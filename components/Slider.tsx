import React, { useMemo, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  GestureResponderEvent,
  LayoutChangeEvent,
  StyleProp,
  ViewStyle,
} from "react-native";
import { useTheme, Theme } from "../providers/ThemeProvider";

interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  onSlidingComplete?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showValueLabel?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const THUMB_SIZE = 20;
const TRACK_HEIGHT = 4;

const Slider = ({
  value,
  onValueChange,
  onSlidingComplete,
  min = 0,
  max = 100,
  step,
  label,
  showValueLabel = false,
  disabled,
  style,
}: SliderProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [trackWidth, setTrackWidth] = useState(0);
  const [dragging, setDragging] = useState(false);
  const trackRef = useRef<View>(null);
  const trackPageX = useRef(0);

  const clamp = useCallback(
    (raw: number) => {
      let next = Math.min(max, Math.max(min, raw));
      if (step && step > 0) {
        next = Math.round((next - min) / step) * step + min;
        next = Math.min(max, Math.max(min, next));
      }
      return next;
    },
    [min, max, step],
  );

  const valueFromEvent = useCallback(
    (event: GestureResponderEvent) => {
      if (trackWidth === 0) return clamp(value);
      const ratio = (event.nativeEvent.pageX - trackPageX.current) / trackWidth;
      return clamp(min + ratio * (max - min));
    },
    [trackWidth, min, max, clamp, value],
  );

  const handleGrant = useCallback(
    (event: GestureResponderEvent) => {
      setDragging(true);
      trackRef.current?.measureInWindow((x) => {
        trackPageX.current = x;
      });
      onValueChange(valueFromEvent(event));
    },
    [onValueChange, valueFromEvent],
  );

  const handleMove = useCallback(
    (event: GestureResponderEvent) => {
      onValueChange(valueFromEvent(event));
    },
    [onValueChange, valueFromEvent],
  );

  const handleRelease = useCallback(
    (event: GestureResponderEvent) => {
      setDragging(false);
      onSlidingComplete?.(valueFromEvent(event));
    },
    [onSlidingComplete, valueFromEvent],
  );

  const handleTerminate = useCallback(() => {
    setDragging(false);
    onSlidingComplete?.(clamp(value));
  }, [onSlidingComplete, clamp, value]);

  const onTrackLayout = useCallback((event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
    trackRef.current?.measureInWindow((x) => {
      trackPageX.current = x;
    });
  }, []);

  const ratio = max > min ? (clamp(value) - min) / (max - min) : 0;
  const thumbLeft = ratio * trackWidth - THUMB_SIZE / 2;

  return (
    <View style={[styles.wrapper, style, disabled && { opacity: 0.38 }]}>
      {(label || showValueLabel) && (
        <View style={styles.labelRow}>
          {label ? (
            <Text
              style={[
                theme.typography.bodySmall,
                { color: theme.colors.primary },
              ]}
            >
              {label}
            </Text>
          ) : (
            <View />
          )}
          {showValueLabel && (
            <Text
              style={[
                theme.typography.bodySmall,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {clamp(value)}
            </Text>
          )}
        </View>
      )}

      <View
        style={styles.touchArea}
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ min, max, now: clamp(value) }}
        accessibilityState={{ disabled }}
        onStartShouldSetResponder={() => !disabled}
        onMoveShouldSetResponder={() => !disabled}
        onResponderGrant={handleGrant}
        onResponderMove={handleMove}
        onResponderRelease={handleRelease}
        onResponderTerminate={handleTerminate}
      >
        <View ref={trackRef} onLayout={onTrackLayout} style={styles.track}>
          <View style={[styles.activeTrack, { width: `${ratio * 100}%` }]} />
        </View>

        <View
          style={[
            styles.thumb,
            { left: thumbLeft },
            dragging && styles.thumbActive,
          ]}
        >
          {dragging && showValueLabel && (
            <View style={styles.valueBubble}>
              <Text
                style={[
                  theme.typography.labelSmall,
                  { color: theme.colors.surface },
                ]}
              >
                {clamp(value)}
              </Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default Slider;

const makeStyles: (theme: Theme) => StyleSheet.NamedStyles<any> = (
  theme: Theme,
) =>
  StyleSheet.create({
    wrapper: {
      width: "100%",
    },
    labelRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 4,
      marginHorizontal: 4,
    },
    touchArea: {
      height: 40,
      justifyContent: "center",
      ...Platform.select({
        web: { cursor: "pointer", touchAction: "none" as any },
      }),
    },
    track: {
      height: TRACK_HEIGHT,
      borderRadius: TRACK_HEIGHT / 2,
      backgroundColor: theme.colors.surfaceContainerHighest,
      overflow: "hidden",
    },
    activeTrack: {
      height: TRACK_HEIGHT,
      borderRadius: TRACK_HEIGHT / 2,
      backgroundColor: theme.colors.primary,
    },
    thumb: {
      position: "absolute",
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      borderRadius: THUMB_SIZE / 2,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      ...Platform.select({
        web: {
          boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        },
        ios: {
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.3,
          shadowRadius: 3,
        },
        android: {
          elevation: 2,
        },
      }),
    },
    thumbActive: {
      transform: [{ scale: 1.2 }],
    },
    valueBubble: {
      position: "absolute",
      top: -32,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: theme.colors.onSurface,
    },
  });
