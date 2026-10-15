import type { ExpoConfig } from "expo/config";

// Replaces the former app.json so the web build can be parameterised. The site
// is served from a GitHub Pages project page (https://<org>.github.io/Glowup/),
// which means every asset URL needs the repository name as a prefix — but only
// in that build. Locally, and on any host serving from the domain root, the
// prefix must be empty or Metro serves the bundle from a path that does not
// exist. The deploy workflow sets GLOWUP_BASE_URL; nothing else does.
const baseUrl = process.env.GLOWUP_BASE_URL ?? "";

// The icons are drawn on the dark scheme's surfaceDim (scripts/generate-icons.mjs),
// so the splash screen and the adaptive icon's background use the same colour
// and the mark's square disappears into them.
const ICON_BACKGROUND = "#0F0D13";

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
      backgroundColor: ICON_BACKGROUND,
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
    "expo-status-bar",
    "expo-font",
    // Push for the /notifications demo. Remote push also needs a development
    // build with APNs / FCM credentials; local notifications work without them.
    "expo-notifications",
    // The /device pages. The package's plugin configures each capability
    // through its Expo module's own plugin, and the microphone because the
    // camera recipe records video with sound.
    [
      "@its/glowup-device",
      {
        location: {
          whenInUsePermission: "Shows your position on the location demo page.",
        },
        camera: {
          cameraPermission:
            "Scans QR codes, takes photos and records videos on the camera demo page.",
          microphonePermission:
            "Records sound with the videos on the camera demo page.",
          recordAudio: true,
        },
        biometrics: {
          faceIDPermission:
            "Unlocks the protected card on the biometrics demo page.",
        },
        // Android backup rules, and the Face ID text above for protected items.
        secureStore: true,
        // Motion & Fitness for the iOS barometer; Android 12+ delivers faster
        // than every 200 ms only with HIGH_SAMPLING_RATE_SENSORS (the level).
        sensors: {
          motionPermission: "Reads the barometer on the sensors demo page.",
          highSamplingRate: true,
        },
        // Picking needs no permission; this removes the camera and microphone
        // permissions expo-image-picker adds (the camera page keeps its own).
        mediaPicker: true,
        mediaLibrary: {
          savePermission: "Saves a copy on the media library demo page.",
        },
        // The background location page: updates through Android's
        // foreground service, and geofencing (the background permission).
        backgroundLocation: {
          mode: "foreground-service",
          geofencing: true,
          alwaysPermission:
            "Records positions and watches a circle on the background location demo page, also with the app closed.",
        },
        bluetooth: {
          permission:
            "Finds and connects to Bluetooth devices on the Bluetooth demo page.",
        },
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: ICON_BACKGROUND,
      },
    ],
  ],
  experiments: {
    baseUrl,
    // Typed routes generate .expo/types/router.d.ts, which is build output and
    // not committed — turning them on makes `npm run type-check` depend on
    // someone having started Metro first. Not worth it for six static routes.
    typedRoutes: false,
  },
};

export default config;
