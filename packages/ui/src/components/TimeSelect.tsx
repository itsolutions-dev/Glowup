import React, { useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Theme, useTheme } from "../providers/ThemeProvider";
import { PressableState } from "./types";
import {
  DateTimePickerLabels,
  getDayPeriodNames,
  getDeviceLocale,
  isLocale12Hour,
  isSameDay,
  useLabels,
} from "./DateTimePicker.shared";

const ROW_HEIGHT = 36;
const VISIBLE_ROWS = 5;

const pad = (value: number) => String(value).padStart(2, "0");

interface TimeColumnProps {
  label: string;
  items: number[];
  selected: number;
  format: (value: number) => string;
  onSelect: (value: number) => void;
  isDisabled: (value: number) => boolean;
  /** Scrolls the column to the selection on mount. Off for short columns. */
  autoScroll?: boolean;
  styles: ReturnType<typeof makeStyles>;
}

const TimeColumn = ({
  label,
  items,
  selected,
  format,
  onSelect,
  isDisabled,
  autoScroll = true,
  styles,
}: TimeColumnProps) => {
  const { theme } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const selectedIndex = items.indexOf(selected);

  useEffect(() => {
    if (!autoScroll || selectedIndex < 0) return;
    // Centre the selected row rather than pinning it to the top.
    const offset = Math.max(
      0,
      (selectedIndex - Math.floor(VISIBLE_ROWS / 2)) * ROW_HEIGHT,
    );
    scrollRef.current?.scrollTo({ y: offset, animated: false });
  }, [autoScroll, selectedIndex]);

  return (
    <View style={styles.column}>
      <Text
        style={[
          theme.typography.labelSmall,
          styles.columnLabel,
          { color: theme.colors.onSurfaceVariant },
        ]}
      >
        {label}
      </Text>
      <ScrollView
        ref={scrollRef}
        style={styles.columnScroll}
        showsVerticalScrollIndicator={false}
      >
        {items.map((item) => {
          const active = item === selected;
          const disabled = isDisabled(item);
          return (
            <Pressable
              key={item}
              accessibilityRole="button"
              accessibilityLabel={`${label} ${format(item)}`}
              accessibilityState={{ selected: active, disabled }}
              disabled={disabled}
              onPress={() => onSelect(item)}
              style={({ hovered }: PressableState) => [
                styles.row,
                active && { backgroundColor: theme.colors.primary },
                !active &&
                  hovered && {
                    backgroundColor: theme.colors.surfaceContainerHighest,
                  },
                disabled && styles.faded,
              ]}
            >
              <Text
                style={[
                  theme.typography.bodyMedium,
                  {
                    color: active
                      ? theme.colors.onPrimary
                      : theme.colors.onSurface,
                  },
                ]}
              >
                {format(item)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

export interface TimeSelectProps {
  value: Date;
  onChange: (date: Date) => void;
  /** Clamps the selectable times on the minimum's own day. */
  minimumDate?: Date;
  /** Clamps the selectable times on the maximum's own day. */
  maximumDate?: Date;
  /** Minute granularity. Defaults to 1. */
  minuteInterval?: number;
  /** Formatting locale; decides 12h vs 24h. Defaults to the device locale. */
  locale?: string;
  /** Forces the clock format instead of deriving it from the locale. */
  use12Hour?: boolean;
  labels?: DateTimePickerLabels;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Scrollable hour/minute columns, plus a day-period column on 12-hour locales.
 * Pure React Native, so the same surface renders on web and native.
 *
 * @deprecated inside the pickers — `DateTimePicker` and `TimePicker` use the
 * Material 3 `ClockPicker` instead. Still exported for compact inline use
 * where a full clock face does not fit.
 */
const TimeSelect = ({
  value,
  onChange,
  minimumDate,
  maximumDate,
  minuteInterval = 1,
  locale: localeProp,
  use12Hour,
  labels: labelOverrides,
  style,
  testID,
}: TimeSelectProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const labels = useLabels(labelOverrides);

  const locale = localeProp ?? getDeviceLocale();
  const twelveHour = use12Hour ?? isLocale12Hour(locale);
  const dayPeriods = getDayPeriodNames(locale);

  const selectedHour = value.getHours();
  const selectedMinute = value.getMinutes();
  const isPm = selectedHour >= 12;

  // The clamps only bite on the boundary day itself: 09:00 stays selectable on
  // any day after a `minimumDate` of "yesterday 14:00".
  const minMinutes = useMemo(() => {
    if (!minimumDate || !isSameDay(minimumDate, value)) return null;
    return minimumDate.getHours() * 60 + minimumDate.getMinutes();
  }, [minimumDate, value]);
  const maxMinutes = useMemo(() => {
    if (!maximumDate || !isSameDay(maximumDate, value)) return null;
    return maximumDate.getHours() * 60 + maximumDate.getMinutes();
  }, [maximumDate, value]);

  const isTimeDisabled = (hours: number, minutes: number) => {
    const total = hours * 60 + minutes;
    if (minMinutes !== null && total < minMinutes) return true;
    if (maxMinutes !== null && total > maxMinutes) return true;
    return false;
  };

  const step = Math.max(1, Math.min(30, Math.floor(minuteInterval)));
  const hourItems = useMemo(
    () =>
      twelveHour
        ? Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i))
        : Array.from({ length: 24 }, (_, i) => i),
    [twelveHour],
  );
  const minuteItems = useMemo(
    () => Array.from({ length: Math.ceil(60 / step) }, (_, i) => i * step),
    [step],
  );

  const commit = (hours: number, minutes: number) => {
    const next = new Date(value);
    next.setHours(hours, minutes, 0, 0);
    onChange(next);
  };

  /** Maps a displayed hour back to 0–23, honouring the current day period. */
  const toClockHour = (displayed: number) => {
    if (!twelveHour) return displayed;
    const base = displayed === 12 ? 0 : displayed;
    return isPm ? base + 12 : base;
  };

  const displayedHour = twelveHour
    ? selectedHour % 12 === 0
      ? 12
      : selectedHour % 12
    : selectedHour;

  // Snap the highlighted minute to the closest step, so 07:13 still lights up
  // a row when minuteInterval is 5.
  const displayedMinute = minuteItems.reduce(
    (closest, minute) =>
      Math.abs(minute - selectedMinute) < Math.abs(closest - selectedMinute)
        ? minute
        : closest,
    minuteItems[0],
  );

  return (
    <View style={[styles.container, style]} testID={testID}>
      <TimeColumn
        label={labels.hours}
        items={hourItems}
        selected={displayedHour}
        format={(hour) => (twelveHour ? String(hour) : pad(hour))}
        onSelect={(hour) => commit(toClockHour(hour), selectedMinute)}
        isDisabled={(hour) => isTimeDisabled(toClockHour(hour), selectedMinute)}
        styles={styles}
      />
      <TimeColumn
        label={labels.minutes}
        items={minuteItems}
        selected={displayedMinute}
        format={pad}
        onSelect={(minute) => commit(selectedHour, minute)}
        isDisabled={(minute) => isTimeDisabled(selectedHour, minute)}
        styles={styles}
      />
      {twelveHour && (
        <View style={styles.column}>
          <Text
            style={[
              theme.typography.labelSmall,
              styles.columnLabel,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {" "}
          </Text>
          <View style={styles.periodColumn}>
            {(
              [
                { key: "am", label: dayPeriods.am, pm: false },
                { key: "pm", label: dayPeriods.pm, pm: true },
              ] as const
            ).map((period) => {
              const active = period.pm === isPm;
              const targetHour = period.pm
                ? (selectedHour % 12) + 12
                : selectedHour % 12;
              const disabled = isTimeDisabled(targetHour, selectedMinute);
              return (
                <Pressable
                  key={period.key}
                  accessibilityRole="button"
                  accessibilityLabel={period.label}
                  accessibilityState={{ selected: active, disabled }}
                  disabled={disabled}
                  onPress={() => commit(targetHour, selectedMinute)}
                  style={({ hovered }: PressableState) => [
                    styles.row,
                    active && { backgroundColor: theme.colors.primary },
                    !active &&
                      hovered && {
                        backgroundColor: theme.colors.surfaceContainerHighest,
                      },
                    disabled && styles.faded,
                  ]}
                >
                  <Text
                    style={[
                      theme.typography.bodyMedium,
                      {
                        color: active
                          ? theme.colors.onPrimary
                          : theme.colors.onSurface,
                      },
                    ]}
                  >
                    {period.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

export default TimeSelect;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      gap: theme.spacing.s,
      justifyContent: "center",
    },
    column: { width: 64 },
    columnLabel: {
      textAlign: "center",
      marginBottom: theme.spacing.xs,
      textTransform: "uppercase",
      minHeight: 16,
    },
    columnScroll: { height: ROW_HEIGHT * VISIBLE_ROWS },
    periodColumn: { gap: theme.spacing.xs },
    row: {
      height: ROW_HEIGHT,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: theme.shape.small,
    },
    faded: { opacity: 0.38 },
  });
