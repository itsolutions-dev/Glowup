import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  ScrollView,
  StyleSheet,
  Platform,
  StyleProp,
  ViewStyle,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import { Theme, useTheme } from "../providers/ThemeProvider";
import { PressableState } from "./types";
import {
  CalendarScrollMode,
  DateRange,
  DateSelectionMode,
  DateTimePickerLabels,
  EMPTY_RANGE,
  ValidRange,
  addDays,
  addMonths,
  applyRangeSelection,
  buildMonthMatrix,
  fromMonthIndex,
  getDeviceLocale,
  getFirstDayOfWeek,
  getMonthNames,
  getShortMonthNames,
  getWeekdayNames,
  isRangeEnd,
  isRangeStart,
  isSameDay,
  isWithinRange,
  makeDayPredicate,
  resolveBounds,
  rotateWeekdays,
  startOfDay,
  toMonthIndex,
  toggleMultipleSelection,
  useLabels,
} from "./DateTimePicker.shared";

/** Which grid the calendar is currently showing. */
type CalendarView = "days" | "months" | "years";

const YEARS_PER_PAGE = 12;
/** How far the endless scroller reaches when no year bounds are given. */
const DEFAULT_YEAR_SPAN = 100;

const CELL = 40;
const WEEK_ROWS = 6;
const MONTH_TITLE_HEIGHT = 40;
/** Constant so `getItemLayout` can place months without measuring them. */
const MONTH_ITEM_HEIGHT = MONTH_TITLE_HEIGHT + WEEK_ROWS * CELL;
const ENDLESS_VIEWPORT_HEIGHT = MONTH_ITEM_HEIGHT;

export interface CalendarProps {
  /** How many days the grid collects. Defaults to `"single"`. */
  selectionMode?: DateSelectionMode;
  /** Selected day in `single` mode. */
  value?: Date | null;
  /** Selected interval in `range` mode. */
  range?: DateRange;
  /** Selected days in `multiple` mode. */
  dates?: Date[];
  /** Fires in `single` mode. */
  onChange?: (date: Date) => void;
  /** Fires in `range` mode with the interval after the tap. */
  onRangeChange?: (range: DateRange) => void;
  /** Fires in `multiple` mode with the full set after the tap. */
  onDatesChange?: (dates: Date[]) => void;
  /** The selectable window plus individual excluded days. */
  validRange?: ValidRange;
  /** Excludes days `validRange` cannot express (weekends, computed holidays). */
  isDateDisabled?: (date: Date) => boolean;
  /** Formatting/labelling locale. Defaults to the device locale. */
  locale?: string;
  /** 0 = Sunday … 6 = Saturday. Defaults to the locale's own week start. */
  firstDayOfWeek?: number;
  labels?: DateTimePickerLabels;
  /**
   * `endless` scrolls through months in one virtualized list; `paged` shows one
   * month at a time behind the chevrons. Defaults to `endless`.
   */
  scrollMode?: CalendarScrollMode;
  /** First year reachable from the year grid and the endless scroller. */
  startYear?: number;
  /** Last year reachable from the year grid and the endless scroller. */
  endYear?: number;
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
  selectionMode = "single",
  value,
  range = EMPTY_RANGE,
  dates,
  onChange,
  onRangeChange,
  onDatesChange,
  validRange,
  isDateDisabled,
  locale: localeProp,
  firstDayOfWeek: firstDayOfWeekProp,
  labels: labelOverrides,
  scrollMode = "endless",
  startYear,
  endYear,
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
  const dayLabelFormat = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: "full" }),
    [locale],
  );

  const selectedDates = useMemo(() => dates ?? [], [dates]);
  const today = useMemo(() => startOfDay(new Date()), []);

  /** The day the calendar opens on: the selection when there is one, else today. */
  const anchorDay = useMemo(() => {
    if (selectionMode === "range") return range.startDate ?? today;
    if (selectionMode === "multiple") return selectedDates[0] ?? today;
    return value ?? today;
    // Only the initial anchor matters; later moves are user-driven.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionMode, today]);

  const [view, setView] = useState<CalendarView>("days");
  // The month whose grid is on screen; independent of the selection so the
  // user can browse away without losing it.
  const [visibleMonth, setVisibleMonth] = useState(
    () => new Date(anchorDay.getFullYear(), anchorDay.getMonth(), 1),
  );
  // The day the keyboard cursor sits on; also drives the focus ring.
  const [focusedDay, setFocusedDay] = useState(() => startOfDay(anchorDay));
  const [yearPageStart, setYearPageStart] = useState(
    () => anchorDay.getFullYear() - 6,
  );

  const isDisabled = useMemo(
    () => makeDayPredicate(validRange, isDateDisabled),
    [validRange, isDateDisabled],
  );
  const { minimumDate, maximumDate } = useMemo(
    () => resolveBounds(validRange),
    [validRange],
  );

  // --- Endless scroller bounds ----------------------------------------------
  // Clamped to validRange when it is narrower than the year span, so the list
  // never scrolls into months where nothing is selectable.
  const { firstMonthIndex, monthCount } = useMemo(() => {
    const lowYear = startYear ?? today.getFullYear() - DEFAULT_YEAR_SPAN;
    const highYear = endYear ?? today.getFullYear() + DEFAULT_YEAR_SPAN;
    const low = Math.max(
      toMonthIndex(new Date(lowYear, 0, 1)),
      minimumDate ? toMonthIndex(minimumDate) : -Infinity,
    );
    const high = Math.min(
      toMonthIndex(new Date(highYear, 11, 1)),
      maximumDate ? toMonthIndex(maximumDate) : Infinity,
    );
    return {
      firstMonthIndex: low,
      monthCount: Math.max(1, high - low + 1),
    };
  }, [startYear, endYear, today, minimumDate, maximumDate]);

  const monthIndices = useMemo(
    () => Array.from({ length: monthCount }, (_, i) => firstMonthIndex + i),
    [firstMonthIndex, monthCount],
  );

  const listRef = useRef<FlatList<number>>(null);
  const initialIndex = Math.min(
    Math.max(0, toMonthIndex(visibleMonth) - firstMonthIndex),
    monthCount - 1,
  );

  // Scrolling is a side effect, so the request is queued as state and carried
  // out afterwards rather than reaching into the list ref mid-render.
  const [scrollRequest, setScrollRequest] = useState<{
    index: number;
    animated: boolean;
  } | null>(null);

  // Each request is a fresh object, so repeating the same index still re-fires
  // the effect and there is nothing to clear afterwards.
  useEffect(() => {
    if (!scrollRequest) return;
    listRef.current?.scrollToIndex(scrollRequest);
  }, [scrollRequest]);

  const scrollToMonth = useCallback(
    (month: Date, animated = true) => {
      const index = Math.min(
        Math.max(0, toMonthIndex(month) - firstMonthIndex),
        monthCount - 1,
      );
      setScrollRequest({ index, animated });
    },
    [firstMonthIndex, monthCount],
  );

  // --- Selection ------------------------------------------------------------

  const select = useCallback(
    (day: Date) => {
      if (isDisabled(day)) return;
      const picked = startOfDay(day);
      setFocusedDay(picked);
      setVisibleMonth(new Date(picked.getFullYear(), picked.getMonth(), 1));
      if (selectionMode === "range") {
        onRangeChange?.(applyRangeSelection(range, picked));
        return;
      }
      if (selectionMode === "multiple") {
        onDatesChange?.(toggleMultipleSelection(selectedDates, picked));
        return;
      }
      onChange?.(picked);
    },
    [
      isDisabled,
      selectionMode,
      range,
      selectedDates,
      onChange,
      onRangeChange,
      onDatesChange,
    ],
  );

  const isSelected = useCallback(
    (day: Date) => {
      if (selectionMode === "range") {
        return isRangeStart(day, range) || isRangeEnd(day, range);
      }
      if (selectionMode === "multiple") {
        return selectedDates.some((date) => isSameDay(date, day));
      }
      return !!value && isSameDay(day, value);
    },
    [selectionMode, range, selectedDates, value],
  );

  // --- Navigation -----------------------------------------------------------

  const moveFocus = useCallback(
    (next: Date) => {
      const target = startOfDay(next);
      setFocusedDay(target);
      const month = new Date(target.getFullYear(), target.getMonth(), 1);
      setVisibleMonth(month);
      if (scrollMode === "endless") scrollToMonth(month);
    },
    [scrollMode, scrollToMonth],
  );

  /**
   * Shows `month` and drags the keyboard cursor along with it, clamped to a day
   * that exists there — so paging with the chevrons and then pressing an arrow
   * key continues from where the eye is.
   */
  const goToMonth = useCallback(
    (month: Date) => {
      const year = month.getFullYear();
      const monthOfYear = month.getMonth();
      setVisibleMonth(new Date(year, monthOfYear, 1));
      setFocusedDay((current) => {
        const lastDay = new Date(year, monthOfYear + 1, 0).getDate();
        return new Date(
          year,
          monthOfYear,
          Math.min(current.getDate(), lastDay),
        );
      });
      if (scrollMode === "endless")
        scrollToMonth(new Date(year, monthOfYear, 1));
    },
    [scrollMode, scrollToMonth],
  );

  const stepMonth = useCallback(
    (delta: number) => goToMonth(addMonths(visibleMonth, delta)),
    [goToMonth, visibleMonth],
  );

  /**
   * Keeps the header title on the month filling the viewport. Every row is
   * `MONTH_ITEM_HEIGHT` tall, so the offset alone identifies it.
   */
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offset = event.nativeEvent.contentOffset.y;
      const index = firstMonthIndex + Math.round(offset / MONTH_ITEM_HEIGHT);
      setVisibleMonth((current) =>
        toMonthIndex(current) === index ? current : fromMonthIndex(index),
      );
    },
    [firstMonthIndex],
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

  // A whole page of months/years is skippable when every entry in it is out of
  // range, so the chevrons stay honest instead of paging into dead ground.
  const canStepBack = !isMonthOutOfRange(
    addMonths(visibleMonth, -1),
    minimumDate,
    maximumDate,
  );
  const canStepForward = !isMonthOutOfRange(
    addMonths(visibleMonth, 1),
    minimumDate,
    maximumDate,
  );

  // --- Rendering ------------------------------------------------------------

  const renderDay = useCallback(
    (day: Date, monthOfGrid: number) => {
      const outsideMonth = day.getMonth() !== monthOfGrid;
      // Neighbouring months are already one scroll away in endless mode, so
      // repeating their days here would show the same date twice on screen.
      if (outsideMonth && scrollMode === "endless") {
        return <View key={day.toISOString()} style={styles.cellWrapper} />;
      }

      const selected = isSelected(day);
      const disabled = isDisabled(day);
      const focused = isSameDay(day, focusedDay);
      const isCurrentDay = isSameDay(day, today);
      const inRange = selectionMode === "range" && isWithinRange(day, range);
      const rangeStart = selectionMode === "range" && isRangeStart(day, range);
      const rangeEnd =
        selectionMode === "range" &&
        isRangeEnd(day, range) &&
        !!range.startDate &&
        !isSameDay(range.startDate, day);

      return (
        <View
          key={day.toISOString()}
          style={[
            styles.cellWrapper,
            // The band is drawn behind the circular cell so consecutive days
            // read as one continuous interval.
            (inRange || rangeStart || rangeEnd) && {
              backgroundColor: theme.colors.primaryContainer,
            },
            rangeStart && styles.bandStart,
            rangeEnd && styles.bandEnd,
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={dayLabelFormat.format(day)}
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
                !inRange &&
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
                    : inRange
                      ? theme.colors.onPrimaryContainer
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
        </View>
      );
    },
    [
      scrollMode,
      styles,
      isSelected,
      isDisabled,
      focusedDay,
      today,
      selectionMode,
      range,
      theme,
      dayLabelFormat,
      select,
    ],
  );

  const renderWeekRow = () => (
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
  );

  const renderMonthGrid = useCallback(
    (month: Date) => (
      <View style={styles.grid}>
        {buildMonthMatrix(month, firstDayOfWeek).map((day) =>
          renderDay(day, month.getMonth()),
        )}
      </View>
    ),
    [styles, firstDayOfWeek, renderDay],
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
        {scrollMode === "paged" && (
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
        )}
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

  const renderEndlessDays = () => (
    <>
      {renderWeekRow()}
      <FlatList
        ref={listRef}
        data={monthIndices}
        keyExtractor={(index) => String(index)}
        style={styles.endlessList}
        showsVerticalScrollIndicator={false}
        initialScrollIndex={initialIndex}
        // Every month renders the same 6-row grid, so the layout is known
        // up front and the list can jump straight to any year.
        getItemLayout={(_, index) => ({
          length: MONTH_ITEM_HEIGHT,
          offset: MONTH_ITEM_HEIGHT * index,
          index,
        })}
        onScroll={handleScroll}
        scrollEventThrottle={32}
        renderItem={({ item }) => {
          const month = fromMonthIndex(item);
          return (
            <View style={styles.monthItem}>
              <Text
                style={[
                  theme.typography.titleSmall,
                  styles.monthTitle,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {`${monthNames[month.getMonth()]} ${month.getFullYear()}`}
              </Text>
              {renderMonthGrid(month)}
            </View>
          );
        }}
      />
    </>
  );

  const renderPagedDays = () => (
    <>
      {renderWeekRow()}
      {renderMonthGrid(visibleMonth)}
    </>
  );

  const renderMonths = () => (
    <View style={styles.pickerGrid}>
      {shortMonthNames.map((name, monthOfYear) => {
        const active = monthOfYear === visibleMonth.getMonth();
        const disabled = isMonthOutOfRange(
          new Date(visibleMonth.getFullYear(), monthOfYear, 1),
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
              goToMonth(new Date(visibleMonth.getFullYear(), monthOfYear, 1));
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
          const disabled = isYearOutOfRange(year, minimumDate, maximumDate);
          return (
            <Pressable
              key={year}
              accessibilityRole="button"
              accessibilityState={{ selected: active, disabled }}
              disabled={disabled}
              onPress={() => {
                goToMonth(new Date(year, visibleMonth.getMonth(), 1));
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
      {view === "days" &&
        (scrollMode === "endless" ? renderEndlessDays() : renderPagedDays())}
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
              if (scrollMode === "endless") {
                scrollToMonth(
                  new Date(today.getFullYear(), today.getMonth(), 1),
                  false,
                );
              }
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
const isMonthOutOfRange = (month: Date, minimum?: Date, maximum?: Date) => {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  return (
    (!!minimum && last.getTime() < startOfDay(minimum).getTime()) ||
    (!!maximum && first.getTime() > startOfDay(maximum).getTime())
  );
};

/** True when no day of `year` is selectable. */
const isYearOutOfRange = (year: number, minimum?: Date, maximum?: Date) =>
  (!!minimum &&
    new Date(year, 11, 31).getTime() < startOfDay(minimum).getTime()) ||
  (!!maximum && new Date(year, 0, 1).getTime() > startOfDay(maximum).getTime());

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
    endlessList: { height: ENDLESS_VIEWPORT_HEIGHT },
    monthItem: { height: MONTH_ITEM_HEIGHT },
    monthTitle: {
      height: MONTH_TITLE_HEIGHT,
      lineHeight: MONTH_TITLE_HEIGHT,
      paddingHorizontal: theme.spacing.xs,
    },
    grid: { flexDirection: "row", flexWrap: "wrap" },
    cellWrapper: {
      width: CELL,
      height: CELL,
      alignItems: "center",
      justifyContent: "center",
    },
    bandStart: {
      borderTopLeftRadius: CELL / 2,
      borderBottomLeftRadius: CELL / 2,
    },
    bandEnd: {
      borderTopRightRadius: CELL / 2,
      borderBottomRightRadius: CELL / 2,
    },
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
