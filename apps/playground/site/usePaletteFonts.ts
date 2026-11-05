import { useEffect } from "react";
import { Platform } from "react-native";
import { loadAsync, useFonts } from "expo-font";
import { Geist_400Regular } from "@expo-google-fonts/geist/400Regular";
import { Geist_500Medium } from "@expo-google-fonts/geist/500Medium";
import { Geist_600SemiBold } from "@expo-google-fonts/geist/600SemiBold";
import { Roboto_400Regular } from "@expo-google-fonts/roboto/400Regular";
import { Roboto_500Medium } from "@expo-google-fonts/roboto/500Medium";
import { Roboto_700Bold } from "@expo-google-fonts/roboto/700Bold";
import { useTheme } from "@its/glowup-ui";

/**
 * The font files each brand palette names in its `typography`. The library
 * only names a font; loading it is the app's job, under exactly that name.
 */
const FONTS: Record<string, Record<string, number>> = {
  databeasy: { Roboto_400Regular, Roboto_500Medium, Roboto_700Bold },
  inxpire: { Geist_400Regular, Geist_500Medium, Geist_600SemiBold },
};

/**
 * Loads a palette's fonts when it is first picked, so a reader who never opens
 * Databeasy or inXpire never downloads Roboto or Geist. Until the files arrive the
 * text renders in the system font, then swaps; `loadAsync` is idempotent.
 */
const ALL_FONTS = Object.assign({}, ...Object.values(FONTS));

/**
 * iOS and Android only: whether every palette's font is registered. Until it
 * is, the app renders nothing. Android measures a label once, with the
 * stand-in font if its own has not arrived, and keeps that width when the
 * real font swaps in: medium-weight labels came out cut ("Sav", "Dai…").
 * The files ship with the app, so this is a moment, not a download. The web
 * keeps loading lazily: a browser measures the text again when a font arrives.
 */
export const useNativeFontsReady = () =>
  useFonts(Platform.OS === "web" ? {} : ALL_FONTS)[0] || Platform.OS === "web";

export const usePaletteFonts = () => {
  const { palette } = useTheme();

  useEffect(() => {
    const fonts = FONTS[palette.id];
    if (fonts) loadAsync(fonts).catch(() => {});
  }, [palette.id]);
};

export default usePaletteFonts;
