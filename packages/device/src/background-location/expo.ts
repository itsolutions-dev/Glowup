import * as Location from "expo-location";
import { Platform } from "react-native";

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
  GeofenceRegion,
  LocationActivityType,
} from "./types";

// Enum names, read at call time: importing this subpath must not depend on
// expo-location's enums (an app's test may mock the module partially).
const ACCURACY: Record<
  LocationAccuracy,
  keyof typeof Location.LocationAccuracy
> = { low: "Low", balanced: "Balanced", high: "High", best: "Highest" };

const ACTIVITY: Record<
  LocationActivityType,
  keyof typeof Location.LocationActivityType
> = {
  other: "Other",
  automotive: "AutomotiveNavigation",
  fitness: "Fitness",
  navigation: "OtherNavigation",
  airborne: "Airborne",
};

export function toLocationTaskOptions(
  options: BackgroundLocationOptions,
): Location.LocationTaskOptions {
  const { foregroundService } = options;
  return {
    accuracy:
      Location.LocationAccuracy[ACCURACY[options.accuracy ?? "balanced"]],
    distanceInterval: options.distanceInterval,
    timeInterval: options.timeInterval,
    deferredUpdatesInterval: options.batchInterval,
    deferredUpdatesDistance: options.batchDistance,
    // Said explicitly: expo's iOS consumer defaults it to true.
    pausesUpdatesAutomatically: options.pausesAutomatically ?? false,
    activityType:
      Location.LocationActivityType[ACTIVITY[options.activityType ?? "other"]],
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
  // iOS: the device cannot monitor regions at all.
  if (/GEOFENCING_UNAVAILABLE/.test(code)) {
    return new LocationError(
      "unsupported",
      "This device cannot monitor regions.",
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

/**
 * The regions as expo-location takes them. iOS's consumer reads
 * `notifyOnEntry`, not the `notifyOnEnter` expo's type and Android use, so
 * both are sent.
 */
export function toLocationRegions(
  regions: GeofenceRegion[],
): Location.LocationRegion[] {
  return regions.map((region) => {
    const notifyOnEnter = region.notifyOnEnter ?? true;
    return {
      identifier: region.id,
      latitude: region.latitude,
      longitude: region.longitude,
      radius: region.radius,
      notifyOnEnter,
      notifyOnEntry: notifyOnEnter,
      notifyOnExit: region.notifyOnExit ?? true,
    } as Location.LocationRegion;
  });
}

// iOS monitors 20 regions per app, Android 100.
const GEOFENCE_LIMIT = Platform.OS === "ios" ? 20 : 100;

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

  geofenceLimit: GEOFENCE_LIMIT,

  async startGeofencing(name, regions) {
    try {
      await Location.startGeofencingAsync(name, toLocationRegions(regions));
    } catch (error) {
      throw toStartError(error);
    }
  },

  async stopGeofencing(name) {
    try {
      if (await expoBackgroundLocationAdapter.hasStartedGeofencing(name)) {
        await Location.stopGeofencingAsync(name);
      }
    } catch (error) {
      throw toLocationError(error);
    }
  },

  // Android throws without the background permission: nothing can fire then.
  async hasStartedGeofencing(name) {
    try {
      return await Location.hasStartedGeofencingAsync(name);
    } catch (error) {
      const failure = toLocationError(error);
      if (failure.code === "permission-denied") return false;
      throw failure;
    }
  },
};
