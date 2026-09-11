import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

import en from "./locales/en.json";
import it from "./locales/it.json";

const STORAGE_KEY = "user-language";

const resources = {
  en: { translation: en },
  it: { translation: it },
};

/**
 * The device locale, or "en" when there is no device — the static web export
 * renders every route in Node, where expo-localization has nothing to read.
 */
const systemLanguage = (): string => {
  try {
    return Localization.getLocales()[0]?.languageCode ?? "en";
  } catch {
    return "en";
  }
};

// Initialised synchronously so the first render already has a language: the
// previous setup awaited AsyncStorage before calling init(), which left the
// first frame untranslated and — during static rendering, where AsyncStorage
// reaches for window.localStorage — threw outright.
i18n.use(initReactI18next).init({
  resources,
  lng: systemLanguage(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

/**
 * The stored preference, applied once it arrives. Skipped on the server, which
 * has no storage and no user to have a preference.
 */
if (typeof window !== "undefined") {
  AsyncStorage.getItem(STORAGE_KEY)
    .then((saved) => {
      if (saved && saved !== i18n.language) i18n.changeLanguage(saved);
    })
    .catch(() => {});
}

export const setLanguage = async (language: string) => {
  await i18n.changeLanguage(language);
  AsyncStorage.setItem(STORAGE_KEY, language).catch(() => {});
};

export default i18n;
