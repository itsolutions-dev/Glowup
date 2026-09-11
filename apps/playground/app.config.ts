import type { ExpoConfig } from "expo/config";

// Replaces the former app.json so the web build can be parameterised. The site
// is served from a GitHub Pages project page (https://<org>.github.io/Glowup/),
// which means every asset URL needs the repository name as a prefix — but only
// in that build. Locally, and on any host serving from the domain root, the
// prefix must be empty or Metro serves the bundle from a path that does not
// exist. The deploy workflow sets GLOWUP_BASE_URL; nothing else does.
const baseUrl = process.env.GLOWUP_BASE_URL ?? "";

const config: ExpoConfig = {
  name: "Glowup",
  slug: "glowup-playground",
  scheme: "glowup",
  version: "1.0.0",
  orientation: "default",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  ios: {
    supportsTablet: true,
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    softwareKeyboardLayoutMode: "pan",
  },
  web: {
    favicon: "./assets/favicon.png",
    bundler: "metro",
    // Static, not "single": expo-router prerenders one HTML file per route, so
    // every component page is a real URL that a crawler and a plain static
    // host can both serve. A single-page build would 404 on a deep link.
    output: "static",
  },
  plugins: [
    "expo-router",
    "expo-localization",
    "expo-status-bar",
    "expo-font",
    [
      "expo-splash-screen",
      {
        image: "./assets/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff",
      },
    ],
  ],
  experiments: {
    baseUrl,
    // Typed routes generate .expo/types/router.d.ts, which is build output and
    // not committed — turning them on makes `npm run type-check` depend on
    // someone having started Metro first. Not worth it for five static routes.
    typedRoutes: false,
  },
};

export default config;
