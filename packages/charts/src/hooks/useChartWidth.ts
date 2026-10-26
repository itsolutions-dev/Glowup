import { useCallback, useState } from "react";
import type { LayoutChangeEvent } from "react-native";

/**
 * Width of the box a chart sits in, from `onLayout` (no `ResizeObserver`, so the
 * same on web and phones). It starts at 0: the first frame has no width yet and
 * the chart draws nothing until it has one.
 */
export const useChartWidth = () => {
  const [width, setWidth] = useState(0);
  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const next = Math.floor(e.nativeEvent.layout.width);
    setWidth((previous) => (previous === next ? previous : next));
  }, []);
  return { width, onLayout };
};
