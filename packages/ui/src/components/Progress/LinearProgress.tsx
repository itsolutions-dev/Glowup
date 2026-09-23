import React, { useEffect, useState } from "react";
import {
  View,
  Animated,
  Easing,
  StyleSheet,
  Dimensions,
  I18nManager,
  type DimensionValue,
} from "react-native";
import { useTheme } from "../../providers/ThemeProvider";

interface LinearProgressProps {
  progress?: number;
  indeterminate?: boolean;
  /** Bar thickness. A percentage fills the parent — a progress surface. */
  height?: DimensionValue;
  color?: string;
  trackColor?: string;
  duration?: number;
  indeterminateDuration?: number;
  /**
   * Hide the bar from assistive technology, for when the component around it
   * already announces the progress — a bar inside a button is not a second
   * control to land on.
   */
  decorative?: boolean;
}

const LinearProgress = ({
  progress = 0,
  indeterminate = false,
  height = 4,
  color,
  trackColor,
  duration = 500,
  indeterminateDuration = 1500,
  decorative = false,
}: LinearProgressProps) => {
  const { theme } = useTheme();
  const [animatedValue] = useState(() => new Animated.Value(0));
  const [trackWidth, setTrackWidth] = useState(Dimensions.get("window").width);

  const clampedProgress = Math.min(1, Math.max(0, progress));

  useEffect(() => {
    if (indeterminate) {
      animatedValue.setValue(0);
      const animation = Animated.loop(
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: indeterminateDuration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      animation.start();
      return () => animation.stop();
    }

    // A determinate bar grows with `scaleX` from its leading edge rather than
    // by animating `width`: a transform runs on the native driver and never
    // relayouts the tree, where a width tween re-runs layout every frame.
    const animation = Animated.timing(animatedValue, {
      toValue: clampedProgress,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [
    clampedProgress,
    indeterminate,
    duration,
    indeterminateDuration,
    animatedValue,
  ]);

  const barColor = color || theme.colors.primary;
  const actualTrackColor = trackColor || theme.colors.surfaceContainerHighest;

  const indeterminateBarWidthRatio = 0.4;
  const translateXIndeterminate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-trackWidth * indeterminateBarWidthRatio, trackWidth],
  });

  const a11y = decorative
    ? {
        accessible: false,
        importantForAccessibility: "no-hide-descendants" as const,
        accessibilityElementsHidden: true,
        "aria-hidden": true,
      }
    : {
        accessibilityRole: "progressbar" as const,
        accessible: true,
        accessibilityLabel: indeterminate
          ? "Loading"
          : `Progress: ${Math.round(clampedProgress * 100)}%`,
        "aria-valuemin": 0,
        "aria-valuemax": 1,
        // Undefined for indeterminate: there is no value to report.
        "aria-valuenow": indeterminate ? undefined : clampedProgress,
      };

  return (
    <View
      style={[
        styles.linearTrack,
        {
          height: height,
          backgroundColor: actualTrackColor,
        },
      ]}
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
      {...a11y}
    >
      <Animated.View
        style={[
          styles.linearBar,
          indeterminate
            ? {
                backgroundColor: barColor,
                width: `${indeterminateBarWidthRatio * 100}%`,
                transform: [{ translateX: translateXIndeterminate }],
              }
            : {
                backgroundColor: barColor,
                width: "100%",
                transformOrigin: I18nManager.isRTL ? "right" : "left",
                transform: [{ scaleX: animatedValue }],
              },
        ]}
      />
    </View>
  );
};

export default LinearProgress;

const styles = StyleSheet.create({
  linearTrack: {
    width: "100%",
    borderRadius: 2,
    overflow: "hidden",
  },
  linearBar: {
    borderRadius: 2,
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
  },
});
