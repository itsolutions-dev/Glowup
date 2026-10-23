import React, { useMemo, useState } from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { Theme, useTheme } from "../providers/ThemeProvider";
import Typography from "./Typography";
import Button from "./Button";
import Divider from "./Divider";
import Input from "./Input";
import Calendar from "./Calendar";
import ClockPicker from "./ClockPicker";
import {
  CalendarScrollMode,
  DateRange,
  DateSelectionMode,
  DateTimePickerLabels,
  DateTimePickerMode,
  EMPTY_RANGE,
  MinuteInterval,
  DateTimePickerProps,
  PickerInputType,
  ValidRange,
  clampDate,
  formatDateInput,
  formatHeadline,
  getDateInputHint,
  makeDayPredicate,
  mergeDateAndTime,
  parseDateInput,
  resolveBounds,
  startOfDay,
  useLabels,
} from "./DateTimePicker.shared";
import { usePickerParts } from "./DateTimePicker.hooks";

/** The draft the surface edits, tagged so the caller can narrow it on confirm. */
export type PickerSelection =
  | { selectionMode: "single"; value: Date | null }
  | { selectionMode: "range"; value: DateRange }
  | { selectionMode: "multiple"; value: Date[] };

/** `date` and `time` are the two steps of a `datetime` picker. */
type SurfaceStep = "date" | "time";

export interface PickerSurfaceProps {
  mode: DateTimePickerMode;
  /** The picker field's own label, reused by the typed-entry field. */
  fieldLabel?: string;
  /**
   * The selection the surface opens on. A dialog edits a draft of it until OK;
   * with `live` it is the value on screen and is never copied.
   */
  selection: PickerSelection;
  /**
   * Receives the finished selection: once, when the user confirms or taps the
   * day that settles a single date — or, with `live`, on every change.
   */
  onConfirm: (selection: PickerSelection) => void;
  /** Asks the host to close the surface (Escape inside the calendar). */
  onRequestClose?: () => void;
  /**
   * Draws the surface inline in the page: no headline and no OK, typed entry is
   * off, and each change goes to `onConfirm` at once.
   */
  live?: boolean;
  /** Greys the surface out and ignores touches. */
  disabled?: boolean;
  validRange?: ValidRange;
  isDateDisabled?: (date: Date) => boolean;
  locale: string;
  firstDayOfWeek?: number;
  labels?: DateTimePickerLabels;
  minuteInterval?: MinuteInterval;
  use24HourClock?: boolean;
  scrollMode?: CalendarScrollMode;
  startYear?: number;
  endYear?: number;
  /** Offers the calendar's "Today" button (single dates only). Default `true`. */
  showToday?: boolean;
  /**
   * Draws OK where one is needed. Default `true`. `false` finishes a time
   * after its minute and a range after its second end instead; a set of days
   * and typed entry keep their OK.
   */
  showOkButton?: boolean;
  defaultInputType?: PickerInputType;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * The Material 3 picker body: headline, calendar or clock, and an OK where a
 * tap does not finish the selection. Shared by the native modal, the web
 * popover and the inline `static` picker so the three never drift.
 */
const PickerSurface = ({
  mode,
  fieldLabel,
  selection,
  onConfirm,
  onRequestClose,
  live = false,
  disabled = false,
  validRange,
  isDateDisabled,
  locale,
  firstDayOfWeek,
  labels: labelOverrides,
  minuteInterval,
  use24HourClock,
  scrollMode = "endless",
  startYear,
  endYear,
  showToday = true,
  showOkButton = true,
  defaultInputType = "picker",
  style,
  testID,
}: PickerSurfaceProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const labels = useLabels(labelOverrides);

  const selectionMode: DateSelectionMode =
    mode === "time" ? "single" : selection.selectionMode;
  const { minimumDate, maximumDate } = useMemo(
    () => resolveBounds(validRange),
    [validRange],
  );
  const isDayDisabled = useMemo(
    () => makeDayPredicate(validRange, isDateDisabled),
    [validRange, isDateDisabled],
  );

  /** An in-range instant to fall back on when the field is still empty. */
  const fallback = useMemo(
    () => clampDate(new Date(), minimumDate, maximumDate),
    [minimumDate, maximumDate],
  );

  const [draftDate, setDraftDate] = useState<Date>(() =>
    selection.selectionMode === "single" && selection.value
      ? new Date(selection.value)
      : fallback,
  );
  const [draftRange, setDraftRange] = useState<DateRange>(() =>
    selection.selectionMode === "range" ? selection.value : EMPTY_RANGE,
  );
  const [draftDates, setDraftDates] = useState<Date[]>(() =>
    selection.selectionMode === "multiple" ? selection.value : [],
  );
  const [step, setStep] = useState<SurfaceStep>(
    mode === "time" ? "time" : "date",
  );

  // An inline picker is the caller's value, not a draft of it.
  const date =
    live && selection.selectionMode === "single" && selection.value
      ? selection.value
      : draftDate;
  const dateRange =
    live && selection.selectionMode === "range" ? selection.value : draftRange;
  const dates =
    live && selection.selectionMode === "multiple"
      ? selection.value
      : draftDates;

  // Typed entry needs an OK to confirm it, which an inline picker does not have,
  // and an unordered set of days has no text form.
  const inputType: PickerInputType =
    live || selectionMode === "multiple" ? "picker" : defaultInputType;
  // Without an OK the surface settles by itself when its last pick is made:
  // the minute, or a range's second end. A set of days has no last pick, and
  // typed text needs its OK.
  const selfFinishing =
    !live &&
    !showOkButton &&
    inputType === "picker" &&
    selectionMode !== "multiple";
  // Only a single date has a time to go with it; a range or a set stays on the
  // calendar.
  const twoSteps = mode === "datetime" && selectionMode === "single";

  // --- Typed entry ----------------------------------------------------------
  // The text fields are only mounted in keyboard mode, so their drafts live
  // beside the date drafts rather than replacing them.
  const hint = getDateInputHint(locale);
  const [singleText, setSingleText] = useState(() =>
    selection.selectionMode === "single" && selection.value
      ? formatDateInput(selection.value, locale)
      : "",
  );
  const [startText, setStartText] = useState(() =>
    selection.selectionMode === "range" && selection.value.startDate
      ? formatDateInput(selection.value.startDate, locale)
      : "",
  );
  const [endText, setEndText] = useState(() =>
    selection.selectionMode === "range" && selection.value.endDate
      ? formatDateInput(selection.value.endDate, locale)
      : "",
  );

  /** `undefined` = valid, a string = the message to show under the field. */
  const validateText = (text: string): string | undefined => {
    if (!text.trim()) return undefined;
    const parsed = parseDateInput(text, locale);
    if (!parsed) return labels.invalidDate;
    if (isDayDisabled(parsed)) return labels.dateOutOfRange;
    return undefined;
  };

  const singleError = validateText(singleText);
  const startError = validateText(startText);
  const endError = validateText(endText);
  const parsedSingle = parseDateInput(singleText, locale);
  const parsedStart = parseDateInput(startText, locale);
  const parsedEnd = parseDateInput(endText, locale);
  const rangeOrderError =
    parsedStart && parsedEnd && parsedEnd.getTime() < parsedStart.getTime()
      ? labels.invalidDateRange
      : undefined;

  const typedEntryValid =
    inputType !== "keyboard" ||
    selectionMode === "multiple" ||
    (selectionMode === "range"
      ? !startError && !endError && !rangeOrderError
      : !singleError);

  // --- Confirmation ---------------------------------------------------------

  const canConfirm = useMemo(() => {
    if (!typedEntryValid) return false;
    if (mode === "time") return true;
    if (selectionMode === "range") {
      return inputType === "keyboard"
        ? !!parsedStart && !!parsedEnd
        : !!draftRange.startDate && !!draftRange.endDate;
    }
    if (selectionMode === "multiple") return draftDates.length > 0;
    return inputType === "keyboard" ? !!parsedSingle : true;
  }, [
    typedEntryValid,
    mode,
    selectionMode,
    inputType,
    parsedStart,
    parsedEnd,
    parsedSingle,
    draftRange,
    draftDates,
  ]);

  const confirm = () => {
    if (selectionMode === "range") {
      const next =
        inputType === "keyboard"
          ? { startDate: parsedStart, endDate: parsedEnd }
          : draftRange;
      onConfirm({ selectionMode: "range", value: next });
      return;
    }
    if (selectionMode === "multiple") {
      onConfirm({ selectionMode: "multiple", value: draftDates });
      return;
    }
    const day =
      inputType === "keyboard" && parsedSingle ? parsedSingle : draftDate;
    // The calendar owns the day and the clock owns the time; a datetime picker
    // confirms the two halves merged back together.
    const value =
      mode === "date"
        ? startOfDay(day)
        : mode === "time"
          ? draftDate
          : mergeDateAndTime(day, draftDate);
    onConfirm({ selectionMode: "single", value });
  };

  // --- Edits ----------------------------------------------------------------
  // Each one updates the draft; an inline picker also reports it straight away.

  const reportSingle = (value: Date) =>
    onConfirm({ selectionMode: "single", value });

  /** A tap on a day of a single-date calendar. */
  const handleDay = (day: Date) => {
    if (mode === "date") {
      // The day is the whole answer, so the tap settles it: a dialog closes on
      // it and an inline picker reports it like any other change.
      setDraftDate(day);
      reportSingle(day);
      return;
    }
    // The tap hands over to the clock, keeping the time already chosen.
    const next = mergeDateAndTime(day, date);
    setDraftDate(next);
    if (live) reportSingle(next);
    setStep("time");
  };

  const handleTime = (next: Date) => {
    setDraftDate(next);
    if (live) reportSingle(next);
  };

  const handleRange = (next: DateRange) => {
    setDraftRange(next);
    if (live || (selfFinishing && next.startDate && next.endDate)) {
      onConfirm({ selectionMode: "range", value: next });
    }
  };

  const handleDates = (next: Date[]) => {
    setDraftDates(next);
    if (live) onConfirm({ selectionMode: "multiple", value: next });
  };

  // --- Chrome ---------------------------------------------------------------

  const supportingText =
    step === "time"
      ? labels.selectTime
      : selectionMode === "range"
        ? labels.selectDateRange
        : selectionMode === "multiple"
          ? labels.selectDates
          : labels.selectDate;

  const headline = useMemo(() => {
    if (step === "time" || mode === "time") {
      return formatHeadline(date, "time", locale);
    }
    if (selectionMode === "range") {
      const start = dateRange.startDate
        ? formatHeadline(dateRange.startDate, "date", locale)
        : labels.startDate;
      const end = dateRange.endDate
        ? formatHeadline(dateRange.endDate, "date", locale)
        : labels.endDate;
      return `${start} – ${end}`;
    }
    if (selectionMode === "multiple") {
      return labels.selectedCount.replace("{{count}}", String(dates.length));
    }
    return formatHeadline(date, "date", locale);
  }, [step, mode, selectionMode, date, dateRange, dates, locale, labels]);

  // The calendar step is where a datetime picker is entered, so the way back to
  // it is the date itself, shown as a button on the clock step.
  const backToDate = twoSteps && step === "time" && (
    <Button
      variant="text"
      density="dense"
      iconName="chevron-left"
      accessibilityHint={labels.back}
      onClick={() => setStep("date")}
    >
      {formatHeadline(date, "date", locale)}
    </Button>
  );

  // A day tap settles a single date and every change of an inline picker is
  // already reported, so OK is only for what a tap leaves open: a time, a range,
  // a set, typed text, and a datetime's clock step.
  const showConfirm =
    !live &&
    !selfFinishing &&
    (inputType === "keyboard" ||
      mode === "time" ||
      selectionMode !== "single" ||
      step === "time");

  // The first step of a datetime picker only reaches OK through typed text, where
  // there is no day tap to hand over to the clock.
  const isFirstOfTwoSteps = twoSteps && step === "date";

  const renderKeyboardEntry = () => {
    if (selectionMode === "range") {
      return (
        <View style={styles.textEntry}>
          <Input
            label={labels.startDate}
            placeholder={hint}
            helperText={hint}
            value={startText}
            onChange={setStartText}
            error={startError}
          />
          <Input
            label={labels.endDate}
            placeholder={hint}
            helperText={hint}
            value={endText}
            onChange={setEndText}
            error={endError ?? rangeOrderError}
          />
        </View>
      );
    }
    return (
      <View style={styles.textEntry}>
        <Input
          // Falls back to the headline's supporting text only when the picker
          // has no label of its own, so the dialog never says it twice.
          label={fieldLabel ?? supportingText}
          placeholder={hint}
          helperText={hint}
          value={singleText}
          onChange={setSingleText}
          error={singleError}
        />
      </View>
    );
  };

  const renderBody = () => {
    if (step === "time") {
      return (
        <ClockPicker
          value={date}
          onChange={handleTime}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          minuteInterval={minuteInterval}
          locale={locale}
          use24HourClock={use24HourClock}
          inputType={inputType}
          onComplete={selfFinishing ? confirm : undefined}
          labels={labelOverrides}
          testID={testID ? `${testID}-clock` : undefined}
        />
      );
    }
    if (inputType === "keyboard") return renderKeyboardEntry();
    return (
      <Calendar
        selectionMode={selectionMode}
        value={date}
        range={dateRange}
        dates={dates}
        onChange={handleDay}
        onRangeChange={handleRange}
        onDatesChange={handleDates}
        validRange={validRange}
        isDateDisabled={isDateDisabled}
        locale={locale}
        firstDayOfWeek={firstDayOfWeek}
        labels={labelOverrides}
        scrollMode={scrollMode}
        startYear={startYear}
        endYear={endYear}
        showToday={showToday && selectionMode === "single"}
        onRequestClose={onRequestClose}
        // Grabbing the keyboard is right for a popup that just opened, wrong for
        // a calendar that is part of a page.
        autoFocus={!live}
        testID={testID ? `${testID}-calendar` : undefined}
      />
    );
  };

  if (live) {
    return (
      <View
        pointerEvents={disabled ? "none" : "auto"}
        style={[disabled && styles.faded, style]}
        testID={testID}
      >
        {!!backToDate && <View style={styles.backRow}>{backToDate}</View>}
        {renderBody()}
      </View>
    );
  }

  return (
    <View
      pointerEvents={disabled ? "none" : "auto"}
      style={[styles.surface, disabled && styles.faded, style]}
      testID={testID}
    >
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Typography variant="labelMedium" style={styles.supporting}>
            {supportingText}
          </Typography>
          <Typography variant="headlineSmall" style={styles.headline}>
            {headline}
          </Typography>
        </View>
        {backToDate}
      </View>

      <Divider />

      <View style={styles.body}>{renderBody()}</View>

      {showConfirm && (
        <View style={styles.footer}>
          <Button
            variant="text"
            disabled={!canConfirm}
            onClick={isFirstOfTwoSteps ? () => setStep("time") : confirm}
          >
            {labels.confirm}
          </Button>
        </View>
      )}
    </View>
  );
};

/**
 * The `static` variant: the surface alone, in the page, wired to the same
 * controller as the popup so the props mean the same thing in both.
 */
export const StaticPicker = (props: DateTimePickerProps) => {
  const { surfaceProps } = usePickerParts(props);
  return <PickerSurface {...surfaceProps} />;
};

export default PickerSurface;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    surface: { paddingTop: theme.spacing.m },
    header: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: theme.spacing.s,
      paddingHorizontal: theme.spacing.m,
      paddingBottom: theme.spacing.m,
    },
    headerText: { flex: 1, gap: theme.spacing.xs },
    supporting: { color: theme.colors.onSurfaceVariant },
    headline: { color: theme.colors.onSurface },
    body: {
      paddingHorizontal: theme.spacing.s,
      paddingVertical: theme.spacing.m,
      alignItems: "center",
    },
    textEntry: {
      width: "100%",
      paddingHorizontal: theme.spacing.s,
    },
    backRow: { alignItems: "flex-start" },
    footer: {
      flexDirection: "row",
      justifyContent: "flex-end",
      paddingHorizontal: theme.spacing.m,
      paddingBottom: theme.spacing.m,
    },
    faded: { opacity: 0.38 },
  });
