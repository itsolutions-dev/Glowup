// The web grid: one container that scrolls on both axes, with the header and the first two columns
// kept in place by `position: sticky`, and only the rows in view mounted. A nested vertical list
// would not do: `sticky left` binds to the nearest scrolling ancestor, which would then never
// scroll sideways. Rows have a fixed height, so the window is plain arithmetic (grid/windowing).
// The widths follow the container (grid/layout `gridSizes`): the number columns share what the
// fixed ones leave, and on a phone the fixed ones shrink so the numbers stay in view.
import React, { createElement, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type ViewStyle,
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
import { visibleRange } from "./grid/windowing";

// react-native-web accepts `position: "sticky"`, which React Native's own style type does not.
const sticky = (top: number | undefined, left: number | undefined, z: number) =>
  ({ position: "sticky", top, left, zIndex: z }) as unknown as ViewStyle;

const PivotGrid = ({
  engine,
  localization,
  height = DEFAULT_HEIGHT,
}: PivotGridProps) => {
  const { theme } = useTheme();
  const { model, loading, toggle } = usePivotGrid(engine, localization);
  const [scrollTop, setScrollTop] = useState(0);
  const [width, setWidth] = useState<number | undefined>(undefined);
  const grid = gridStrings(localization);
  const collapse = grid.collapseChildren || "Collapse";
  const expand = grid.expandChildren || "Expand";

  const colors = theme.colors;
  const text = { color: colors.onSurface, ...theme.typography.bodyMedium };
  const sizes = gridSizes(width);
  const onLayout = (event: LayoutChangeEvent) =>
    setWidth(Math.round(event.nativeEvent.layout.width));

  if (!model || model.empty) {
    return (
      <View style={[styles.message, { height }]}>
        <Text style={text}>{messageText(loading, grid)}</Text>
      </View>
    );
  }

  // A minimum, not a width: in a wider container the content stretches and the number columns grow.
  const minWidth =
    sizes.chevron + sizes.label + model.columns.length * sizes.cell;
  const numberCell = {
    flexGrow: 1,
    flexBasis: sizes.cell,
    minWidth: sizes.cell,
  };
  const { start, end } = visibleRange({
    scrollTop,
    viewportHeight: height - HEADER_HEIGHT,
    rowHeight: ROW_HEIGHT,
    count: model.rows.length,
  });

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

  const renderRow = (row: GridRow) => {
    const { background, color } = rowColors(row, colors);
    return (
      <View
        key={row.key}
        testID={`pivot-row-${row.key}`}
        style={[
          styles.row,
          {
            backgroundColor: background,
            borderBottomColor: colors.outlineVariant,
          },
        ]}
      >
        <View
          testID={`pivot-chevron-${row.key}`}
          style={[
            styles.chevron,
            sticky(undefined, 0, 2),
            { width: sizes.chevron, backgroundColor: background },
          ]}
        >
          {arrow(row, sizes.chevron, color)}
        </View>
        <View
          testID={`pivot-label-${row.key}`}
          style={[
            styles.label,
            sticky(undefined, sizes.chevron, 2),
            {
              width: sizes.label,
              backgroundColor: background,
              paddingLeft: 8 + row.indent,
            },
          ]}
        >
          <Text numberOfLines={1} style={[text, { color }]}>
            {row.label}
          </Text>
        </View>
        {row.cells.map((cell, index) => (
          <View
            key={cell.key}
            testID={`pivot-cell-${row.key}-${index}`}
            {...cellAccess(cell, grid)}
            role={cell.error ? "img" : undefined}
            style={[styles.cell, numberCell]}
          >
            <Text style={[text, { color: cell.error ? colors.error : color }]}>
              {cell.error ? "!" : cell.text}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View testID="pivot-grid" onLayout={onLayout}>
      {createElement(
        "div",
        {
          style: { overflow: "auto", height, position: "relative" },
          onScroll: (event: { currentTarget: { scrollTop: number } }) =>
            setScrollTop(event.currentTarget.scrollTop),
        },
        <View testID="pivot-content" style={{ minWidth }}>
          <View
            testID="pivot-header"
            style={[
              styles.header,
              sticky(0, undefined, 3),
              { backgroundColor: colors.surfaceContainerHigh },
            ]}
          >
            <View
              testID="pivot-corner"
              style={[
                styles.corner,
                sticky(undefined, 0, 4),
                {
                  width: sizes.chevron + sizes.label,
                  backgroundColor: colors.surfaceContainerHigh,
                },
              ]}
            />
            {model.columns.map((column) => (
              <View key={column.key} style={[styles.headerCell, numberCell]}>
                {arrow(column, 24, colors.onSurface)}
                <Text numberOfLines={1} style={[text, styles.headerText]}>
                  {column.label}
                </Text>
              </View>
            ))}
          </View>
          <View style={{ height: start * ROW_HEIGHT }} />
          {model.rows.slice(start, end).map(renderRow)}
          <View style={{ height: (model.rows.length - end) * ROW_HEIGHT }} />
        </View>,
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  message: { alignItems: "center", justifyContent: "center" },
  header: { flexDirection: "row", height: HEADER_HEIGHT },
  corner: { height: HEADER_HEIGHT },
  headerCell: {
    height: HEADER_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 8,
  },
  headerText: { flexShrink: 1, textAlign: "right" },
  // The cells of a row take its height (no height of their own): the row's 1 px bottom border
  // stays visible under the sticky ones too.
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
});

export default PivotGrid;
