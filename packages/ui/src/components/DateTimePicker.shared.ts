import { useMemo } from "react";
import { Platform } from "react-native";
import * as Localization from "expo-localization";
import { isToday, isYesterday, isTomorrow } from "date-fns";

export type DateTimePickerMode = "date" | "datetime" | "time";

export interface DateTimePickerRelativeLabels {
  today?: string;
  yesterday?: string;
  tomorrow?: string;
}

export interface DateTimePickerProps {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  disabled?: boolean;
  mode?: DateTimePickerMode;
  /**
   * Overrides the relative day labels, e.g. from i18n:
   * `relativeLabels={{ today: t("TODAY"), yesterday: t("YESTERDAY"), tomorrow: t("TOMORROW") }}`.
   * Defaults to the device locale via Intl.RelativeTimeFormat.
   */
  relativeLabels?: DateTimePickerRelativeLabels;
  /** Mount with the picker already open. Uncontrolled after that. */
  defaultOpen?: boolean;
}

export const getDeviceLocale = () => {
  if (Platform.OS === "web") {
    return navigator.language || "it-IT";
  }
  return Localization.getLocales()[0]?.languageTag || "it-IT";
};

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
  value: Date,
  mode: DateTimePickerMode,
  locale: string,
  labels?: DateTimePickerRelativeLabels,
) => {
  const { today, yesterday, tomorrow } = labels ?? {};
  return useMemo(() => {
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
