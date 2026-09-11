import { useMemo } from "react";
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider as NavigationThemeProvider,
} from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  AlertProvider,
  AlertProviderWrapper,
  StatusBar,
  ThemeProvider,
  ToastProvider,
  useTheme,
} from "@its/glowup-ui";

import { SiteShell } from "../site/SiteShell";

/**
 * The provider chain plus the site chrome, mounted once for every route.
 *
 * Navigation is file-based: each route under app/ is a real URL, prerendered
 * to its own HTML file by `expo export`. The header is off because SiteShell
 * draws the top bar itself — one bar, the same on all platforms, instead of a
 * navigator header on native and nothing on web.
 */
export default function RootLayout() {
  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AlertProvider>
          <AlertProviderWrapper>
            <ToastProvider>
              <StatusBar />
              <Navigator />
            </ToastProvider>
          </AlertProviderWrapper>
        </AlertProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

/**
 * The navigator, told which scheme it is rendering in.
 *
 * expo-router mounts a React Navigation container, and that container paints
 * the scene behind every route from ITS OWN theme — `DefaultTheme`, whose
 * background is the light `rgb(242, 242, 242)`. Nothing in the app set that
 * colour, and switching our ThemeProvider to dark did not touch it: the text
 * turned light while the surface behind it stayed light grey, which is why the
 * whole site read as washed out in dark mode.
 *
 * The theme has to come from **expo-router's** re-exports, not from
 * `@react-navigation/native`: expo-router vendors its own fork of React
 * Navigation under `expo-router/build/react-navigation`, so the two packages
 * have different context objects and a provider from the wrong one is ignored
 * in silence.
 *
 * It also has to sit inside our ThemeProvider, so `useTheme()` can be read.
 */
const Navigator = () => {
  const { theme } = useTheme();

  const navigationTheme = useMemo(() => {
    const base = theme.isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      dark: theme.isDark,
      colors: {
        ...base.colors,
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.onSurface,
        border: theme.colors.outlineVariant,
        primary: theme.colors.primary,
        notification: theme.colors.error,
      },
    };
  }, [theme]);

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <SiteShell>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "fade",
            // The scene paints its own rectangle on web and takes the colour
            // from React Navigation's theme, not ours; naming it here is what
            // stops the light grey from surviving into dark mode.
            contentStyle: { backgroundColor: theme.colors.background },
          }}
        />
      </SiteShell>
    </NavigationThemeProvider>
  );
};
