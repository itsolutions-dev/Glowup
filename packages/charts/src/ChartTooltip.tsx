import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@its/glowup-ui";

export type TooltipRow = { color: string; name: string; value: string };

type ChartTooltipProps = {
  /** Where it points to, in the chart's own coordinates. */
  x: number;
  y: number;
  /** Width of the chart: the tooltip stays inside it. */
  containerWidth: number;
  title: string;
  rows: TooltipRow[];
};

/** A small card above the point it explains. It never takes touches: the chart under it keeps them. */
export const ChartTooltip = ({
  x,
  y,
  containerWidth,
  title,
  rows,
}: ChartTooltipProps) => {
  const { theme } = useTheme();
  const [size, setSize] = useState({ width: 0, height: 0 });
  // Until it is measured it sits at the corner: next to the right edge the box
  // would be squeezed to the space left there and measured too narrow, its text
  // wrapped.
  const measured = size.width > 0;
  const left = measured
    ? Math.min(
        Math.max(0, x - size.width / 2),
        Math.max(0, containerWidth - size.width),
      )
    : 0;
  const top = measured ? Math.max(0, y - size.height - 8) : 0;
  return (
    <View
      pointerEvents="none"
      onLayout={(e) =>
        setSize({
          width: e.nativeEvent.layout.width,
          height: e.nativeEvent.layout.height,
        })
      }
      style={[
        styles.card,
        {
          left,
          top,
          // Hidden until measured, so it does not flash in the wrong place.
          opacity: size.width ? 1 : 0,
          backgroundColor: theme.colors.inverseSurface,
          borderRadius: theme.shape.small,
        },
      ]}
    >
      <Text
        style={[
          theme.typography.labelMedium,
          { color: theme.colors.inverseOnSurface },
        ]}
      >
        {title}
      </Text>
      {rows.map((r, i) => (
        <View key={i} style={styles.row}>
          <View style={[styles.swatch, { backgroundColor: r.color }]} />
          <Text
            style={[
              theme.typography.labelSmall,
              { color: theme.colors.inverseOnSurface },
            ]}
          >
            {r.name}: {r.value}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { position: "absolute", paddingHorizontal: 10, paddingVertical: 6 },
  row: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  swatch: { width: 8, height: 8, borderRadius: 4 },
});
