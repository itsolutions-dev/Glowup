import React, { Children, isValidElement, ReactElement } from "react";
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { SizeClass, useBreakpoint } from "../../hooks/useBreakpoint";
import {
  GridLayoutItem,
  gridLayoutHeight,
  gridReadingOrder,
  itemPlacement,
} from "../internal/gridLayout";

export type { GridLayoutItem } from "../internal/gridLayout";
export {
  clampGridItem,
  gridLayoutHeight,
  gridReadingOrder,
} from "../internal/gridLayout";

export interface GridLayoutProps {
  /** Where each child sits, matched to the child by `key` = `id`. */
  layout: GridLayoutItem[];
  /** How many columns the width is divided into. Defaults to 12. */
  columns?: number;
  /** Height of one row, in dp. Defaults to 48. */
  rowHeight?: number;
  /** Space between columns and between rows, in dp. Defaults to 16. */
  gap?: number;
  /**
   * Below this window size class the children stack in reading order (rows
   * top to bottom, then left to right), each at its content's height.
   * Defaults to `"medium"`.
   */
  stackBelow?: SizeClass;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Also gives each item's wrapper `${testID}-${id}`. */
  testID?: string;
}

/**
 * Places its children on a grid of cells from layout data: each child, matched
 * by its `key`, takes the columns and rows its entry in `layout` names, and
 * cells left empty stay empty. An item is as tall as its rows, and content
 * taller than that scrolls inside it. Below `stackBelow` the children stack
 * full width in reading order instead, at their content's height.
 *
 * Placement needs no measured width (percentages plus dp margins), so the grid
 * prerenders and follows its container's width by itself. A `GridLayout`
 * inside an item lays out on that item's width: with as many `columns` as the
 * item spans, its cells are about as wide as the outer grid's (exactly, in an
 * item with no padding; padding narrows them).
 */
const GridLayout = ({
  layout,
  columns = 12,
  rowHeight = 48,
  gap = 16,
  stackBelow = "medium",
  children,
  style,
  testID,
}: GridLayoutProps) => {
  const { atLeast } = useBreakpoint();
  // forEach, not toArray: toArray rewrites the keys the layout refers to.
  const byId = new Map<string, ReactElement>();
  Children.forEach(children, (child) => {
    if (isValidElement(child) && child.key != null) {
      byId.set(String(child.key), child);
    }
  });
  const itemID = (id: string) => (testID ? `${testID}-${id}` : undefined);

  if (!atLeast(stackBelow)) {
    return (
      <View testID={testID} style={[{ gap }, style]}>
        {gridReadingOrder(layout).map((item) =>
          byId.has(item.id) ? (
            <View key={item.id} testID={itemID(item.id)}>
              {byId.get(item.id)}
            </View>
          ) : null,
        )}
      </View>
    );
  }

  return (
    <View
      testID={testID}
      style={[{ height: gridLayoutHeight(layout, rowHeight, gap) }, style]}
    >
      {layout.map((item) =>
        byId.has(item.id) ? (
          <View
            key={item.id}
            testID={itemID(item.id)}
            style={[styles.item, itemPlacement(item, columns, rowHeight, gap)]}
          >
            {/* Like the library's other nested scrollers: no bounce, or iOS
                gives every vertical pan to the item and the page stops
                scrolling; a tap with the keyboard up reaches its control. */}
            <ScrollView
              nestedScrollEnabled
              bounces={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.content}
            >
              {byId.get(item.id)}
            </ScrollView>
          </View>
        ) : null,
      )}
    </View>
  );
};

export default GridLayout;

const styles = StyleSheet.create({
  item: { position: "absolute" },
  content: { flexGrow: 1 },
});
