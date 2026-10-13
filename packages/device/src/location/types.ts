import type { PermissionState, Unsubscribe } from "../core/types";
import type { LocationError } from "./errors";

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

export interface PositionOptions {
  accuracy?: LocationAccuracy;
}

export interface WatchPositionOptions extends PositionOptions {
  /** Minimum metres between two updates. */
  distanceInterval?: number;
  /** Minimum milliseconds between two updates. Android only: iOS and web ignore it. */
  timeInterval?: number;
}

export interface LastKnownPositionOptions {
  /** Oldest acceptable fix, in milliseconds. */
  maxAge?: number;
  /** Largest acceptable `coords.accuracy`, in metres. */
  requiredAccuracy?: number;
}

/**
 * The contract between the location hooks and whatever reads the position.
 * Every rejection and every `onError` call carries a `LocationError`.
 *
 * The hooks run the checks (support, permission, services) before calling
 * `getCurrentPosition`, `getLastKnownPosition` or `watchPosition`, so an
 * adapter needs no guard of its own for them — but it must never prompt from
 * those three: only `requestPermission` may.
 */
export interface LocationAdapter {
  /** Whether this platform can locate at all. Read at call time. */
  isSupported(): boolean;
  getPermission(): Promise<LocationPermissionState>;
  /** Shows the OS prompt when it still can; otherwise resolves the current state. */
  requestPermission(): Promise<LocationPermissionState>;
  /** False when location is switched off for the whole device. */
  hasServicesEnabled(): Promise<boolean>;
  getCurrentPosition(options: PositionOptions): Promise<GeoPosition>;
  /** A cached fix, without waking the GPS; `null` when none fits `options`. */
  getLastKnownPosition(
    options: LastKnownPositionOptions,
  ): Promise<GeoPosition | null>;
  watchPosition(
    options: WatchPositionOptions,
    onPosition: (position: GeoPosition) => void,
    onError: (error: LocationError) => void,
  ): Unsubscribe;
}
