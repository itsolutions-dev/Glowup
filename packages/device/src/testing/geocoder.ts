import { LocationError, type LocationErrorCode } from "../location/errors";
import type {
  GeocodedAddress,
  GeocodedLocation,
  GeocoderAdapter,
  GeoPoint,
} from "../location/types";

/** Rome's Piazza Venezia, as a street-level result. */
export function buildGeocodedLocation(
  overrides: Partial<GeocodedLocation> = {},
): GeocodedLocation {
  return {
    latitude: 41.8959,
    longitude: 12.4823,
    accuracy: 100,
    ...overrides,
  };
}

/** Rome's Piazza Venezia, with every part an iOS answer has. */
export function buildGeocodedAddress(
  overrides: Partial<GeocodedAddress> = {},
): GeocodedAddress {
  return {
    name: "Piazza Venezia",
    street: "Piazza Venezia",
    streetNumber: null,
    district: "Municipio I",
    city: "Roma",
    subregion: "Roma Capitale",
    region: "Lazio",
    postalCode: "00186",
    country: "Italia",
    isoCountryCode: "IT",
    timezone: "Europe/Rome",
    formattedAddress: null,
    ...overrides,
  };
}

/**
 * What a mock call answers: results (`[]` is "nothing found"), an error, or
 * `"pending"` for a call that never settles (to test a timeout).
 */
export type MockGeocoderAnswer<T> =
  T[] | LocationError | LocationErrorCode | "pending";

export interface MockGeocoderOptions {
  /** `false` behaves like the web default: no geocoder. Default true. */
  supported?: boolean;
}

export interface MockGeocoderAdapter extends GeocoderAdapter {
  /** What every later `geocode()` answers. Default: `[buildGeocodedLocation()]`. */
  setGeocode(answer: MockGeocoderAnswer<GeocodedLocation>): void;
  /** What every later `reverseGeocode()` answers. Default: `[buildGeocodedAddress()]`. */
  setReverseGeocode(answer: MockGeocoderAnswer<GeocodedAddress>): void;
  /** Every address `geocode()` received, in order. */
  readonly geocodeCalls: readonly string[];
  /** Every point `reverseGeocode()` received, in order. */
  readonly reverseGeocodeCalls: readonly GeoPoint[];
}

function answer<T>(value: MockGeocoderAnswer<T>): Promise<T[]> {
  if (value === "pending") return new Promise<T[]>(() => {});
  if (typeof value === "string") {
    return Promise.reject(new LocationError(value));
  }
  if (value instanceof Error) return Promise.reject(value);
  return Promise.resolve([...value]);
}

/**
 * An in-memory `GeocoderAdapter`. Inject it with
 * `<DeviceAdaptersProvider adapters={{ geocoder }}>` and set its answers from
 * the test: `geocoder.setGeocode([])` for "nothing found",
 * `geocoder.setReverseGeocode("unavailable")` for a failure.
 */
export function createMockGeocoderAdapter(
  options: MockGeocoderOptions = {},
): MockGeocoderAdapter {
  let geocodeAnswer: MockGeocoderAnswer<GeocodedLocation> = [
    buildGeocodedLocation(),
  ];
  let reverseAnswer: MockGeocoderAnswer<GeocodedAddress> = [
    buildGeocodedAddress(),
  ];
  const geocodeCalls: string[] = [];
  const reverseGeocodeCalls: GeoPoint[] = [];

  return {
    isSupported: () => options.supported ?? true,
    geocode(address) {
      geocodeCalls.push(address);
      return answer(geocodeAnswer);
    },
    reverseGeocode(point) {
      reverseGeocodeCalls.push({ ...point });
      return answer(reverseAnswer);
    },
    setGeocode(next) {
      geocodeAnswer = next;
    },
    setReverseGeocode(next) {
      reverseAnswer = next;
    },
    get geocodeCalls() {
      return [...geocodeCalls];
    },
    get reverseGeocodeCalls() {
      return [...reverseGeocodeCalls];
    },
  };
}
