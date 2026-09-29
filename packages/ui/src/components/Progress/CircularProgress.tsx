import React, { useEffect, useMemo, useRef, useState } from "react";
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
  const clamped =
    progress === undefined ? undefined : Math.min(1, Math.max(0, progress));
  const ring = {
    size,
    strokeWidth,
    color: color || theme.colors.primary,
    testID,
    a11y: decorative
      ? {
          accessibilityElementsHidden: true,
          importantForAccessibility: "no-hide-descendants" as const,
        }
      : {
          accessible: true,
          accessibilityRole: "progressbar" as const,
          accessibilityLabel:
            accessibilityLabel ??
            (clamped === undefined ? "Loading" : "Progress"),
          accessibilityValue:
            clamped === undefined
              ? undefined
              : { min: 0, max: 100, now: Math.round(clamped * 100) },
        },
  };

  return clamped === undefined ? (
    <Spinner {...ring} duration={duration} />
  ) : (
    <Determinate
      {...ring}
      progress={clamped}
      track={theme.colors.secondaryContainer}
    />
  );
};

interface Ring {
  size: number;
  strokeWidth: number;
  color: string;
  a11y: object;
  testID?: string;
}

/** Radius and circumference of a ring drawn inside a `size` box. */
const geometry = (size: number, strokeWidth: number) => {
  const radius = (size - strokeWidth) / 2;
  return { radius, circumference: radius * 2 * Math.PI, centre: size / 2 };
};

const Spinner = ({
  size,
  strokeWidth,
  color,
  duration,
  a11y,
  testID,
}: Ring & { duration: number }) => {
  const [rotateAnim] = useState(() => new Animated.Value(0));
  const { radius, circumference, centre } = geometry(size, strokeWidth);

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

  const rotate = useMemo(
    () =>
      rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
      }),
    [rotateAnim],
  );

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
          cx={centre}
          cy={centre}
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
  track,
  size,
  strokeWidth,
  color,
  a11y,
  testID,
}: Ring & { progress: number; track: string }) => {
  const reduceMotion = useReduceMotion();
  const [value] = useState(() => new Animated.Value(progress));
  const { radius, circumference, centre } = geometry(size, strokeWidth);
  // The value starts where `progress` is, so only a change animates: a ring
  // that mounts at 40% must not run a 300 ms tween from 40% to 40%.
  const shown = useRef(progress);

  useEffect(() => {
    if (shown.current === progress) return;
    shown.current = progress;
    Animated.timing(value, {
      toValue: progress,
      duration: reduceMotion ? 0 : 300,
      easing: Easing.out(Easing.cubic),
      // strokeDashoffset is an SVG attribute, not a transform.
      useNativeDriver: false,
    }).start();
  }, [progress, reduceMotion, value]);

  const offset = useMemo(
    () =>
      value.interpolate({
        inputRange: [0, 1],
        outputRange: [circumference, 0],
      }),
    [value, circumference],
  );

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
