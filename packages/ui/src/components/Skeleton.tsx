import React, { useEffect, useMemo, useState } from "react";
import {
  Animated,
  StyleSheet,
  DimensionValue,
  StyleProp,
  View,
  ViewStyle,
} from "react-native";
import { useTheme } from "../providers/ThemeProvider";

type SkeletonVariant = "rect" | "circle" | "text";

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
  /** Pulse animation duration for a full cycle (ms). */
  duration?: number;
  /** false renders a static placeholder (no pulse). */
  animate?: boolean;
  /**
   * `"list"`: `count` rounded rows stacked `gap` apart, the placeholder of a
   * list loading its first page. `width` and `style` then apply to the list.
   */
  preset?: "list";
  /** `preset="list"`: how many rows. Defaults to 6. */
  count?: number;
  /** `preset="list"`: each row's height. Defaults to 64. */
  itemHeight?: number;
  /** `preset="list"`: the space between rows. Defaults to `theme.spacing.s`. */
  gap?: number;
  /** Root testID; with `preset="list"` each row gets `${testID}-row`. */
  testID?: string;
}

const Skeleton = ({
  variant = "rect",
  width,
  height,
  borderRadius,
  style,
  duration = 1200,
  animate = true,
  preset,
  count = 6,
  itemHeight = 64,
  gap,
  testID,
}: SkeletonProps) => {
  const { theme } = useTheme();
  const pulse = { duration, animate };
  if (preset !== "list") {
    return (
      <Bone
        {...pulse}
        variant={variant}
        width={width}
        height={height}
        borderRadius={borderRadius}
        style={style}
        testID={testID}
      />
    );
  }
  return (
    // One "Loading" for the whole list, not one per row.
    <View
      accessibilityLabel="Loading"
      testID={testID}
      style={[{ width: width ?? "100%", gap: gap ?? theme.spacing.s }, style]}
    >
      {Array.from({ length: count }, (_, index) => (
        <Bone
          key={index}
          {...pulse}
          height={itemHeight}
          borderRadius={theme.shape.large}
          testID={testID && `${testID}-row`}
          hidden
        />
      ))}
    </View>
  );
};

const Bone = ({
  variant = "rect",
  width,
  height,
  borderRadius,
  style,
  duration = 1200,
  animate = true,
  testID,
  hidden = false,
}: SkeletonProps & { hidden?: boolean }) => {
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
      accessibilityLabel={hidden ? undefined : "Loading"}
      accessibilityElementsHidden={hidden}
      importantForAccessibility={hidden ? "no-hide-descendants" : undefined}
      testID={testID}
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
