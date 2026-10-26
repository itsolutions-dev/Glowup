import React from "react";
import { Pressable } from "react-native";
import type { Plot } from "./ChartAxes";

type DenseHitProps = {
  plot: Plot;
  /** The category under a point given relative to the plot's top-left corner, or null. */
  indexAt: (x: number, y: number) => number | null;
  onPress: (index: number) => void;
  /** The pointer is over this category (a mouse on the web), or over none (null). */
  onHover: (index: number | null) => void;
  testID?: string;
};

/**
 * One touch layer over the whole plot, for charts with thousands of categories
 * where a Pressable per category would be a native view each. It asks `indexAt`
 * which category a point belongs to.
 */
export const DenseHit = ({
  plot,
  indexAt,
  onPress,
  onHover,
  testID,
}: DenseHitProps) => {
  const locate = (e: {
    nativeEvent: {
      locationX?: number;
      locationY?: number;
      offsetX?: number;
      offsetY?: number;
    };
  }) => {
    const n = e.nativeEvent;
    const x = n.locationX ?? n.offsetX;
    const y = n.locationY ?? n.offsetY;
    return x === undefined || y === undefined ? null : indexAt(x, y);
  };
  return (
    <Pressable
      testID={testID}
      accessible={false}
      style={{
        position: "absolute",
        left: plot.left,
        top: plot.top,
        width: plot.width,
        height: plot.height,
      }}
      onPress={(e) => {
        const i = locate(e);
        if (i !== null) onPress(i);
      }}
      onPointerMove={(e) => onHover(locate(e))}
      onPointerLeave={() => onHover(null)}
    />
  );
};

/** The bars from which a bar chart goes dense by itself: past it one node per bar is too many. Measured on the web, see docs/charts-package-plan.md step 7. */
export const DENSE_BARS = 400;
/** The categories from which a line chart swaps its Pressable per category for one touch layer. */
export const DENSE_POINTS = 200;
