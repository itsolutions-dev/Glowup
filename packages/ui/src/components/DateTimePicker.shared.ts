import { useMemo } from "react";
import { Platform, StyleProp, ViewStyle } from "react-native";
import * as Localization from "expo-localization";
import { isToday, isYesterday, isTomorrow } from "date-fns";

export type DateTimePickerMode = "date" | "datetime" | "time";

/**
 * How the picker surface is rendered.
 * - `auto` — the OS picker on iOS/Android, the in-house popover on web.
 * - `native` — force the OS picker (ignored on web, which has none).
 * - `inline` — force the in-house Calendar/TimeSelect surface everywhere.
 *
 * `auto` falls back to `inline` on native as soon as a feature the OS picker
 * cannot express is requested (currently `isDateDisabled`).
 */
export type DateTimePickerVariant = "auto" | "native" | "inline";

/**
 * Minute granularities the OS pickers accept. Restricted to this set so the
 * `native` variant and the in-house `TimeSelect` stay interchangeable.
 */
export type MinuteInterval = 1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30;

export interface DateTimePickerRelativeLabels {
  today?: string;
  yesterday?: string;
  tomorrow?: string;
}

/** Chrome strings for the picker surface. Defaults are English — pass i18n values. */
export interface DateTimePickerLabels {
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
}

export const DEFAULT_LABELS: Required<DateTimePickerLabels> = {
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
};

export interface DateTimePickerProps {
  label?: string;
  /** `null` renders `placeholder` instead of a formatted value. */
  value: Date | null;
  onChange: (date: Date) => void;
  disabled?: boolean;
  mode?: DateTimePickerMode;
  variant?: DateTimePickerVariant;
  /**
   * Overrides the relative day labels, e.g. from i18n:
   * `relativeLabels={{ today: t("TODAY"), yesterday: t("YESTERDAY"), tomorrow: t("TOMORROW") }}`.
   * Defaults to the device locale via Intl.RelativeTimeFormat.
   */
  relativeLabels?: DateTimePickerRelativeLabels;
  /** Chrome strings of the picker surface (nav buttons, "Today", "Clear", …). */
  labels?: DateTimePickerLabels;
  /** Earliest selectable instant. Days before it are disabled, not hidden. */
  minimumDate?: Date;
  /** Latest selectable instant. */
  maximumDate?: Date;
  /** Disables individual days (weekends, holidays, …). Forces `inline` on native. */
  isDateDisabled?: (date: Date) => boolean;
  /** Error text below the field; also recolors the field. */
  error?: string;
  /** Supporting text below the field; hidden while an error is shown. */
  helperText?: string;
  /** Appends an asterisk to the label. */
  required?: boolean;
  /** Adds a clear affordance to the field. Needs `onClear` to do anything. */
  clearable?: boolean;
  onClear?: () => void;
  /** Shown while `value` is `null`. */
  placeholder?: string;
  /** Minute granularity of the time columns. Defaults to 1. */
  minuteInterval?: MinuteInterval;
  /** Overrides the formatting/labelling locale. Defaults to the device locale. */
  locale?: string;
  /** 0 = Sunday … 6 = Saturday. Defaults to the locale's own week start. */
  firstDayOfWeek?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /** Mount with the picker already open. Uncontrolled after that. */
  defaultOpen?: boolean;
}

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

export const useDateTimeDisplay = (
  value: Date | null,
  mode: DateTimePickerMode,
  locale: string,
  labels?: DateTimePickerRelativeLabels,
) => {
  const { today, yesterday, tomorrow } = labels ?? {};
  return useMemo(() => {
    if (!value) return "";
    const day = mode === "time" ? null : getRelativeDay(value);
    const relative = day
      ? formatRelativeDay(day, locale, { today, yesterday, tomorrow })
      : null;
    const options: Intl.DateTimeFormatOptions = {
      dateStyle: mode === "time" ? undefined : "medium",
      timeStyle: mode === "date" ? undefined : "short",
    };
    const formatted = new Intl.DateTimeFormat(locale, options).format(value);
    return relative ? `${relative}, ${formatted}` : formatted;
  }, [value, mode, locale, today, yesterday, tomorrow]);
};

/** Merges caller labels over the English defaults. */
export const useLabels = (labels?: DateTimePickerLabels) =>
  useMemo(() => ({ ...DEFAULT_LABELS, ...labels }), [labels]);
