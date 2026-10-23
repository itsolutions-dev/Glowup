import React, {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import Collapse from "./Collapse";
import Icons from "./Glyph";
import {
  Theme,
  getFocusRing,
  getStateColor,
  useTheme,
} from "../providers/ThemeProvider";
import { MaterialCommunityIconsGlyphs, PressableState } from "./types";
import { useReduceMotion } from "./internal/useReduceMotion";
import { toggleIn } from "./internal/selection";
import {
  CheckState,
  RowInfo,
  checkStates,
  indexNodes,
  isExpandable,
  toggleChecked,
  visibleRows,
} from "./internal/treeModel";

/** One node of the tree. Its `id` is its identity in `expanded` and `selected`: keep it unique and stable. */
export interface TreeNode {
  id: string;
  /** What the row says. Text is drawn in the theme's type; any other node as given. */
  label: React.ReactNode;
  /** Before the label: a glyph name, or any node. */
  icon?: MaterialCommunityIconsGlyphs | Exclude<React.ReactNode, string>;
  /** The nodes under this one. Left out (or `hasChildren`), the node is a leaf, or one `loadChildren` fills in when it is opened. */
  children?: TreeNode[];
  /** A disabled row cannot be selected or checked, and is skipped by a parent's checkbox. It can still be opened. */
  disabled?: boolean;
  /** The node has children that are not in `children` yet: it shows a chevron, and opening it calls `loadChildren`. */
  hasChildren?: boolean;
  /** After the label: text or a number is drawn as a small count, any other node as given. */
  badge?: React.ReactNode;
}

/** What `renderLabel` is told about the row it draws. */
export interface TreeRowState {
  /** 1 for the roots. */
  level: number;
  expanded: boolean;
  /** Highlighted by `selectionMode`, or checked when the rows have checkboxes. */
  selected: boolean;
  /** Some of the children are checked, not all (rows with checkboxes). */
  indeterminate: boolean;
  /** The children are being loaded. */
  loading: boolean;
  disabled: boolean;
}

export interface TreeProps {
  /** The roots. Keep the array (and the nodes in it) stable between renders: rows whose node did not change are not drawn again. */
  data: TreeNode[];
  /** The ids of the open nodes. Set, the tree is controlled: it opens and closes what this says, and reports through `onExpandedChange`. */
  expanded?: string[];
  /** The ids of the nodes that start open, when `expanded` is not set. */
  defaultExpanded?: string[];
  /** Called with the open ids after a node is opened or closed. */
  onExpandedChange?: (expanded: string[]) => void;
  /**
   * The ids of the selected nodes: at most one with `selectionMode="single"`.
   * With checkboxes it lists every checked node, a parent whose children are
   * all checked included. Set, the tree is controlled.
   */
  selected?: string[];
  /** The ids that start selected, when `selected` is not set. */
  defaultSelected?: string[];
  /** Called with the selected ids after a press, a Space or an Enter on a row. */
  onSelectedChange?: (selected: string[]) => void;
  /**
   * What pressing a row does. `"none"` opens and closes it, `"single"` selects
   * it (and only it), `"multiple"` toggles it in the selection. The chevron
   * always opens and closes. Defaults to `"none"`.
   */
  selectionMode?: "none" | "single" | "multiple";
  /**
   * With `selectionMode="multiple"`, a checkbox on each row: checking a parent
   * checks everything under it, and a parent with only some children checked
   * shows the mixed state. Ignored in the other modes. Defaults to `false`.
   */
  checkboxes?: boolean;
  /**
   * Fetches the children of a node marked `hasChildren` when it is first
   * opened; a loading row shows meanwhile, and a retry row if the promise
   * rejects. The result is kept: the node is not asked again.
   */
  loadChildren?: (node: TreeNode) => Promise<TreeNode[]>;
  /** Called when `loadChildren` rejects. */
  onLoadError?: (error: unknown, node: TreeNode) => void;
  /**
   * Draws the label of a row instead of `node.label`. Rows are memoised: pass
   * a function that does not change between renders (`useCallback`), or every
   * row is drawn again whenever the tree is.
   */
  renderLabel?: (node: TreeNode, state: TreeRowState) => React.ReactNode;
  /** How far each level is pushed in, in px. Defaults to 24. */
  indent?: number;
  /** Row height and text size: 32, 40 or 48 px. Defaults to `"medium"`. */
  size?: "small" | "medium" | "large";
  /** Nothing can be opened, selected or focused. Defaults to `false`. */
  disabled?: boolean;
  /** Draws a vertical guide line down each open node's children. Defaults to `false`. */
  showLines?: boolean;
  /** The text of the loading row. Defaults to `"Loading…"`. */
  loadingText?: string;
  /** The text of the row that retries a failed load. Defaults to `"Could not load. Try again"`. */
  retryText?: string;
  /** Names the tree for assistive tech. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// --- The store the rows read from ------------------------------------------
//
// Each row subscribes to its own slice of the tree's state (a few bits, see
// `rowFlags`), so a press that changes one row draws that row, not the whole
// tree: React skips a memoised row whose props did not change, and the store
// wakes only the rows whose flags did.

type Status = "loading" | "error";

interface Snapshot {
  expanded: ReadonlySet<string>;
  selected: ReadonlySet<string>;
  checks: ReadonlyMap<string, CheckState>;
  loaded: ReadonlyMap<string, TreeNode[]>;
  status: ReadonlyMap<string, Status>;
  /** The row with the keyboard focus, `null` while the tree has none. */
  focused: string | null;
  /** The one row in the tab order. */
  tabStop: string | null;
}

const EXPANDED = 1;
const SELECTED = 2;
const CHECKED = 4;
const MIXED = 8;
const FOCUSED = 16;
const TAB_STOP = 32;
const LOADING = 64;
const FAILED = 128;
const LOADED = 256;

const rowFlags = (snap: Snapshot, id: string) => {
  const check = snap.checks.get(id);
  const status = snap.status.get(id);
  return (
    (snap.expanded.has(id) ? EXPANDED : 0) |
    (snap.selected.has(id) ? SELECTED : 0) |
    (check === "checked" ? CHECKED : 0) |
    (check === "mixed" ? MIXED : 0) |
    (snap.focused === id ? FOCUSED : 0) |
    (snap.tabStop === id ? TAB_STOP : 0) |
    (status === "loading" ? LOADING : 0) |
    (status === "error" ? FAILED : 0) |
    (snap.loaded.has(id) ? LOADED : 0)
  );
};

const NONE_SET: ReadonlySet<string> = new Set();
const NONE_MAP: ReadonlyMap<string, never> = new Map<string, never>();
const NO_SNAPSHOT: Snapshot = {
  expanded: NONE_SET,
  selected: NONE_SET,
  checks: NONE_MAP,
  loaded: NONE_MAP,
  status: NONE_MAP,
  focused: null,
  tabStop: null,
};

const createStore = () => {
  const listeners = new Set<() => void>();
  let snapshot = NO_SNAPSHOT;
  return {
    get: () => snapshot,
    set: (next: Snapshot) => {
      snapshot = next;
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    emit: () => listeners.forEach((listener) => listener()),
  };
};
type Store = ReturnType<typeof createStore>;

interface Actions {
  /** A press on a row. */
  activate: (id: string) => void;
  /** A press on a chevron, or the screen reader's expand and collapse. */
  toggle: (id: string) => void;
  retry: (id: string) => void;
}

interface Shared {
  store: Store;
  actions: Actions;
  theme: Theme;
  styles: ReturnType<typeof makeStyles>;
  treeId: string;
  selectionMode: "none" | "single" | "multiple";
  checkboxes: boolean;
  disabled: boolean;
  size: "small" | "medium" | "large";
  indent: number;
  showLines: boolean;
  loadingText: string;
  retryText: string;
  renderLabel?: TreeProps["renderLabel"];
  testID?: string;
}

const ROW_HEIGHT = { small: 32, medium: 40, large: 48 };
const CHEVRON = 24;

const isText = (node: React.ReactNode): node is string | number =>
  typeof node === "string" || typeof node === "number";

const domId = (treeId: string, id: string) =>
  `${treeId}-${encodeURIComponent(id)}`;

const web = () => Platform.OS === "web";

// --- Rows -------------------------------------------------------------------

const Chevron = ({
  expanded,
  color,
  reduceMotion,
}: {
  expanded: boolean;
  color: string;
  reduceMotion: boolean;
}) => {
  const [turn] = useState(() => new Animated.Value(expanded ? 1 : 0));
  const turned = useRef(expanded);
  useEffect(() => {
    if (turned.current === expanded) return;
    turned.current = expanded;
    Animated.timing(turn, {
      toValue: expanded ? 1 : 0,
      duration: reduceMotion ? 0 : 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [expanded, reduceMotion, turn]);
  const rotate = turn.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "90deg"],
  });
  return (
    <Animated.View style={{ transform: [{ rotate }] }}>
      <Icons name="chevron-right" size={20} color={color} />
    </Animated.View>
  );
};

interface BranchProps {
  node: TreeNode;
  level: number;
  posInSet: number;
  setSize: number;
  shared: Shared;
}

// One node and, when it is open, the branches under it. The function's name is
// not `TreeBranch`: inside it that name would be the bare function, and the
// recursion below would skip the memo.
const TreeBranch = React.memo(function Branch({
  node,
  level,
  posInSet,
  setSize,
  shared,
}: BranchProps) {
  const { store, actions, theme, styles, checkboxes, selectionMode } = shared;
  const read = () => rowFlags(store.get(), node.id);
  const flags = useSyncExternalStore(store.subscribe, read, read);
  const reduceMotion = useReduceMotion();

  const kids =
    node.children ??
    (flags & LOADED ? store.get().loaded.get(node.id) : undefined);
  const expandable = kids ? kids.length > 0 : !!node.hasChildren;
  const expanded = expandable && !!(flags & EXPANDED);
  const loading = !!(flags & LOADING);
  const failed = !!(flags & FAILED);
  const checkMode = checkboxes && selectionMode === "multiple";
  const checked = !!(flags & CHECKED);
  const mixed = !!(flags & MIXED);
  const selectable = selectionMode !== "none";
  const highlighted = !checkMode && selectable && !!(flags & SELECTED);
  const focused = !!(flags & FOCUSED);
  const inert = shared.disabled;
  const rowDisabled = inert || !!node.disabled;
  const id = domId(shared.treeId, node.id);
  const isWeb = web();

  const state: TreeRowState = {
    level,
    expanded,
    selected: checkMode ? checked : highlighted,
    indeterminate: mixed,
    loading,
    disabled: rowDisabled,
  };

  const onColor = highlighted
    ? theme.colors.onSecondaryContainer
    : theme.colors.onSurface;
  const secondary = highlighted
    ? theme.colors.onSecondaryContainer
    : theme.colors.onSurfaceVariant;

  const labelNode = shared.renderLabel ? (
    shared.renderLabel(node, state)
  ) : isText(node.label) ? (
    <Text
      style={[
        theme.typography[shared.size === "small" ? "bodyMedium" : "bodyLarge"],
        { color: onColor },
      ]}
      numberOfLines={1}
    >
      {node.label}
    </Text>
  ) : (
    node.label
  );

  const iconNode =
    typeof node.icon === "string" ? (
      <Icons
        name={node.icon as MaterialCommunityIconsGlyphs}
        size={20}
        color={secondary}
      />
    ) : (
      node.icon
    );

  const badgeNode =
    node.badge === undefined ||
    node.badge === null ||
    node.badge === false ? null : isText(node.badge) ? (
      <View
        style={[
          styles.badge,
          {
            backgroundColor: highlighted
              ? theme.colors.surface
              : theme.colors.secondaryContainer,
          },
        ]}
      >
        <Text
          style={[
            theme.typography.labelSmall,
            { color: theme.colors.onSecondaryContainer },
          ]}
        >
          {node.badge}
        </Text>
      </View>
    ) : (
      node.badge
    );

  // What a screen reader gets: on the web the ARIA tree pattern (the wrapper is
  // the treeitem, the row only draws and takes the pointer); on native the row
  // is the one accessible element, with the opening as a custom action.
  const itemProps = isWeb
    ? ({
        role: "treeitem",
        tabIndex: flags & TAB_STOP && !inert ? 0 : -1,
        "aria-level": level,
        "aria-posinset": posInSet,
        "aria-setsize": setSize,
        "aria-labelledby": `${id}-label`,
        "aria-expanded": expandable ? expanded : undefined,
        "aria-disabled": rowDisabled || undefined,
        ...(checkMode
          ? { "aria-checked": mixed ? "mixed" : checked }
          : selectable
            ? { "aria-selected": highlighted }
            : null),
      } as object)
    : null;
  const rowProps = isWeb
    ? ({ tabIndex: -1 } as object)
    : ({
        accessible: true,
        accessibilityRole: checkMode
          ? "checkbox"
          : selectable || expandable
            ? "button"
            : undefined,
        accessibilityLabel: isText(node.label) ? String(node.label) : undefined,
        accessibilityState: {
          disabled: rowDisabled,
          expanded: expandable ? expanded : undefined,
          selected: !checkMode && selectable ? highlighted : undefined,
          checked: checkMode ? (mixed ? "mixed" : checked) : undefined,
        },
        accessibilityActions: expandable
          ? [{ name: expanded ? "collapse" : "expand" }]
          : undefined,
        onAccessibilityAction: () => actions.toggle(node.id),
      } as object);

  const slop = isWeb ? 0 : Math.max(0, (48 - ROW_HEIGHT[shared.size]) / 2);
  const padLeft = (level - 1) * shared.indent;

  return (
    <View
      // The ids are for the web (aria-labelledby, focus()): off it they would
      // only add an instance-dependent value to every row.
      id={isWeb ? id : undefined}
      style={isWeb ? styles.item : undefined}
      testID={shared.testID ? `${shared.testID}-item-${node.id}` : undefined}
      {...itemProps}
    >
      <Pressable
        onPress={() => actions.activate(node.id)}
        disabled={rowDisabled}
        hitSlop={slop ? { top: slop, bottom: slop } : undefined}
        style={({ hovered, pressed }: PressableState) => [
          styles.row,
          { paddingLeft: padLeft + theme.spacing.xs },
          {
            backgroundColor: highlighted
              ? pressed
                ? getStateColor(
                    theme.colors.secondaryContainer,
                    theme.colors.onSecondaryContainer,
                    "press",
                  )
                : hovered
                  ? getStateColor(
                      theme.colors.secondaryContainer,
                      theme.colors.onSecondaryContainer,
                      "hover",
                    )
                  : theme.colors.secondaryContainer
              : pressed
                ? getStateColor(
                    theme.colors.surface,
                    theme.colors.onSurface,
                    "press",
                  )
                : hovered
                  ? getStateColor(
                      theme.colors.surface,
                      theme.colors.onSurface,
                      "hover",
                    )
                  : "transparent",
          },
          focused && getFocusRing(theme),
          rowDisabled && styles.disabled,
        ]}
        {...rowProps}
      >
        {expandable ? (
          <Pressable
            onPress={() => actions.toggle(node.id)}
            disabled={inert}
            hitSlop={8}
            accessible={false}
            style={styles.chevron}
            testID={
              shared.testID ? `${shared.testID}-chevron-${node.id}` : undefined
            }
            {...(isWeb ? ({ tabIndex: -1 } as object) : null)}
          >
            <Chevron
              expanded={expanded}
              color={secondary}
              reduceMotion={reduceMotion}
            />
          </Pressable>
        ) : (
          <View style={styles.chevron} />
        )}
        {checkMode && (
          <View
            style={[
              styles.checkbox,
              checked || mixed
                ? { backgroundColor: theme.colors.primary }
                : {
                    borderWidth: 2,
                    borderColor: theme.colors.onSurfaceVariant,
                  },
            ]}
          >
            {(checked || mixed) && (
              <Icons
                name={mixed && !checked ? "minus" : "check"}
                size={14}
                color={theme.colors.onPrimary}
              />
            )}
          </View>
        )}
        {iconNode}
        <View style={styles.label} id={isWeb ? `${id}-label` : undefined}>
          {labelNode}
        </View>
        {badgeNode}
      </Pressable>
      {expandable && (
        <Collapse open={expanded} duration={reduceMotion ? 0 : 200}>
          <View {...(isWeb ? ({ role: "group" } as object) : null)}>
            {shared.showLines && (
              <View
                pointerEvents="none"
                style={[
                  styles.line,
                  { left: padLeft + theme.spacing.xs + 1.5 + CHEVRON / 2 },
                ]}
              />
            )}
            {kids?.map((kid, i) => (
              <TreeBranch
                key={kid.id}
                node={kid}
                level={level + 1}
                posInSet={i + 1}
                setSize={kids.length}
                shared={shared}
              />
            ))}
            {loading && (
              <View
                style={[
                  styles.status,
                  { paddingLeft: level * shared.indent + theme.spacing.xs },
                ]}
              >
                <View style={styles.chevron}>
                  <ActivityIndicator
                    size="small"
                    color={theme.colors.primary}
                  />
                </View>
                <Text
                  style={[
                    theme.typography.bodyMedium,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {shared.loadingText}
                </Text>
              </View>
            )}
            {failed && (
              <Pressable
                onPress={() => actions.retry(node.id)}
                accessibilityRole="button"
                style={[
                  styles.status,
                  { paddingLeft: level * shared.indent + theme.spacing.xs },
                ]}
                {...(isWeb ? ({ tabIndex: -1 } as object) : null)}
              >
                <View style={styles.chevron}>
                  <Icons
                    name="alert-circle-outline"
                    size={20}
                    color={theme.colors.error}
                  />
                </View>
                <Text
                  style={[
                    theme.typography.bodyMedium,
                    { color: theme.colors.error },
                  ]}
                >
                  {shared.retryText}
                </Text>
              </Pressable>
            )}
          </View>
        </Collapse>
      )}
    </View>
  );
});

// --- The tree ---------------------------------------------------------------

interface KeyEventLike {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  preventDefault?: () => void;
}

/**
 * A hierarchy you can open and close: folders and files, a category tree, an
 * org chart. Rows open with a chevron, can be selected one at a time or with
 * checkboxes (a parent shows the mixed state when only some of its children
 * are checked), and can load their children the first time they are opened.
 *
 * On the web it is the ARIA tree pattern: one tab stop, then the arrow keys
 * (Up and Down move, Right opens or steps in, Left closes or steps out, Home
 * and End jump), Enter or Space acts on the row, `*` opens the siblings, and
 * typing a letter jumps to the next label that starts with it.
 *
 * ```tsx
 * <Tree
 *   data={[{ id: "src", label: "src", icon: "folder-outline", children: [{ id: "app", label: "App.tsx" }] }]}
 *   selectionMode="single"
 *   onSelectedChange={([id]) => open(id)}
 * />
 * ```
 */
const Tree = ({
  data,
  expanded: expandedProp,
  defaultExpanded = [],
  onExpandedChange,
  selected: selectedProp,
  defaultSelected = [],
  onSelectedChange,
  selectionMode = "none",
  checkboxes = false,
  loadChildren,
  onLoadError,
  renderLabel,
  indent = 24,
  size = "medium",
  disabled = false,
  showLines = false,
  loadingText = "Loading…",
  retryText = "Could not load. Try again",
  accessibilityLabel,
  style,
  testID,
}: TreeProps) => {
  const { theme } = useTheme();
  const treeId = useId();
  const [expandedState, setExpandedState] = useState(defaultExpanded);
  const [selectedState, setSelectedState] = useState(defaultSelected);
  const [loaded, setLoaded] = useState<ReadonlyMap<string, TreeNode[]>>(
    () => new Map(),
  );
  const [status, setStatus] = useState<ReadonlyMap<string, Status>>(
    () => new Map(),
  );
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [active, setActive] = useState(false);

  const expandedIds = expandedProp ?? expandedState;
  const selectedIds = selectedProp ?? selectedState;
  const expandedSet = useMemo(() => new Set(expandedIds), [expandedIds]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const checkMode = checkboxes && selectionMode === "multiple";

  const index = useMemo(() => indexNodes(data, loaded), [data, loaded]);
  const rows = useMemo(
    () => visibleRows(data, loaded, expandedSet),
    [data, loaded, expandedSet],
  );
  const checks = useMemo(
    () =>
      checkMode
        ? checkStates(data, loaded, selectedSet)
        : new Map<string, CheckState>(),
    [checkMode, data, loaded, selectedSet],
  );
  // Exactly one row is in the tab order: the one last focused, if it is still
  // there, else the first.
  const tabStop = rows.some((r) => r.id === focusedId)
    ? focusedId
    : (rows[0]?.id ?? null);

  const [store] = useState(createStore);
  // Written while rendering so a row drawn in this very pass reads fresh state;
  // the rows React skips are woken once the pass is committed.
  store.set({
    expanded: expandedSet,
    selected: selectedSet,
    checks,
    loaded,
    status,
    focused: active && !disabled ? focusedId : null,
    tabStop,
  });
  useLayoutEffect(() => {
    store.emit();
  });

  // --- State changes --------------------------------------------------------

  const setExpanded = (next: string[]) => {
    if (expandedProp === undefined) setExpandedState(next);
    onExpandedChange?.(next);
  };
  const setSelected = (next: string[]) => {
    if (selectedProp === undefined) setSelectedState(next);
    onSelectedChange?.(next);
  };

  const focusRow = (id: string) => {
    setFocusedId(id);
    if (!web() || typeof document === "undefined") return;
    (
      document.getElementById(domId(treeId, id)) as HTMLElement | null
    )?.focus?.();
  };

  const toggleExpanded = (id: string) => {
    const info = index.get(id);
    if (disabled || !info || !isExpandable(info.node, loaded)) return;
    setExpanded(
      expandedSet.has(id)
        ? expandedIds.filter((e) => e !== id)
        : [...expandedIds, id],
    );
  };

  const activate = (id: string) => {
    const info = index.get(id);
    if (disabled || !info) return;
    focusRow(id);
    const { node } = info;
    if (node.disabled) return;
    if (selectionMode === "none") return toggleExpanded(id);
    if (checkMode) {
      const next = toggleChecked(data, loaded, index, selectedSet, id);
      if (next) setSelected(next);
    } else if (selectionMode === "single") {
      if (!selectedSet.has(id)) setSelected([id]);
    } else {
      setSelected(toggleIn(selectedIds, id));
    }
  };

  // --- Lazy children --------------------------------------------------------

  const inflight = useRef(new Set<string>());
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const loader = useRef(loadChildren);
  const onError = useRef(onLoadError);
  useEffect(() => {
    loader.current = loadChildren;
    onError.current = onLoadError;
  });

  // Whatever opens a node (the chevron, a key, `expanded` set from outside)
  // lands here: an open node that is waiting for children gets them.
  useEffect(() => {
    if (!loader.current) return;
    expandedIds.forEach((id) => {
      const node = index.get(id)?.node;
      if (!node || !node.hasChildren || node.children) return;
      if (loaded.has(id) || status.has(id) || inflight.current.has(id)) return;
      inflight.current.add(id);
      setStatus((s) => new Map(s).set(id, "loading"));
      loader.current!(node).then(
        (kids) => {
          inflight.current.delete(id);
          if (!mounted.current) return;
          setLoaded((l) => new Map(l).set(id, kids));
          setStatus((s) => {
            const next = new Map(s);
            next.delete(id);
            return next;
          });
        },
        (error: unknown) => {
          inflight.current.delete(id);
          if (!mounted.current) return;
          setStatus((s) => new Map(s).set(id, "error"));
          onError.current?.(error, node);
        },
      );
    });
  }, [expandedIds, index, loaded, status]);

  const retry = (id: string) =>
    setStatus((s) => {
      const next = new Map(s);
      next.delete(id);
      return next;
    });

  // --- Keyboard (web) -------------------------------------------------------

  const typeAhead = useRef({ text: "", time: 0 });
  const onKeyDown = (event: KeyEventLike) => {
    if (disabled || rows.length === 0) return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const at = Math.max(
      0,
      rows.findIndex((r) => r.id === focusedId),
    );
    const row = rows[at];
    const go = (target?: RowInfo) => {
      event.preventDefault?.();
      if (target) focusRow(target.id);
    };
    switch (event.key) {
      case "ArrowDown":
        return go(rows[at + 1]);
      case "ArrowUp":
        return go(rows[at - 1]);
      case "Home":
        return go(rows[0]);
      case "End":
        return go(rows[rows.length - 1]);
      case "ArrowRight":
        if (!row.expandable) return;
        if (!row.expanded) {
          event.preventDefault?.();
          return toggleExpanded(row.id);
        }
        return go(rows[at + 1]?.parent === row.id ? rows[at + 1] : undefined);
      case "ArrowLeft":
        if (row.expanded) {
          event.preventDefault?.();
          return toggleExpanded(row.id);
        }
        return row.parent
          ? go(rows.find((r) => r.id === row.parent))
          : undefined;
      case "Enter":
      case " ":
        event.preventDefault?.();
        return activate(row.id);
      case "*": {
        event.preventDefault?.();
        const siblings = rows
          .filter((r) => r.parent === row.parent && r.expandable && !r.expanded)
          .map((r) => r.id);
        if (siblings.length) setExpanded([...expandedIds, ...siblings]);
        return;
      }
      default: {
        if (event.key.length !== 1) return;
        const typed = typeAhead.current;
        const now = Date.now();
        typed.text =
          now - typed.time > 700 ? event.key : typed.text + event.key;
        typed.time = now;
        const needle = typed.text.toLowerCase();
        // One letter again and again steps on to the next label; a longer
        // prefix may match the row it is on.
        const from = needle.length > 1 ? 0 : 1;
        for (let k = 0; k < rows.length; k++) {
          const candidate = rows[(at + from + k) % rows.length];
          const label = candidate.node.label;
          if (isText(label) && String(label).toLowerCase().startsWith(needle)) {
            return go(candidate);
          }
        }
      }
    }
  };

  // --- Render ---------------------------------------------------------------

  const toggle = (id: string) => {
    focusRow(id);
    toggleExpanded(id);
  };
  const latest = useRef<Actions>({ activate, toggle, retry });
  useLayoutEffect(() => {
    latest.current = { activate, toggle, retry };
  });
  const actions = useMemo<Actions>(
    () => ({
      activate: (id) => latest.current.activate(id),
      toggle: (id) => latest.current.toggle(id),
      retry: (id) => latest.current.retry(id),
    }),
    [],
  );
  const styles = useMemo(() => makeStyles(theme, size), [theme, size]);
  const shared = useMemo<Shared>(
    () => ({
      store,
      actions,
      theme,
      styles,
      treeId,
      selectionMode,
      checkboxes,
      disabled,
      size,
      indent,
      showLines,
      loadingText,
      retryText,
      renderLabel,
      testID,
    }),
    [
      store,
      actions,
      theme,
      styles,
      treeId,
      selectionMode,
      checkboxes,
      disabled,
      size,
      indent,
      showLines,
      loadingText,
      retryText,
      renderLabel,
      testID,
    ],
  );

  const treeProps = web()
    ? ({
        role: "tree",
        "aria-multiselectable": selectionMode === "multiple" || undefined,
        "aria-label": accessibilityLabel,
        "aria-disabled": disabled || undefined,
        onKeyDown,
        onFocus: () => {
          setActive(true);
          setFocusedId((current) => current ?? tabStop);
        },
        onBlur: (event: {
          currentTarget?: { contains?: (node: unknown) => boolean };
          relatedTarget?: unknown;
        }) => {
          const next = event?.relatedTarget;
          if (next && event.currentTarget?.contains?.(next)) return;
          setActive(false);
        },
      } as object)
    : null;

  return (
    <View
      style={style}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      {...treeProps}
    >
      {data.map((node, i) => (
        <TreeBranch
          key={node.id}
          node={node}
          level={1}
          posInSet={i + 1}
          setSize={data.length}
          shared={shared}
        />
      ))}
    </View>
  );
};

export default Tree;

const makeStyles = (theme: Theme, size: "small" | "medium" | "large") =>
  StyleSheet.create({
    // Under the pointer rows have their own state layer; the wrapper is only
    // what the keyboard focuses, so the browser's outline is not drawn round
    // a row and everything under it.
    item: { outlineWidth: 0 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: ROW_HEIGHT[size],
      paddingRight: theme.spacing.s,
      gap: theme.spacing.s,
      borderRadius: theme.shape.small,
      // Reserved, so the focus ring does not move the row.
      borderWidth: 1.5,
      borderColor: "transparent",
      ...Platform.select({ web: { cursor: "pointer" as const } }),
    },
    disabled: { opacity: 0.38 },
    chevron: {
      width: CHEVRON,
      height: CHEVRON,
      alignItems: "center",
      justifyContent: "center",
    },
    checkbox: {
      width: 18,
      height: 18,
      borderRadius: 2,
      alignItems: "center",
      justifyContent: "center",
    },
    label: { flexShrink: 1, flexGrow: 1 },
    badge: {
      minWidth: 20,
      paddingHorizontal: theme.spacing.s,
      paddingVertical: 2,
      borderRadius: theme.shape.small,
      alignItems: "center",
    },
    line: {
      position: "absolute",
      top: 0,
      bottom: 0,
      width: 1,
      backgroundColor: theme.colors.outlineVariant,
    },
    status: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.s,
      minHeight: ROW_HEIGHT[size],
    },
  });
