import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
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
  /**
   * The ring under the indicator. `true` draws it in the indicator's colour at
   * a low opacity, a string draws it in that colour, `false` draws none. Left
   * out, a ring with a `progress` has its usual track (`secondaryContainer`)
   * and a spinner has none.
   */
  trackColor?: boolean | string;
  /**
   * Text, a number or any node drawn with the ring, at `labelPosition`. Text
   * is drawn in the theme's type, scaled to the ring when it is inside; a node
   * as given.
   */
  label?: React.ReactNode;
  /**
   * Where `label` goes: `"center"` inside the ring, or `"top"`, `"bottom"`,
   * `"left"` or `"right"` of it. Defaults to `"center"` for a ring with a
   * `progress` and to `"right"` for a spinner, which is too small to hold a label.
   */
  labelPosition?: "top" | "bottom" | "left" | "right" | "center";
  /** Indeterminate only: one revolution, in ms. */
  duration?: number;
  /** Hides it from assistive tech when something else announces the progress. */
  decorative?: boolean;
  accessibilityLabel?: string;
  testID?: string;
}

const isText = (node: React.ReactNode): node is string | number =>
  typeof node === "string" || typeof node === "number";

const isEmpty = (node: React.ReactNode) =>
  node === undefined || node === null || node === false || node === "";

const CircularProgress = ({
  progress,
  size = 48,
  strokeWidth = 4,
  color,
  trackColor,
  label,
  labelPosition,
  duration = 1000,
  decorative = false,
  accessibilityLabel,
  testID,
}: CircularProgressProps) => {
  const { theme } = useTheme();
  const clamped =
    progress === undefined ? undefined : Math.min(1, Math.max(0, progress));
  const indicator = color || theme.colors.primary;
  const track: Track | null =
    trackColor === false
      ? null
      : trackColor === true
        ? { stroke: indicator, opacity: 0.24 }
        : typeof trackColor === "string"
          ? { stroke: trackColor, opacity: 1 }
          : clamped === undefined
            ? null
            : { stroke: theme.colors.secondaryContainer, opacity: 1 };
  const ring = {
    size,
    strokeWidth,
    color: indicator,
    track,
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

  const indicatorNode =
    clamped === undefined ? (
      <Spinner {...ring} duration={duration} />
    ) : (
      <Determinate {...ring} progress={clamped} />
    );

  if (isEmpty(label)) return indicatorNode;

  const position =
    labelPosition ?? (clamped === undefined ? "right" : "center");
  const inside = position === "center";
  // Inside, the type follows the ring, and the ring's own hole is what it must fit.
  const insideSize = Math.max(10, Math.round(size * 0.28));
  const labelNode = isText(label) ? (
    <Text
      numberOfLines={1}
      style={
        inside
          ? [
              theme.typography.labelMedium,
              {
                color: theme.colors.onSurface,
                fontSize: insideSize,
                lineHeight: Math.round(insideSize * 1.25),
                maxWidth: Math.max(0, size - strokeWidth * 2 - 4),
                textAlign: "center",
              },
            ]
          : [
              theme.typography.labelMedium,
              { color: theme.colors.onSurfaceVariant },
            ]
      }
    >
      {label}
    </Text>
  ) : (
    label
  );

  if (inside) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        {indicatorNode}
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.container]}
        >
          {labelNode}
        </View>
      </View>
    );
  }
  return (
    <View
      style={[
        styles.outside,
        {
          flexDirection:
            position === "left" || position === "right" ? "row" : "column",
        },
      ]}
    >
      {(position === "top" || position === "left") && labelNode}
      {indicatorNode}
      {(position === "bottom" || position === "right") && labelNode}
    </View>
  );
};

/** The ring under the indicator: its colour, and how opaque it is drawn. */
interface Track {
  stroke: string;
  opacity: number;
}

interface Ring {
  size: number;
  strokeWidth: number;
  color: string;
  track: Track | null;
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
  track,
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
        {!!track && (
          <Circle
            stroke={track.stroke}
            strokeOpacity={track.opacity}
            fill="none"
            cx={centre}
            cy={centre}
            r={radius}
            strokeWidth={strokeWidth}
          />
        )}
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
}: Ring & { progress: number }) => {
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
        {!!track && (
          <Circle
            stroke={track.stroke}
            strokeOpacity={track.opacity}
            fill="none"
            cx={centre}
            cy={centre}
            r={radius}
            strokeWidth={strokeWidth}
          />
        )}
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
  // The ring and a label beside it, which need a little room between them.
  outside: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
});

export default CircularProgress;
