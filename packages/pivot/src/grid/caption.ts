import type { LocalizationDictionary } from "../localization/types";

/** A caption from a section of the dictionary, or the English fallback when it is missing. */
export const caption = (
  localization: LocalizationDictionary | undefined,
  section: string,
  key: string,
  fallback: string,
) => {
  const value = (
    localization?.[section] as Record<string, unknown> | undefined
  )?.[key];
  return typeof value === "string" && value ? value : fallback;
};
