import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  Animated,
  View,
  Text,
  StyleSheet,
  Platform,
  StyleProp,
  ViewStyle,
} from "react-native";

import { useTheme, Theme, getFocusRing } from "../providers/ThemeProvider";
import { useInteractionFeedback } from "../providers/InteractionFeedback";
import { PressableState } from "./types";
import { a11yState } from "./internal/a11yState";

export interface SwitchProps {
  value: boolean;
  /** Called with the new state when the switch, or its label, is pressed. */
  onChange: (value: boolean) => void;
  disabled?: boolean;
  /** Text next to the switch. Pressing it toggles the switch too. */
  label?: string;
  /**
   * Where the label sits relative to the switch: `"start"` and `"end"` are
   * the left and right in a left-to-right layout, `"top"` and `"bottom"`
   * stack them. Defaults to `"end"`.
   */
  labelPlacement?: "start" | "end" | "top" | "bottom";
  /**
   * Switch size: `"small"` is 24 x 14, `"medium"` 32 x 18, `"large"` 40 x 22.
   * `width` and `height` override it. Defaults to `"medium"`.
   */
  size?: "small" | "medium" | "large";
  /** Style for the outer Pressable. */
  containerStyle?: StyleProp<ViewStyle>;
  /** Track width. Defaults to the `size`'s (32 for medium). */
  width?: number;
  /** Track height; the thumb scales with it. Defaults to the `size`'s (18 for medium). */
  height?: number;
  /**
   * Report the switch to `ThemeProvider`'s `onInteractionFeedback` (haptics).
   * Defaults to true.
   */
  feedback?: boolean;
}

// Fixed parts of the switch geometry: the track's outline and how much of the
// inner track height the thumb fills, off and on.
const TRACK_BORDER_WIDTH = 2;
const THUMB_OFF_RATIO = 0.8;
const THUMB_ON_RATIO = 0.9;
const DURATION = 200;
// Track sizes: medium is the original 32 x 18, the others scale it by 0.75 and 1.25.
const SIZES = {
  small: { width: 24, height: 14 },
  medium: { width: 32, height: 18 },
  large: { width: 40, height: 22 },
} as const;

export interface SwitchGeometry {
  /** The track's inside, where the thumb is positioned (the border is not part of it). */
  innerWidth: number;
  innerHeight: number;
  /** Equal gap between the thumb and the track edge, off and on. */
  offInset: number;
  onInset: number;
  offSize: number;
  onSize: number;
  offLeft: number;
  onLeft: number;
  offTop: number;
  onTop: number;
}

/**
 * The thumb's size and position for a track, in the track's padding box (an
 * absolutely placed child is measured from inside the border, so the border
 * must not be added again). The thumb is a circle centred in the track's
 * height with the same inset at both ends, off and on, and never wider than
 * the inside of the track.
 */
export const getSwitchGeometry = (
  width: number,
  height: number,
): SwitchGeometry => {
  const innerWidth = Math.max(0, width - 2 * TRACK_BORDER_WIDTH);
  const innerHeight = Math.max(0, height - 2 * TRACK_BORDER_WIDTH);
  const fit = Math.min(innerWidth, innerHeight);
  const offSize = fit * THUMB_OFF_RATIO;
  const onSize = fit * THUMB_ON_RATIO;
  const offInset = (innerHeight - offSize) / 2;
  const onInset = (innerHeight - onSize) / 2;
  return {
    innerWidth,
    innerHeight,
    offInset,
    onInset,
    offSize,
    onSize,
    offLeft: offInset,
    onLeft: innerWidth - onSize - onInset,
    offTop: offInset,
    onTop: onInset,
  };
};

const Switch = ({
  value,
  onChange,
  disabled = false,
  label,
  labelPlacement = "end",
  size = "medium",
  containerStyle = {},
  width = SIZES[size].width,
  height = SIZES[size].height,
  feedback = true,
}: SwitchProps) => {
  const { theme } = useTheme();
  const emitFeedback = useInteractionFeedback(feedback);
  const TRACK_WIDTH = width;
  const TRACK_HEIGHT = height;

  const geometry = useMemo(
    () => getSwitchGeometry(TRACK_WIDTH, TRACK_HEIGHT),
    [TRACK_WIDTH, TRACK_HEIGHT],
  );

  const styles = useMemo(
    () => makeStyles(theme, TRACK_WIDTH, TRACK_HEIGHT),
    [theme, TRACK_WIDTH, TRACK_HEIGHT],
  );
  const labelFirst = labelPlacement === "start" || labelPlacement === "top";
  const labelNode = !!label && (
    <Text
      style={[theme.typography.bodyLarge, { color: theme.colors.onSurface }]}
    >
      {label}
    </Text>
  );

  const [animatedValue] = useState(() => new Animated.Value(value ? 1 : 0));

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: DURATION,
      useNativeDriver: false,
    }).start();
  }, [value, animatedValue]);

  const range = (off: number, on: number) =>
    animatedValue.interpolate({ inputRange: [0, 1], outputRange: [off, on] });

  const trackColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.surfaceVariant, theme.colors.primary],
  });

  const thumbColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.outline, theme.colors.onPrimary],
  });

  const thumbSize = range(geometry.offSize, geometry.onSize);
  const thumbBorderRadius = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [geometry.offSize / 2, geometry.onSize / 2],
  });

  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        emitFeedback("toggle");
        onChange(!value);
      }}
      style={[
        label
          ? [
              styles.labelled,
              {
                flexDirection:
                  labelPlacement === "top" || labelPlacement === "bottom"
                    ? "column"
                    : "row",
              },
            ]
          : styles.container,
        containerStyle,
        disabled && styles.disabled,
      ]}
      accessibilityLabel={label}
      accessibilityRole="switch"
      {...a11yState("switch", { checked: value, disabled })}
      {...(Platform.OS === "android" && {
        android_ripple: {
          color: disabled ? "transparent" : theme.colors.primary,
        },
      })}
    >
      {({ hovered }: PressableState) => (
        <>
          {labelFirst && labelNode}
          <View
            style={[
              styles.container,
              hovered && !disabled && getFocusRing(theme),
            ]}
          >
            <Animated.View
              style={[styles.track, { backgroundColor: trackColor }]}
            >
              <Animated.View
                style={[
                  styles.thumb,
                  {
                    left: range(geometry.offLeft, geometry.onLeft),
                    top: range(geometry.offTop, geometry.onTop),
                    backgroundColor: thumbColor,
                    width: thumbSize,
                    height: thumbSize,
                    borderRadius: thumbBorderRadius,
                  },
                ]}
              />
            </Animated.View>
          </View>
          {!labelFirst && labelNode}
        </>
      )}
    </Pressable>
  );
};

const makeStyles = (theme: Theme, TRACK_WIDTH: number, TRACK_HEIGHT: number) =>
  StyleSheet.create({
    container: {
      width: TRACK_WIDTH,
      height: TRACK_HEIGHT,
      justifyContent: "center",
      borderRadius: TRACK_HEIGHT / 2, // Ensures a pill shape based on height
    },
    labelled: {
      alignItems: "center",
      alignSelf: "flex-start",
      gap: theme.spacing.s,
    },
    disabled: {
      opacity: 0.38,
    },
    track: {
      width: TRACK_WIDTH,
      height: TRACK_HEIGHT,
      borderRadius: TRACK_HEIGHT / 2,
      borderWidth: TRACK_BORDER_WIDTH,
      borderColor: theme.colors.outline,
      justifyContent: "center",
    },
    thumb: {
      position: "absolute",
      justifyContent: "center",
      alignItems: "center",
    },
  });

export default Switch;
