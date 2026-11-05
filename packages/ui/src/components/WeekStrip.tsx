import React, { useMemo } from "react";
import {
  PanResponder,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { Theme, useTheme } from "../providers/ThemeProvider";
import { gradientStyle } from "../providers/gradient";
import IconButton from "./IconButton";
import {
  addDays,
  getDeviceLocale,
  getFirstDayOfWeek,
  getWeekdayNames,
  isSameDay,
  startOfDay,
} from "./DateTimePicker.shared";

export interface WeekStripProps {
  /** The chosen day. The strip shows the week it falls in. */
  value: Date;
  /** Called with the pressed day, or with the same weekday a week later or earlier after a swipe. */
  onChange: (date: Date) => void;
  /**
   * The days to show, as `Date#getDay()` numbers (0 = Sunday … 6 = Saturday), in the locale's week
   * order whatever order they are given in. Defaults to Monday to Friday, `[1, 2, 3, 4, 5]`.
   */
  weekDays?: number[];
  /** The locale of the weekday names and of the first day of the week. Defaults to the device's. */
  locale?: string;
  /** The first day of the week, 0 = Sunday … 6 = Saturday. Defaults to the locale's. */
  firstDayOfWeek?: number;
  /** Fills the chosen day with the brand gradient (`primary` into `tertiary`) instead of `primary`. */
  gradient?: boolean;
  /**
   * An arrow on each side that moves a week, for a mouse, which cannot swipe.
   * Defaults to `true` on the web and `false` on iOS and Android.
   */
  arrows?: boolean;
  /** The names of the arrows and of the screen-reader actions that move a week. Default English. */
  labels?: { nextWeek?: string; previousWeek?: string };
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const WORK_WEEK = [1, 2, 3, 4, 5];
// How far a finger must travel sideways before the strip takes the gesture, and to move a week.
const CLAIM = 10;
const SWIPE = 40;

/**
 * A week as a row of days, one of them chosen, as in a phone agenda: press a day to pick it, swipe
 * the row (or press an arrow, on the web) to move a week. Screen readers move a week through the
 * days' actions.
 */
const WeekStrip = ({
  value,
  onChange,
  weekDays = WORK_WEEK,
  locale: localeProp,
  firstDayOfWeek: firstDayProp,
  gradient = false,
  arrows = Platform.OS === "web",
  labels,
  style,
  testID,
}: WeekStripProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const locale = localeProp ?? getDeviceLocale();
  const firstDay = firstDayProp ?? getFirstDayOfWeek(locale);
  const short = getWeekdayNames(locale);
  const full = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: "full" }),
    [locale],
  );

  // The chosen day as a number: the gesture below depends on it, and a number cannot be changed
  // behind its back the way a Date passed around could.
  const time = startOfDay(value).getTime();

  // A sideways drag belongs to the strip, which cancels the press on the day under the finger; an
  // upright one is left to the page's scroll.
  const swipe = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dx) > CLAIM && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderTerminationRequest: () => false,
        onPanResponderRelease: (_, g) => {
          if (Math.abs(g.dx) > SWIPE)
            onChange(addDays(new Date(time), g.dx < 0 ? 7 : -7));
        },
      }),
    [time, onChange],
  );

  const chosen = new Date(time);
  const start = addDays(chosen, -((chosen.getDay() - firstDay + 7) % 7));
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i)).filter(
    (day) => weekDays.includes(day.getDay()),
  );

  const nextWeek = labels?.nextWeek ?? "Next week";
  const previousWeek = labels?.previousWeek ?? "Previous week";
  const move = (weeks: number) => onChange(addDays(chosen, weeks * 7));

  const strip = (
    <View
      style={[styles.row, arrows ? styles.grow : style]}
      testID={arrows ? undefined : testID}
      {...swipe.panHandlers}
    >
      {days.map((day) => {
        const selected = isSameDay(day, chosen);
        return (
          <Pressable
            key={day.getTime()}
            accessibilityRole="button"
            accessibilityLabel={full.format(day)}
            accessibilityState={{ selected }}
            accessibilityActions={[
              { name: "nextWeek", label: nextWeek },
              { name: "previousWeek", label: previousWeek },
            ]}
            onAccessibilityAction={(e) =>
              move(e.nativeEvent.actionName === "nextWeek" ? 1 : -1)
            }
            onPress={() => onChange(day)}
            style={[
              styles.day,
              selected &&
                (gradient
                  ? gradientStyle(
                      theme.colors.primary,
                      theme.colors.tertiary,
                      160,
                    )
                  : { backgroundColor: theme.colors.primary }),
            ]}
          >
            <Text
              style={[
                theme.typography.labelSmall,
                {
                  color: selected
                    ? theme.colors.onPrimary
                    : theme.colors.onSurfaceVariant,
                },
              ]}
            >
              {short[day.getDay()]}
            </Text>
            <Text
              style={[
                theme.typography.titleMedium,
                {
                  color: selected
                    ? theme.colors.onPrimary
                    : theme.colors.onSurface,
                },
              ]}
            >
              {day.getDate()}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  if (!arrows) return strip;
  return (
    <View style={[styles.withArrows, style]} testID={testID}>
      <IconButton
        icon="chevron-left"
        accessibilityLabel={previousWeek}
        title={previousWeek}
        onClick={() => move(-1)}
      />
      {strip}
      <IconButton
        icon="chevron-right"
        accessibilityLabel={nextWeek}
        title={nextWeek}
        onClick={() => move(1)}
      />
    </View>
  );
};

export default WeekStrip;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    row: { flexDirection: "row", gap: theme.spacing.xs },
    grow: { flex: 1 },
    withArrows: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
    },
    day: {
      flex: 1,
      alignItems: "center",
      gap: theme.spacing.xs,
      paddingVertical: theme.spacing.s,
      borderRadius: theme.shape.medium,
    },
  });
