import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  GestureResponderEvent,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Theme, useTheme } from "../providers/ThemeProvider";

/** Which unit the dial is currently editing. */
export type ClockUnit = "hours" | "minutes";

const DIAL_SIZE = 256;
const CENTER = DIAL_SIZE / 2;
const OUTER_RADIUS = 100;
/** Second ring used only by the 24-hour dial, for 13–00. */
const INNER_RADIUS = 62;
/** Diameter of the circle sitting at the tip of the hand. */
const KNOB = 40;
const CENTER_DOT = 8;
/** Halfway between the rings — anything closer than this reads as the inner one. */
const RING_SPLIT = (OUTER_RADIUS + INNER_RADIUS) / 2;

const TAU = Math.PI * 2;

interface DialNumber {
  /** The value the label stands for: 0–23 for hours, 0–59 for minutes. */
  value: number;
  label: string;
  /** Position on the clock face, 0 = 12 o'clock, 11 = 11 o'clock. */
  position: number;
  radius: number;
}

const pad2 = (value: number) => String(value).padStart(2, "0");

/** Clock position → angle in radians, with 12 o'clock at the top. */
const toAngle = (position: number, steps: number) =>
  (position / steps) * TAU - Math.PI / 2;

const toPoint = (angle: number, radius: number) => ({
  x: CENTER + radius * Math.cos(angle),
  y: CENTER + radius * Math.sin(angle),
});

export interface ClockDialProps {
  unit: ClockUnit;
  /** Current hour, always 0–23 regardless of the displayed clock format. */
  hours: number;
  minutes: number;
  /** Renders two rings (1–12 outer, 13–00 inner) instead of one. */
  use24HourClock?: boolean;
  /** Minute granularity the dial snaps to. Defaults to 1. */
  minuteInterval?: number;
  onChangeHours: (hours: number) => void;
  onChangeMinutes: (minutes: number) => void;
  /** Fires when a press on the hour dial ends, to hand over to the minutes. */
  onUnitComplete?: () => void;
  /** Greys out and refuses values the caller does not allow. */
  isTimeDisabled?: (hours: number, minutes: number) => boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * The Material 3 analog clock face: a rotating hand with a knob at its tip, a
 * ring of labels, and drag-to-set. Drawn with plain Views so the kit does not
 * take on an SVG dependency for one component.
 */
const ClockDial = ({
  unit,
  hours,
  minutes,
  use24HourClock = false,
  minuteInterval = 1,
  onChangeHours,
  onChangeMinutes,
  onUnitComplete,
  isTimeDisabled,
  style,
  testID,
}: ClockDialProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const step = Math.max(1, Math.min(30, Math.floor(minuteInterval)));

  const numbers = useMemo<DialNumber[]>(() => {
    if (unit === "minutes") {
      // Only the multiples of five are labelled; the rest are still selectable
      // by angle, exactly as on a real clock face.
      return Array.from({ length: 12 }, (_, i) => ({
        value: i * 5,
        label: pad2(i * 5),
        position: i,
        radius: OUTER_RADIUS,
      }));
    }
    if (!use24HourClock) {
      return Array.from({ length: 12 }, (_, i) => {
        const clockHour = i === 0 ? 12 : i;
        return {
          value: clockHour,
          label: String(clockHour),
          position: i,
          radius: OUTER_RADIUS,
        };
      });
    }
    // 24-hour face: 1–12 on the outer ring, 13–23 plus 00 on the inner one.
    const outer = Array.from({ length: 12 }, (_, i) => ({
      value: i === 0 ? 12 : i,
      label: pad2(i === 0 ? 12 : i),
      position: i,
      radius: OUTER_RADIUS,
    }));
    const inner = Array.from({ length: 12 }, (_, i) => ({
      value: i === 0 ? 0 : i + 12,
      label: pad2(i === 0 ? 0 : i + 12),
      position: i,
      radius: INNER_RADIUS,
    }));
    return [...outer, ...inner];
  }, [unit, use24HourClock]);

  /** Where the hand points right now, and how long it is. */
  const hand = useMemo(() => {
    if (unit === "minutes") {
      return { angle: toAngle(minutes, 60), radius: OUTER_RADIUS };
    }
    if (!use24HourClock) {
      return { angle: toAngle(hours % 12, 12), radius: OUTER_RADIUS };
    }
    const onInnerRing = hours === 0 || hours > 12;
    return {
      angle: toAngle(hours % 12, 12),
      radius: onInnerRing ? INNER_RADIUS : OUTER_RADIUS,
    };
  }, [unit, hours, minutes, use24HourClock]);

  const commit = (locationX: number, locationY: number) => {
    const dx = locationX - CENTER;
    const dy = locationY - CENTER;
    const distance = Math.hypot(dx, dy);
    // atan2 measures from 3 o'clock; the face starts at 12, hence the quarter turn.
    const angle = (Math.atan2(dy, dx) + Math.PI / 2 + TAU) % TAU;

    if (unit === "minutes") {
      const raw = Math.round((angle / TAU) * 60) % 60;
      const snapped = (Math.round(raw / step) * step) % 60;
      if (isTimeDisabled?.(hours, snapped)) return;
      onChangeMinutes(snapped);
      return;
    }

    const position = Math.round((angle / TAU) * 12) % 12;
    let nextHour: number;
    if (!use24HourClock) {
      // Keep the current half of the day; the AM/PM switch owns that choice.
      const base = position === 0 ? 12 : position;
      nextHour = hours >= 12 ? (base % 12) + 12 : base % 12;
    } else {
      const inner = distance < RING_SPLIT;
      // The rings read 1–12 outside and 13–23 plus 00 inside, so 12 o'clock
      // means noon on the outer ring and midnight on the inner one.
      nextHour = inner
        ? position === 0
          ? 0
          : position + 12
        : position === 0
          ? 12
          : position;
    }
    if (isTimeDisabled?.(nextHour, minutes)) return;
    onChangeHours(nextHour);
  };

  // The raw responder props rather than PanResponder: the handlers are rebuilt
  // with the rest of the render, so they always see the current time without a
  // ref standing between them and the props.
  const handleTouch = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    commit(locationX, locationY);
  };

  const handTip = toPoint(hand.angle, hand.radius);
  /** A knob over an unlabelled minute gets no number, so it stays a plain dot. */
  const handOnLabel =
    unit === "hours" || minutes % 5 === 0 ? undefined : styles.knobBare;

  return (
    <View
      testID={testID}
      accessibilityRole="adjustable"
      accessibilityValue={{
        text: `${pad2(hours)}:${pad2(minutes)}`,
      }}
      style={[styles.dial, style]}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handleTouch}
      onResponderMove={handleTouch}
      onResponderRelease={onUnitComplete}
    >
      {/* The hand and its knob sit under the labels so the selected number
          stays readable on top of the primary-coloured circle. */}
      <View
        pointerEvents="none"
        style={[
          styles.hand,
          {
            left: CENTER - 1,
            top: CENTER - hand.radius,
            height: hand.radius,
            backgroundColor: theme.colors.primary,
          },
          // Rotating the bar around the dial centre needs the pivot at its
          // bottom edge, which is where the centre dot is.
          {
            transform: [
              { translateY: hand.radius / 2 },
              { rotate: `${(hand.angle * 180) / Math.PI + 90}deg` },
              { translateY: -hand.radius / 2 },
            ],
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[styles.centerDot, { backgroundColor: theme.colors.primary }]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.knob,
          handOnLabel,
          {
            left: handTip.x - KNOB / 2,
            top: handTip.y - KNOB / 2,
            backgroundColor: theme.colors.primary,
          },
        ]}
      />

      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        {numbers.map((number) => {
          const point = toPoint(toAngle(number.position, 12), number.radius);
          const active =
            unit === "minutes"
              ? number.value === minutes
              : number.value ===
                (use24HourClock ? hours : hours % 12 === 0 ? 12 : hours % 12);
          const disabled =
            unit === "minutes"
              ? !!isTimeDisabled?.(hours, number.value)
              : !!isTimeDisabled?.(
                  use24HourClock
                    ? number.value
                    : hours >= 12
                      ? (number.value % 12) + 12
                      : number.value % 12,
                  minutes,
                );
          return (
            <Text
              key={`${number.radius}-${number.value}`}
              style={[
                number.radius === OUTER_RADIUS
                  ? theme.typography.bodyLarge
                  : theme.typography.bodyMedium,
                styles.number,
                {
                  left: point.x - KNOB / 2,
                  top: point.y - KNOB / 2,
                  color: active
                    ? theme.colors.onPrimary
                    : theme.colors.onSurface,
                },
                disabled && styles.faded,
              ]}
            >
              {number.label}
            </Text>
          );
        })}
      </View>
    </View>
  );
};

export default ClockDial;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    dial: {
      width: DIAL_SIZE,
      height: DIAL_SIZE,
      borderRadius: DIAL_SIZE / 2,
      backgroundColor: theme.colors.surfaceContainerHighest,
      alignSelf: "center",
    },
    hand: {
      position: "absolute",
      width: 2,
    },
    centerDot: {
      position: "absolute",
      left: CENTER - CENTER_DOT / 2,
      top: CENTER - CENTER_DOT / 2,
      width: CENTER_DOT,
      height: CENTER_DOT,
      borderRadius: CENTER_DOT / 2,
    },
    knob: {
      position: "absolute",
      width: KNOB,
      height: KNOB,
      borderRadius: KNOB / 2,
    },
    /** Shrunk to a dot for minutes that carry no label. */
    knobBare: {
      width: CENTER_DOT,
      height: CENTER_DOT,
      borderRadius: CENTER_DOT / 2,
      marginLeft: (KNOB - CENTER_DOT) / 2,
      marginTop: (KNOB - CENTER_DOT) / 2,
    },
    number: {
      position: "absolute",
      width: KNOB,
      height: KNOB,
      lineHeight: KNOB,
      textAlign: "center",
    },
    faded: { opacity: 0.38 },
  });
