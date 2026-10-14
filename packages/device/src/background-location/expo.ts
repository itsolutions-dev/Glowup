import * as Location from "expo-location";

import {
  LocationError,
  toLocationError,
  toLocationPermissionState,
  type LocationAccuracy,
} from "../core/geo";
import { toPermissionState } from "../core/permissions";
import { isNativePlatform } from "../core/support";
import { systemSheet } from "../core/systemSheet";
import type {
  BackgroundLocationAdapter,
  BackgroundLocationOptions,
  LocationActivityType,
} from "./types";

const ACCURACY: Record<LocationAccuracy, Location.LocationAccuracy> = {
  low: Location.LocationAccuracy.Low,
  balanced: Location.LocationAccuracy.Balanced,
  high: Location.LocationAccuracy.High,
  best: Location.LocationAccuracy.Highest,
};

const ACTIVITY: Record<LocationActivityType, Location.LocationActivityType> = {
  other: Location.LocationActivityType.Other,
  automotive: Location.LocationActivityType.AutomotiveNavigation,
  fitness: Location.LocationActivityType.Fitness,
  navigation: Location.LocationActivityType.OtherNavigation,
  airborne: Location.LocationActivityType.Airborne,
};

export function toLocationTaskOptions(
  options: BackgroundLocationOptions,
): Location.LocationTaskOptions {
  const { foregroundService } = options;
  return {
    accuracy: ACCURACY[options.accuracy ?? "balanced"],
    distanceInterval: options.distanceInterval,
    timeInterval: options.timeInterval,
    deferredUpdatesInterval: options.batchInterval,
    deferredUpdatesDistance: options.batchDistance,
    // Said explicitly: expo's iOS consumer defaults it to true.
    pausesUpdatesAutomatically: options.pausesAutomatically ?? false,
    activityType: ACTIVITY[options.activityType ?? "other"],
    showsBackgroundLocationIndicator: options.showsIndicator ?? false,
    ...(foregroundService && {
      foregroundService: {
        notificationTitle: foregroundService.title,
        notificationBody: foregroundService.body,
        notificationColor: foregroundService.color,
        killServiceOnDestroy: foregroundService.stopWithApp ?? false,
      },
    }),
  };
}

/**
 * What expo-location's `startLocationUpdatesAsync` rejects with, beyond the
 * permission and the services: a build without the background setup (iOS's
 * `location` background mode, Android's foreground service permissions) and
 * Android refusing to start a foreground service from the background.
 */
export function toStartError(error: unknown): LocationError {
  const code = String((error as { code?: unknown })?.code ?? "");
  if (
    /LOCATION_UPDATES_UNAVAILABLE|FOREGROUND_SERVICE_PERMISSIONS/.test(code)
  ) {
    return new LocationError(
      "unsupported",
      "Background location is not set up in this build: add `backgroundLocation` to the @its/glowup-device config plugin and rebuild.",
      error,
    );
  }
  if (/FOREGROUND_SERVICE_START_NOT_ALLOWED/.test(code)) {
    return new LocationError(
      "unavailable",
      "Android starts a foreground service only while the app is in the foreground.",
      error,
    );
  }
  return toLocationError(error);
}

/** The native default: expo-location's updates, run by expo-task-manager. */
export const expoBackgroundLocationAdapter: BackgroundLocationAdapter = {
  isSupported: () => isNativePlatform,

  async getPermission() {
    return toPermissionState(await Location.getBackgroundPermissionsAsync());
  },

  // Android 11+ answers with the app's settings page, not a dialog: the app
  // goes to the background meanwhile, which must not lock it (`useAppLock`).
  requestPermission: () =>
    systemSheet.run(async () =>
      toPermissionState(await Location.requestBackgroundPermissionsAsync()),
    ),

  async getForegroundPermission() {
    return toLocationPermissionState(
      await Location.getForegroundPermissionsAsync(),
    );
  },

  hasServicesEnabled: () => Location.hasServicesEnabledAsync(),

  async start(name, options) {
    try {
      await Location.startLocationUpdatesAsync(
        name,
        toLocationTaskOptions(options),
      );
    } catch (error) {
      throw toStartError(error);
    }
  },

  // Stopping what is not running throws on Android (no such task).
  async stop(name) {
    try {
      if (await Location.hasStartedLocationUpdatesAsync(name)) {
        await Location.stopLocationUpdatesAsync(name);
      }
    } catch (error) {
      throw toLocationError(error);
    }
  },

  async hasStarted(name) {
    try {
      return await Location.hasStartedLocationUpdatesAsync(name);
    } catch (error) {
      throw toLocationError(error);
    }
  },
};
