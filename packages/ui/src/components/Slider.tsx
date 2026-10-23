import React, { useMemo, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  AccessibilityActionEvent,
  GestureResponderEvent,
  LayoutChangeEvent,
  StyleProp,
  ViewStyle,
} from "react-native";
import { useTheme, Theme, getFocusRing } from "../providers/ThemeProvider";
import { useInteractionFeedback } from "../providers/InteractionFeedback";

/**
 * How a pointer moves the value: `"drag"` only by dragging the thumb,
 * `"click"` only by jumping to where the track is pressed, `"both"` either.
 */
export type SliderInteraction = "both" | "drag" | "click";

interface KeyEventLike {
  key: string;
  preventDefault?: () => void;
}

export interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  onSlidingComplete?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showValueLabel?: boolean;
  /** Draw a tick at every step (requires step > 0). */
  marks?: boolean;
  /**
   * What a pointer (finger or mouse) may do: `"both"` drags the thumb and
   * jumps to where the track is pressed, `"drag"` only drags the thumb,
   * `"click"` only jumps to the pressed point. The keyboard (arrows, Page
   * Up/Down, Home/End) and assistive actions work in every mode. Defaults to
   * `"both"`.
   */
  interaction?: SliderInteraction;
  /** Blocks the pointer, the keyboard and assistive actions, and dims the slider. */
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /**
   * Report each step the thumb crosses to `ThemeProvider`'s
   * `onInteractionFeedback` (haptics), as a selection. Only with a `step`: a
   * continuous slider would report every pixel. Defaults to true.
   */
  feedback?: boolean;
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
  marks = false,
  interaction = "both",
  disabled,
  style,
  feedback = true,
}: SliderProps) => {
  const { theme } = useTheme();
  const emitFeedback = useInteractionFeedback(feedback);
  const styles = useMemo(() => makeStyles(theme), [theme]);

  // The track's width: the touch area minus the half thumb kept free at each end.
  const [trackWidth, setTrackWidth] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [focused, setFocused] = useState(false);
  const areaRef = useRef<View>(null);
  // Where the touch area starts on the page. A grant reads it from the event
  // itself (pageX - locationX), so the first touch never waits for a measure.
  const areaPageX = useRef(0);
  // How far the grab was from the thumb's centre, so a drag does not jump.
  const grabOffset = useRef(0);

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

  const valueFromPage = useCallback(
    (pageX: number) => {
      if (trackWidth === 0) return clamp(value);
      const along = (pageX - areaPageX.current - THUMB_SIZE / 2) / trackWidth;
      return clamp(min + along * (max - min));
    },
    [trackWidth, min, max, clamp, value],
  );

  // One selection tick per step crossed, never for a continuous slider.
  const change = useCallback(
    (next: number) => {
      if (step && step > 0 && next !== clamp(value)) emitFeedback("selection");
      onValueChange(next);
    },
    [step, clamp, value, emitFeedback, onValueChange],
  );

  const ratio = max > min ? (clamp(value) - min) / (max - min) : 0;
  const thumbCentre = THUMB_SIZE / 2 + ratio * trackWidth;
  const dragsThumb = interaction !== "click";
  const jumps = interaction !== "drag";

  const handleGrant = useCallback(
    (event: GestureResponderEvent) => {
      const { pageX, locationX } = event.nativeEvent;
      if (typeof pageX === "number" && typeof locationX === "number") {
        areaPageX.current = pageX - locationX;
      }
      setDragging(true);
      if (jumps) {
        grabOffset.current = 0;
        change(valueFromPage(pageX));
      } else {
        // "drag": the thumb was grabbed, keep the grip where it was.
        grabOffset.current = (locationX ?? thumbCentre) - thumbCentre;
      }
    },
    [jumps, change, valueFromPage, thumbCentre],
  );

  const handleMove = useCallback(
    (event: GestureResponderEvent) => {
      if (!dragsThumb) return;
      change(valueFromPage(event.nativeEvent.pageX - grabOffset.current));
    },
    [dragsThumb, change, valueFromPage],
  );

  const handleRelease = useCallback(
    (event: GestureResponderEvent) => {
      setDragging(false);
      onSlidingComplete?.(
        valueFromPage(event.nativeEvent.pageX - grabOffset.current),
      );
    },
    [onSlidingComplete, valueFromPage],
  );

  const handleTerminate = useCallback(() => {
    setDragging(false);
    onSlidingComplete?.(clamp(value));
  }, [onSlidingComplete, clamp, value]);

  // "drag" only takes a touch that starts on the thumb.
  const shouldStart = (event?: GestureResponderEvent) => {
    if (disabled) return false;
    if (interaction !== "drag") return true;
    const x = event?.nativeEvent?.locationX;
    return typeof x !== "number" || Math.abs(x - thumbCentre) <= THUMB_SIZE;
  };

  const onAreaLayout = useCallback(() => {
    // Fallback for a grant that carries no locationX.
    areaRef.current?.measureInWindow?.((x) => {
      areaPageX.current = x;
    });
  }, []);
  const onTrackLayout = useCallback((event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  }, []);

  // Keyboard and assistive technology, whatever the pointer may do.
  const keyStep = step && step > 0 ? step : (max - min) / 100;
  const commit = (next: number) => {
    const target = clamp(next);
    if (target === clamp(value)) return;
    change(target);
    onSlidingComplete?.(target);
  };
  const onKeyDown = (event: KeyEventLike) => {
    if (disabled) return;
    const current = clamp(value);
    let next: number;
    switch (event.key) {
      case "ArrowRight":
      case "ArrowUp":
        next = current + keyStep;
        break;
      case "ArrowLeft":
      case "ArrowDown":
        next = current - keyStep;
        break;
      case "PageUp":
        next = current + 10 * keyStep;
        break;
      case "PageDown":
        next = current - 10 * keyStep;
        break;
      case "Home":
        next = min;
        break;
      case "End":
        next = max;
        break;
      default:
        return;
    }
    event.preventDefault?.();
    commit(next);
  };

  // Web: a real slider for the browser (focusable, with its value); native:
  // an adjustable element with increment and decrement actions.
  const semantics =
    Platform.OS === "web"
      ? ({
          role: "slider",
          tabIndex: disabled ? -1 : 0,
          "aria-label": label,
          "aria-valuemin": min,
          "aria-valuemax": max,
          "aria-valuenow": clamp(value),
          "aria-disabled": disabled || undefined,
          "aria-orientation": "horizontal",
          onKeyDown,
          onFocus: () => setFocused(true),
          onBlur: () => setFocused(false),
        } as object)
      : {
          accessibilityRole: "adjustable" as const,
          accessibilityLabel: label,
          accessibilityValue: { min, max, now: clamp(value) },
          accessibilityActions: [
            { name: "increment" as const },
            { name: "decrement" as const },
          ],
          onAccessibilityAction: (event: AccessibilityActionEvent) => {
            if (disabled) return;
            const { actionName } = event.nativeEvent;
            if (actionName === "increment") commit(clamp(value) + keyStep);
            if (actionName === "decrement") commit(clamp(value) - keyStep);
          },
        };

  const thumbLeft = ratio * trackWidth;

  const markRatios = useMemo(() => {
    if (!marks || !step || step <= 0 || max <= min) return [];
    const count = Math.floor((max - min) / step);
    if (count > 100) return []; // avoid rendering hundreds of ticks
    return Array.from(
      { length: count + 1 },
      (_, i) => (i * step) / (max - min),
    );
  }, [marks, step, min, max]);

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
        ref={areaRef}
        style={styles.touchArea}
        accessibilityState={{ disabled }}
        {...semantics}
        onLayout={onAreaLayout}
        onStartShouldSetResponder={shouldStart}
        // A dragged thumb is not taken over by a ScrollView; a tap is.
        onResponderTerminationRequest={() => !dragsThumb}
        onResponderGrant={handleGrant}
        onResponderMove={handleMove}
        onResponderRelease={handleRelease}
        onResponderTerminate={handleTerminate}
      >
        <View
          pointerEvents="none"
          onLayout={onTrackLayout}
          style={styles.track}
        >
          <View style={[styles.activeTrack, { width: `${ratio * 100}%` }]} />
          {markRatios.map((r, i) => (
            <View
              key={i}
              style={[
                styles.mark,
                {
                  left: `${r * 100}%`,
                  backgroundColor:
                    r <= ratio
                      ? theme.colors.onPrimary
                      : theme.colors.onSurfaceVariant,
                },
              ]}
            />
          ))}
        </View>

        <View
          pointerEvents="none"
          style={[
            styles.thumb,
            { left: thumbLeft },
            dragging && styles.thumbActive,
            focused && getFocusRing(theme),
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

const makeStyles = (theme: Theme) =>
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
        web: {
          cursor: "pointer",
          touchAction: "none" as any,
          // The thumb shows its own focus ring.
          outlineStyle: "none" as any,
        },
      }),
    },
    track: {
      // Half a thumb free at each end, so the thumb stays inside the touch area.
      marginHorizontal: THUMB_SIZE / 2,
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
    mark: {
      position: "absolute",
      top: TRACK_HEIGHT / 2 - 1,
      width: 2,
      height: 2,
      borderRadius: 1,
      marginLeft: -1,
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
          boxShadow: `0 1px 3px ${theme.colors.shadow}4D`,
        },
        ios: {
          shadowColor: theme.colors.shadow,
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
