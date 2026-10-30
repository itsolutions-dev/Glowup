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
import { rgba } from "polished";
import Icons from "./Glyph";
import Button from "./Button";
import { Theme, useTheme } from "../providers/ThemeProvider";
import { PressableState } from "./types";
import { swallowEscapeKeyUp } from "./internal/useEscapeKey";
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

/**
 * Internal: the month grid of `DatePicker` and `DateTimePicker`, which render it
 * in their popup or, with `variant="static"`, inline. Not exported from the
 * package.
 */

/** Which grid the calendar is currently showing. */
type CalendarView = "days" | "years";

const YEARS_PER_PAGE = 12;
/** How far the endless scroller reaches when no year bounds are given. */
const DEFAULT_YEAR_SPAN = 100;

const CELL = 40;
const WEEK_ROWS = 6;
/** Constant so `getItemLayout` can place months without measuring them. */
const MONTH_ITEM_HEIGHT = WEEK_ROWS * CELL;
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
  /** Renders the "Today" button next to the month arrows. Default `true`. */
  showToday?: boolean;
  /**
   * Arrow-key/PageUp/Home/Enter navigation. Web only — there is no key event
   * source on native. Default `true`.
   */
  keyboardNavigation?: boolean;
  /** Called on Escape while keyboard navigation is active. */
  onRequestClose?: () => void;
  /**
   * Moves keyboard focus into the calendar when it mounts, so the arrow keys
   * work at once. Web only. The date pickers set it; leave it off for a
   * calendar that is part of a page.
   */
  autoFocus?: boolean;
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
  autoFocus = false,
  style,
  testID,
}: CalendarProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const labels = useLabels(labelOverrides);

  const locale = localeProp ?? getDeviceLocale();
  const firstDayOfWeek = firstDayOfWeekProp ?? getFirstDayOfWeek(locale);
  const weekdayNames = useMemo(
    () => rotateWeekdays(getWeekdayNames(locale), firstDayOfWeek),
    [locale, firstDayOfWeek],
  );
  const dayLabelFormat = useMemo(
    () => new Intl.DateTimeFormat(locale, { dateStyle: "full" }),
    [locale],
  );
  // "October 2026", in the locale's own order and form.
  const monthYearFormat = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }),
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
  // The day under the pointer while a range waits for its end; see `preview`.
  const [hoverDay, setHoverDay] = useState<Date | null>(null);

  const isDisabled = useMemo(
    () => makeDayPredicate(validRange, isDateDisabled),
    [validRange, isDateDisabled],
  );
  const { minimumDate, maximumDate } = useMemo(
    () => resolveBounds(validRange),
    [validRange],
  );

  /**
   * While a range has its start and waits for its end, the stretch from the start
   * to the day under the pointer, in either direction; `null` otherwise. Only
   * drawn: nothing is reported until a day is pressed.
   */
  const preview = useMemo<DateRange | null>(() => {
    const { startDate, endDate } = range;
    if (selectionMode !== "range" || !startDate || endDate) return null;
    if (!hoverDay || isDisabled(hoverDay)) return null;
    const start = startOfDay(startDate);
    return hoverDay.getTime() < start.getTime()
      ? { startDate: hoverDay, endDate: start }
      : { startDate: start, endDate: hoverDay };
  }, [selectionMode, range, hoverDay, isDisabled]);

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
  // On web this is the calendar's DOM element: keyboard handling is scoped to
  // it, so a calendar on screen never takes keys from the rest of the page.
  const rootRef = useRef<View>(null);
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

  // The month the list was last seen on. The header follows the list only when
  // it moves on from there: the arrows name the new month first and scroll to it
  // after, and the events of that scroll, still on the old month, must not take
  // the header back to it.
  const listMonth = useRef(toMonthIndex(visibleMonth));

  /**
   * Keeps the header title on the month filling the viewport. Every row is
   * `MONTH_ITEM_HEIGHT` tall, so the offset alone identifies it.
   */
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offset = event.nativeEvent.contentOffset.y;
      const index = firstMonthIndex + Math.round(offset / MONTH_ITEM_HEIGHT);
      if (index === listMonth.current) return;
      listMonth.current = index;
      setVisibleMonth(fromMonthIndex(index));
    },
    [firstMonthIndex],
  );

  useEffect(() => {
    if (Platform.OS !== "web" || !autoFocus) return;
    (rootRef.current as unknown as HTMLElement | null)?.focus();
  }, [autoFocus]);

  // Picking a month or a year unmounts the button that had focus, which drops
  // focus to the page and leaves the arrow keys with nothing to reach. Coming
  // back to the days, focus returns to the calendar.
  const previousView = useRef(view);
  useEffect(() => {
    const from = previousView.current;
    previousView.current = view;
    if (Platform.OS !== "web" || !keyboardNavigation) return;
    if (view === "days" && from !== "days") {
      (rootRef.current as unknown as HTMLElement | null)?.focus();
    }
  }, [view, keyboardNavigation]);

  useEffect(() => {
    if (Platform.OS !== "web" || !keyboardNavigation || view !== "days") return;
    const root = rootRef.current as unknown as HTMLElement | null;
    if (!root) return;

    // Listening on the calendar itself, in the capture phase, so a day cell's
    // own Enter handling cannot also fire. Moving through the days hands DOM
    // focus to the calendar root: from then on Enter selects the highlighted
    // day, not whichever cell or header button focus happened to start on.
    const handleKeyDown = (event: KeyboardEvent) => {
      const handled = () => {
        event.preventDefault();
        event.stopPropagation();
        if (document.activeElement !== root) root.focus();
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
          // A header or footer button keeps its own Enter.
          if (event.target !== root) return;
          handled();
          return select(focusedDay);
        case "Escape":
          if (onRequestClose) {
            handled();
            swallowEscapeKeyUp();
            onRequestClose();
          }
          return;
        default:
          return;
      }
    };

    root.addEventListener("keydown", handleKeyDown, true);
    return () => root.removeEventListener("keydown", handleKeyDown, true);
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
      // The interval drawn as a band: the real one, or its preview. A band of a
      // single day is no band, so it is the selected circle alone.
      const span = preview ?? range;
      const spanned =
        selectionMode === "range" &&
        !!span.startDate &&
        !!span.endDate &&
        !isSameDay(span.startDate, span.endDate);
      const inRange = spanned && isWithinRange(day, span);
      const rangeStart = spanned && isRangeStart(day, span);
      const rangeEnd = spanned && isRangeEnd(day, span);
      const banded = inRange || rangeStart || rangeEnd;

      return (
        <View
          key={day.toISOString()}
          style={[
            styles.cellWrapper,
            // The band is drawn behind the circular cell so consecutive days
            // read as one continuous interval.
            banded && {
              backgroundColor: preview
                ? rgba(theme.colors.primaryContainer, 0.5)
                : theme.colors.primaryContainer,
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
            // Only while a range is open: any other hover would re-render the
            // grid for nothing.
            onHoverIn={
              selectionMode === "range" && range.startDate && !range.endDate
                ? () => setHoverDay(day)
                : undefined
            }
            onHoverOut={() => setHoverDay(null)}
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
                !banded &&
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
                    : banded
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
      preview,
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

  const todayDisabled = isDisabled(today);

  const goToToday = () => {
    setView("days");
    select(today);
    if (scrollMode === "endless") {
      scrollToMonth(new Date(today.getFullYear(), today.getMonth(), 1), false);
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      {/* One control for month and year, in M3's label size so the longest
          English month still fits beside Today; it opens the year grid. */}
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
          numberOfLines={1}
          style={[
            theme.typography.labelLarge,
            styles.headerTitle,
            { color: theme.colors.onSurface },
          ]}
        >
          {monthYearFormat.format(visibleMonth)}
        </Text>
        <Icons
          name={view === "years" ? "menu-up" : "menu-down"}
          size={18}
          color={theme.colors.onSurfaceVariant}
        />
      </Pressable>

      <View style={styles.headerControls}>
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
            hovered && {
              backgroundColor: theme.colors.surfaceContainerHighest,
            },
            view === "days" && !canStepBack && styles.faded,
          ]}
        >
          <Icons name="chevron-left" size={22} color={theme.colors.onSurface} />
        </Pressable>

        {showToday && (
          <Button
            variant="outlined"
            onClick={goToToday}
            disabled={todayDisabled}
            style={styles.todayButton}
          >
            {labels.today}
          </Button>
        )}

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
            hovered && {
              backgroundColor: theme.colors.surfaceContainerHighest,
            },
            view === "days" && !canStepForward && styles.faded,
          ]}
        >
          <Icons
            name="chevron-right"
            size={22}
            color={theme.colors.onSurface}
          />
        </Pressable>
      </View>
    </View>
  );

  const renderEndlessDays = () => (
    <>
      {renderWeekRow()}
      <FlatList
        ref={listRef}
        testID={testID ? `${testID}-months` : undefined}
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
        renderItem={({ item }) => (
          <View style={styles.monthItem}>
            {renderMonthGrid(fromMonthIndex(item))}
          </View>
        )}
      />
    </>
  );

  const renderPagedDays = () => (
    <>
      {renderWeekRow()}
      {renderMonthGrid(visibleMonth)}
    </>
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

  return (
    <View
      ref={rootRef}
      // Focusable so a keyboard user can Tab to the calendar (web: tabIndex 0).
      focusable={keyboardNavigation}
      style={[styles.container, style]}
      testID={testID}
    >
      {renderHeader()}
      {view === "days" &&
        (scrollMode === "endless" ? renderEndlessDays() : renderPagedDays())}
      {view === "years" && renderYears()}
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
    // One row in every language: the title gives way (ellipsis) to the controls.
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: theme.spacing.xs,
      marginBottom: theme.spacing.s,
    },
    headerTitle: { flexShrink: 1 },
    headerControls: {
      flexDirection: "row",
      alignItems: "center",
      flexShrink: 0,
    },
    // Button's own margin and padding are sized for a form; here it sits between
    // two 32 px arrows, so it is trimmed to sit level with them.
    todayButton: {
      marginTop: 0,
      marginBottom: 0,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.s,
    },
    headerButton: {
      flexShrink: 1,
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
    faded: { opacity: 0.38 },
  });
