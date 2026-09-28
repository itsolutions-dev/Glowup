import { useEffect } from "react";
import { Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "@its/glowup-ui";

/**
 * The status bar and the browser chrome, following the site's scheme.
 *
 * Native: light or dark status-bar content for the current scheme (Android is
 * edge-to-edge since SDK 54, so the bar's colour is the app background's).
 * Web: the `theme-color` meta tag and the page background, so the address bar
 * and the overscroll area match the scheme instead of staying white.
 *
 * This used to be the library's `StatusBar`. It is site chrome, not a
 * component, and it was the only thing that made `expo-status-bar` a peer of
 * the whole kit.
 */
export const ThemeStatusBar = () => {
  const { theme } = useTheme();
  const { surface, background } = theme.colors;

  useEffect(() => {
    if (Platform.OS !== "web") return;
    let meta = document.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.content = surface;
    const previous = document.body.style.backgroundColor;
    document.body.style.backgroundColor = background;
    return () => {
      document.body.style.backgroundColor = previous;
    };
  }, [surface, background]);

  return <StatusBar style={theme.isDark ? "light" : "dark"} />;
};
