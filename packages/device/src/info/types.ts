import type { PlatformOSType } from "react-native";

export type DeviceType = "phone" | "tablet" | "desktop" | "tv" | "unknown";

/**
 * What the app can know about the device it runs on. Every field the platform
 * cannot answer is `null`: on web there is no brand and no native app version.
 */
export interface DeviceInfo {
  platform: PlatformOSType;
  /** Marketing model name: "iPhone 15 Pro", "Pixel 8". */
  model: string | null;
  /** "Apple", "google", "samsung". `null` on web. */
  brand: string | null;
  manufacturer: string | null;
  os: {
    /** "iOS", "Android", "Mac OS"… */
    name: string | null;
    version: string | null;
  };
  deviceType: DeviceType;
  /** Simulator or emulator. Always `false` on web. */
  isEmulator: boolean;
  app: {
    /** Bundle identifier (iOS) or application ID (Android). */
    id: string | null;
    name: string | null;
    /**
     * The native version (`CFBundleShortVersionString` / `versionName`). In
     * Expo Go this is Expo Go's own version, not your app's.
     */
    version: string | null;
    /** The native build number (`CFBundleVersion` / `versionCode`). */
    build: string | null;
  };
}

/**
 * The contract between `useDeviceInfo()` and whatever reads the device. The
 * answer does not change while the app runs, so it is read synchronously.
 */
export interface DeviceInfoAdapter {
  getDeviceInfo(): DeviceInfo;
}
