import React, { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useTheme } from "../../providers/ThemeProvider";
import { useReduceMotion } from "../internal/useReduceMotion";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export interface CircularProgressProps {
  /**
   * Completion from 0 to 1. Set, the ring fills to it over a track; unset,
   * the indicator spins (indeterminate).
   */
  progress?: number;
  size?: number;
  strokeWidth?: number;
  /** Indicator colour. Defaults to `primary`. */
  color?: string;
  /** Indeterminate only: one revolution, in ms. */
  duration?: number;
  /** Hides it from assistive tech when something else announces the progress. */
  decorative?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}

const CircularProgress = ({
  progress,
  size = 48,
  strokeWidth = 4,
  color,
  duration = 1000,
  decorative = false,
  accessibilityLabel,
  testID,
}: CircularProgressProps) => {
  const { theme } = useTheme();
  const indeterminate = progress === undefined;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const indicator = color || theme.colors.primary;

  const a11y = decorative
    ? {
        accessibilityElementsHidden: true,
        importantForAccessibility: "no-hide-descendants" as const,
      }
    : {
        accessible: true,
        accessibilityRole: "progressbar" as const,
        accessibilityLabel:
          accessibilityLabel ?? (indeterminate ? "Loading" : "Progress"),
        accessibilityValue: indeterminate
          ? undefined
          : {
              min: 0,
              max: 100,
              now: Math.round(Math.min(1, Math.max(0, progress)) * 100),
            },
      };

  if (indeterminate) {
    return (
      <Spinner
        size={size}
        strokeWidth={strokeWidth}
        color={indicator}
        duration={duration}
        radius={radius}
        circumference={circumference}
        a11y={a11y}
        testID={testID}
      />
    );
  }

  return (
    <Determinate
      progress={Math.min(1, Math.max(0, progress))}
      size={size}
      strokeWidth={strokeWidth}
      color={indicator}
      track={theme.colors.secondaryContainer}
      radius={radius}
      circumference={circumference}
      a11y={a11y}
      testID={testID}
    />
  );
};

type Geometry = {
  size: number;
  strokeWidth: number;
  color: string;
  radius: number;
  circumference: number;
  a11y: object;
  testID?: string;
};

const Spinner = ({
  size,
  strokeWidth,
  color,
  duration,
  radius,
  circumference,
  a11y,
  testID,
}: Geometry & { duration: number }) => {
  const [rotateAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    rotateAnim.setValue(0);
    const animation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    animation.start();
    return () => animation.stop();
  }, [rotateAnim, duration]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <Animated.View
      {...a11y}
      testID={testID}
      style={[
        styles.container,
        { width: size, height: size, transform: [{ rotate }] },
      ]}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          stroke={color}
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * 0.25}
          strokeLinecap="round"
        />
      </Svg>
    </Animated.View>
  );
};

const Determinate = ({
  progress,
  size,
  strokeWidth,
  color,
  track,
  radius,
  circumference,
  a11y,
  testID,
}: Geometry & { progress: number; track: string }) => {
  const reduceMotion = useReduceMotion();
  const [value] = useState(() => new Animated.Value(progress));

  useEffect(() => {
    Animated.timing(value, {
      toValue: progress,
      duration: reduceMotion ? 0 : 300,
      easing: Easing.out(Easing.cubic),
      // strokeDashoffset is an SVG attribute, not a transform.
      useNativeDriver: false,
    }).start();
  }, [progress, reduceMotion, value]);

  const offset = value.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });
  const centre = size / 2;

  return (
    <View
      {...a11y}
      testID={testID}
      style={[styles.container, { width: size, height: size }]}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle
          stroke={track}
          fill="none"
          cx={centre}
          cy={centre}
          r={radius}
          strokeWidth={strokeWidth}
        />
        {/* Rotated a quarter turn back so the arc starts at twelve o'clock. */}
        <AnimatedCircle
          stroke={color}
          fill="none"
          cx={centre}
          cy={centre}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${centre} ${centre})`}
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});

export default CircularProgress;
