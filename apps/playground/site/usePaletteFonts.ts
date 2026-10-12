import { useEffect } from "react";
import { loadAsync } from "expo-font";
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
  crm: { Roboto_400Regular, Roboto_500Medium, Roboto_700Bold },
  inxpire: { Geist_400Regular, Geist_500Medium, Geist_600SemiBold },
};

/**
 * Loads a palette's fonts when it is first picked, so a reader who never opens
 * CRM or inXpire never downloads Roboto or Geist. Until the files arrive the
 * text renders in the system font, then swaps; `loadAsync` is idempotent.
 */
export const usePaletteFonts = () => {
  const { palette } = useTheme();

  useEffect(() => {
    const fonts = FONTS[palette.id];
    if (fonts) loadAsync(fonts).catch(() => {});
  }, [palette.id]);
};

export default usePaletteFonts;
