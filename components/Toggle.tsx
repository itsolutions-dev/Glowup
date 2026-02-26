import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Pressable,
  Animated,
  StyleSheet,
  Platform,
  View,
  StyleProp,
  ViewStyle,
} from "react-native";

import { useTheme, Theme, getGlowStyles } from "../providers/ThemeProvider"; // Assuming this is a custom ThemeProvider

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  containerStyle?: StyleProp<ViewStyle>; // Style for the outer Pressable
  width?: number; // Make width configurable
  height?: number; // Make height configurable
  trackBorderWidth?: number; // Make border width configurable
  animationDuration?: number; // Make animation duration configurable
  thumbOffSizeRatio?: number; // Ratio of inner track height for thumb when off
  thumbOnSizeRatio?: number; // Ratio of inner track height for thumb when on
}

const Toggle = ({
  value,
  onValueChange,
  disabled = false,
  containerStyle = {},
  width = 32, // Default width
  height = 18, // Default height
  trackBorderWidth = 2, // Default track border
  animationDuration = 200, // Default duration
  thumbOffSizeRatio = 0.8, // Example ratio for off state thumb size
  thumbOnSizeRatio = 0.9, // Example ratio for on state thumb size
}: ToggleProps) => {
  const { theme } = useTheme();

  // Use the direct props, not trying to read from `style`
  const TRACK_WIDTH = width;
  const TRACK_HEIGHT = height;
  const TRACK_BORDER_WIDTH = trackBorderWidth;

  const {
    thumbOffSize,
    thumbOnSize,
    thumbOffOffset,
    thumbOnOffset,
    thumbMarginTopOff,
    thumbMarginTopOn,
  } = useMemo(() => {
    const innerTrackHeight = TRACK_HEIGHT - 2 * TRACK_BORDER_WIDTH;

    // Calculate thumb sizes based on inner track height and ratios
    // Ensure they don't exceed innerTrackHeight
    const calculatedThumbOffSize = Math.max(
      0,
      Math.min(innerTrackHeight, innerTrackHeight * thumbOffSizeRatio),
    );
    const calculatedThumbOnSize = Math.max(
      0,
      Math.min(innerTrackHeight, innerTrackHeight * thumbOnSizeRatio),
    );

    // Warn if calculated thumb sizes are too large
    if (
      calculatedThumbOffSize > innerTrackHeight ||
      calculatedThumbOnSize > innerTrackHeight
    ) {
      console.warn(
        "Toggle: Calculated thumb size exceeds inner track height. Adjust thumb ratios or track dimensions.",
      );
    }

    // Offset for 'off' state: just the track border width
    const calculatedThumbOffOffset = TRACK_BORDER_WIDTH;

    // Offset for 'on' state: total track width - thumb width (when ON) - border width
    // Ensure the thumb doesn't go outside the track, considering its own width
    const calculatedThumbOnOffset = Math.max(
      calculatedThumbOffOffset, // Cannot be less than off offset
      TRACK_WIDTH - calculatedThumbOnSize - TRACK_BORDER_WIDTH,
    );

    // Vertical centering (marginTop)
    const calculatedThumbMarginTopOff =
      (TRACK_HEIGHT - calculatedThumbOffSize) / 2;
    const calculatedThumbMarginTopOn =
      (TRACK_HEIGHT - calculatedThumbOnSize) / 2;

    return {
      thumbOffSize: calculatedThumbOffSize,
      thumbOnSize: calculatedThumbOnSize,
      thumbOffOffset: calculatedThumbOffOffset,
      thumbOnOffset: calculatedThumbOnOffset,
      thumbMarginTopOff: calculatedThumbMarginTopOff,
      thumbMarginTopOn: calculatedThumbMarginTopOn,
    };
  }, [
    TRACK_WIDTH,
    TRACK_HEIGHT,
    TRACK_BORDER_WIDTH,
    thumbOffSizeRatio,
    thumbOnSizeRatio,
  ]);

  // Pass dynamic dimensions to makeStyles
  const styles = useMemo(
    () => makeStyles(theme, TRACK_WIDTH, TRACK_HEIGHT, TRACK_BORDER_WIDTH),
    [theme, TRACK_WIDTH, TRACK_HEIGHT, TRACK_BORDER_WIDTH],
  );

  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: animationDuration, // Use configurable duration
      useNativeDriver: false,
    }).start();
  }, [value, animationDuration, animatedValue]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [thumbOffOffset, thumbOnOffset], // Use calculated offsets
  });

  const trackColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.surfaceVariant, theme.colors.primary],
  });

  const thumbColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.outline, theme.colors.onPrimary],
  });

  const thumbSize = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [thumbOffSize, thumbOnSize], // Use calculated sizes
  });

  const thumbBorderRadius = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [thumbOffSize / 2, thumbOnSize / 2], // Half of thumbSize for circle
  });

  return (
    <Pressable
      disabled={disabled}
      onPress={() => onValueChange(!value)}
      style={({ hovered }) => [
        styles.container,
        containerStyle,
        hovered && getGlowStyles(theme, true),
      ]}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      aria-checked={value}
      aria-disabled={disabled}
      {...(Platform.OS === "android" && {
        android_ripple: {
          color: disabled ? "transparent" : theme.colors.primary,
        },
      })}
    >
      <Animated.View style={[styles.track, { backgroundColor: trackColor }]}>
        <Animated.View
          style={[
            styles.thumb,
            {
              transform: [{ translateX }],
              backgroundColor: thumbColor,
              width: thumbSize,
              height: thumbSize,
              borderRadius: thumbBorderRadius,
              marginTop: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [thumbMarginTopOff, thumbMarginTopOn], // Use calculated margins
              }),
              marginBottom: animatedValue.interpolate({
                // If you truly need marginBottom for some reason
                inputRange: [0, 1],
                outputRange: [thumbMarginTopOff, thumbMarginTopOn], // Same as marginTop for centering
              }),
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
};

// makeStyles now accepts dynamic dimensions
const makeStyles: (
  theme: Theme,
  TRACK_WIDTH: number,
  TRACK_HEIGHT: number,
  TRACK_BORDER_WIDTH: number,
) => StyleSheet.NamedStyles<any> = (
  theme: Theme,
  TRACK_WIDTH: number,
  TRACK_HEIGHT: number,
  TRACK_BORDER_WIDTH: number,
) =>
  StyleSheet.create({
    container: {
      width: TRACK_WIDTH,
      height: TRACK_HEIGHT,
      justifyContent: "center",
      borderRadius: TRACK_HEIGHT / 2, // Ensures a pill shape based on height
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

export default Toggle;
