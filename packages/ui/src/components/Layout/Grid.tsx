import React, { useMemo, useState } from "react";
import { View, LayoutChangeEvent, useWindowDimensions } from "react-native";
import Box, { BoxProps } from "./Box";
import { useTheme } from "../../providers/ThemeProvider";
import { SpacingValue, resolveSpacing } from "./tokens";

export interface GridProps extends Omit<BoxProps, "row" | "wrap" | "gap"> {
  /** Fixed column count. Ignored when `minChildWidth` is set. */
  columns?: number;
  /**
   * Responsive alternative to `columns`: fits as many columns of at least this
   * width as the container allows.
   */
  minChildWidth?: number;
  /** Gap between cells — a spacing token name or a raw value. */
  spacing?: SpacingValue;
}

/**
 * Equal-width grid. `columns` for a fixed layout, `minChildWidth` to let the
 * column count follow the available width.
 *
 * Children are chunked into explicit rows rather than left to wrap, so the gap
 * never pushes a cell onto the next line and a short last row keeps its cells
 * at full column width instead of stretching them.
 */
const Grid = ({
  columns = 2,
  minChildWidth,
  spacing = "s",
  style,
  children,
  ...boxProps
}: GridProps) => {
  const { theme } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null);
  const gap = resolveSpacing(theme, spacing) ?? 0;

  const handleLayout = (event: LayoutChangeEvent) =>
    setMeasuredWidth(event.nativeEvent.layout.width);

  const columnCount = useMemo(() => {
    if (!minChildWidth) return Math.max(1, Math.floor(columns));
    // Fall back to the window width until the first layout pass reports ours.
    const available = measuredWidth ?? windowWidth;
    return Math.max(1, Math.floor((available + gap) / (minChildWidth + gap)));
  }, [columns, minChildWidth, measuredWidth, windowWidth, gap]);

  const rows = useMemo(() => {
    const items = React.Children.toArray(children).filter(Boolean);
    const chunks: React.ReactNode[][] = [];
    for (let index = 0; index < items.length; index += columnCount) {
      chunks.push(items.slice(index, index + columnCount));
    }
    return chunks;
  }, [children, columnCount]);

  return (
    <Box
      {...boxProps}
      onLayout={minChildWidth ? handleLayout : undefined}
      style={[{ gap }, style]}
    >
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={{ flexDirection: "row", gap }}>
          {row.map((cell, cellIndex) => (
            <View key={cellIndex} style={{ flex: 1 }}>
              {cell}
            </View>
          ))}
          {/* Placeholders keep the final row's cells at column width. */}
          {Array.from({ length: columnCount - row.length }, (_, index) => (
            <View key={`filler-${index}`} style={{ flex: 1 }} />
          ))}
        </View>
      ))}
    </Box>
  );
};

export default Grid;
