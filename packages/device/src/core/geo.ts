/**
 * What `/location` and `/background-location` share: positions, the location
 * permission and `LocationError`. It lives in core because a capability may
 * not import another; each subpath re-exports it, so both name the same
 * class and the same types. Plain JavaScript: no native module.
 */
import { toPermissionState, type PermissionResponseLike } from "./permissions";
import type { PermissionState } from "./types";

/**
 * Whether the user let the app see where they are exactly. iOS 14+ ("Precise
 * Location" off) and Android 12+ let them grant an approximate location only:
 * coordinates then arrive kilometres off, without any error.
 */
export type LocationPrecision = "precise" | "approximate";

export interface LocationPermissionState extends PermissionState {
  /** Set once granted. `null` while not granted, and on web (browsers do not say). */
  precision: LocationPrecision | null;
}

/**
 * How hard the device tries: `low` (~km, cell towers, cheapest), `balanced`
 * (~100 m), `high` (~10 m, GPS), `best` (the most the hardware gives).
 */
export type LocationAccuracy = "low" | "balanced" | "high" | "best";

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
  /** Metres above the WGS 84 ellipsoid. */
  altitude: number | null;
  /** Radius of uncertainty in metres. */
  accuracy: number | null;
  altitudeAccuracy: number | null;
  /** Direction of travel in degrees from true north (not the compass). */
  heading: number | null;
  /** Metres per second. */
  speed: number | null;
}

export interface GeoPosition {
  coords: GeoCoordinates;
  /** Milliseconds since the epoch, when the fix was taken. */
  timestamp: number;
}

/**
 * Why a location call failed.
 *
 * - `permission-denied`: location is not granted (never asked, or refused).
 *   The hooks never prompt: ask with `useLocationPermission().request()`.
 * - `services-disabled`: location is switched off for the whole device.
 * - `unavailable`: no fix could be obtained (indoors, no signal, a provider
 *   error); for geocoding, no network or too many requests.
 * - `timeout`: no fix (or geocoding answer) within the requested time.
 * - `unsupported`: this platform cannot locate (a browser without
 *   geolocation), or has no geocoder (the web, Android without one).
 */
export type LocationErrorCode =
  | "permission-denied"
  | "services-disabled"
  | "unavailable"
  | "timeout"
  | "unsupported";

export class LocationError extends Error {
  readonly code: LocationErrorCode;

  constructor(code: LocationErrorCode, message?: string, cause?: unknown) {
    super(message ?? DEFAULT_MESSAGES[code]);
    this.name = "LocationError";
    this.code = code;
    if (cause !== undefined) (this as { cause?: unknown }).cause = cause;
  }
}

const DEFAULT_MESSAGES: Record<LocationErrorCode, string> = {
  "permission-denied": "Location permission is not granted.",
  "services-disabled": "Location services are turned off on this device.",
  unavailable: "The current location is unavailable.",
  timeout: "Timed out waiting for a location fix.",
  unsupported: "Location is not supported on this platform.",
};

/** Works across module copies, where `instanceof` would not. */
export function isLocationError(error: unknown): error is LocationError {
  return (
    error instanceof Error &&
    error.name === "LocationError" &&
    typeof (error as LocationError).code === "string"
  );
}

/**
 * expo-location's permission response, spelled out structurally: core may not
 * import the module.
 */
export interface LocationPermissionResponseLike extends PermissionResponseLike {
  ios?: { accuracy?: string };
  android?: { accuracy?: string };
}

function toPrecision(
  raw: LocationPermissionResponseLike,
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
  raw: LocationPermissionResponseLike,
): LocationPermissionState {
  const state = toPermissionState(raw);
  return {
    ...state,
    precision: state.status === "granted" ? toPrecision(raw) : null,
  };
}

/** expo-location's `LocationObject`, structurally. */
export interface LocationObjectLike {
  coords: {
    latitude: number;
    longitude: number;
    altitude?: number | null;
    accuracy?: number | null;
    altitudeAccuracy?: number | null;
    heading?: number | null;
    speed?: number | null;
  };
  timestamp: number;
}

export function toGeoPosition(raw: LocationObjectLike): GeoPosition {
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
  // Android without a geocoder (no Google Play services).
  if (/NO_GEOCODE/.test(code)) {
    return new LocationError("unsupported", message, error);
  }
  return new LocationError("unavailable", message, error);
}
