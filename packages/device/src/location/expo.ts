import * as Location from "expo-location";

import { hasDOM, isNativePlatform } from "../core/support";
import {
  LocationError,
  toGeoPosition,
  toLocationError,
  toLocationPermissionState,
} from "../core/geo";
import type { Unsubscribe } from "../core/types";
import type {
  GeocodedAddress,
  GeocodedLocation,
  GeocoderAdapter,
  Heading,
  HeadingAccuracy,
  LocationAccuracy,
  LocationAdapter,
} from "./types";

const ACCURACY: Record<LocationAccuracy, Location.LocationAccuracy> = {
  low: Location.LocationAccuracy.Low,
  balanced: Location.LocationAccuracy.Balanced,
  high: Location.LocationAccuracy.High,
  best: Location.LocationAccuracy.Highest,
};

const HEADING_ACCURACY: Record<number, HeadingAccuracy> = {
  3: "high",
  2: "medium",
  1: "low",
};

/** 0 up to (not including) 360, whatever the platform sent. */
function toDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

/**
 * expo sends `-1` for a true heading it cannot compute (no permission, or on
 * Android no fix yet to take the declination from), and accuracy as 0–3.
 */
export function toHeading(raw: Location.LocationHeadingObject): Heading {
  return {
    magneticHeading: toDegrees(raw.magHeading),
    trueHeading: raw.trueHeading >= 0 ? toDegrees(raw.trueHeading) : null,
    accuracy: HEADING_ACCURACY[raw.accuracy] ?? "unreliable",
    timestamp: Date.now(),
  };
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

  // expo's web build warns and never emits: no heading there. Android keeps
  // one native heading watch (a second takes the events away from the
  // first); the hooks open one per adapter, so this is called once at a time.
  ...(isNativePlatform && {
    watchHeading(
      onHeading: (heading: Heading) => void,
      onError: (error: LocationError) => void,
    ): Unsubscribe {
      let active = true;
      let subscription: Location.LocationSubscription | null = null;
      Location.watchHeadingAsync(
        (raw) => {
          if (active) onHeading(toHeading(raw));
        },
        // iOS without a magnetometer, or CoreLocation failing.
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
  }),
};

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

/**
 * `null` for an iOS placemark without a location. Android sends an accuracy
 * (and an altitude) of 0 for a point it never measured: neither means
 * anything, so the accuracy becomes `null` and the altitude is dropped.
 */
export function toGeocodedLocation(
  raw: Location.LocationGeocodedLocation,
): GeocodedLocation | null {
  if (!Number.isFinite(raw.latitude) || !Number.isFinite(raw.longitude)) {
    return null;
  }
  return {
    latitude: raw.latitude,
    longitude: raw.longitude,
    accuracy:
      typeof raw.accuracy === "number" && raw.accuracy > 0
        ? raw.accuracy
        : null,
  };
}

/** iOS leaves `formattedAddress` out and Android `timezone`: both read `null`. */
export function toGeocodedAddress(
  raw: Location.LocationGeocodedAddress,
): GeocodedAddress {
  return {
    name: text(raw.name),
    street: text(raw.street),
    streetNumber: text(raw.streetNumber),
    district: text(raw.district),
    city: text(raw.city),
    subregion: text(raw.subregion),
    region: text(raw.region),
    postalCode: text(raw.postalCode),
    country: text(raw.country),
    isoCountryCode: text(raw.isoCountryCode),
    timezone: text(raw.timezone),
    formattedAddress: text(raw.formattedAddress),
  };
}

const isGeocodedLocation = (
  value: GeocodedLocation | null,
): value is GeocodedLocation => value !== null;

/**
 * The platforms' own geocoders: `CLGeocoder` on iOS (no permission,
 * rate-limited by Apple), `android.location.Geocoder` on Android (one result,
 * the foreground permission, not while the app is in the background, absent
 * without Google Play services). The web has none: expo's web build answers
 * `[]`, which would read as "not found".
 */
export const expoGeocoderAdapter: GeocoderAdapter = {
  isSupported: () => isNativePlatform,

  async geocode(address) {
    if (!isNativePlatform) throw new LocationError("unsupported");
    try {
      const results = await Location.geocodeAsync(address);
      return results.map(toGeocodedLocation).filter(isGeocodedLocation);
    } catch (error) {
      throw toLocationError(error);
    }
  },

  async reverseGeocode({ latitude, longitude }) {
    if (!isNativePlatform) throw new LocationError("unsupported");
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      return results.map(toGeocodedAddress);
    } catch (error) {
      throw toLocationError(error);
    }
  },
};
