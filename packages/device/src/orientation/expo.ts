import * as ScreenOrientation from "expo-screen-orientation";
import { Platform } from "react-native";

import { isNativePlatform } from "../core/support";
import { OrientationError } from "./errors";
import type { Orientation, OrientationAdapter, OrientationLock } from "./types";

const { Orientation: Expo, OrientationLock: ExpoLock } = ScreenOrientation;

const FROM_EXPO: Record<number, Orientation> = {
  [Expo.PORTRAIT_UP]: "portrait-up",
  [Expo.PORTRAIT_DOWN]: "portrait-down",
  [Expo.LANDSCAPE_LEFT]: "landscape-left",
  [Expo.LANDSCAPE_RIGHT]: "landscape-right",
};

const TO_EXPO: Record<OrientationLock, ScreenOrientation.OrientationLock> = {
  any: ExpoLock.DEFAULT,
  // Not PORTRAIT: on iOS it includes upside down, which iPhones without a
  // home button refuse, so the whole lock would fail there.
  portrait: ExpoLock.PORTRAIT_UP,
  landscape: ExpoLock.LANDSCAPE,
  "landscape-left": ExpoLock.LANDSCAPE_LEFT,
  "landscape-right": ExpoLock.LANDSCAPE_RIGHT,
};

const toOrientation = (value: ScreenOrientation.Orientation): Orientation =>
  FROM_EXPO[value] ?? "unknown";

// The app's own lock (Info.plist / AndroidManifest, from app.json's
// `orientation`), read before the first lock and put back by unlock().
// expo-screen-orientation's unlockAsync() does not: it sets "anything but
// upside down" on iOS and UNSPECIFIED on Android, so a portrait-only app
// starts rotating once a screen that locked it unmounts.
let saved: Promise<ScreenOrientation.PlatformOrientationInfo | null> | null =
  null;

async function restore(info: ScreenOrientation.PlatformOrientationInfo) {
  // lockPlatformAsync() rejects a falsy constant, and SCREEN_ORIENTATION_LANDSCAPE
  // is 0: expo maps LANDSCAPE_RIGHT to exactly that attribute.
  if (
    Platform.OS === "android" &&
    info.screenOrientationConstantAndroid === 0
  ) {
    await ScreenOrientation.lockAsync(ExpoLock.LANDSCAPE_RIGHT);
    return;
  }
  await ScreenOrientation.lockPlatformAsync(info);
}

/** The native default: expo-screen-orientation. */
export const expoOrientationAdapter: OrientationAdapter = {
  isSupported: () => isNativePlatform,
  getOrientation: async () =>
    toOrientation(await ScreenOrientation.getOrientationAsync()),
  subscribe(listener) {
    const subscription = ScreenOrientation.addOrientationChangeListener(
      ({ orientationInfo }) =>
        listener(toOrientation(orientationInfo.orientation)),
    );
    return () => subscription.remove();
  },
  supportsLock: () => isNativePlatform,
  async lock(lock) {
    saved ??= ScreenOrientation.getPlatformOrientationLockAsync().catch(
      () => null,
    );
    await saved;
    try {
      await ScreenOrientation.lockAsync(TO_EXPO[lock]);
    } catch (error) {
      throw new OrientationError(
        "failed",
        error instanceof Error ? error.message : undefined,
        error,
      );
    }
  },
  async unlock() {
    if (!saved) return;
    const info = await saved;
    saved = null;
    try {
      if (!info) throw new Error("no saved lock");
      await restore(info);
    } catch {
      await ScreenOrientation.unlockAsync().catch(() => {});
    }
  },
};
