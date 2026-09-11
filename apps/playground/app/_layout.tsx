import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  AlertProvider,
  AlertProviderWrapper,
  StatusBar,
  ThemeProvider,
  ToastProvider,
} from "@its/glowup-ui";

// Side-effect import: starts i18next so the template screens' `t()` calls
// resolve to real copy instead of rendering the raw UPPER_SNAKE_CASE keys.
import "../i18n";

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
              <SiteShell>
                <Stack
                  screenOptions={{
                    headerShown: false,
                    animation: "fade",
                    contentStyle: { backgroundColor: "transparent" },
                  }}
                />
              </SiteShell>
            </ToastProvider>
          </AlertProviderWrapper>
        </AlertProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}
