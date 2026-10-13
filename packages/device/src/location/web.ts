import { hasDOM } from "../core/support";
import { LocationError } from "./errors";
import type {
  GeoPosition,
  LocationAccuracy,
  LocationAdapter,
  LocationPermissionState,
} from "./types";

/**
 * The web default, on `navigator.geolocation` directly rather than through
 * expo-location's web build, which drops watch errors, serves fixes of any age
 * as "current" (`maximumAge: Infinity`) and reports a denial as askable again.
 * Every browser global is read at call time: the static export prerenders in
 * Node.
 */

const GRANTED: LocationPermissionState = {
  status: "granted",
  canAskAgain: false,
  precision: null,
};
// A browser does not prompt again once denied: only the site settings can.
const DENIED: LocationPermissionState = {
  status: "denied",
  canAskAgain: false,
  precision: null,
};
const PROMPT: LocationPermissionState = {
  status: "undetermined",
  canAskAgain: true,
  precision: null,
};
const UNSUPPORTED: LocationPermissionState = {
  status: "unsupported",
  canAskAgain: false,
  precision: null,
};

const geolocation = (): Geolocation | null =>
  hasDOM() && "geolocation" in navigator ? navigator.geolocation : null;

const highAccuracy = (accuracy: LocationAccuracy = "balanced") =>
  accuracy === "high" || accuracy === "best";

function toGeoPosition({
  coords,
  timestamp,
}: GeolocationPosition): GeoPosition {
  return {
    coords: {
      latitude: coords.latitude,
      longitude: coords.longitude,
      altitude: coords.altitude,
      accuracy: coords.accuracy,
      altitudeAccuracy: coords.altitudeAccuracy,
      heading: Number.isNaN(coords.heading) ? null : coords.heading,
      speed: coords.speed,
    },
    timestamp,
  };
}

// GeolocationPositionError: 1 PERMISSION_DENIED, 2 POSITION_UNAVAILABLE, 3 TIMEOUT.
function toLocationError(error: GeolocationPositionError): LocationError {
  const code =
    error.code === 1
      ? "permission-denied"
      : error.code === 3
        ? "timeout"
        : "unavailable";
  return new LocationError(code, error.message || undefined, error);
}

function getPosition(
  geo: Geolocation,
  options: PositionOptions,
): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) =>
    geo.getCurrentPosition(resolve, reject, options),
  );
}

async function queryPermission(): Promise<LocationPermissionState | null> {
  try {
    const status = await navigator.permissions.query({ name: "geolocation" });
    if (status.state === "granted") return GRANTED;
    if (status.state === "denied") return DENIED;
    return PROMPT;
  } catch {
    // No Permissions API (older Safari): the state cannot be read.
    return null;
  }
}

/** Metres between two fixes (haversine): browsers have no distance filter. */
function distance(a: GeoPosition, b: GeoPosition): number {
  const rad = Math.PI / 180;
  const dLat = (b.coords.latitude - a.coords.latitude) * rad;
  const dLon = (b.coords.longitude - a.coords.longitude) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.coords.latitude * rad) *
      Math.cos(b.coords.latitude * rad) *
      Math.sin(dLon / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

export const webLocationAdapter: LocationAdapter = {
  isSupported: () => geolocation() !== null,

  async getPermission() {
    if (!geolocation()) return UNSUPPORTED;
    return (await queryPermission()) ?? PROMPT;
  },

  async requestPermission() {
    const geo = geolocation();
    if (!geo) return UNSUPPORTED;
    const current = await queryPermission();
    if (current && current.status !== "undetermined") return current;
    // Browsers have no request API: asking for a position is what prompts.
    try {
      await getPosition(geo, { maximumAge: Infinity });
      return GRANTED;
    } catch (error) {
      if ((error as GeolocationPositionError).code === 1) return DENIED;
      // Allowed, but no fix: the permission itself was granted.
      return (await queryPermission()) ?? GRANTED;
    }
  },

  // A page cannot tell whether the OS has location switched off: the request
  // fails with POSITION_UNAVAILABLE instead.
  hasServicesEnabled: async () => geolocation() !== null,

  async getCurrentPosition({ accuracy }) {
    const geo = geolocation();
    if (!geo) throw new LocationError("unsupported");
    try {
      return toGeoPosition(
        await getPosition(geo, {
          enableHighAccuracy: highAccuracy(accuracy),
          maximumAge: 0,
        }),
      );
    } catch (error) {
      throw toLocationError(error as GeolocationPositionError);
    }
  },

  async getLastKnownPosition({ maxAge = Infinity, requiredAccuracy }) {
    const geo = geolocation();
    if (!geo) throw new LocationError("unsupported");
    try {
      // `timeout: 0` answers from the browser's cache or fails at once.
      const position = toGeoPosition(
        await getPosition(geo, { maximumAge: maxAge, timeout: 0 }),
      );
      const accuracy = position.coords.accuracy ?? Infinity;
      return requiredAccuracy === undefined || accuracy <= requiredAccuracy
        ? position
        : null;
    } catch (error) {
      if ((error as GeolocationPositionError).code === 3) return null;
      throw toLocationError(error as GeolocationPositionError);
    }
  },

  watchPosition({ accuracy, distanceInterval = 0 }, onPosition, onError) {
    const geo = geolocation();
    if (!geo) {
      onError(new LocationError("unsupported"));
      return () => {};
    }
    let last: GeoPosition | null = null;
    const id = geo.watchPosition(
      (raw) => {
        const position = toGeoPosition(raw);
        if (last && distance(last, position) < distanceInterval) return;
        last = position;
        onPosition(position);
      },
      (error) => onError(toLocationError(error)),
      { enableHighAccuracy: highAccuracy(accuracy), maximumAge: 0 },
    );
    return () => geo.clearWatch(id);
  },
};
