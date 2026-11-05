import React, {
  Children,
  ReactElement,
  ReactNode,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  LayoutChangeEvent,
  StyleProp,
  StyleSheet,
  View,
  ViewProps,
  ViewStyle,
} from "react-native";
import { useTheme } from "../../providers/ThemeProvider";
import { SizeClass, useBreakpoint } from "../../hooks/useBreakpoint";
import { SpacingInput, resolveSpacing } from "./tokens";

/**
 * A breakpoint of the grid, mobile-first: each applies from its width up. They
 * are the Material 3 window size classes — `xs` from 0 dp, `sm` from 600,
 * `md` from 840, `lg` from 1200 and `xl` from 1600.
 */
export type GridBreakpoint = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * How wide an item is: a number of columns (1 to `columns`), `"grow"` to share
 * what the row has left with the other growing items, or `"auto"` to size to
 * its content.
 */
export type GridSpan = number | "auto" | "grow";

/** A `GridSpan` for each breakpoint, `{ xs: 12, md: 6 }`. */
export type GridSizeMap = Partial<Record<GridBreakpoint, GridSpan>>;

/** The `size` of a grid item: one span for every width, or one per breakpoint. */
export type GridSize = GridSpan | GridSizeMap;

/** The gap between items: one value for both axes, or `{ row, column }`. */
export type GridSpacing =
  SpacingInput | { row?: SpacingInput; column?: SpacingInput };

/** Called for each child of an `autoSize` grid, to size it. */
export type GridAutoSizeFn = (index: number, child: ReactElement) => GridSize;

/** What `autoSize={true}` uses: a card per row on a phone, three on a desktop. */
const DEFAULT_AUTO_SIZE: GridSizeMap = { xs: 12, sm: 6, md: 4 };

const BREAKPOINTS: GridBreakpoint[] = ["xs", "sm", "md", "lg", "xl"];

const BY_SIZE_CLASS: Record<SizeClass, GridBreakpoint> = {
  compact: "xs",
  medium: "sm",
  expanded: "md",
  large: "lg",
  extraLarge: "xl",
};

/** What a container tells its items about the row they sit in. */
interface GridContextValue {
  columns: number;
  /** Gap between two items of a row, in px. */
  columnGap: number;
  /** The container's width, or `null` until its first layout pass. */
  width: number | null;
  breakpoint: GridBreakpoint;
  wrap: boolean;
}

/** `null` outside a container, and inside an item (a grid's items are not its children). */
const GridContext = createContext<GridContextValue | null>(null);

/** The span `size` gives at `current`: the largest breakpoint set at or below it. */
const spanAt = (size: GridSize | undefined, current: GridBreakpoint) => {
  if (size === undefined) return "auto";
  if (typeof size !== "object") return size;
  for (let index = BREAKPOINTS.indexOf(current); index >= 0; index -= 1) {
    const span = size[BREAKPOINTS[index]];
    if (span !== undefined) return span;
  }
  return "auto";
};

/**
 * The style that gives an item its width in its container's row. Until the
 * container has been measured (a server render, the first frame) a column span
 * is a percentage and the container draws no gap, so the row still holds the
 * right number of items.
 */
const cellStyle = (
  grid: GridContextValue,
  size: GridSize | undefined,
): ViewStyle => {
  const span = spanAt(size, grid.breakpoint);
  if (span === "grow") {
    return { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0 };
  }
  if (span === "auto") return { flexGrow: 0, flexShrink: 0 };

  const columns = Math.max(1, grid.columns);
  const count = Math.min(Math.max(span, 1), columns);
  // A row that does not wrap squeezes its items instead of overflowing.
  const squeeze: ViewStyle = grid.wrap ? {} : { flexShrink: 1, minWidth: 0 };
  if (grid.width === null) {
    return { width: `${(count / columns) * 100}%`, ...squeeze };
  }
  // The columns share what is left of the row once the gaps are taken out; an
  // item spanning several also takes the gaps it covers. Whole pixels, rounded
  // down, so the sum of a row can never exceed the container.
  const free = grid.width - grid.columnGap * (columns - 1);
  const width = (free * count) / columns + grid.columnGap * (count - 1);
  return { width: Math.max(0, Math.floor(width)), ...squeeze };
};

/** Gives every child of an `autoSize` container a `size` it did not choose. */
const sizeChildren = (
  children: ReactNode,
  autoSize: true | GridSize | GridAutoSizeFn,
) => {
  const sizeOf = (index: number, child: ReactElement): GridSize =>
    typeof autoSize === "function"
      ? autoSize(index, child)
      : autoSize === true
        ? DEFAULT_AUTO_SIZE
        : autoSize;
  let index = 0;
  return Children.map(children, (child) => {
    if (!isValidElement<GridProps>(child)) return child;
    const size = sizeOf(index, child);
    index += 1;
    if (child.type !== Grid) return <Grid size={size}>{child}</Grid>;
    return child.props.size === undefined
      ? cloneElement(child, { size })
      : child;
  });
};

export interface GridProps extends Omit<ViewProps, "style" | "children"> {
  /**
   * Makes this grid lay its children out in rows of `columns` columns. The
   * grid items go inside it, each with its own `size`. A container inside
   * another container is also an item of it, and takes a `size` too.
   */
  container?: boolean;
  /** Columns in a row of this container; an item's `size` counts in them. */
  columns?: number;
  /**
   * An item's width in the container's row: a number of columns (1 to
   * `columns`), `"grow"` to share the rest of the row, `"auto"` to size to its
   * content, or an object with one of those for each breakpoint
   * (`{ xs: 12, md: 6 }`). A breakpoint without a value takes the next smaller
   * one that has; with none, the item is `"auto"`. Without `size` an item is
   * `"auto"`, unless the container has `autoSize`.
   */
  size?: GridSize;
  /**
   * Gap between the items of a container: a number of px, a spacing token name
   * (`"m"`), or `{ row, column }` of those for the two axes.
   */
  spacing?: GridSpacing;
  /** Whether a container moves items that do not fit onto the next row. */
  wrap?: boolean;
  /**
   * Sizes the children of a container that have no `size` of their own, so
   * they do not need one each. `true` is a card per row on a phone, two from
   * `sm` and three from `md` (`{ xs: 12, sm: 6, md: 4 }`, for 12 columns); a
   * size gives every child that size; a function is called with the index and
   * the element of each child (its `key` is `child.key`) and returns its size:
   * `(index, child) => child.key === "notes" ? { xs: 12 } : { xs: 12, md: 6 }`.
   * A child that is not a `Grid` is put in an item of the size it gets.
   */
  autoSize?: boolean | GridSize | GridAutoSizeFn;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

interface GridContainerProps
  extends
    Required<Pick<GridProps, "columns" | "spacing" | "wrap" | "autoSize">>,
    Omit<ViewProps, "style" | "children"> {
  /** The style of this grid as an item of the container above, if any. */
  cell?: ViewStyle;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

const GridContainer = ({
  columns,
  spacing,
  wrap,
  autoSize,
  cell,
  style,
  children,
  onLayout,
  ...viewProps
}: GridContainerProps) => {
  const { theme } = useTheme();
  const { sizeClass } = useBreakpoint();
  const [width, setWidth] = useState<number | null>(null);

  const axes =
    typeof spacing === "object" ? spacing : { row: spacing, column: spacing };
  const rowGap = resolveSpacing(theme, axes.row) ?? 0;
  const columnGap = resolveSpacing(theme, axes.column) ?? 0;
  const breakpoint = BY_SIZE_CLASS[sizeClass];

  const grid = useMemo<GridContextValue>(
    () => ({ columns, columnGap, width, breakpoint, wrap }),
    [columns, columnGap, width, breakpoint, wrap],
  );

  const handleLayout = (event: LayoutChangeEvent) => {
    // The layout width includes the container's own padding and border; the
    // items share only what is inside them.
    const s = StyleSheet.flatten([cell, style]) ?? {};
    const px = (...values: unknown[]) =>
      values.find((v): v is number => typeof v === "number") ?? 0;
    const inset =
      px(s.paddingLeft, s.paddingStart, s.paddingHorizontal, s.padding) +
      px(s.paddingRight, s.paddingEnd, s.paddingHorizontal, s.padding) +
      px(s.borderLeftWidth, s.borderStartWidth, s.borderWidth) +
      px(s.borderRightWidth, s.borderEndWidth, s.borderWidth);
    setWidth(event.nativeEvent.layout.width - inset);
    onLayout?.(event);
  };

  return (
    <GridContext.Provider value={grid}>
      <View
        {...viewProps}
        onLayout={handleLayout}
        style={[
          {
            flexDirection: "row",
            flexWrap: wrap ? "wrap" : "nowrap",
            rowGap,
            // The items' widths already leave room for the gaps once measured.
            columnGap: width === null ? 0 : columnGap,
          },
          cell,
          style,
        ]}
      >
        {autoSize === false ? children : sizeChildren(children, autoSize)}
      </View>
    </GridContext.Provider>
  );
};

/**
 * A 12-column responsive grid, for the container and for its items:
 *
 * ```tsx
 * <Grid container spacing={16}>
 *   <Grid size={{ xs: 12, md: 6 }}>…</Grid>
 *   <Grid size={{ xs: 12, md: 6 }}>…</Grid>
 * </Grid>
 * ```
 *
 * A container lays its items out in a wrapping row. An item's `size` is how
 * many of the container's columns it spans, per breakpoint, or `"grow"` /
 * `"auto"`. `autoSize` sizes the children of a container for you.
 *
 * The widths come from the container's measured width, so it needs one from
 * its parent (a column parent stretches it). A `Grid` that is neither a
 * container nor inside one is a plain `View`. The breakpoints follow the window
 * width, or the width a `ViewportProvider` sets.
 */
const Grid = ({
  container = false,
  columns = 12,
  size,
  spacing = "s",
  wrap = true,
  autoSize = false,
  style,
  children,
  ...viewProps
}: GridProps) => {
  const parent = useContext(GridContext);
  const cell = parent ? cellStyle(parent, size) : undefined;

  if (container) {
    return (
      <GridContainer
        {...viewProps}
        columns={columns}
        spacing={spacing}
        wrap={wrap}
        autoSize={autoSize}
        cell={cell}
        style={style}
      >
        {children}
      </GridContainer>
    );
  }
  if (!parent) {
    return (
      <View {...viewProps} style={style}>
        {children}
      </View>
    );
  }
  return (
    <View {...viewProps} style={[cell, style]}>
      <GridContext.Provider value={null}>{children}</GridContext.Provider>
    </View>
  );
};

export default Grid;
