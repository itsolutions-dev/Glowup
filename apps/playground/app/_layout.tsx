import { useEffect, useMemo } from "react";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useFonts } from "expo-font";
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider as NavigationThemeProvider,
  useRouter,
} from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  AlertProvider,
  PortalHost,
  ToastProvider,
  useTheme,
} from "@its/glowup-ui";

import { HapticThemeProvider } from "../site/HapticsPreference";
import { SiteShell } from "../site/SiteShell";
import { ThemeStatusBar } from "../site/ThemeStatusBar";

/**
 * The provider chain plus the site chrome, mounted once for every route.
 *
 * Navigation is file-based: each route under app/ is a real URL, prerendered
 * to its own HTML file by `expo export`. The header is off because SiteShell
 * draws the top bar itself — one bar, the same on all platforms, instead of a
 * navigator header on native and nothing on web.
 */
/**
 * Native smoke run only (.github/workflows/native.yml): a build made with
 * EXPO_PUBLIC_NATIVE_CHECK_ROUTE=/native-check opens that route a minute after
 * launch, once the smoke check has taken its screenshot of the home page (a deep
 * link cannot do it on iOS: the system asks "Open in Glowup?" first). Without
 * the variable this renders nothing and schedules nothing.
 */
const NativeCheckTrigger = () => {
  const router = useRouter();
  useEffect(() => {
    const route = process.env.EXPO_PUBLIC_NATIVE_CHECK_ROUTE;
    if (!route) return;
    const timer = setTimeout(() => router.push(route as never), 60_000);
    return () => clearTimeout(timer);
  }, [router]);
  return null;
};

export default function RootLayout() {
  // The icon font, registered during the static render too. An icon renders
  // nothing until its font counts as loaded, and in Node that only happens
  // through loadAsync / useFonts (which then puts the @font-face in the
  // exported HTML). Without this the prerender drew every icon empty while the
  // browser — hydrating the page after the shell, whose icons had loaded the
  // font by then — drew them with glyphs: React's hydration error #418.
  useFonts(MaterialCommunityIcons.font);

  return (
    <HapticThemeProvider>
      <SafeAreaProvider>
        <AlertProvider>
          <ToastProvider>
            {/* The host an app mounts once at its root: a tooltip or a hover card
            drawn through it escapes the page's scroll area and sits above the
            sidebar, instead of being cut off at the edge of the content. */}
            <PortalHost>
              <ThemeStatusBar />
              <Navigator />
              <NativeCheckTrigger />
            </PortalHost>
          </ToastProvider>
        </AlertProvider>
      </SafeAreaProvider>
    </HapticThemeProvider>
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
