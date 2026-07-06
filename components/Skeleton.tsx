import React, { useEffect, useMemo, useState } from "react";
import {
  Animated,
  StyleSheet,
  DimensionValue,
  StyleProp,
  ViewStyle,
} from "react-native";
import { useTheme } from "../providers/ThemeProvider";

type SkeletonVariant = "rect" | "circle" | "text";

interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  /** Pulse animation duration for a full cycle (ms). */
  duration?: number;
  /** false renders a static placeholder (no pulse). */
  animate?: boolean;
}

const Skeleton = ({
  variant = "rect",
  width,
  height,
  borderRadius,
  style,
  duration = 1200,
  animate = true,
}: SkeletonProps) => {
  const { theme } = useTheme();
  // useState lazy init instead of useAnimatedValue: react-native-web
  // does not export it
  const [opacity] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    if (!animate) {
      opacity.setValue(0.6);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: duration / 2,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity, duration, animate]);

  const variantStyle = useMemo<ViewStyle>(() => {
    switch (variant) {
      case "circle": {
        const size = (width ?? 40) as number;
        return {
          width: size,
          height: (height ?? size) as DimensionValue,
          borderRadius:
            borderRadius ?? (typeof size === "number" ? size / 2 : 20),
        };
      }
      case "text":
        return {
          width: width ?? "100%",
          height: height ?? 16,
          borderRadius: borderRadius ?? 4,
        };
      default:
        return {
          width: width ?? "100%",
          height: height ?? 48,
          borderRadius: borderRadius ?? 8,
        };
    }
  }, [variant, width, height, borderRadius]);

  return (
    <Animated.View
      accessibilityLabel="Loading"
      style={[
        styles.base,
        { backgroundColor: theme.colors.surfaceContainerHighest },
        variantStyle,
        { opacity },
        style,
      ]}
    />
  );
};

export default Skeleton;

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
  },
});
