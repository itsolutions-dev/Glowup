/**
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
