import React, { useEffect, useRef } from "react";
import { View, Animated, Easing, StyleSheet, Dimensions } from "react-native";
import { useTheme } from "providers/ThemeProvider";

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
  const animatedValue = useRef(new Animated.Value(0)).current;
  const trackWidth = useRef(Dimensions.get("window").width);

  useEffect(() => {
    if (indeterminate) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: false,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          }),
        ]),
      ).start();
    } else {
      Animated.timing(animatedValue, {
        toValue: progress,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }
  }, [progress, indeterminate]);

  const barColor = color || theme.colors.primary;
  const actualTrackColor = trackColor || theme.colors.surfaceContainerHighest;

  const indeterminateBarWidthRatio = 0.4;
  const translateXIndeterminate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [
      -trackWidth.current * indeterminateBarWidthRatio,
      trackWidth.current,
    ],
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
      onLayout={(event) => {
        if (indeterminate) {
          trackWidth.current = event.nativeEvent.layout.width;
          animatedValue.stopAnimation();
          animatedValue.setValue(0);
          Animated.loop(
            Animated.timing(animatedValue, {
              toValue: 1,
              duration: indeterminateDuration,
              easing: Easing.linear,
              useNativeDriver: false,
            }),
          ).start();
        }
      }}
      accessibilityRole="progressbar"
      accessible={true}
      accessibilityLabel={
        indeterminate ? "Loading" : `Progress: ${Math.round(progress * 100)}%`
      }
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuenow={indeterminate ? undefined : progress} // Undefined for indeterminate
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
