// The phone grid (iOS and Android). React Native has no `position: sticky`, and moving the fixed parts
// from JavaScript lags behind the finger. So the numbers scroll on two axes (a horizontal scroll that
// holds a vertical one) and two animated values follow them with the native driver: the header, clipped
// in its box, moves with the horizontal offset, and the column of labels, clipped in its own, with the
// vertical one. No JavaScript runs between the finger and the screen. Rows have a fixed height, so the
// window of mounted rows is plain arithmetic (grid/windowing), updated only when it changes.
// The web grid (PivotGrid.web.tsx) does the same with CSS.
import React, { useEffect, useMemo, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { useTheme } from "@its/glowup-ui";
import {
  DEFAULT_HEIGHT,
  HEADER_HEIGHT,
  ROW_HEIGHT,
  gridSizes,
} from "./grid/layout";
import { gridStrings, type GridColumn, type GridRow } from "./grid/model";
import { ToggleArrow, cellAccess, messageText, rowColors } from "./grid/parts";
import type { PivotGridProps } from "./grid/props";
import { usePivotGrid } from "./grid/usePivotGrid";
import { sameRange, visibleRange } from "./grid/windowing";

type ScrollEvent = NativeSyntheticEvent<NativeScrollEvent>;

const PivotGrid = ({
  engine,
  localization,
  height = DEFAULT_HEIGHT,
}: PivotGridProps) => {
  const { theme } = useTheme();
  const { model, loading, toggle } = usePivotGrid(engine, localization);
  const [width, setWidth] = useState<number | undefined>(undefined);
  const [scrollTop, setScrollTop] = useState(0);
  // With a screen reader on, no rows are kept above and below the view: clipped out of sight, they
  // are still reported to TalkBack (React Native clips by drawing), and a reader could land on rows
  // nobody can see. The spare rows only hide blank space during a fast drag, which a reader does not do.
  const [reader, setReader] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isScreenReaderEnabled().then((on) => {
      if (alive) setReader(on);
    });
    const subscription = AccessibilityInfo.addEventListener(
      "screenReaderChanged",
      setReader,
    );
    return () => {
      alive = false;
      subscription.remove();
    };
  }, []);
  const overscan = reader ? 0 : undefined;
  const grid = gridStrings(localization);
  const collapse = grid.collapseChildren || "Collapse";
  const expand = grid.expandChildren || "Expand";

  const colors = theme.colors;
  const text = { color: colors.onSurface, ...theme.typography.bodyMedium };
  const sizes = gridSizes(width);
  const bodyHeight = height - HEADER_HEIGHT;
  const count = model?.rows.length ?? 0;
  const columns = model?.columns.length ?? 0;
  const fixed = sizes.chevron + sizes.label;
  const cellWidth =
    width === undefined
      ? sizes.cell
      : Math.max(
          sizes.cell,
          Math.floor((width - fixed) / Math.max(1, columns)),
        );
  const contentWidth = columns * cellWidth;

  // The offsets the animation follows. Created once; the events go to the native side.
  const [x] = useState(() => new Animated.Value(0));
  const [y] = useState(() => new Animated.Value(0));
  const [minusX] = useState(() => Animated.multiply(x, -1));
  const [minusY] = useState(() => Animated.multiply(y, -1));

  // The window moves only when the rows in it would change, not on every scroll event: the state
  // keeps its old value (and React skips the render) while the rows in view stay the same.
  const onScrollX = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { x } } }], {
        useNativeDriver: true,
      }),
    [x],
  );
  const onScrollY = useMemo(
    () =>
      Animated.event([{ nativeEvent: { contentOffset: { y } } }], {
        useNativeDriver: true,
        listener: (event: ScrollEvent) => {
          const top = event.nativeEvent.contentOffset.y;
          const args = {
            viewportHeight: bodyHeight,
            rowHeight: ROW_HEIGHT,
            count,
            overscan,
          };
          setScrollTop((current) =>
            sameRange(
              visibleRange({ ...args, scrollTop: top }),
              visibleRange({ ...args, scrollTop: current }),
            )
              ? current
              : top,
          );
        },
      }),
    [y, bodyHeight, count, overscan],
  );

  const onLayout = (event: LayoutChangeEvent) =>
    setWidth(Math.round(event.nativeEvent.layout.width));

  if (!model || model.empty) {
    return (
      <View style={[styles.message, { height }]}>
        <Text style={text}>{messageText(loading, grid)}</Text>
      </View>
    );
  }

  const { start, end } = visibleRange({
    scrollTop,
    viewportHeight: bodyHeight,
    rowHeight: ROW_HEIGHT,
    count: model.rows.length,
    overscan,
  });
  const rows = model.rows.slice(start, end);

  const arrow = (item: GridColumn | GridRow, size: number, color: string) => (
    <ToggleArrow
      item={item}
      size={size}
      color={color}
      collapse={collapse}
      expand={expand}
      onToggle={toggle}
    />
  );

  const border = { borderBottomColor: colors.outlineVariant };
  const spacer = (rowsCount: number) => (
    <View style={{ height: rowsCount * ROW_HEIGHT }} />
  );

  return (
    <View
      testID="pivot-grid"
      accessibilityLabel="Pivot grid"
      onLayout={onLayout}
      style={{ height }}
    >
      <View style={styles.top}>
        <View
          testID="pivot-corner"
          style={{
            width: fixed,
            height: HEADER_HEIGHT,
            backgroundColor: colors.surfaceContainerHigh,
          }}
        />
        <View testID="pivot-header-clip" style={styles.clip}>
          <Animated.View
            testID="pivot-header-track"
            style={[
              styles.headerTrack,
              {
                width: contentWidth,
                backgroundColor: colors.surfaceContainerHigh,
                transform: [{ translateX: minusX }],
              },
            ]}
          >
            {model.columns.map((column) => (
              <View
                key={column.key}
                style={[styles.headerCell, { width: cellWidth }]}
              >
                {arrow(column, 24, colors.onSurface)}
                <Text numberOfLines={1} style={[text, styles.headerText]}>
                  {column.label}
                </Text>
              </View>
            ))}
          </Animated.View>
        </View>
      </View>

      <View style={{ flexDirection: "row", height: bodyHeight }}>
        <View
          testID="pivot-label-clip"
          style={[styles.labelClip, { width: fixed }]}
        >
          <Animated.View
            testID="pivot-label-track"
            style={{ transform: [{ translateY: minusY }] }}
          >
            {spacer(start)}
            {rows.map((row) => {
              const { background, color } = rowColors(row, colors);
              return (
                <View
                  key={row.key}
                  style={[styles.row, border, { backgroundColor: background }]}
                >
                  <View
                    testID={`pivot-chevron-${row.key}`}
                    style={[styles.chevron, { width: sizes.chevron }]}
                  >
                    {arrow(row, sizes.chevron, color)}
                  </View>
                  <View
                    testID={`pivot-label-${row.key}`}
                    style={[
                      styles.label,
                      { width: sizes.label, paddingLeft: 8 + row.indent },
                    ]}
                  >
                    <Text numberOfLines={1} style={[text, { color }]}>
                      {row.label}
                    </Text>
                  </View>
                </View>
              );
            })}
            {spacer(count - end)}
          </Animated.View>
        </View>

        <Animated.ScrollView
          testID="pivot-body-x"
          horizontal
          directionalLockEnabled
          scrollEventThrottle={16}
          onScroll={onScrollX}
          style={styles.bodyX}
        >
          <Animated.ScrollView
            testID="pivot-body-y"
            nestedScrollEnabled
            directionalLockEnabled
            scrollEventThrottle={16}
            onScroll={onScrollY}
            style={{ width: contentWidth }}
          >
            {spacer(start)}
            {rows.map((row) => {
              const { background, color } = rowColors(row, colors);
              return (
                <View
                  key={row.key}
                  testID={`pivot-row-${row.key}`}
                  style={[styles.row, border, { backgroundColor: background }]}
                >
                  {row.cells.map((cell, index) => (
                    <View
                      key={cell.key}
                      testID={`pivot-cell-${row.key}-${index}`}
                      {...cellAccess(cell, grid)}
                      style={[styles.cell, { width: cellWidth }]}
                    >
                      <Text
                        numberOfLines={1}
                        style={[
                          text,
                          styles.number,
                          { color: cell.error ? colors.error : color },
                        ]}
                      >
                        {cell.error ? "!" : cell.text}
                      </Text>
                    </View>
                  ))}
                </View>
              );
            })}
            {spacer(count - end)}
          </Animated.ScrollView>
        </Animated.ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  message: { alignItems: "center", justifyContent: "center" },
  top: { flexDirection: "row", height: HEADER_HEIGHT },
  clip: { flex: 1, overflow: "hidden" },
  headerTrack: { flexDirection: "row", height: HEADER_HEIGHT },
  headerCell: {
    height: HEADER_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 8,
  },
  headerText: { flexShrink: 1, textAlign: "right" },
  labelClip: { overflow: "hidden" },
  bodyX: { flex: 1 },
  // A row takes its height and the cells fill it: the 1 px bottom border stays visible.
  row: {
    flexDirection: "row",
    height: ROW_HEIGHT,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chevron: { alignItems: "center", justifyContent: "center" },
  label: { justifyContent: "center" },
  cell: {
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 12,
  },
  // The whole width of the cell, not the width of the digits: sized to its content, a number was
  // measured a fraction short on Android 15 at density 1 and drawn on two lines.
  number: { alignSelf: "stretch", textAlign: "right" },
});

export default PivotGrid;
