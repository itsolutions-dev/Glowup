import React, { useEffect, useState } from "react";
import { View, Animated, Easing, StyleSheet, Dimensions } from "react-native";
import { useTheme } from "../../providers/ThemeProvider";

interface LinearProgressProps {
  progress?: number;
  indeterminate?: boolean;
  height?: number;
  color?: string;
  trackColor?: string;
  duration?: number;
  indeterminateDuration?: number;
}

const LinearProgress = ({
  progress = 0,
  indeterminate = false,
  height = 4,
  color,
  trackColor,
  duration = 500,
  indeterminateDuration = 1500,
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
          useNativeDriver: false,
        }),
      );
      animation.start();
      return () => animation.stop();
    }

    Animated.timing(animatedValue, {
      toValue: clampedProgress,
      duration,
      useNativeDriver: false,
    }).start();
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
      accessibilityRole="progressbar"
      accessible={true}
      accessibilityLabel={
        indeterminate
          ? "Loading"
          : `Progress: ${Math.round(clampedProgress * 100)}%`
      }
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuenow={indeterminate ? undefined : clampedProgress} // Undefined for indeterminate
    >
      <Animated.View
        style={[
          styles.linearBar,
          {
            backgroundColor: barColor,
            height: "100%",
            width: indeterminate
              ? `${indeterminateBarWidthRatio * 100}%`
              : animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
            transform: indeterminate
              ? [{ translateX: translateXIndeterminate }]
              : [],
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
    left: 0,
  },
});
