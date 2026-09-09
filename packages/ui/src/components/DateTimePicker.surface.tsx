import React, { useMemo, useState } from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { Theme, useTheme } from "../providers/ThemeProvider";
import Typography from "./Typography";
import Button from "./Button";
import IconButton from "./IconButton";
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
  /** The selection the surface opens on; edits stay local until confirm. */
  selection: PickerSelection;
  onConfirm: (selection: PickerSelection) => void;
  onCancel: () => void;
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
  /** Offers the calendar↔keyboard toggle. Default `true`. */
  inputEnabled?: boolean;
  defaultInputType?: PickerInputType;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * The Material 3 picker dialog body: headline, calendar or clock, actions.
 * Shared by the native modal and the web popover so the two never drift.
 */
const PickerSurface = ({
  mode,
  fieldLabel,
  selection,
  onConfirm,
  onCancel,
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
  inputEnabled = true,
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
  const [inputType, setInputType] = useState<PickerInputType>(defaultInputType);

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
      return formatHeadline(draftDate, "time", locale);
    }
    if (selectionMode === "range") {
      const start = draftRange.startDate
        ? formatHeadline(draftRange.startDate, "date", locale)
        : labels.startDate;
      const end = draftRange.endDate
        ? formatHeadline(draftRange.endDate, "date", locale)
        : labels.endDate;
      return `${start} – ${end}`;
    }
    if (selectionMode === "multiple") {
      return labels.selectedCount.replace(
        "{{count}}",
        String(draftDates.length),
      );
    }
    return formatHeadline(draftDate, "date", locale);
  }, [
    step,
    mode,
    selectionMode,
    draftDate,
    draftRange,
    draftDates,
    locale,
    labels,
  ]);

  // Typed entry has no counterpart for an unordered set of days.
  const showInputToggle = inputEnabled && selectionMode !== "multiple";
  const toggleIcon =
    inputType === "keyboard"
      ? step === "time"
        ? "clock-outline"
        : "calendar-blank-outline"
      : "pencil-outline";
  const toggleLabel =
    inputType === "keyboard"
      ? step === "time"
        ? labels.switchToClock
        : labels.switchToCalendar
      : labels.switchToKeyboard;

  const renderKeyboardEntry = () => {
    if (selectionMode === "range") {
      return (
        <View style={styles.textEntry}>
          <Input
            label={labels.startDate}
            placeholder={hint}
            helperText={hint}
            value={startText}
            onChangeText={setStartText}
            error={startError}
          />
          <Input
            label={labels.endDate}
            placeholder={hint}
            helperText={hint}
            value={endText}
            onChangeText={setEndText}
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
          onChangeText={setSingleText}
          error={singleError}
        />
      </View>
    );
  };

  const renderBody = () => {
    if (step === "time") {
      return (
        <ClockPicker
          value={draftDate}
          onChange={setDraftDate}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          minuteInterval={minuteInterval}
          locale={locale}
          use24HourClock={use24HourClock}
          inputType={inputType}
          labels={labelOverrides}
          testID={testID ? `${testID}-clock` : undefined}
        />
      );
    }
    if (inputType === "keyboard") return renderKeyboardEntry();
    return (
      <Calendar
        selectionMode={selectionMode}
        value={draftDate}
        range={draftRange}
        dates={draftDates}
        onChange={setDraftDate}
        onRangeChange={setDraftRange}
        onDatesChange={setDraftDates}
        validRange={validRange}
        isDateDisabled={isDateDisabled}
        locale={locale}
        firstDayOfWeek={firstDayOfWeek}
        labels={labelOverrides}
        scrollMode={scrollMode}
        startYear={startYear}
        endYear={endYear}
        showToday={selectionMode === "single"}
        onRequestClose={onCancel}
        testID={testID ? `${testID}-calendar` : undefined}
      />
    );
  };

  // A datetime picker collects the day first and the time second, so the
  // primary action advances instead of confirming on the first step.
  const isFirstOfTwoSteps = mode === "datetime" && step === "date";

  return (
    <View style={[styles.surface, style]} testID={testID}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Typography variant="labelMedium" style={styles.supporting}>
            {supportingText}
          </Typography>
          <Typography variant="headlineSmall" style={styles.headline}>
            {headline}
          </Typography>
        </View>
        {showInputToggle && (
          <IconButton
            icon={toggleIcon}
            accessibilityLabel={toggleLabel}
            onPress={() =>
              setInputType(inputType === "keyboard" ? "picker" : "keyboard")
            }
          />
        )}
      </View>

      <Divider />

      <View style={styles.body}>{renderBody()}</View>

      <View style={styles.footer}>
        {mode === "datetime" && step === "time" && (
          <Button mode="text" onPress={() => setStep("date")}>
            {labels.back}
          </Button>
        )}
        <View style={styles.footerSpacer} />
        <Button mode="text" onPress={onCancel}>
          {labels.cancel}
        </Button>
        <Button
          mode="text"
          disabled={!canConfirm}
          onPress={isFirstOfTwoSteps ? () => setStep("time") : confirm}
        >
          {isFirstOfTwoSteps ? labels.next : labels.confirm}
        </Button>
      </View>
    </View>
  );
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
    footer: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.s,
      paddingHorizontal: theme.spacing.m,
      paddingBottom: theme.spacing.m,
    },
    footerSpacer: { flex: 1 },
  });
