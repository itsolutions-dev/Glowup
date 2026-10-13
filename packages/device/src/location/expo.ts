import * as Location from "expo-location";

import { hasDOM, isNativePlatform } from "../core/support";
import { toPermissionState } from "../core/permissions";
import { isLocationError, LocationError } from "./errors";
import type {
  GeoPosition,
  LocationAccuracy,
  LocationAdapter,
  LocationPermissionState,
  LocationPrecision,
} from "./types";

const ACCURACY: Record<LocationAccuracy, Location.LocationAccuracy> = {
  low: Location.LocationAccuracy.Low,
  balanced: Location.LocationAccuracy.Balanced,
  high: Location.LocationAccuracy.High,
  best: Location.LocationAccuracy.Highest,
};

function toPrecision(
  raw: Location.LocationPermissionResponse,
): LocationPrecision | null {
  if (raw.ios)
    return raw.ios.accuracy === "reduced" ? "approximate" : "precise";
  if (raw.android) {
    if (raw.android.accuracy === "fine") return "precise";
    if (raw.android.accuracy === "coarse") return "approximate";
  }
  return null;
}

export function toLocationPermissionState(
  raw: Location.LocationPermissionResponse,
): LocationPermissionState {
  const state = toPermissionState(raw);
  return {
    ...state,
    precision: state.status === "granted" ? toPrecision(raw) : null,
  };
}

export function toGeoPosition(raw: Location.LocationObject): GeoPosition {
  const { coords, timestamp } = raw;
  return {
    coords: {
      latitude: coords.latitude,
      longitude: coords.longitude,
      altitude: coords.altitude ?? null,
      accuracy: coords.accuracy ?? null,
      altitudeAccuracy: coords.altitudeAccuracy ?? null,
      heading: coords.heading ?? null,
      speed: coords.speed ?? null,
    },
    timestamp,
  };
}

/**
 * expo-location's errors carry a code derived from the native exception's
 * name (`ERR_LOCATION_UNAUTHORIZED` on Android, `ERR_DENIED_FOREGROUND_…` and
 * `ERR_LOCATION_SERVICES_DISABLED` on iOS…). Match on the words rather than on
 * an exact list, which changes between SDKs.
 */
export function toLocationError(error: unknown): LocationError {
  if (isLocationError(error)) return error;
  const code = String((error as { code?: unknown })?.code ?? "");
  const message = error instanceof Error ? error.message : undefined;
  if (/UNAUTHORIZED|DENIED|PERMISSION/.test(code)) {
    return new LocationError("permission-denied", message, error);
  }
  if (/SERVICES_DISABLED|SETTINGS_UNSATISFIED/.test(code)) {
    return new LocationError("services-disabled", message, error);
  }
  return new LocationError("unavailable", message, error);
}

/** The native default: expo-location on iOS and Android. */
export const expoLocationAdapter: LocationAdapter = {
  isSupported: () =>
    isNativePlatform || (hasDOM() && "geolocation" in navigator),

  async getPermission() {
    return toLocationPermissionState(
      await Location.getForegroundPermissionsAsync(),
    );
  },

  async requestPermission() {
    return toLocationPermissionState(
      await Location.requestForegroundPermissionsAsync(),
    );
  },

  hasServicesEnabled: () => Location.hasServicesEnabledAsync(),

  async getCurrentPosition({ accuracy = "balanced" }) {
    try {
      return toGeoPosition(
        await Location.getCurrentPositionAsync({
          accuracy: ACCURACY[accuracy],
        }),
      );
    } catch (error) {
      throw toLocationError(error);
    }
  },

  async getLastKnownPosition(options) {
    try {
      const raw = await Location.getLastKnownPositionAsync(options);
      return raw ? toGeoPosition(raw) : null;
    } catch (error) {
      throw toLocationError(error);
    }
  },

  watchPosition(
    { accuracy = "balanced", distanceInterval, timeInterval },
    onPosition,
    onError,
  ) {
    // watchPositionAsync resolves its subscription asynchronously; the caller
    // may unsubscribe before it does, and must hear nothing after that.
    let active = true;
    let subscription: Location.LocationSubscription | null = null;
    Location.watchPositionAsync(
      { accuracy: ACCURACY[accuracy], distanceInterval, timeInterval },
      (raw) => {
        if (active) onPosition(toGeoPosition(raw));
      },
      (reason) => {
        if (active) onError(new LocationError("unavailable", reason));
      },
    ).then(
      (created) => {
        if (active) subscription = created;
        else created.remove();
      },
      (error) => {
        if (active) onError(toLocationError(error));
      },
    );
    return () => {
      active = false;
      subscription?.remove();
    };
  },
};
