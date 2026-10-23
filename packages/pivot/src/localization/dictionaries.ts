import type { LocalizationDictionary } from "./types";
import en from "./en.json";
import it from "./it.json";

// Typed here so the package's declarations name this type, not the JSON files (tsc does not emit those).
export const localizationEn: LocalizationDictionary = en;
export const localizationIt: LocalizationDictionary = it;
