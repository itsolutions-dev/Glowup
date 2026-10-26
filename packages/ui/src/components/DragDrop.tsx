import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  Animated,
  GestureResponderEvent,
  Platform,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { rgba } from "polished";
import { useTheme, Theme } from "../providers/ThemeProvider";
import {
  InteractionFeedbackHandler,
  useInteractionFeedback,
} from "../providers/InteractionFeedback";
import Portal from "./Portal";
import { elevationStyle } from "./internal/elevation";
import { useEscapeKey } from "./internal/useEscapeKey";
import {
  DropOrientation,
  INDICATOR,
  Point,
  Rect,
  indicatorAt,
  insertionIndex,
  zoneAt,
} from "./internal/dragDrop";

export type { DropOrientation } from "./internal/dragDrop";

/** What is being dragged: a `Draggable`'s `id` and `data`. */
export interface DragItem {
  id: string;
  data?: unknown;
}

/** Where it would land: a `Droppable`'s `id` and `data`, and the position in it. */
export interface DropTarget {
  id: string;
  data?: unknown;
  /**
   * The position among the zone's own draggables, the dragged one left out:
   * remove the item from where it was, then insert it here. Reordering a list
   * and moving between lists read it the same way.
   */
  index: number;
}

export interface DragStartEvent {
  active: DragItem;
}

export interface DragEndEvent {
  active: DragItem;
  /** Null when the item was dropped outside every zone that takes it. */
  over: DropTarget | null;
}

// A touch has to rest this long before it lifts the item, so a swipe still
// scrolls; a mouse lifts it as soon as it moves this far, so a click still clicks.
const LONG_PRESS = 250;
const TOUCH_SLOP = 8;
const MOUSE_DISTANCE = 4;
// The item left in place while its preview follows the pointer.
const GHOST_OPACITY = 0.4;

/** A touch that has rested long enough to lift the item. */
const rested = (gesture: { touch: boolean; at: number }) =>
  gesture.touch && Date.now() - gesture.at >= LONG_PRESS;

interface Active extends DragItem {
  node: React.ReactNode;
}

interface DragState {
  active: Active | null;
  /** The dragged item's rect, once measured: where its preview starts. */
  rect: Rect | null;
  over: DropTarget | null;
}

const IDLE: DragState = { active: null, rect: null, over: null };

interface ZoneEntry {
  ref: React.RefObject<View | null>;
  data?: unknown;
  accept?: (item: DragItem) => boolean;
  disabled?: boolean;
  orientation: DropOrientation;
  depth: number;
  /** The draggables this zone sits inside: it never takes one of them. */
  within: string[];
}

interface ItemEntry {
  ref: React.RefObject<View | null>;
  zone: string | null;
}

/** A zone that takes the item being dragged, measured when the drag began. */
interface Target {
  id: string;
  rect: Rect;
  depth: number;
  entry: ZoneEntry;
  /** Its draggables, the dragged one left out. */
  items: Rect[];
}

/** Where a view is in the window: the DOM's own rect on the web, which
 * also accounts for transforms. */
const measure = (view: View | null): Promise<Rect | null> =>
  new Promise((resolve) => {
    if (!view) return resolve(null);
    if (Platform.OS === "web") {
      const r = (view as unknown as Element).getBoundingClientRect();
      return resolve({ x: r.left, y: r.top, width: r.width, height: r.height });
    }
    view.measureInWindow((x, y, width, height) =>
      resolve({ x, y, width, height }),
    );
  });

/** The pointer in window coordinates: the web's `pageX` counts the page's scroll. */
const pointOf = (event: GestureResponderEvent): Point => {
  const { pageX, pageY } = event.nativeEvent;
  return Platform.OS === "web"
    ? { x: pageX - window.scrollX, y: pageY - window.scrollY }
    : { x: pageX, y: pageY };
};

interface Handlers {
  onDragStart?: (event: DragStartEvent) => void;
  onDragEnd: (event: DragEndEvent) => void;
  onDragCancel?: (event: DragStartEvent) => void;
  emit: InteractionFeedbackHandler;
}

// Kept outside React state like the form store: a move re-renders only the
// zone whose insertion point changed, never the tree.
const createManager = () => {
  // The provider's latest props, set after each of its renders.
  let handlers: Handlers = { onDragEnd: () => {}, emit: () => {} };
  let state = IDLE;
  const listeners = new Set<() => void>();
  const set = (next: Partial<DragState>) => {
    state = { ...state, ...next };
    listeners.forEach((listener) => listener());
  };

  const zones = new Map<string, ZoneEntry>();
  const items = new Map<string, ItemEntry>();
  const pan = new Animated.ValueXY();
  let grab: Point = { x: 0, y: 0 };
  let last: Point = grab;
  let targets: Target[] = [];
  // Bumped by every drag, so a measure that resolves after its drag ended is dropped.
  let generation = 0;

  const locate = (point: Point): DropTarget | null => {
    const target = zoneAt(targets, point);
    if (!target) return null;
    return {
      id: target.id,
      data: target.entry.data,
      index: insertionIndex(target.items, point, target.entry.orientation),
    };
  };

  const move = (point: Point) => {
    last = point;
    if (!state.active) return;
    pan.setValue({ x: point.x - grab.x, y: point.y - grab.y });
    const over = locate(point);
    if (over?.id !== state.over?.id || over?.index !== state.over?.index) {
      set({ over });
    }
  };

  // ponytail: zones are measured once, when the drag begins. A list that
  // scrolls under a held item (mouse wheel, auto-scroll) needs a re-measure.
  const start = (
    item: DragItem,
    node: React.ReactNode,
    from: Point,
    touch: boolean,
  ) => {
    grab = from;
    last = from;
    targets = [];
    pan.setValue({ x: 0, y: 0 });
    set({ active: { ...item, node }, rect: null, over: null });
    if (touch) handlers.emit("longPress");
    handlers.onDragStart?.({ active: item });

    const current = ++generation;
    const zoneRects = Promise.all(
      [...zones].map(([id, entry]) =>
        measure(entry.ref.current).then((rect) => ({ id, entry, rect })),
      ),
    );
    const itemRects = Promise.all(
      [...items].map(([id, entry]) =>
        measure(entry.ref.current).then((rect) => ({ id, entry, rect })),
      ),
    );
    Promise.all([zoneRects, itemRects]).then(([measuredZones, measured]) => {
      if (current !== generation || !state.active) return;
      targets = measuredZones.flatMap(({ id, entry, rect }) =>
        rect &&
        !entry.disabled &&
        !entry.within.includes(item.id) &&
        (entry.accept?.(item) ?? true)
          ? [
              {
                id,
                rect,
                depth: entry.depth,
                entry,
                items: measured.flatMap((m) =>
                  m.rect && m.entry.zone === id && m.id !== item.id
                    ? [m.rect]
                    : [],
                ),
              },
            ]
          : [],
      );
      set({ rect: measured.find((m) => m.id === item.id)?.rect ?? null });
      move(last);
    });
  };

  const finish = (dropped: boolean) => {
    const { active, over } = state;
    if (!active) return;
    generation++;
    targets = [];
    set(IDLE);
    const item = { id: active.id, data: active.data };
    if (dropped) handlers.onDragEnd({ active: item, over });
    else handlers.onDragCancel?.({ active: item });
  };

  // The innermost draggable under the current press: the only one that lifts.
  let pressed: string | null = null;

  return {
    setHandlers: (next: Handlers) => {
      handlers = next;
    },
    press: (id: string) => {
      pressed = id;
    },
    pressed: () => pressed,
    zones,
    items,
    pan,
    start,
    move,
    end: () => finish(true),
    cancel: () => finish(false),
    indicator: (id: string, index: number) => {
      const target = targets.find((t) => t.id === id);
      return target
        ? indicatorAt(
            target.rect,
            target.items,
            index,
            target.entry.orientation,
          )
        : null;
    },
    get: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
};

type Manager = ReturnType<typeof createManager>;

const ManagerContext = createContext<Manager | null>(null);

// True inside a drag preview: the draggables and zones of a dragged item are
// drawn there a second time, and only the originals may register.
const PreviewContext = createContext(false);

/** The zone and the draggables a component sits inside. */
interface Scope {
  zone: string | null;
  depth: number;
  within: string[];
}

const ScopeContext = createContext<Scope>({ zone: null, depth: 0, within: [] });

const useManager = (name: string) => {
  const manager = useContext(ManagerContext);
  if (!manager) throw new Error(`${name} must be inside a DragDropProvider.`);
  return manager;
};

/** A slice of the drag state; re-renders only when the slice changes. */
const useDragSlice = <T,>(manager: Manager, select: (state: DragState) => T) =>
  useSyncExternalStore(
    manager.subscribe,
    () => select(manager.get()),
    () => select(IDLE),
  );

export interface DragDropProviderProps {
  children: React.ReactNode;
  /** An item was lifted: by a resting touch, or a mouse moved while pressed. */
  onDragStart?: (event: DragStartEvent) => void;
  /** An item was let go. Apply the move here; `over` is null outside every zone. */
  onDragEnd: (event: DragEndEvent) => void;
  /** The drag was called off: Escape on the web, or the system took the touch. */
  onDragCancel?: (event: DragStartEvent) => void;
  /**
   * Report a touch that lifts an item to `ThemeProvider`'s
   * `onInteractionFeedback` (haptics), as a long press. Defaults to true.
   */
  feedback?: boolean;
}

/**
 * Drag and drop for the `Draggable`s and `Droppable`s below it, on iOS,
 * Android and the web, by touch and by mouse. A touch lifts an item after
 * resting on it for a moment (so a swipe still scrolls), a mouse as soon as
 * it moves; the item stays in place, dimmed, while a preview follows the
 * pointer, and a line marks where it would land.
 *
 * The provider only reports the drop: keep the lists in your state and
 * move the item in `onDragEnd`.
 *
 * Inside a `ScrollView`, pass `scrollEnabled={!active}` (from `useDragDrop`)
 * so it does not scroll under a held item. The preview is drawn through a
 * `Portal`, so it is not clipped when a `PortalHost` wraps the app.
 */
export const DragDropProvider = ({
  children,
  onDragStart,
  onDragEnd,
  onDragCancel,
  feedback = true,
}: DragDropProviderProps) => {
  const emit = useInteractionFeedback(feedback);
  const [manager] = useState(createManager);
  useEffect(() => {
    manager.setHandlers({ onDragStart, onDragEnd, onDragCancel, emit });
  });
  const dragging = useDragSlice(manager, (s) => s.active !== null);

  useEscapeKey(dragging, manager.cancel);

  return (
    <ManagerContext.Provider value={manager}>
      {children}
      {dragging && (
        <Portal>
          <DragPreview manager={manager} />
        </Portal>
      )}
    </ManagerContext.Provider>
  );
};

/** The item being dragged under the nearest `DragDropProvider`, or null. */
export const useDragDrop = (): { active: DragItem | null } => {
  const manager = useManager("useDragDrop");
  return { active: useDragSlice(manager, (s) => s.active) };
};

// Rendered at the PortalHost, outside the provider: the manager comes as a prop.
const DragPreview = ({ manager }: { manager: Manager }) => {
  const { theme } = useTheme();
  const active = useDragSlice(manager, (s) => s.active);
  const rect = useDragSlice(manager, (s) => s.rect);
  const layer = useRef<View>(null);
  // Where the layer itself is in the window, to turn window rects into its own.
  const [origin, setOrigin] = useState<Point>({ x: 0, y: 0 });

  return (
    <View
      ref={layer}
      collapsable={false}
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={() =>
        measure(layer.current).then((r) => r && setOrigin({ x: r.x, y: r.y }))
      }
    >
      {active && rect && (
        <Animated.View
          style={[
            lift(theme),
            {
              position: "absolute",
              left: rect.x - origin.x,
              top: rect.y - origin.y,
              width: rect.width,
              height: rect.height,
              transform: manager.pan.getTranslateTransform(),
            },
          ]}
        >
          <ManagerContext.Provider value={manager}>
            <PreviewContext.Provider value>
              {active.node}
            </PreviewContext.Provider>
          </ManagerContext.Provider>
        </Animated.View>
      )}
    </View>
  );
};

/** A raised shadow without a surface of its own: the preview keeps the item's look. */
const lift = (theme: Theme): ViewStyle =>
  Platform.OS === "web"
    ? { boxShadow: `0 6px 16px ${rgba(theme.colors.shadow, 0.24)}` }
    : { ...elevationStyle(theme, 3), backgroundColor: undefined };

export interface DraggableProps {
  /** Unique among the provider's draggables; reported as `active.id`. */
  id: string;
  /** What the drop handler needs to know about the item; reported as `active.data`. */
  data?: unknown;
  children: React.ReactNode;
  /** What follows the pointer, drawn at the item's size. Defaults to `children`. */
  preview?: React.ReactNode;
  /** A tap or a click that did not turn into a drag. */
  onPress?: () => void;
  /** Cannot be lifted. */
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  testID?: string;
}

/**
 * Something that can be picked up and moved. Inside a `Droppable` it counts as
 * one of that zone's items, for the insertion index and line.
 *
 * The whole item is the handle, pressable content included: a `Card` or a
 * row with its own `onClick` still gets its tap, and a press that rests
 * (touch) or moves (mouse) lifts the item instead. In nested draggables the
 * innermost one under the press is lifted.
 */
export const Draggable = ({ disabled = false, ...props }: DraggableProps) =>
  useContext(PreviewContext) ? (
    <View style={props.style}>{props.children}</View>
  ) : (
    <LiveDraggable {...props} disabled={disabled} />
  );

const LiveDraggable = ({
  id,
  data,
  children,
  preview,
  onPress,
  disabled,
  style,
  accessibilityLabel,
  testID,
}: DraggableProps) => {
  const manager = useManager("Draggable");
  const scope = useContext(ScopeContext);
  const ref = useRef<View>(null);
  const dragging = useDragSlice(manager, (s) => s.active?.id === id);

  const latest = useRef({ data, node: preview ?? children, onPress });
  useEffect(() => {
    latest.current = { data, node: preview ?? children, onPress };
  });

  useEffect(() => {
    manager.items.set(id, { ref, zone: scope.zone });
    return () => {
      manager.items.delete(id);
    };
  }, [manager, id, scope.zone]);

  const gesture = useRef<{
    phase: "idle" | "pending" | "active";
    /** This view holds the responder, rather than a control inside it. */
    owner: boolean;
    touch: boolean;
    from: Point;
    last: Point;
    /** When the press began, in ms. */
    at: number;
    timer?: ReturnType<typeof setTimeout>;
  }>({
    phase: "idle",
    owner: false,
    touch: true,
    from: { x: 0, y: 0 },
    last: { x: 0, y: 0 },
    at: 0,
  });

  useEffect(() => {
    const g = gesture.current;
    return () => {
      clearTimeout(g.timer);
      if (g.phase === "active") manager.cancel();
    };
  }, [manager]);

  // A browser scrolls the page under a lifted item unless the touch's moves
  // are cancelled, and it only waits for a listener that was already there
  // when the touch began: so it is on the item from the start. It runs before
  // the responder system, so it also cancels the move that is about to lift
  // the item off a pressable child.
  useEffect(() => {
    const node = ref.current as unknown as HTMLElement | null;
    if (Platform.OS !== "web" || !node) return;
    const block = (event: TouchEvent) => {
      const g = gesture.current;
      const lifting =
        g.phase === "active" ||
        (g.phase === "pending" && rested(g) && manager.pressed() === id);
      if (lifting && event.cancelable) event.preventDefault();
    };
    node.addEventListener("touchmove", block, { passive: false });
    return () => node.removeEventListener("touchmove", block);
  }, [manager, id]);

  const activate = () => {
    const g = gesture.current;
    clearTimeout(g.timer);
    g.phase = "active";
    manager.start(
      { id, data: latest.current.data },
      latest.current.node,
      g.from,
      g.touch,
    );
    manager.move(g.last);
  };

  const begin = (event: GestureResponderEvent) => {
    const g = gesture.current;
    clearTimeout(g.timer);
    g.from = g.last = pointOf(event);
    g.at = Date.now();
    // The web reports the DOM event's type; native input is always touch.
    const type = (event.nativeEvent as { type?: string }).type;
    g.touch = !type?.startsWith("mouse");
    g.phase = "pending";
    g.owner = false;
  };

  const moved = () => {
    const { from, last } = gesture.current;
    return Math.hypot(last.x - from.x, last.y - from.y);
  };

  // Every press inside is seen here first, whoever ends up handling it. The
  // capture runs outermost first, so the innermost draggable claims it last.
  const onPressCapture = (event: GestureResponderEvent) => {
    if (disabled) return false;
    begin(event);
    manager.press(id);
    return false;
  };

  // A control inside took the press (a pressable card, a row): take it over
  // once the press rests (touch) or moves (mouse). A plain tap stays its own.
  const onMoveCapture = (event: GestureResponderEvent) => {
    const g = gesture.current;
    if (g.owner || g.phase !== "pending" || manager.pressed() !== id) {
      return false;
    }
    g.last = pointOf(event);
    if (g.touch && rested(g)) return true;
    if (!g.touch && moved() >= MOUSE_DISTANCE) return true;
    // A swipe: leave it to the scroll view.
    if (g.touch && moved() > TOUCH_SLOP) g.phase = "idle";
    return false;
  };

  const onGrant = (event: GestureResponderEvent) => {
    const g = gesture.current;
    if (g.phase === "idle") begin(event);
    g.owner = true;
    // Taken over from a child: the press has already rested or moved. The
    // item lifts now, and `true` keeps a native scroll view from taking the
    // touch back (Android).
    if (g.touch ? rested(g) : moved() >= MOUSE_DISTANCE) {
      activate();
      return true;
    }
    if (g.touch)
      g.timer = setTimeout(activate, LONG_PRESS - (Date.now() - g.at));
    return false;
  };

  const onMove = (event: GestureResponderEvent) => {
    const g = gesture.current;
    g.last = pointOf(event);
    if (g.phase === "active") return manager.move(g.last);
    if (g.phase !== "pending") return;
    if (!g.touch && moved() >= MOUSE_DISTANCE) activate();
    else if (g.touch && moved() > TOUCH_SLOP) {
      clearTimeout(g.timer);
      g.phase = "idle";
    }
  };

  const finish = (dropped: boolean) => {
    const g = gesture.current;
    clearTimeout(g.timer);
    if (g.phase === "active") {
      if (dropped) manager.end();
      else manager.cancel();
    } else if (dropped && g.phase === "pending") latest.current.onPress?.();
    g.phase = "idle";
    g.owner = false;
  };

  const inner = useMemo(
    () => ({ ...scope, within: [...scope.within, id] }),
    [scope, id],
  );

  return (
    <ScopeContext.Provider value={inner}>
      <View
        ref={ref}
        collapsable={false}
        testID={testID}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={onPress ? "button" : undefined}
        accessibilityState={{ disabled: !!disabled }}
        style={[
          !disabled && Platform.OS === "web" && webGrab,
          style,
          dragging && { opacity: GHOST_OPACITY },
        ]}
        onStartShouldSetResponderCapture={onPressCapture}
        onMoveShouldSetResponderCapture={onMoveCapture}
        // Nothing inside took the press.
        onStartShouldSetResponder={() => !disabled && manager.pressed() === id}
        // A lifted item is not taken over by a scroll view; a resting touch is.
        onResponderTerminationRequest={() => gesture.current.phase !== "active"}
        onResponderGrant={onGrant}
        onResponderMove={onMove}
        onResponderRelease={() => finish(true)}
        onResponderTerminate={() => finish(false)}
      >
        {children}
      </View>
    </ScopeContext.Provider>
  );
};

const webGrab = { cursor: "grab", userSelect: "none" } as unknown as ViewStyle;

export interface DroppableRenderState {
  /** The dragged item would land here. */
  isOver: boolean;
  /** Where among this zone's draggables it would land; -1 when not over. */
  index: number;
}

export interface DroppableProps {
  /** Unique among the provider's droppables; reported as `over.id`. */
  id: string;
  /** What the drop handler needs to know about the zone; reported as `over.data`. */
  data?: unknown;
  /**
   * Whether the zone takes an item. One that does not is ignored, and the
   * pointer falls through to the zone around it. Every item by default.
   */
  accept?: (item: DragItem) => boolean;
  /** The axis its draggables are laid along. Defaults to `"vertical"`. */
  orientation?: DropOrientation;
  /** Takes nothing. */
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /** Content, or a function of whether an item is over the zone and where. */
  children?:
    React.ReactNode | ((state: DroppableRenderState) => React.ReactNode);
}

/**
 * A place items can be dropped: a list, a column, a bin. Zones nest: the
 * innermost one under the pointer that takes the item wins, and a zone inside
 * a `Draggable` never takes that draggable. While an item is over it, a line
 * in the primary color marks where it would land among its draggables.
 */
export const Droppable = ({
  orientation = "vertical",
  disabled = false,
  ...props
}: DroppableProps) =>
  useContext(PreviewContext) ? (
    <View style={props.style}>
      {typeof props.children === "function"
        ? props.children({ isOver: false, index: -1 })
        : props.children}
    </View>
  ) : (
    <LiveDroppable {...props} orientation={orientation} disabled={disabled} />
  );

const LiveDroppable = ({
  id,
  data,
  accept,
  orientation,
  disabled,
  style,
  testID,
  children,
}: DroppableProps & { orientation: DropOrientation }) => {
  const manager = useManager("Droppable");
  const { theme } = useTheme();
  const scope = useContext(ScopeContext);
  const ref = useRef<View>(null);
  const index = useDragSlice(manager, (s) =>
    s.over?.id === id ? s.over.index : -1,
  );

  useEffect(() => {
    manager.zones.set(id, {
      ref,
      data,
      accept,
      disabled,
      orientation,
      depth: scope.depth,
      within: scope.within,
    });
  });
  useEffect(
    () => () => {
      manager.zones.delete(id);
    },
    [manager, id],
  );

  const inner = useMemo(
    () => ({ zone: id, depth: scope.depth + 1, within: scope.within }),
    [id, scope],
  );
  const line = index >= 0 ? manager.indicator(id, index) : null;

  return (
    <ScopeContext.Provider value={inner}>
      <View ref={ref} collapsable={false} testID={testID} style={style}>
        {typeof children === "function"
          ? children({ isOver: index >= 0, index })
          : children}
        {line && (
          <View
            pointerEvents="none"
            style={[
              styles.line,
              {
                left: line.x,
                top: line.y,
                width: line.width,
                height: line.height,
                backgroundColor: theme.colors.primary,
              },
            ]}
          />
        )}
      </View>
    </ScopeContext.Provider>
  );
};

const styles = StyleSheet.create({
  line: { position: "absolute", borderRadius: INDICATOR / 2 },
});
