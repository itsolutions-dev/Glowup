import { useMemo } from "react";
import { Platform, StyleProp, ViewStyle } from "react-native";
import * as Localization from "expo-localization";
import { isToday, isYesterday, isTomorrow } from "date-fns";

/** What the picker collects: a calendar date, a time of day, or both. */
export type DateTimePickerMode = "date" | "datetime" | "time";

/**
 * How many dates the calendar collects.
 * - `single` — one date (the default).
 * - `range` — a start/end pair; the grid highlights everything in between.
 * - `multiple` — an unordered set of days.
 *
 * Ignored when `mode` is `"time"`, which always collects a single instant.
 */
export type DateSelectionMode = "single" | "range" | "multiple";

/** Which surface the open dialog shows: the calendar/clock, or text fields. */
export type PickerInputType = "picker" | "keyboard";

/** How the calendar moves between months. */
export type CalendarScrollMode = "endless" | "paged";

/**
 * Minute granularities the time picker offers. Restricted to divisors of 60 so
 * every column ends exactly on the hour.
 */
export type MinuteInterval = 1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30;

/** A start/end pair. Either end may be `null` while the user is mid-selection. */
export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

/**
 * The selectable window. `startDate`/`endDate` are inclusive bounds compared at
 * day granularity, so a `startDate` of "today 14:00" still allows today.
 */
export interface ValidRange {
  startDate?: Date | null;
  endDate?: Date | null;
  /** Individual days to exclude inside the window (holidays, blackout days). */
  disabledDates?: Date[];
}

export interface DateTimePickerRelativeLabels {
  today?: string;
  yesterday?: string;
  tomorrow?: string;
}

/** Chrome strings for the picker surface. Defaults are English — pass i18n values. */
export interface DateTimePickerLabels {
  /** Dialog headline over a single-date calendar. */
  selectDate?: string;
  /** Dialog headline over a range calendar. */
  selectDateRange?: string;
  /** Dialog headline over a multi-date calendar. */
  selectDates?: string;
  /** Dialog headline over the clock. */
  selectTime?: string;
  today?: string;
  clear?: string;
  cancel?: string;
  confirm?: string;
  previousMonth?: string;
  nextMonth?: string;
  previousYears?: string;
  nextYears?: string;
  selectMonth?: string;
  selectYear?: string;
  openPicker?: string;
  closePicker?: string;
  hours?: string;
  minutes?: string;
  am?: string;
  pm?: string;
  /** Placeholder/label of the range start field. */
  startDate?: string;
  /** Placeholder/label of the range end field. */
  endDate?: string;
  /** Toggles from calendar to typed entry. */
  switchToKeyboard?: string;
  /** Toggles from typed entry back to the calendar. */
  switchToCalendar?: string;
  /** Toggles from typed entry back to the clock. */
  switchToClock?: string;
  /** Shown under a field whose text is not a date at all. */
  invalidDate?: string;
  /** Shown under a field whose date falls outside `validRange`. */
  dateOutOfRange?: string;
  /** Shown when the range ends before it starts. */
  invalidDateRange?: string;
  /** Summary of a multi-date selection; `{{count}}` is substituted. */
  selectedCount?: string;
  /** Advances a `datetime` picker from the calendar step to the clock step. */
  next?: string;
  /** Returns a `datetime` picker from the clock step to the calendar step. */
  back?: string;
}

export const DEFAULT_LABELS: Required<DateTimePickerLabels> = {
  selectDate: "Select date",
  selectDateRange: "Select period",
  selectDates: "Select dates",
  selectTime: "Select time",
  today: "Today",
  clear: "Clear",
  cancel: "Cancel",
  confirm: "OK",
  previousMonth: "Previous month",
  nextMonth: "Next month",
  previousYears: "Previous years",
  nextYears: "Next years",
  selectMonth: "Select month",
  selectYear: "Select year",
  openPicker: "Open picker",
  closePicker: "Close picker",
  hours: "Hours",
  minutes: "Minutes",
  am: "AM",
  pm: "PM",
  startDate: "Start",
  endDate: "End",
  switchToKeyboard: "Switch to text input",
  switchToCalendar: "Switch to calendar",
  switchToClock: "Switch to clock",
  invalidDate: "Not a valid date",
  dateOutOfRange: "Date outside the allowed range",
  invalidDateRange: "The end date precedes the start date",
  selectedCount: "{{count}} selected",
  next: "Next",
  back: "Back",
};

/** Props shared by every selection mode. */
export interface DateTimePickerCommonProps {
  label?: string;
  /** Shown while the field has no value. */
  placeholder?: string;
  mode?: DateTimePickerMode;
  disabled?: boolean;
  /** Appends an asterisk to the label. */
  required?: boolean;
  /** Error text below the field; also recolors the field. */
  error?: string;
  /** Supporting text below the field; hidden while an error is shown. */
  helperText?: string;
  /** Adds a clear affordance to the field. Needs `onClear` to do anything. */
  clearable?: boolean;
  onClear?: () => void;
  /** The selectable window plus individual excluded days. */
  validRange?: ValidRange;
  /** Excludes days `validRange` cannot express (weekends, a computed holiday set). */
  isDateDisabled?: (date: Date) => boolean;
  /** Chrome strings of the picker surface (nav buttons, "Today", "Clear", …). */
  labels?: DateTimePickerLabels;
  /**
   * Overrides the relative day labels, e.g. from i18n:
   * `relativeLabels={{ today: t("TODAY"), yesterday: t("YESTERDAY") }}`.
   * Defaults to the device locale via Intl.RelativeTimeFormat.
   */
  relativeLabels?: DateTimePickerRelativeLabels;
  /** Overrides the formatting/labelling locale. Defaults to the device locale. */
  locale?: string;
  /** 0 = Sunday … 6 = Saturday. Defaults to the locale's own week start. */
  firstDayOfWeek?: number;
  /** Minute granularity of the clock. Defaults to 1. */
  minuteInterval?: MinuteInterval;
  /** Forces the 24-hour clock face. Left unset, the locale decides. */
  use24HourClock?: boolean;
  /** Lets the user type the value straight into the field. Default `true`. */
  inputEnabled?: boolean;
  /** Which surface the dialog opens on. Default `"picker"`. */
  defaultInputType?: PickerInputType;
  /** Month navigation inside the dialog. Default `"endless"`. */
  scrollMode?: CalendarScrollMode;
  /** First year offered by the year grid. Defaults to 100 years back. */
  startYear?: number;
  /** Last year offered by the year grid. Defaults to 100 years on. */
  endYear?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /** Mount with the picker already open. Uncontrolled after that. */
  defaultOpen?: boolean;
}

export interface SingleDateTimePickerProps extends DateTimePickerCommonProps {
  selectionMode?: "single";
  /** `null` renders `placeholder` instead of a formatted value. */
  value: Date | null;
  onChange: (date: Date) => void;
}

export interface RangeDateTimePickerProps extends DateTimePickerCommonProps {
  selectionMode: "range";
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export interface MultipleDateTimePickerProps extends DateTimePickerCommonProps {
  selectionMode: "multiple";
  value: Date[];
  onChange: (dates: Date[]) => void;
}

export type DateTimePickerProps =
  | SingleDateTimePickerProps
  | RangeDateTimePickerProps
  | MultipleDateTimePickerProps;

export const getDeviceLocale = () => {
  if (Platform.OS === "web") {
    return (typeof navigator !== "undefined" && navigator.language) || "en-US";
  }
  return Localization.getLocales()[0]?.languageTag || "en-US";
};

// --- Locale-derived calendar metadata ---------------------------------------
// Everything below is computed from Intl so the calendar chrome follows the
// caller's locale instead of a hardcoded language.

// 2023-01-01 was a Sunday: iterating 7 days from it yields Sunday…Saturday,
// matching the indices returned by Date#getDay().
const REFERENCE_SUNDAY = new Date(2023, 0, 1);

// CLDR regions whose week starts on Sunday. Only consulted when the runtime
// lacks Intl.Locale#getWeekInfo (older Hermes), which is why it is a short list
// of the common ones rather than the full CLDR table.
const SUNDAY_FIRST_REGIONS = new Set([
  "US",
  "CA",
  "BR",
  "MX",
  "JP",
  "KR",
  "TW",
  "HK",
  "IL",
  "PH",
  "ZA",
  "CO",
  "PE",
  "VE",
  "IN",
  "TH",
  "ID",
  "EG",
  "SA",
  "AE",
]);

const memoize = <T>(compute: (locale: string) => T) => {
  const cache = new Map<string, T>();
  return (locale: string): T => {
    const hit = cache.get(locale);
    if (hit !== undefined) return hit;
    const value = compute(locale);
    cache.set(locale, value);
    return value;
  };
};

export const getMonthNames = memoize((locale: string) => {
  const format = new Intl.DateTimeFormat(locale, { month: "long" });
  return Array.from({ length: 12 }, (_, month) =>
    format.format(new Date(2023, month, 1)),
  );
});

export const getShortMonthNames = memoize((locale: string) => {
  const format = new Intl.DateTimeFormat(locale, { month: "short" });
  return Array.from({ length: 12 }, (_, month) =>
    format.format(new Date(2023, month, 1)),
  );
});

/** Sunday-first weekday labels; rotate with `rotateWeekdays` for display. */
export const getWeekdayNames = memoize((locale: string) => {
  const format = new Intl.DateTimeFormat(locale, { weekday: "short" });
  return Array.from({ length: 7 }, (_, day) =>
    format.format(new Date(2023, 0, REFERENCE_SUNDAY.getDate() + day)),
  );
});

/** 0 = Sunday … 6 = Saturday, following Date#getDay(). */
export const getFirstDayOfWeek = memoize((locale: string) => {
  try {
    const localeInfo = new Intl.Locale(locale) as Intl.Locale & {
      getWeekInfo?: () => { firstDay: number };
      weekInfo?: { firstDay: number };
    };
    // Intl reports 1 = Monday … 7 = Sunday, so 7 has to wrap around to 0.
    const firstDay =
      localeInfo.getWeekInfo?.().firstDay ?? localeInfo.weekInfo?.firstDay;
    if (firstDay) return firstDay % 7;
  } catch {
    // Intl.Locale missing (older Hermes) — fall through to the region table.
  }
  const region = locale.split(/[-_]/)[1]?.toUpperCase();
  return region && SUNDAY_FIRST_REGIONS.has(region) ? 0 : 1;
});

/** True when the locale formats time as 1–12 with a day period. */
export const isLocale12Hour = memoize((locale: string) => {
  try {
    const resolved = new Intl.DateTimeFormat(locale, {
      hour: "numeric",
    }).resolvedOptions();
    if (typeof resolved.hour12 === "boolean") return resolved.hour12;
    if (resolved.hourCycle) {
      return resolved.hourCycle === "h11" || resolved.hourCycle === "h12";
    }
  } catch {
    // Non-conforming Intl — assume 24h, the more common default worldwide.
  }
  return false;
});

/** Day-period labels ("AM"/"PM") in the given locale. */
export const getDayPeriodNames = memoize((locale: string) => {
  const format = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    hour12: true,
  });
  const read = (hours: number) => {
    const parts = format.formatToParts(new Date(2023, 0, 1, hours));
    return parts.find((part) => part.type === "dayPeriod")?.value ?? "";
  };
  return { am: read(9) || "AM", pm: read(21) || "PM" };
});

export const rotateWeekdays = <T>(names: T[], firstDayOfWeek: number): T[] => [
  ...names.slice(firstDayOfWeek),
  ...names.slice(0, firstDayOfWeek),
];

// --- Date maths -------------------------------------------------------------

export const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const addDays = (date: Date, days: number) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

export const addMonths = (date: Date, months: number) => {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  // Clamp the day so 31 Jan + 1 month lands on 28/29 Feb, not on 2/3 Mar.
  const lastDay = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0,
  ).getDate();
  target.setDate(Math.min(date.getDate(), lastDay));
  return target;
};

export const clampDate = (date: Date, minimum?: Date, maximum?: Date) => {
  if (minimum && date.getTime() < minimum.getTime()) return new Date(minimum);
  if (maximum && date.getTime() > maximum.getTime()) return new Date(maximum);
  return date;
};

/** Whole-day comparison, so a `minimumDate` at 14:00 still allows that day. */
export const isDayOutOfRange = (day: Date, minimum?: Date, maximum?: Date) => {
  const start = startOfDay(day).getTime();
  if (minimum && start < startOfDay(minimum).getTime()) return true;
  if (maximum && start > startOfDay(maximum).getTime()) return true;
  return false;
};

/** Takes the calendar date from `day` and the time of day from `time`. */
export const mergeDateAndTime = (day: Date, time: Date) => {
  const merged = new Date(time);
  merged.setFullYear(day.getFullYear(), day.getMonth(), day.getDate());
  return merged;
};

/**
 * The 6×7 grid of the month containing `month`, padded with the trailing days
 * of the previous month and the leading days of the next one.
 */
export const buildMonthMatrix = (month: Date, firstDayOfWeek: number) => {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const offset =
    (new Date(year, monthIndex, 1).getDay() - firstDayOfWeek + 7) % 7;
  return Array.from(
    { length: 42 },
    (_, index) => new Date(year, monthIndex, 1 - offset + index),
  );
};

// --- Month indexing (endless scrolling) -------------------------------------
// The endless calendar addresses months by a single integer so a FlatList can
// treat them as a flat, fixed-height list.

/** Months elapsed since year 0 — a total order over (year, month). */
export const toMonthIndex = (date: Date) =>
  date.getFullYear() * 12 + date.getMonth();

export const fromMonthIndex = (index: number) =>
  new Date(Math.floor(index / 12), index % 12, 1);

// --- validRange -------------------------------------------------------------

export interface ResolvedBounds {
  minimumDate?: Date;
  maximumDate?: Date;
}

export const resolveBounds = (validRange?: ValidRange): ResolvedBounds => ({
  minimumDate: validRange?.startDate ?? undefined,
  maximumDate: validRange?.endDate ?? undefined,
});

/**
 * One predicate folding together the window, the excluded-day list and the
 * caller's own rule, so every surface disables exactly the same days.
 */
export const makeDayPredicate = (
  validRange?: ValidRange,
  isDateDisabled?: (date: Date) => boolean,
) => {
  const { minimumDate, maximumDate } = resolveBounds(validRange);
  const excluded = validRange?.disabledDates;
  return (day: Date) => {
    if (isDayOutOfRange(day, minimumDate, maximumDate)) return true;
    if (excluded?.some((excludedDay) => isSameDay(excludedDay, day))) {
      return true;
    }
    return !!isDateDisabled?.(day);
  };
};

// --- Range / multiple selection ---------------------------------------------

export const EMPTY_RANGE: DateRange = { startDate: null, endDate: null };

export const isRangeStart = (day: Date, range: DateRange) =>
  !!range.startDate && isSameDay(day, range.startDate);

export const isRangeEnd = (day: Date, range: DateRange) =>
  !!range.endDate && isSameDay(day, range.endDate);

/** Strictly between the two ends — the ends themselves render as endpoints. */
export const isWithinRange = (day: Date, range: DateRange) => {
  if (!range.startDate || !range.endDate) return false;
  const time = startOfDay(day).getTime();
  return (
    time > startOfDay(range.startDate).getTime() &&
    time < startOfDay(range.endDate).getTime()
  );
};

/**
 * Applies a tap to a range: the first tap opens a new range, the second closes
 * it, and a second tap before the start re-opens from there rather than
 * producing an inverted range.
 */
export const applyRangeSelection = (range: DateRange, day: Date): DateRange => {
  const picked = startOfDay(day);
  const { startDate, endDate } = range;
  if (!startDate || endDate) return { startDate: picked, endDate: null };
  if (picked.getTime() < startOfDay(startDate).getTime()) {
    return { startDate: picked, endDate: null };
  }
  return { startDate, endDate: picked };
};

/** Adds the day, or removes it when it is already selected. */
export const toggleMultipleSelection = (dates: Date[], day: Date) => {
  const picked = startOfDay(day);
  const without = dates.filter((date) => !isSameDay(date, picked));
  if (without.length !== dates.length) return without;
  return [...without, picked].sort((a, b) => a.getTime() - b.getTime());
};

// --- Typed date entry -------------------------------------------------------
// The field order and separator are read out of Intl rather than hardcoded, so
// the same input accepts 22/11/2023 in it-IT and 11/22/2023 in en-US.

type DateField = "day" | "month" | "year";

const DATE_PARTS_SAMPLE = new Date(2023, 10, 22);

const getDateParts = memoize((locale: string) =>
  new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(DATE_PARTS_SAMPLE),
);

/** The order the locale writes day, month and year in. */
export const getDateFieldOrder = memoize((locale: string) => {
  const order = getDateParts(locale)
    .filter((part): part is Intl.DateTimeFormatPart & { type: DateField } =>
      ["day", "month", "year"].includes(part.type),
    )
    .map((part) => part.type);
  // A calendar the Gregorian parts don't cover (e.g. a non-numeric skeleton)
  // still needs three fields to parse against.
  return order.length === 3 ? order : (["day", "month", "year"] as DateField[]);
});

/** The literal the locale puts between the fields, e.g. "/" or ".". */
export const getDateFieldSeparator = memoize((locale: string) => {
  const literal = getDateParts(locale).find(
    (part) => part.type === "literal" && part.value.trim().length > 0,
  );
  return literal?.value.trim() ?? "/";
});

const FIELD_HINTS: Record<DateField, string> = {
  day: "DD",
  month: "MM",
  year: "YYYY",
};

/** A typing hint in the locale's own order, e.g. "DD/MM/YYYY". */
export const getDateInputHint = memoize((locale: string) =>
  getDateFieldOrder(locale)
    .map((field) => FIELD_HINTS[field])
    .join(getDateFieldSeparator(locale)),
);

const pad2 = (value: number) => String(value).padStart(2, "0");

/** Renders a date in the same shape `parseDateInput` accepts. */
export const formatDateInput = (date: Date, locale: string) => {
  const separator = getDateFieldSeparator(locale);
  return getDateFieldOrder(locale)
    .map((field) => {
      if (field === "year") return String(date.getFullYear());
      if (field === "month") return pad2(date.getMonth() + 1);
      return pad2(date.getDate());
    })
    .join(separator);
};

/**
 * Parses typed text against the locale's field order. Returns `null` for
 * anything that is not a real calendar date, so 31/02 is rejected rather than
 * silently rolled over to 03/03.
 */
export const parseDateInput = (text: string, locale: string): Date | null => {
  const groups = text.split(/\D+/).filter(Boolean);
  if (groups.length !== 3) return null;

  const order = getDateFieldOrder(locale);
  const values: Partial<Record<DateField, number>> = {};
  order.forEach((field, index) => {
    values[field] = Number(groups[index]);
  });

  const { day, month, year } = values;
  if (day === undefined || month === undefined || year === undefined) {
    return null;
  }
  if (!Number.isFinite(day + month + year)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  // A 2-digit year is read as this century; anything shorter is still being typed.
  const fullYear =
    String(groups[order.indexOf("year")]).length <= 2 ? 2000 + year : year;

  const parsed = new Date(fullYear, month - 1, day);
  // setDate rolls invalid days over, so a round-trip check catches 31/02.
  const roundTrips =
    parsed.getFullYear() === fullYear &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day;
  return roundTrips ? parsed : null;
};

// --- Display formatting -----------------------------------------------------

type RelativeDay = keyof DateTimePickerRelativeLabels;

const DAY_OFFSETS: Record<RelativeDay, number> = {
  yesterday: -1,
  today: 0,
  tomorrow: 1,
};

// Used when the runtime lacks Intl.RelativeTimeFormat and no override is given
const FALLBACK_LABELS: Record<RelativeDay, string> = {
  yesterday: "Yesterday",
  today: "Today",
  tomorrow: "Tomorrow",
};

const getRelativeDay = (date: Date): RelativeDay | null => {
  if (isToday(date)) return "today";
  if (isYesterday(date)) return "yesterday";
  if (isTomorrow(date)) return "tomorrow";
  return null;
};

const formatRelativeDay = (
  day: RelativeDay,
  locale: string,
  labels?: DateTimePickerRelativeLabels,
) => {
  const override = labels?.[day];
  if (override) return override;
  if (typeof Intl.RelativeTimeFormat === "function") {
    const formatted = new Intl.RelativeTimeFormat(locale, {
      numeric: "auto",
    }).format(DAY_OFFSETS[day], "day");
    return formatted.charAt(0).toLocaleUpperCase(locale) + formatted.slice(1);
  }
  return FALLBACK_LABELS[day];
};

/** Formats one instant for the field, with a relative prefix when it earns one. */
export const formatDateTime = (
  value: Date,
  mode: DateTimePickerMode,
  locale: string,
  labels?: DateTimePickerRelativeLabels,
) => {
  const day = mode === "time" ? null : getRelativeDay(value);
  const relative = day ? formatRelativeDay(day, locale, labels) : null;
  const options: Intl.DateTimeFormatOptions = {
    dateStyle: mode === "time" ? undefined : "medium",
    timeStyle: mode === "date" ? undefined : "short",
  };
  const formatted = new Intl.DateTimeFormat(locale, options).format(value);
  return relative ? `${relative}, ${formatted}` : formatted;
};

/** The short form used inside the dialog headline, where space is tight. */
export const formatHeadline = (
  value: Date,
  mode: DateTimePickerMode,
  locale: string,
) =>
  new Intl.DateTimeFormat(locale, {
    weekday: mode === "time" ? undefined : "short",
    day: mode === "time" ? undefined : "numeric",
    month: mode === "time" ? undefined : "short",
    hour: mode === "date" ? undefined : "numeric",
    minute: mode === "date" ? undefined : "2-digit",
  }).format(value);

export const useDateTimeDisplay = (
  value: Date | null,
  mode: DateTimePickerMode,
  locale: string,
  labels?: DateTimePickerRelativeLabels,
) => {
  const { today, yesterday, tomorrow } = labels ?? {};
  return useMemo(() => {
    if (!value) return "";
    return formatDateTime(value, mode, locale, { today, yesterday, tomorrow });
  }, [value, mode, locale, today, yesterday, tomorrow]);
};

/** Merges caller labels over the English defaults. */
export const useLabels = (labels?: DateTimePickerLabels) =>
  useMemo(() => ({ ...DEFAULT_LABELS, ...labels }), [labels]);

/**
 * `Omit` applied to each member of a union instead of to the collapsed union,
 * so the picker wrappers can lock `mode` without losing the discriminant.
 */
export type DistributiveOmit<T, K extends keyof never> = T extends unknown
  ? Omit<T, K>
  : never;
