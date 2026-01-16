import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import your translation files
import en from "./locales/en.json";
import it from "./locales/it.json";

const resources = {
  en: { translation: en },
  it: { translation: it },
};

const initI18n = async () => {
  // Retrieve saved preference or use system default
  const savedLanguage = await AsyncStorage.getItem("user-language");
  const systemLocale = Localization.getLocales()[0].languageCode ?? "en";

  await i18n.use(initReactI18next).init({
    compatibilityJSON: "v3",
    resources,
    lng: savedLanguage || systemLocale,
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });
};

initI18n();
export default i18n;
