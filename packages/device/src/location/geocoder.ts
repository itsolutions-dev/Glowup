import { useCallback, useMemo } from "react";

import { useDeviceAdapter } from "../core/adapters";
import { LocationError, toError } from "../core/geo";
import { useClientValue } from "../core/shared";
import { expoGeocoderAdapter } from "./expo";
import { withTimeout } from "./resolve";
import type {
  GeocodedAddress,
  GeocodedLocation,
  GeocoderAdapter,
  GeoPoint,
} from "./types";

const DEFAULT_TIMEOUT = 15_000;

export interface GeocodeOptions {
  /**
   * Milliseconds before the call rejects with `timeout` (default 15000). The
   * platform's request is not cancelled: its answer is dropped.
   */
  timeout?: number;
}

function checkAddress(address: unknown): string {
  if (typeof address !== "string" || address.trim() === "") {
    throw new TypeError(
      "useGeocoder().geocode(): address must be a non-empty string.",
    );
  }
  return address.trim();
}

function checkPoint(point: unknown): GeoPoint {
  const { latitude, longitude } = (point ?? {}) as Partial<GeoPoint>;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new TypeError(
      "useGeocoder().reverseGeocode(): latitude and longitude must be finite numbers.",
    );
  }
  if (Math.abs(latitude!) > 90 || Math.abs(longitude!) > 180) {
    throw new RangeError(
      "useGeocoder().reverseGeocode(): latitude must be within ±90 and longitude within ±180.",
    );
  }
  return { latitude: latitude!, longitude: longitude! };
}

async function run<T>(
  adapter: GeocoderAdapter,
  call: () => Promise<T>,
  timeout: number,
): Promise<T> {
  if (!adapter.isSupported()) throw new LocationError("unsupported");
  try {
    return await withTimeout(call(), timeout);
  } catch (error) {
    throw toError(error);
  }
}

export interface UseGeocoder {
  /** `null` while a static page hydrates; `false` on the web by default. */
  isSupported: boolean | null;
  /**
   * The places an address may be. Resolves `[]` when nothing matches;
   * rejects with a `LocationError`: `permission-denied` (Android needs the
   * location permission), `unavailable` (no network, too many requests, the
   * app in the background on Android), `timeout`, `unsupported`. A
   * `TypeError` for an empty address.
   */
  geocode: (
    address: string,
    options?: GeocodeOptions,
  ) => Promise<GeocodedLocation[]>;
  /**
   * The addresses at a point (`position.coords` fits). Resolves `[]` when
   * nothing is known there; rejects as `geocode` does, and with a
   * `TypeError` / `RangeError` for coordinates that are not a point on Earth.
   */
  reverseGeocode: (
    point: GeoPoint,
    options?: GeocodeOptions,
  ) => Promise<GeocodedAddress[]>;
}

/**
 * Geocoding, `@its/glowup-device/location`: the platform's geocoder on iOS
 * and Android, none on the web. Supply your own provider with
 * `<DeviceAdaptersProvider adapters={{ geocoder }}>`. Nothing is cached or
 * throttled: debounce what the user types, Apple limits the request rate.
 */
export function useGeocoder(): UseGeocoder {
  const adapter = useDeviceAdapter("geocoder") ?? expoGeocoderAdapter;

  const isSupported = useClientValue(() => adapter.isSupported(), null);

  const geocode = useCallback(
    async (address: string, { timeout = DEFAULT_TIMEOUT } = {}) => {
      const query = checkAddress(address);
      return run(adapter, () => adapter.geocode(query), timeout);
    },
    [adapter],
  );

  const reverseGeocode = useCallback(
    async (point: GeoPoint, { timeout = DEFAULT_TIMEOUT } = {}) => {
      const checked = checkPoint(point);
      return run(adapter, () => adapter.reverseGeocode(checked), timeout);
    },
    [adapter],
  );

  return useMemo(
    () => ({ isSupported, geocode, reverseGeocode }),
    [isSupported, geocode, reverseGeocode],
  );
}
