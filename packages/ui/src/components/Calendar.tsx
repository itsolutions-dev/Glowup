import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
  StyleProp,
  ViewStyle,
} from "react-native";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import { Theme, useTheme } from "../providers/ThemeProvider";
import { PressableState } from "./types";
import {
  DateTimePickerLabels,
  addDays,
  addMonths,
  buildMonthMatrix,
  getDeviceLocale,
  getFirstDayOfWeek,
  getMonthNames,
  getShortMonthNames,
  getWeekdayNames,
  isDayOutOfRange,
  isSameDay,
  rotateWeekdays,
  startOfDay,
  useLabels,
} from "./DateTimePicker.shared";

/** Which grid the calendar is currently showing. */
type CalendarView = "days" | "months" | "years";

const YEARS_PER_PAGE = 12;

export interface CalendarProps {
  /** Currently selected day. `null` selects nothing but still renders a month. */
  value?: Date | null;
  onChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  /** Disables individual days (weekends, holidays, …). */
  isDateDisabled?: (date: Date) => boolean;
  /** Formatting/labelling locale. Defaults to the device locale. */
  locale?: string;
  /** 0 = Sunday … 6 = Saturday. Defaults to the locale's own week start. */
  firstDayOfWeek?: number;
  labels?: DateTimePickerLabels;
  /** Renders the "Today" shortcut row. Default `true`. */
  showToday?: boolean;
  /**
   * Arrow-key/PageUp/Home/Enter navigation. Web only — there is no key event
   * source on native. Default `true`.
   */
  keyboardNavigation?: boolean;
  /** Called on Escape while keyboard navigation is active. */
  onRequestClose?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const Calendar = ({
  value,
  onChange,
  minimumDate,
  maximumDate,
  isDateDisabled,
  locale: localeProp,
  firstDayOfWeek: firstDayOfWeekProp,
  labels: labelOverrides,
  showToday = true,
  keyboardNavigation = true,
  onRequestClose,
  style,
  testID,
}: CalendarProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const labels = useLabels(labelOverrides);

  const locale = localeProp ?? getDeviceLocale();
  const firstDayOfWeek = firstDayOfWeekProp ?? getFirstDayOfWeek(locale);
  const monthNames = getMonthNames(locale);
  const shortMonthNames = getShortMonthNames(locale);
  const weekdayNames = useMemo(
    () => rotateWeekdays(getWeekdayNames(locale), firstDayOfWeek),
    [locale, firstDayOfWeek],
  );

  const today = useMemo(() => startOfDay(new Date()), []);
  const [view, setView] = useState<CalendarView>("days");
  // The month whose grid is on screen; independent of the selection so the
  // user can browse away without losing it.
  const [visibleMonth, setVisibleMonth] = useState(
    () =>
      new Date((value ?? today).getFullYear(), (value ?? today).getMonth(), 1),
  );
  // The day the keyboard cursor sits on; also drives the focus ring.
  const [focusedDay, setFocusedDay] = useState(() =>
    startOfDay(value ?? today),
  );
  const [yearPageStart, setYearPageStart] = useState(
    () => (value ?? today).getFullYear() - 6,
  );

  const isDisabled = useCallback(
    (day: Date) =>
      isDayOutOfRange(day, minimumDate, maximumDate) || !!isDateDisabled?.(day),
    [minimumDate, maximumDate, isDateDisabled],
  );

  const select = useCallback(
    (day: Date) => {
      if (isDisabled(day)) return;
      setFocusedDay(startOfDay(day));
      setVisibleMonth(new Date(day.getFullYear(), day.getMonth(), 1));
      onChange(startOfDay(day));
    },
    [isDisabled, onChange],
  );

  const moveFocus = useCallback((next: Date) => {
    setFocusedDay(startOfDay(next));
    setVisibleMonth(new Date(next.getFullYear(), next.getMonth(), 1));
  }, []);

  /**
   * Shows `month` and drags the keyboard cursor along with it, clamped to a day
   * that exists there — so paging with the chevrons and then pressing an arrow
   * key continues from where the eye is.
   */
  const goToMonth = useCallback((month: Date) => {
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    setVisibleMonth(new Date(year, monthIndex, 1));
    setFocusedDay((current) => {
      const lastDay = new Date(year, monthIndex + 1, 0).getDate();
      return new Date(year, monthIndex, Math.min(current.getDate(), lastDay));
    });
  }, []);

  const stepMonth = useCallback(
    (delta: number) => goToMonth(addMonths(visibleMonth, delta)),
    [goToMonth, visibleMonth],
  );

  useEffect(() => {
    if (Platform.OS !== "web" || !keyboardNavigation || view !== "days") return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const handled = () => {
        event.preventDefault();
        event.stopPropagation();
      };
      switch (event.key) {
        case "ArrowLeft":
          handled();
          return moveFocus(addDays(focusedDay, -1));
        case "ArrowRight":
          handled();
          return moveFocus(addDays(focusedDay, 1));
        case "ArrowUp":
          handled();
          return moveFocus(addDays(focusedDay, -7));
        case "ArrowDown":
          handled();
          return moveFocus(addDays(focusedDay, 7));
        case "PageUp":
          handled();
          return moveFocus(addMonths(focusedDay, event.shiftKey ? -12 : -1));
        case "PageDown":
          handled();
          return moveFocus(addMonths(focusedDay, event.shiftKey ? 12 : 1));
        case "Home": {
          handled();
          const offset = (focusedDay.getDay() - firstDayOfWeek + 7) % 7;
          return moveFocus(addDays(focusedDay, -offset));
        }
        case "End": {
          handled();
          const offset = (focusedDay.getDay() - firstDayOfWeek + 7) % 7;
          return moveFocus(addDays(focusedDay, 6 - offset));
        }
        case "Enter":
        case " ":
          handled();
          return select(focusedDay);
        case "Escape":
          if (onRequestClose) {
            handled();
            onRequestClose();
          }
          return;
        default:
          return;
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [
    keyboardNavigation,
    view,
    focusedDay,
    firstDayOfWeek,
    moveFocus,
    select,
    onRequestClose,
  ]);

  const cells = useMemo(
    () => buildMonthMatrix(visibleMonth, firstDayOfWeek),
    [visibleMonth, firstDayOfWeek],
  );

  // A whole page of months/years is skippable when every entry in it is out of
  // range, so the chevrons stay honest instead of paging into dead ground.
  const canStepBack = !isDayOutOfRangeMonth(
    addMonths(visibleMonth, -1),
    minimumDate,
    maximumDate,
  );
  const canStepForward = !isDayOutOfRangeMonth(
    addMonths(visibleMonth, 1),
    minimumDate,
    maximumDate,
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          view === "years" ? labels.previousYears : labels.previousMonth
        }
        accessibilityState={{ disabled: view === "days" && !canStepBack }}
        disabled={view === "days" && !canStepBack}
        onPress={() =>
          view === "years"
            ? setYearPageStart((start) => start - YEARS_PER_PAGE)
            : stepMonth(-1)
        }
        style={({ hovered }: PressableState) => [
          styles.navButton,
          hovered && { backgroundColor: theme.colors.surfaceContainerHighest },
          view === "days" && !canStepBack && styles.faded,
        ]}
      >
        <Icons name="chevron-left" size={22} color={theme.colors.onSurface} />
      </Pressable>

      <View style={styles.headerCenter}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={labels.selectMonth}
          accessibilityState={{ expanded: view === "months" }}
          onPress={() => setView(view === "months" ? "days" : "months")}
          style={styles.headerButton}
        >
          <Text
            style={[
              theme.typography.titleMedium,
              { color: theme.colors.onSurface },
            ]}
          >
            {monthNames[visibleMonth.getMonth()]}
          </Text>
          <Icons
            name={view === "months" ? "menu-up" : "menu-down"}
            size={18}
            color={theme.colors.onSurfaceVariant}
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={labels.selectYear}
          accessibilityState={{ expanded: view === "years" }}
          onPress={() => {
            setYearPageStart(visibleMonth.getFullYear() - 6);
            setView(view === "years" ? "days" : "years");
          }}
          style={styles.headerButton}
        >
          <Text
            style={[
              theme.typography.titleMedium,
              { color: theme.colors.onSurface },
            ]}
          >
            {visibleMonth.getFullYear()}
          </Text>
          <Icons
            name={view === "years" ? "menu-up" : "menu-down"}
            size={18}
            color={theme.colors.onSurfaceVariant}
          />
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          view === "years" ? labels.nextYears : labels.nextMonth
        }
        accessibilityState={{ disabled: view === "days" && !canStepForward }}
        disabled={view === "days" && !canStepForward}
        onPress={() =>
          view === "years"
            ? setYearPageStart((start) => start + YEARS_PER_PAGE)
            : stepMonth(1)
        }
        style={({ hovered }: PressableState) => [
          styles.navButton,
          hovered && { backgroundColor: theme.colors.surfaceContainerHighest },
          view === "days" && !canStepForward && styles.faded,
        ]}
      >
        <Icons name="chevron-right" size={22} color={theme.colors.onSurface} />
      </Pressable>
    </View>
  );

  const renderDays = () => (
    <>
      <View style={styles.weekRow}>
        {weekdayNames.map((name, index) => (
          <Text
            key={`${name}-${index}`}
            style={[
              theme.typography.labelSmall,
              styles.weekdayLabel,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {name}
          </Text>
        ))}
      </View>
      <View
        role="grid"
        style={styles.grid}
        testID={testID ? `${testID}-grid` : undefined}
      >
        {cells.map((day) => {
          const outsideMonth = day.getMonth() !== visibleMonth.getMonth();
          const selected = !!value && isSameDay(day, value);
          const disabled = isDisabled(day);
          const focused = isSameDay(day, focusedDay);
          const isCurrentDay = isSameDay(day, today);
          return (
            <Pressable
              key={day.toISOString()}
              accessibilityRole="button"
              accessibilityLabel={new Intl.DateTimeFormat(locale, {
                dateStyle: "full",
              }).format(day)}
              accessibilityState={{ selected, disabled }}
              disabled={disabled}
              onPress={() => select(day)}
              style={({ hovered, pressed }: PressableState) => [
                styles.dayCell,
                selected && { backgroundColor: theme.colors.primary },
                !selected &&
                  isCurrentDay && {
                    borderWidth: 1,
                    borderColor: theme.colors.primary,
                  },
                !selected &&
                  focused && {
                    borderWidth: 2,
                    borderColor: theme.colors.outline,
                  },
                !selected &&
                  (hovered || pressed) && {
                    backgroundColor: theme.colors.surfaceContainerHighest,
                  },
                disabled && styles.faded,
              ]}
            >
              <Text
                style={[
                  theme.typography.bodyMedium,
                  {
                    color: selected
                      ? theme.colors.onPrimary
                      : outsideMonth
                        ? theme.colors.outline
                        : isCurrentDay
                          ? theme.colors.primary
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
    </>
  );

  const renderMonths = () => (
    <View style={styles.pickerGrid}>
      {shortMonthNames.map((name, monthIndex) => {
        const active = monthIndex === visibleMonth.getMonth();
        const disabled = isDayOutOfRangeMonth(
          new Date(visibleMonth.getFullYear(), monthIndex, 1),
          minimumDate,
          maximumDate,
        );
        return (
          <Pressable
            key={name}
            accessibilityRole="button"
            accessibilityState={{ selected: active, disabled }}
            disabled={disabled}
            onPress={() => {
              goToMonth(new Date(visibleMonth.getFullYear(), monthIndex, 1));
              setView("days");
            }}
            style={({ hovered }: PressableState) => [
              styles.pickerCell,
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
              {name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  const renderYears = () => (
    <ScrollView style={styles.yearScroll}>
      <View style={styles.pickerGrid}>
        {Array.from(
          { length: YEARS_PER_PAGE },
          (_, i) => yearPageStart + i,
        ).map((year) => {
          const active = year === visibleMonth.getFullYear();
          const disabled = isDayOutOfRangeYear(year, minimumDate, maximumDate);
          return (
            <Pressable
              key={year}
              accessibilityRole="button"
              accessibilityState={{ selected: active, disabled }}
              disabled={disabled}
              onPress={() => {
                setVisibleMonth(new Date(year, visibleMonth.getMonth(), 1));
                setView("days");
              }}
              style={({ hovered }: PressableState) => [
                styles.pickerCell,
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
                {year}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );

  const todayDisabled = isDisabled(today);

  return (
    <View style={[styles.container, style]} testID={testID}>
      {renderHeader()}
      {view === "days" && renderDays()}
      {view === "months" && renderMonths()}
      {view === "years" && renderYears()}
      {showToday && (
        <View
          style={[
            styles.footer,
            { borderTopColor: theme.colors.outlineVariant },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: todayDisabled }}
            disabled={todayDisabled}
            onPress={() => {
              setView("days");
              select(today);
            }}
            style={({ hovered }: PressableState) => [
              styles.footerButton,
              hovered && {
                backgroundColor: theme.colors.surfaceContainerHighest,
              },
              todayDisabled && styles.faded,
            ]}
          >
            <Text
              style={[
                theme.typography.labelLarge,
                { color: theme.colors.primary },
              ]}
            >
              {labels.today}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

export default Calendar;

/** True when no day of `month` is selectable. */
const isDayOutOfRangeMonth = (month: Date, minimum?: Date, maximum?: Date) => {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  return (
    isDayOutOfRange(last, minimum, undefined) ||
    isDayOutOfRange(first, undefined, maximum)
  );
};

/** True when no day of `year` is selectable. */
const isDayOutOfRangeYear = (year: number, minimum?: Date, maximum?: Date) =>
  isDayOutOfRange(new Date(year, 11, 31), minimum, undefined) ||
  isDayOutOfRange(new Date(year, 0, 1), undefined, maximum);

const CELL = 40;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      width: CELL * 7 + theme.spacing.s * 2,
      paddingHorizontal: theme.spacing.s,
      paddingVertical: theme.spacing.s,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: theme.spacing.s,
    },
    headerCenter: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.s,
    },
    headerButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      borderRadius: theme.shape.small,
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: 2,
    },
    navButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    weekRow: { flexDirection: "row" },
    weekdayLabel: {
      width: CELL,
      textAlign: "center",
      textTransform: "uppercase",
    },
    grid: { flexDirection: "row", flexWrap: "wrap" },
    dayCell: {
      width: CELL,
      height: CELL,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: CELL / 2,
    },
    pickerGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    pickerCell: {
      width: "31%",
      paddingVertical: 10,
      alignItems: "center",
      borderRadius: theme.shape.small,
      marginBottom: 6,
    },
    yearScroll: { maxHeight: CELL * 6 },
    footer: {
      flexDirection: "row",
      justifyContent: "flex-end",
      borderTopWidth: 1,
      marginTop: theme.spacing.s,
      paddingTop: theme.spacing.s,
    },
    footerButton: {
      paddingVertical: 6,
      paddingHorizontal: theme.spacing.s,
      borderRadius: theme.shape.small,
    },
    faded: { opacity: 0.38 },
  });
