import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  DimensionValue,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { Theme, useTheme } from "../providers/ThemeProvider";
import { useReduceMotion } from "./internal/useReduceMotion";
import {
  AxisMetrics,
  MIN_THUMB,
  clamp,
  maxScroll,
  hasScrollbar,
  isOverflowing,
  scrollFromDrag,
  scrollFromTrackPress,
  scrollbarShown,
  thumbMetrics,
} from "./internal/scrollbar";

type Axis = "vertical" | "horizontal";

/** Style overrides for the drawn scrollbar, merged after its own styles. */
export interface ScrollAreaSlotStyles {
  /** The strip the thumb travels along. */
  track?: StyleProp<ViewStyle>;
  /** The draggable thumb. */
  thumb?: StyleProp<ViewStyle>;
}

export interface ScrollAreaProps extends Omit<
  ScrollViewProps,
  | "horizontal"
  | "showsVerticalScrollIndicator"
  | "showsHorizontalScrollIndicator"
  | "scrollEventThrottle"
  | "onScroll"
  | "style"
  | "contentContainerStyle"
> {
  /**
   * The axis that scrolls. `"both"` nests a horizontal scroll view in a
   * vertical one, so the content may overflow in either direction. Defaults to
   * `"vertical"`.
   */
  orientation?: "vertical" | "horizontal" | "both";
  /**
   * When the scrollbars are visible.
   * - `auto`: whenever the content overflows.
   * - `always`: always, overflowing or not.
   * - `scroll`: while scrolling or dragging, and `scrollHideDelay` after.
   * - `hover`: while the pointer is over the area (web), and while scrolling
   *   or dragging. Without a pointer, as on a phone, it behaves like `scroll`.
   *
   * Defaults to `"auto"`.
   */
  type?: "auto" | "always" | "scroll" | "hover";
  /** Thickness of the scrollbar, in dp: raise it on touch screens for a bigger grab area. Defaults to `10`. */
  scrollbarSize?: number;
  /** How long, in ms, a `scroll` or `hover` scrollbar stays after the last scroll, drag or hover. Defaults to `600`. */
  scrollHideDelay?: number;
  /** Fixed height of the area. Leave it out to size to the content, up to `maxHeight`. */
  height?: DimensionValue;
  /** The height at which the content starts to scroll. */
  maxHeight?: DimensionValue;
  /** Fixed width of the area. */
  width?: DimensionValue;
  /**
   * Called on every scroll, like `ScrollView`'s. With `orientation="both"` the
   * event carries both axes' offset, content size and layout measurement.
   */
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  /** Style of the outer view. The scrollbars are laid over it. */
  style?: StyleProp<ViewStyle>;
  /** Style of the view wrapping the children inside the scroll view (padding, `flexGrow`). */
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Style overrides for the track and the thumb. */
  slotStyles?: ScrollAreaSlotStyles;
  /**
   * A ref to the scroll view: the vertical one, or the horizontal one for
   * `orientation="horizontal"`. Use it for `scrollTo`, `scrollToEnd`, …
   */
  ref?: React.Ref<ScrollView>;
  /**
   * Root testID. The scroll view gets `${testID}-viewport` (the horizontal one
   * of `both`, `${testID}-viewport-x`), each scrollbar `${testID}-scrollbar-vertical` or
   * `${testID}-scrollbar-horizontal`, and its thumb `${testID}-thumb-vertical`
   * or `${testID}-thumb-horizontal`.
   */
  testID?: string;
  children?: React.ReactNode;
}

const NO_METRICS: AxisMetrics = { scroll: 0, viewport: 0, content: 0 };

/**
 * The browser's own scrollbar, hidden inline. (`ThemeProvider` styles the
 * browser's scrollbars everywhere else; the mark below keeps its rules off these.)
 */
const WEB_HIDE_BAR = { scrollbarWidth: "none" } as ViewStyle;
/** `data-glowup-scroll-area`: what `ThemeProvider`'s scrollbar rule skips. */
const WEB_AREA_MARK = { dataSet: { glowupScrollArea: "" } } as object;
/** The scrollbar is not text, and a touch on it drags it rather than panning the page. */
const WEB_NO_GESTURE = {
  userSelect: "none",
  touchAction: "none",
} as ViewStyle;

/** Gap between the thumb and the edge of its track, in dp. */
const INSET = 2;
const FADE_IN = 120;
const FADE_OUT = 240;

type Point = {
  clientX?: number;
  clientY?: number;
  pageX?: number;
  pageY?: number;
  offsetX?: number;
  offsetY?: number;
  locationX?: number;
  locationY?: number;
};

/** The coordinate along the axis of a pointer (web) or touch (native) event, on the screen. */
const along = (axis: Axis, e: Point) =>
  (axis === "vertical" ? (e.clientY ?? e.pageY) : (e.clientX ?? e.pageX)) ?? 0;

/** The coordinate along the axis within the element that was pressed. */
const within = (axis: Axis, e: Point) =>
  (axis === "vertical"
    ? (e.offsetY ?? e.locationY)
    : (e.offsetX ?? e.locationX)) ?? 0;

interface ScrollbarProps {
  axis: Axis;
  metrics: AxisMetrics;
  /** Length of the track. */
  track: number;
  thickness: number;
  /** Room left at the end of the track for the other scrollbar's corner. */
  corner: number;
  shown: boolean;
  onScrollTo: (axis: Axis, position: number, animated: boolean) => void;
  onDrag: (dragging: boolean) => void;
  onHover: (hovering: boolean) => void;
  slotStyles?: ScrollAreaSlotStyles;
  testID?: string;
  thumbTestID?: string;
}

/** One drawn scrollbar: a themed track and thumb, draggable, a press on the track pages. */
const Scrollbar = ({
  axis,
  metrics,
  track,
  thickness,
  corner,
  shown,
  onScrollTo,
  onDrag,
  onHover,
  slotStyles,
  testID,
  thumbTestID,
}: ScrollbarProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const reduceMotion = useReduceMotion();
  const vertical = axis === "vertical";
  const web = Platform.OS === "web";

  const [dragging, setDragging] = useState(false);
  const [hot, setHot] = useState(false);
  const [opacity] = useState(() => new Animated.Value(shown ? 1 : 0));

  // Read by the handlers, which outlive the render that made them: a drag goes
  // on while the content grows under it.
  const live = useRef({ metrics, track, onScrollTo, onDrag });
  useEffect(() => {
    live.current = { metrics, track, onScrollTo, onDrag };
  });
  const session = useRef<{ start: number; startScroll: number } | null>(null);

  useEffect(() => {
    const animation = Animated.timing(opacity, {
      toValue: shown ? 1 : 0,
      duration: reduceMotion ? 0 : shown ? FADE_IN : FADE_OUT,
      // react-native-web has no native driver and warns when asked for one.
      useNativeDriver: !web,
    });
    animation.start();
    return () => animation.stop();
  }, [shown, reduceMotion, opacity, web]);

  const begin = (point: number) => {
    session.current = {
      start: point,
      startScroll: live.current.metrics.scroll,
    };
    setDragging(true);
    live.current.onDrag(true);
  };

  const move = (point: number) => {
    const current = session.current;
    if (!current) return;
    const { metrics: now, track: length, onScrollTo: scrollTo } = live.current;
    scrollTo(
      axis,
      scrollFromDrag(
        now,
        { track: length },
        current.startScroll,
        point - current.start,
      ),
      false,
    );
  };

  const end = useCallback(() => {
    if (!session.current) return;
    session.current = null;
    setDragging(false);
    live.current.onDrag(false);
  }, []);
  // Unmounted mid-drag (the content shrank): give back the hold on the visibility.
  useEffect(() => end, [end]);

  const page = (point: number) => {
    const { metrics: now, track: length, onScrollTo: scrollTo } = live.current;
    const next = scrollFromTrackPress(now, { track: length }, point);
    if (next !== now.scroll) scrollTo(axis, next, !reduceMotion);
  };

  const thumb = thumbMetrics(metrics, { track, minThumb: MIN_THUMB });
  const thumbThickness = Math.max(2, thickness - 2 * INSET);
  const active = hot || dragging;

  // Web draws on pointer events, which carry a mouse, a pen and a finger alike
  // and, with the capture, follow the pointer out of the thumb. Native uses the
  // responder events the touch system gives every view.
  const trackHandlers = web
    ? {
        onPointerDown: (event: {
          nativeEvent: Point & { button?: number };
        }) => {
          if ((event.nativeEvent.button ?? 0) > 0) return;
          page(within(axis, event.nativeEvent));
        },
        // The track lies over the scroller, so a wheel turned over it would scroll
        // the page behind instead.
        onWheel: (event: {
          nativeEvent: { deltaX?: number; deltaY?: number; deltaMode?: number };
        }) => {
          const { deltaX = 0, deltaY = 0, deltaMode = 0 } = event.nativeEvent;
          const { metrics: now, onScrollTo: scrollTo } = live.current;
          const delta =
            (vertical ? deltaY : deltaX || deltaY) * (deltaMode === 1 ? 16 : 1);
          scrollTo(axis, clamp(now.scroll + delta, 0, maxScroll(now)), false);
        },
        onPointerEnter: () => {
          setHot(true);
          onHover(true);
        },
        onPointerLeave: () => {
          setHot(false);
          onHover(false);
        },
      }
    : {
        onStartShouldSetResponder: () => true,
        onResponderGrant: (event: { nativeEvent: Point }) =>
          page(within(axis, event.nativeEvent)),
      };

  const thumbHandlers = web
    ? {
        onPointerDown: (event: {
          nativeEvent: Point & { button?: number; pointerId?: number };
          stopPropagation: () => void;
          currentTarget: unknown;
        }) => {
          // A press on the thumb drags it; the track below would page.
          event.stopPropagation();
          if ((event.nativeEvent.button ?? 0) > 0) return;
          (
            event.currentTarget as {
              setPointerCapture?: (pointerId: number) => void;
            }
          ).setPointerCapture?.(event.nativeEvent.pointerId ?? 0);
          begin(along(axis, event.nativeEvent));
        },
        onPointerMove: (event: { nativeEvent: Point }) =>
          move(along(axis, event.nativeEvent)),
        onPointerUp: end,
        onPointerCancel: end,
        onLostPointerCapture: end,
      }
    : {
        onStartShouldSetResponder: () => true,
        // The scroll view is a sibling, but an ancestor scroller must not take
        // the gesture over from a thumb being dragged.
        onResponderTerminationRequest: () => false,
        onResponderGrant: (event: { nativeEvent: Point }) =>
          begin(along(axis, event.nativeEvent)),
        onResponderMove: (event: { nativeEvent: Point }) =>
          move(along(axis, event.nativeEvent)),
        onResponderRelease: end,
        onResponderTerminate: end,
      };

  return (
    <Animated.View
      testID={testID}
      aria-hidden
      {...trackHandlers}
      style={[
        styles.track,
        vertical
          ? { top: 0, right: 0, bottom: corner, width: thickness }
          : { left: 0, bottom: 0, right: corner, height: thickness },
        active && styles.trackActive,
        web && WEB_NO_GESTURE,
        { opacity, pointerEvents: shown ? "auto" : "none" },
        slotStyles?.track,
      ]}
    >
      <View
        testID={thumbTestID}
        {...thumbHandlers}
        style={[
          styles.thumb,
          {
            borderRadius: thumbThickness / 2,
            backgroundColor: active
              ? theme.colors.onSurfaceVariant
              : theme.colors.outline,
          },
          vertical
            ? {
                left: INSET,
                width: thumbThickness,
                height: thumb.size,
                transform: [{ translateY: thumb.offset }],
              }
            : {
                top: INSET,
                height: thumbThickness,
                width: thumb.size,
                transform: [{ translateX: thumb.offset }],
              },
          web && WEB_NO_GESTURE,
          slotStyles?.thumb,
        ]}
      />
    </Animated.View>
  );
};

/** Clears a pending timer, if any. */
const clear = (
  timer: React.RefObject<ReturnType<typeof setTimeout> | null>,
) => {
  if (timer.current) clearTimeout(timer.current);
  timer.current = null;
};

/**
 * A scrollable area with scrollbars drawn from the theme instead of the
 * platform's: the native indicators are hidden and a thumb and track take their
 * place, on web and on native alike. The thumb is as long as the visible share
 * of the content, follows the scroll offset, and can be dragged; a press on the
 * track scrolls a page. Keyboard, wheel and touch scrolling stay the platform's
 * own, because the content sits in a real `ScrollView`. The scrollbars are laid
 * over the content, not beside it: pad the content (`contentContainerStyle`) by
 * `scrollbarSize` where they must not cover it.
 *
 * ```tsx
 * <ScrollArea maxHeight={240} type="hover">
 *   {items}
 * </ScrollArea>
 * ```
 */
const ScrollArea = ({
  orientation = "vertical",
  type = "auto",
  scrollbarSize = 10,
  scrollHideDelay = 600,
  height,
  maxHeight,
  width,
  onScroll,
  onLayout,
  onContentSizeChange,
  style,
  contentContainerStyle,
  slotStyles,
  ref,
  testID,
  children,
  ...scrollViewProps
}: ScrollAreaProps) => {
  const web = Platform.OS === "web";
  const wantsVertical = orientation !== "horizontal";
  const wantsHorizontal = orientation !== "vertical";
  const primary: Axis = wantsVertical ? "vertical" : "horizontal";

  const [metrics, setMetrics] = useState<Record<Axis, AxisMetrics>>({
    vertical: NO_METRICS,
    horizontal: NO_METRICS,
  });
  const latest = useRef(metrics);
  const update = useCallback((axis: Axis, patch: Partial<AxisMetrics>) => {
    const before = latest.current[axis];
    const after = { ...before, ...patch };
    if (
      after.scroll === before.scroll &&
      after.viewport === before.viewport &&
      after.content === before.content
    ) {
      return;
    }
    latest.current = { ...latest.current, [axis]: after };
    setMetrics(latest.current);
  }, []);

  // --- Visibility for `scroll` and `hover` ---------------------------------
  const [engaged, setEngaged] = useState(false);
  const holds = useRef({ area: false, bar: false, drag: false });
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const engage = useCallback(() => {
    // Nothing to show or hide for these two.
    if (type === "auto" || type === "always") return;
    clear(hideTimer);
    setEngaged(true);
    const { area, bar, drag } = holds.current;
    if (area || bar || drag) return;
    hideTimer.current = setTimeout(() => setEngaged(false), scrollHideDelay);
  }, [type, scrollHideDelay]);
  useEffect(() => () => clear(hideTimer), []);

  const hold = useCallback(
    (which: "area" | "bar" | "drag", on: boolean) => {
      holds.current[which] = on;
      engage();
    },
    [engage],
  );
  const onDrag = useCallback((on: boolean) => hold("drag", on), [hold]);
  const onBarHover = useCallback((on: boolean) => hold("bar", on), [hold]);

  // --- Scroll views ---------------------------------------------------------
  const views = useRef<Record<Axis, ScrollView | null>>({
    vertical: null,
    horizontal: null,
  });
  const attach = useCallback(
    (axis: Axis) => (node: ScrollView | null) => {
      views.current[axis] = node;
      if (axis !== primary) return;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [primary, ref],
  );
  // A ref callback must keep its identity, or it is detached and attached on every render.
  const verticalRef = useMemo(() => attach("vertical"), [attach]);
  const horizontalRef = useMemo(() => attach("horizontal"), [attach]);

  const scrollTo = useCallback(
    (axis: Axis, position: number, animated: boolean) => {
      views.current[axis]?.scrollTo(
        axis === "vertical"
          ? { y: position, animated }
          : { x: position, animated },
      );
    },
    [],
  );

  // These run when the scroll view reports, never during render; the rule cannot
  // tell, because they reach the scroll views through a spread.
  /* eslint-disable react-hooks/refs */
  const handlers = useMemo(() => {
    const make = (axis: Axis) => {
      const isPrimary = axis === primary;
      return {
        onLayout: (event: LayoutChangeEvent) => {
          const { width: w, height: h } = event.nativeEvent.layout;
          update(axis, { viewport: axis === "vertical" ? h : w });
          if (isPrimary) onLayout?.(event);
        },
        onContentSizeChange: (w: number, h: number) => {
          update(axis, { content: axis === "vertical" ? h : w });
          if (isPrimary) onContentSizeChange?.(w, h);
        },
        onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
          const { contentOffset } = event.nativeEvent;
          update(axis, {
            scroll: axis === "vertical" ? contentOffset.y : contentOffset.x,
          });
          engage();
          if (!onScroll) return;
          if (orientation !== "both") {
            onScroll(event);
            return;
          }
          const { vertical, horizontal } = latest.current;
          onScroll({
            ...event,
            nativeEvent: {
              ...event.nativeEvent,
              contentOffset: { x: horizontal.scroll, y: vertical.scroll },
              contentSize: {
                width: horizontal.content,
                height: vertical.content,
              },
              layoutMeasurement: {
                width: horizontal.viewport,
                height: vertical.viewport,
              },
            },
          });
        },
      };
    };
    return { vertical: make("vertical"), horizontal: make("horizontal") };
  }, [
    primary,
    orientation,
    update,
    engage,
    onLayout,
    onContentSizeChange,
    onScroll,
  ]);
  /* eslint-enable react-hooks/refs */

  // --- Scrollbars -----------------------------------------------------------
  const overflowing = {
    vertical: isOverflowing(metrics.vertical),
    horizontal: isOverflowing(metrics.horizontal),
  };
  const drawn = {
    vertical: wantsVertical && hasScrollbar(type, overflowing.vertical),
    horizontal: wantsHorizontal && hasScrollbar(type, overflowing.horizontal),
  };
  const corner = drawn.vertical && drawn.horizontal ? scrollbarSize : 0;

  const scrollbar = (axis: Axis) =>
    drawn[axis] ? (
      <Scrollbar
        axis={axis}
        metrics={metrics[axis]}
        track={Math.max(0, metrics[axis].viewport - corner)}
        thickness={scrollbarSize}
        corner={corner}
        shown={scrollbarShown(type, overflowing[axis], engaged)}
        onScrollTo={scrollTo}
        onDrag={onDrag}
        onHover={onBarHover}
        slotStyles={slotStyles}
        testID={testID ? `${testID}-scrollbar-${axis}` : undefined}
        thumbTestID={testID ? `${testID}-thumb-${axis}` : undefined}
      />
    ) : null;

  const common = {
    nestedScrollEnabled: true,
    showsVerticalScrollIndicator: false,
    showsHorizontalScrollIndicator: false,
    scrollEventThrottle: 16,
  };
  const viewportStyle: StyleProp<ViewStyle> = web ? WEB_HIDE_BAR : undefined;
  const areaMark = web ? WEB_AREA_MARK : undefined;
  const viewportId = testID ? `${testID}-viewport` : undefined;

  const content =
    orientation === "both" ? (
      <ScrollView
        {...scrollViewProps}
        {...common}
        {...areaMark}
        {...handlers.vertical}
        ref={verticalRef}
        testID={viewportId}
        style={viewportStyle}
      >
        <ScrollView
          horizontal
          {...common}
          {...areaMark}
          {...handlers.horizontal}
          ref={horizontalRef}
          testID={viewportId ? `${viewportId}-x` : undefined}
          style={viewportStyle}
          contentContainerStyle={contentContainerStyle}
        >
          {children}
        </ScrollView>
      </ScrollView>
    ) : (
      <ScrollView
        {...scrollViewProps}
        {...common}
        {...areaMark}
        {...handlers[primary]}
        horizontal={orientation === "horizontal"}
        ref={primary === "vertical" ? verticalRef : horizontalRef}
        testID={viewportId}
        style={viewportStyle}
        contentContainerStyle={contentContainerStyle}
      >
        {children}
      </ScrollView>
    );

  // `hover` is the pointer over the area; a pointer over a visible scrollbar
  // (which `scroll` keeps showing, too) is held by the scrollbar itself.
  const hoverProps =
    web && type === "hover"
      ? {
          onPointerEnter: () => hold("area", true),
          onPointerLeave: () => hold("area", false),
        }
      : undefined;

  return (
    <View
      testID={testID}
      {...hoverProps}
      style={[{ width, height, maxHeight }, style]}
    >
      {content}
      {scrollbar("vertical")}
      {scrollbar("horizontal")}
    </View>
  );
};

export default ScrollArea;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    track: { position: "absolute", backgroundColor: "transparent" },
    trackActive: { backgroundColor: theme.colors.surfaceContainerHigh },
    thumb: { position: "absolute", top: 0 },
  });
