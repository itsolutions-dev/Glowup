import { useCallback, useMemo, useState } from "react";
import {
  DateSelectionMode,
  DateTimePickerProps,
  MultipleDateTimePickerProps,
  RangeDateTimePickerProps,
  SingleDateTimePickerProps,
  EMPTY_RANGE,
  clampDate,
  formatDateInput,
  formatDateTime,
  getDateInputHint,
  getDeviceLocale,
  makeDayPredicate,
  parseDateInput,
  resolveBounds,
  useLabels,
} from "./DateTimePicker.shared";
import { PickerSelection } from "./DateTimePicker.surface";

/**
 * Everything the native and the web picker need in common: locale resolution,
 * the field's display text, typed entry, and turning a confirmed draft back
 * into the caller's own `onChange` shape.
 */
export const usePickerController = (props: DateTimePickerProps) => {
  const {
    mode = "date",
    locale: localeProp,
    labels: labelOverrides,
    relativeLabels,
    validRange,
    isDateDisabled,
    inputEnabled = true,
  } = props;

  const locale = localeProp ?? getDeviceLocale();
  const labels = useLabels(labelOverrides);
  const selectionMode: DateSelectionMode =
    mode === "time" ? "single" : (props.selectionMode ?? "single");

  const { minimumDate, maximumDate } = useMemo(
    () => resolveBounds(validRange),
    [validRange],
  );
  const isDayDisabled = useMemo(
    () => makeDayPredicate(validRange, isDateDisabled),
    [validRange, isDateDisabled],
  );

  const single = props as SingleDateTimePickerProps;
  const rangeProps = props as RangeDateTimePickerProps;
  const multipleProps = props as MultipleDateTimePickerProps;

  const range = selectionMode === "range" ? rangeProps.value : EMPTY_RANGE;
  const dates = useMemo(
    () => (selectionMode === "multiple" ? multipleProps.value : []),
    [selectionMode, multipleProps.value],
  );

  /** The text the closed field shows. */
  const displayValue = useMemo(() => {
    if (selectionMode === "range") {
      const { startDate, endDate } = range;
      if (!startDate && !endDate) return "";
      const start = startDate
        ? formatDateTime(startDate, "date", locale, relativeLabels)
        : labels.startDate;
      const end = endDate
        ? formatDateTime(endDate, "date", locale, relativeLabels)
        : labels.endDate;
      return `${start} – ${end}`;
    }
    if (selectionMode === "multiple") {
      if (dates.length === 0) return "";
      // A couple of dates fit; beyond that the count is more readable.
      if (dates.length <= 2) {
        return dates
          .map((date) => formatDateTime(date, "date", locale, relativeLabels))
          .join(", ");
      }
      return labels.selectedCount.replace("{{count}}", String(dates.length));
    }
    return single.value
      ? formatDateTime(single.value, mode, locale, relativeLabels)
      : "";
  }, [
    selectionMode,
    range,
    dates,
    single.value,
    mode,
    locale,
    relativeLabels,
    labels,
  ]);

  /** The draft handed to the surface when it opens. */
  const selection = useMemo<PickerSelection>(() => {
    if (selectionMode === "range") {
      return { selectionMode: "range", value: range };
    }
    if (selectionMode === "multiple") {
      return { selectionMode: "multiple", value: dates };
    }
    return { selectionMode: "single", value: single.value };
  }, [selectionMode, range, dates, single.value]);

  const handleConfirm = useCallback(
    (confirmed: PickerSelection) => {
      if (confirmed.selectionMode === "range") {
        rangeProps.onChange(confirmed.value);
        return;
      }
      if (confirmed.selectionMode === "multiple") {
        multipleProps.onChange(confirmed.value);
        return;
      }
      if (confirmed.value) {
        single.onChange(clampDate(confirmed.value, minimumDate, maximumDate));
      }
    },
    // Reading the callbacks off the props object keeps this stable across the
    // three shapes without re-deriving the union on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.onChange, minimumDate, maximumDate],
  );

  // --- Typed entry in the closed field --------------------------------------
  // Only a single calendar date fits in one text box; a range types its two
  // ends inside the dialog, and a time has no unambiguous short form.
  const fieldEditable =
    inputEnabled && mode === "date" && selectionMode === "single";
  const inputHint = getDateInputHint(locale);
  const [inputText, setInputText] = useState<string | null>(null);

  const fieldText =
    inputText ??
    (single.value && fieldEditable
      ? formatDateInput(single.value, locale)
      : "");

  const [inputError, setInputError] = useState<string | undefined>();

  const handleInputChange = useCallback((text: string) => {
    setInputText(text);
    setInputError(undefined);
  }, []);

  /** Commits on blur so the field does not fight the user mid-keystroke. */
  const handleInputBlur = useCallback(() => {
    if (inputText === null) return;
    if (!inputText.trim()) {
      setInputText(null);
      setInputError(undefined);
      props.onClear?.();
      return;
    }
    const parsed = parseDateInput(inputText, locale);
    if (!parsed) {
      setInputError(labels.invalidDate);
      return;
    }
    if (isDayDisabled(parsed)) {
      setInputError(labels.dateOutOfRange);
      return;
    }
    setInputError(undefined);
    setInputText(null);
    single.onChange(parsed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputText, locale, isDayDisabled, labels, props.onClear, props.onChange]);

  /** Drops any half-typed text so the field re-renders the committed value. */
  const resetInput = useCallback(() => {
    setInputText(null);
    setInputError(undefined);
  }, []);

  return {
    locale,
    labels,
    selectionMode,
    displayValue,
    selection,
    handleConfirm,
    minimumDate,
    maximumDate,
    fieldEditable,
    fieldText,
    inputHint,
    inputError,
    handleInputChange,
    handleInputBlur,
    resetInput,
  };
};
