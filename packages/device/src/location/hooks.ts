import { useCallback, useEffect, useState } from "react";
import { Linking } from "react-native";

import { useDeviceAdapter } from "../core/adapters";
import { usePermissionSnapshot } from "../core/permissionStore";
import type { Unsubscribe } from "../core/types";
import { defaultLocationAdapter } from "./defaultAdapter";
import type { LocationError } from "./errors";
import { getPermissionStore, UNKNOWN_LOCATION } from "./permissionStore";
import { ensureReady, resolvePosition, toError } from "./resolve";
import type {
  GeoPosition,
  LocationAdapter,
  LocationPermissionState,
  PositionOptions,
  WatchPositionOptions,
} from "./types";

function useLocationAdapter(): LocationAdapter {
  return useDeviceAdapter("location") ?? defaultLocationAdapter;
}

export interface UseLocationPermission extends LocationPermissionState {
  /** True until the first read answers (`status` reads `"undetermined"` meanwhile). */
  isLoading: boolean;
  /**
   * Shows the OS prompt. Once `canAskAgain` is false the OS ignores it: call
   * `openSettings()`. The other hooks never prompt on their own.
   */
  request: () => Promise<LocationPermissionState>;
  /** Re-reads the state. The hook already does this when the app returns to the foreground. */
  refresh: () => Promise<LocationPermissionState>;
  /** Opens this app's page in the system settings (native only). */
  openSettings: () => Promise<void>;
}

/**
 * The foreground location permission, shared by every component that asks:
 * a `request()` made in one updates them all.
 */
export function useLocationPermission(): UseLocationPermission {
  const store = getPermissionStore(useLocationAdapter());
  const state = usePermissionSnapshot(store);

  return {
    ...(state ?? UNKNOWN_LOCATION),
    isLoading: state === null,
    request: store.request,
    refresh: store.refresh,
    openSettings: () => Linking.openSettings(),
  };
}

export interface UseCurrentPositionOptions extends PositionOptions {
  /**
   * Accept a cached fix up to this old (milliseconds) before waking the GPS.
   * Fast, but the user may have moved since.
   */
  maxAge?: number;
  /** Give up after this many milliseconds (default 15000; 0 waits forever). */
  timeout?: number;
  /**
   * Read on mount and whenever the options change (default true). With
   * `false`, only `refresh()` reads.
   */
  enabled?: boolean;
}

export interface UseCurrentPosition {
  /** The latest fix; kept when a later read fails. */
  position: GeoPosition | null;
  /** The latest read's failure; cleared by the next fix. */
  error: LocationError | null;
  isLoading: boolean;
  /** Reads again, also when `enabled` is false. */
  refresh: () => void;
}

interface Settled {
  key: string | null;
  position: GeoPosition | null;
  error: LocationError | null;
}

/**
 * One position. Never prompts: without the permission it ends in a
 * `permission-denied` error, so gate it on `useLocationPermission()`.
 */
export function useCurrentPosition({
  accuracy = "balanced",
  maxAge,
  timeout = 15000,
  enabled = true,
}: UseCurrentPositionOptions = {}): UseCurrentPosition {
  const adapter = useLocationAdapter();
  const [reads, setReads] = useState(0);
  // Identifies the read the current options and refresh() count ask for;
  // `isLoading` is "the last settled read is not that one".
  const key =
    enabled || reads > 0 ? `${accuracy}|${maxAge}|${timeout}|${reads}` : null;
  const [settled, setSettled] = useState<Settled>({
    key: null,
    position: null,
    error: null,
  });

  useEffect(() => {
    if (key === null) return;
    // Options can change while a read runs: only the newest one may land.
    let active = true;
    resolvePosition(adapter, { accuracy, maxAge, timeout }).then(
      (position) => {
        if (active) setSettled({ key, position, error: null });
      },
      (caught) => {
        if (active) {
          setSettled((previous) => ({
            key,
            position: previous.position,
            error: toError(caught),
          }));
        }
      },
    );
    return () => {
      active = false;
    };
  }, [adapter, key, accuracy, maxAge, timeout]);

  const refresh = useCallback(() => setReads((count) => count + 1), []);

  return {
    position: settled.position,
    error: settled.error,
    isLoading: key !== null && settled.key !== key,
    refresh,
  };
}

export interface UseWatchPositionOptions extends WatchPositionOptions {
  /** Watch while true (default true). Pass `permission.status === "granted"`. */
  enabled?: boolean;
}

export interface UseWatchPosition {
  /** The latest fix; kept when the watch stops. */
  position: GeoPosition | null;
  /** Cleared by the next fix. */
  error: LocationError | null;
}

/** Follows the position while mounted and enabled. Never prompts. */
export function useWatchPosition({
  accuracy = "balanced",
  distanceInterval,
  timeInterval,
  enabled = true,
}: UseWatchPositionOptions = {}): UseWatchPosition {
  const adapter = useLocationAdapter();
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [error, setError] = useState<LocationError | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let unsubscribe: Unsubscribe | null = null;
    ensureReady(adapter).then(
      () => {
        if (!active) return;
        unsubscribe = adapter.watchPosition(
          { accuracy, distanceInterval, timeInterval },
          (next) => {
            setPosition(next);
            setError(null);
          },
          (failure) => setError(toError(failure)),
        );
      },
      (failure) => {
        if (active) setError(toError(failure));
      },
    );
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [adapter, enabled, accuracy, distanceInterval, timeInterval]);

  return { position, error };
}
