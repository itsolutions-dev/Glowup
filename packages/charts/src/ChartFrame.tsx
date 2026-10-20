import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Skeleton, useTheme } from "@its/glowup-ui";
import { useChartWidth } from "./hooks/useChartWidth";

export type ChartSize = { width: number; height: number };

type ChartFrameProps = {
  height: number;
  loading?: boolean;
  empty?: boolean;
  emptyLabel: string;
  /** What a screen reader says for the whole chart (the drawing itself is hidden from it). */
  summary: string;
  testID?: string;
  children: (size: ChartSize) => React.ReactNode;
};

/**
 * The box of a chart: measures its width, shows the loading and empty states and
 * hides the drawing from assistive technology behind one text summary. Its
 * children draw only once the width is known, so a first frame at width 0
 * never reaches them.
 */
export const ChartFrame = ({
  height,
  loading,
  empty,
  emptyLabel,
  summary,
  testID,
  children,
}: ChartFrameProps) => {
  const { theme } = useTheme();
  const { width, onLayout } = useChartWidth();
  let content: React.ReactNode = null;
  if (loading) {
    content = <Skeleton width="100%" height={height} />;
  } else if (empty) {
    content = (
      <View style={styles.empty}>
        <Text
          style={[
            theme.typography.bodyMedium,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          {emptyLabel}
        </Text>
      </View>
    );
  } else if (width > 0) {
    content = children({ width, height });
  }
  return (
    <View
      testID={testID}
      onLayout={onLayout}
      style={[styles.frame, { height }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={loading ? "Loading" : empty ? emptyLabel : summary}
    >
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  // The drawing is absolutely positioned inside: a width taken from the
  // children would stop the box from ever getting narrower.
  frame: { alignSelf: "stretch", position: "relative" },
  empty: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
});
