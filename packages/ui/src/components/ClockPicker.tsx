import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Theme, useTheme } from "../providers/ThemeProvider";
import { PressableState } from "./types";
import ClockDial, { ClockUnit } from "./ClockDial";
import {
  DateTimePickerLabels,
  MinuteInterval,
  PickerInputType,
  getDayPeriodNames,
  getDeviceLocale,
  isLocale12Hour,
  isSameDay,
  useLabels,
} from "./DateTimePicker.shared";

const pad2 = (value: number) => String(value).padStart(2, "0");

export interface ClockPickerProps {
  value: Date;
  onChange: (date: Date) => void;
  /** Clamps the selectable times on the minimum's own day. */
  minimumDate?: Date;
  /** Clamps the selectable times on the maximum's own day. */
  maximumDate?: Date;
  /** Minute granularity. Defaults to 1. */
  minuteInterval?: MinuteInterval;
  /** Formatting locale; decides 12h vs 24h. Defaults to the device locale. */
  locale?: string;
  /** Forces the 24-hour face. Left unset, the locale decides. */
  use24HourClock?: boolean;
  /** `picker` shows the dial, `keyboard` two text fields. Defaults to `picker`. */
  inputType?: PickerInputType;
  labels?: DateTimePickerLabels;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * The Material 3 time picker surface: the hour and minute readouts double as
 * the unit selector, with the analog dial (or two text fields) underneath.
 */
const ClockPicker = ({
  value,
  onChange,
  minimumDate,
  maximumDate,
  minuteInterval = 1,
  locale: localeProp,
  use24HourClock,
  inputType = "picker",
  labels: labelOverrides,
  style,
  testID,
}: ClockPickerProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const labels = useLabels(labelOverrides);

  const locale = localeProp ?? getDeviceLocale();
  // An explicit `true` forces the 24-hour face; anything else follows the
  // locale, so the flag reads the same way it is named.
  const twelveHour = use24HourClock ? false : isLocale12Hour(locale);
  const dayPeriods = getDayPeriodNames(locale);

  const [unit, setUnit] = useState<ClockUnit>("hours");

  const hours = value.getHours();
  const minutes = value.getMinutes();
  const isPm = hours >= 12;

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

  const isTimeDisabled = (nextHours: number, nextMinutes: number) => {
    const total = nextHours * 60 + nextMinutes;
    if (minMinutes !== null && total < minMinutes) return true;
    if (maxMinutes !== null && total > maxMinutes) return true;
    return false;
  };

  const commit = (nextHours: number, nextMinutes: number) => {
    const next = new Date(value);
    next.setHours(nextHours, nextMinutes, 0, 0);
    onChange(next);
  };

  const displayedHour = twelveHour
    ? hours % 12 === 0
      ? 12
      : hours % 12
    : hours;

  const setDayPeriod = (pm: boolean) => {
    const nextHours = pm ? (hours % 12) + 12 : hours % 12;
    if (isTimeDisabled(nextHours, minutes)) return;
    commit(nextHours, minutes);
  };

  /** Parses a typed hour in the format currently on screen. */
  const handleHourText = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, 2);
    if (!digits) return;
    const typed = Number(digits);
    const max = twelveHour ? 12 : 23;
    if (typed > max) return;
    const nextHours = twelveHour
      ? isPm
        ? (typed % 12) + 12
        : typed % 12
      : typed;
    if (isTimeDisabled(nextHours, minutes)) return;
    commit(nextHours, minutes);
  };

  const handleMinuteText = (text: string) => {
    const digits = text.replace(/\D/g, "").slice(0, 2);
    if (!digits) return;
    const typed = Number(digits);
    if (typed > 59) return;
    if (isTimeDisabled(hours, typed)) return;
    commit(hours, typed);
  };

  const renderReadout = (
    unitKey: ClockUnit,
    text: string,
    accessibilityLabel: string,
    onChangeText: (next: string) => void,
  ) => {
    const active = unit === unitKey;
    const shared = [
      styles.readout,
      {
        backgroundColor: active
          ? theme.colors.primaryContainer
          : theme.colors.surfaceContainerHighest,
      },
      active && { borderWidth: 2, borderColor: theme.colors.primary },
    ];
    const textColor = active
      ? theme.colors.onPrimaryContainer
      : theme.colors.onSurface;

    if (inputType === "keyboard") {
      return (
        <TextInput
          accessibilityLabel={accessibilityLabel}
          value={text}
          onChangeText={onChangeText}
          onFocus={() => setUnit(unitKey)}
          keyboardType="number-pad"
          maxLength={2}
          selectTextOnFocus
          style={[
            shared,
            theme.typography.displayMedium,
            styles.readoutText,
            { color: textColor },
          ]}
        />
      );
    }

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ selected: active }}
        onPress={() => setUnit(unitKey)}
        style={({ hovered }: PressableState) => [
          ...shared,
          !active &&
            hovered && { backgroundColor: theme.colors.surfaceContainerHigh },
        ]}
      >
        <Text
          style={[
            theme.typography.displayMedium,
            styles.readoutText,
            { color: textColor },
          ]}
        >
          {text}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.readoutRow}>
        {renderReadout(
          "hours",
          twelveHour ? String(displayedHour) : pad2(displayedHour),
          labels.hours,
          handleHourText,
        )}
        <Text
          style={[
            theme.typography.displayMedium,
            styles.separator,
            { color: theme.colors.onSurface },
          ]}
        >
          :
        </Text>
        {renderReadout(
          "minutes",
          pad2(minutes),
          labels.minutes,
          handleMinuteText,
        )}

        {twelveHour && (
          <View
            style={[styles.periodGroup, { borderColor: theme.colors.outline }]}
          >
            {(
              [
                { key: "am", label: dayPeriods.am || labels.am, pm: false },
                { key: "pm", label: dayPeriods.pm || labels.pm, pm: true },
              ] as const
            ).map((period, index) => {
              const active = period.pm === isPm;
              const targetHour = period.pm ? (hours % 12) + 12 : hours % 12;
              const disabled = isTimeDisabled(targetHour, minutes);
              return (
                <Pressable
                  key={period.key}
                  accessibilityRole="button"
                  accessibilityLabel={period.label}
                  accessibilityState={{ selected: active, disabled }}
                  disabled={disabled}
                  onPress={() => setDayPeriod(period.pm)}
                  style={({ hovered }: PressableState) => [
                    styles.periodCell,
                    index === 0 && {
                      borderBottomWidth: 1,
                      borderBottomColor: theme.colors.outline,
                    },
                    active && {
                      backgroundColor: theme.colors.tertiaryContainer,
                    },
                    !active &&
                      hovered && {
                        backgroundColor: theme.colors.surfaceContainerHighest,
                      },
                    disabled && styles.faded,
                  ]}
                >
                  <Text
                    style={[
                      theme.typography.titleMedium,
                      {
                        color: active
                          ? theme.colors.onTertiaryContainer
                          : theme.colors.onSurfaceVariant,
                      },
                    ]}
                  >
                    {period.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {inputType === "picker" && (
        <ClockDial
          unit={unit}
          hours={hours}
          minutes={minutes}
          use24HourClock={!twelveHour}
          minuteInterval={minuteInterval}
          onChangeHours={(next) => commit(next, minutes)}
          onChangeMinutes={(next) => commit(hours, next)}
          // Setting the hour is only half the job, so hand over to the minutes
          // the moment the finger lifts — the M3 dial's own behaviour.
          onUnitComplete={() => unit === "hours" && setUnit("minutes")}
          isTimeDisabled={isTimeDisabled}
          style={styles.dial}
          testID={testID ? `${testID}-dial` : undefined}
        />
      )}
    </View>
  );
};

export default ClockPicker;

const READOUT_WIDTH = 90;
const READOUT_HEIGHT = 76;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { alignItems: "center", gap: theme.spacing.l },
    readoutRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
    },
    readout: {
      width: READOUT_WIDTH,
      height: READOUT_HEIGHT,
      borderRadius: theme.shape.small,
      alignItems: "center",
      justifyContent: "center",
    },
    readoutText: { textAlign: "center", lineHeight: READOUT_HEIGHT },
    separator: { width: theme.spacing.l, textAlign: "center" },
    periodGroup: {
      marginLeft: theme.spacing.s,
      borderWidth: 1,
      borderRadius: theme.shape.small,
      overflow: "hidden",
    },
    periodCell: {
      width: 52,
      height: READOUT_HEIGHT / 2,
      alignItems: "center",
      justifyContent: "center",
    },
    dial: { marginBottom: theme.spacing.s },
    faded: { opacity: 0.38 },
  });
