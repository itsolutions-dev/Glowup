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
 * How far a heading can be trusted: iOS's uncertainty (high under 20°,
 * medium under 35°, low under 50°) or Android's magnetometer calibration.
 * `unreliable`: the compass needs calibrating (a figure-eight motion).
 */
export type HeadingAccuracy = "high" | "medium" | "low" | "unreliable";

/** Where the top edge of the device points, clockwise from north. */
export interface Heading {
  /** Degrees from magnetic north, from 0 up to (not including) 360. */
  magneticHeading: number;
  /**
   * Degrees from true north; `null` until the platform knows the magnetic
   * declination where the device is (it needs a location fix first).
   */
  trueHeading: number | null;
  accuracy: HeadingAccuracy;
  /** When the reading arrived (`Date.now()`). */
  timestamp: number;
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
  /**
   * Optional: the compass. The package opens one watch per adapter however
   * many components read it, only once the permission is granted, and stops
   * it while the app is in the background. An adapter without it (the web,
   * an adapter written before 0.7) has no heading: `useHeading` reports
   * `unsupported`. A failure that ends the watch goes to `onError`.
   */
  watchHeading?(
    onHeading: (heading: Heading) => void,
    onError: (error: LocationError) => void,
  ): Unsubscribe;
}

/** A place found for an address. */
export interface GeocodedLocation {
  latitude: number;
  longitude: number;
  /**
   * Radius in metres of the area the result stands for (a building, a
   * street, a whole city). `null` where the platform does not say (Android).
   */
  accuracy: number | null;
}

/**
 * A postal address found for a point. Every part is `null` where the
 * platform does not know it; none is ever an empty string.
 */
export interface GeocodedAddress {
  /** The place's name ("Tower Bridge"); on Android often just the street number. */
  name: string | null;
  street: string | null;
  streetNumber: string | null;
  /** Below the city: a neighbourhood or district. */
  district: string | null;
  city: string | null;
  /** Between the city and the region: a county or province. */
  subregion: string | null;
  /** A state or region. */
  region: string | null;
  postalCode: string | null;
  /** The country's name, in the device's language. */
  country: string | null;
  /** ISO 3166-1 alpha-2 ("IT"). */
  isoCountryCode: string | null;
  /** An IANA time zone ("Europe/Rome"). iOS only. */
  timezone: string | null;
  /** The address as one line, in the local format. Android only. */
  formattedAddress: string | null;
}

/** The point `reverseGeocode` looks up: a `GeoCoordinates` fits. */
export type GeoPoint = Pick<GeoCoordinates, "latitude" | "longitude">;

/**
 * Turns addresses into places and points into addresses. Separate from
 * `LocationAdapter` so an app can swap only this one for its own provider
 * (a web service on the web, where the default has none). Results arrive
 * normalised; "nothing found" resolves an empty list; failures reject with a
 * `LocationError` (anything else is reported as `unavailable`).
 */
export interface GeocoderAdapter {
  isSupported(): boolean;
  geocode(address: string): Promise<GeocodedLocation[]>;
  reverseGeocode(point: GeoPoint): Promise<GeocodedAddress[]>;
}
