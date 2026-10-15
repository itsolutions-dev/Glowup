import { useCallback, useMemo } from "react";

import { useDeviceAdapter } from "../core/adapters";
import { LocationError, toError } from "../core/geo";
import {
  createPermissionStore,
  toPermissionHook,
  usePermissionSnapshot,
  type PermissionStore,
} from "../core/permissionStore";
import { UNKNOWN, UNSUPPORTED } from "../core/permissions";
import { getOrCreate, useClientValue } from "../core/shared";
import type { PermissionState } from "../core/types";
import { expoBackgroundLocationAdapter } from "./expo";
import { checkOptions } from "./options";
import { checkRegions } from "./regions";
import { checkTaskName, isTaskDefined, type TaskKind } from "./tasks";
import type {
  BackgroundLocationAdapter,
  BackgroundLocationOptions,
  GeofenceRegion,
} from "./types";

/** The provided adapter, or expo-location's. */
export function useBackgroundLocationAdapter(): BackgroundLocationAdapter {
  return (
    useDeviceAdapter("backgroundLocation") ?? expoBackgroundLocationAdapter
  );
}

// One store per adapter, so every component sees the same answer.
const permissionStores = new WeakMap<
  BackgroundLocationAdapter,
  PermissionStore<PermissionState>
>();

function getPermissionStore(
  adapter: BackgroundLocationAdapter,
): PermissionStore<PermissionState> {
  return getOrCreate(permissionStores, adapter, () =>
    createPermissionStore({
      isSupported: () => adapter.isSupported(),
      read: () => adapter.getPermission(),
      // Only after the foreground permission: iOS would show the foreground
      // prompt instead, and Android 11+ refuses at once.
      async request() {
        const foreground = await adapter.getForegroundPermission();
        if (foreground.status !== "granted") return adapter.getPermission();
        return adapter.requestPermission();
      },
      unsupported: UNSUPPORTED,
      unknown: UNKNOWN,
    }),
  );
}

export interface UseBackgroundLocationPermission extends PermissionState {
  /** True until the first read answers (`status` reads `"undetermined"` meanwhile). */
  isLoading: boolean;
  /**
   * Asks for "Always" (iOS) / "Allow all the time" (Android). Does nothing
   * until the foreground permission is granted: ask for that first. iOS shows
   * the upgrade prompt once per install, and Android 11+ opens the app's
   * settings page instead of a dialog; after that, `openSettings()`.
   */
  request: () => Promise<PermissionState>;
  /** Re-reads the state. The hook already does this when the app returns to the foreground. */
  refresh: () => Promise<PermissionState>;
  /** Opens this app's page in the system settings. */
  openSettings: () => Promise<void>;
}

/**
 * The background location permission. Android needs it only for updates
 * without a foreground service; iOS, to relaunch the app for updates after
 * it was terminated. Before it is asked, iOS reads `undetermined` on every
 * launch, even after the user answered on an earlier one.
 */
export function useBackgroundLocationPermission(): UseBackgroundLocationPermission {
  const store = getPermissionStore(useBackgroundLocationAdapter());
  return toPermissionHook(store, usePermissionSnapshot(store), UNKNOWN);
}

// One store per adapter, kind and name, so every component agrees. It is
// read on mount and on every return to the foreground (the system may have
// stopped it meanwhile: a revoked permission); a read that began before a
// `start` / `stop` is dropped.
const runningStores = new WeakMap<
  BackgroundLocationAdapter,
  Map<string, PermissionStore<boolean>>
>();

function getRunningStore(
  adapter: BackgroundLocationAdapter,
  kind: TaskKind,
  name: string,
): PermissionStore<boolean> {
  const stores = getOrCreate(runningStores, adapter, () => new Map());
  return getOrCreate(stores, `${kind}:${name}`, () =>
    createPermissionStore({
      isSupported: () => adapter.isSupported(),
      read:
        kind === "location"
          ? () => adapter.hasStarted(name)
          : () => adapter.hasStartedGeofencing(name),
      unsupported: false,
    }),
  );
}

function useSupport(adapter: BackgroundLocationAdapter): boolean | null {
  return useClientValue(() => adapter.isSupported(), null);
}

function checkDefined(
  name: string,
  kind: TaskKind,
  api: string,
  define: string,
): void {
  if (!isTaskDefined(name, kind)) {
    throw new Error(
      `${api}: no ${kind} task "${name}". Call ${define}("${name}", handler) at module scope first.`,
    );
  }
}

/** Support, then the foreground permission and the services: what both kinds need. */
async function ensureLocationReady(
  adapter: BackgroundLocationAdapter,
): Promise<void> {
  const foreground = await adapter.getForegroundPermission();
  if (foreground.status === "unsupported") {
    throw new LocationError("unsupported");
  }
  if (foreground.status !== "granted") {
    throw new LocationError(
      "permission-denied",
      "Background location needs the foreground location permission first.",
    );
  }
  if (!(await adapter.hasServicesEnabled())) {
    throw new LocationError("services-disabled");
  }
}

export interface UseBackgroundLocation {
  /** `null` while a static page hydrates; `false` on the web. */
  isSupported: boolean | null;
  /**
   * Whether updates run under this name, started by this launch or an
   * earlier one (they survive the app: stop them explicitly). `null` until
   * the first read.
   */
  isRunning: boolean | null;
  /**
   * Starts the updates, or changes the options of running ones. Never
   * prompts. Rejects with a `LocationError`: `unsupported` (the web, or a
   * build without `backgroundLocation` in the config plugin),
   * `permission-denied` (the foreground permission; on Android without a
   * foreground service, the background one), `services-disabled`,
   * `unavailable` (on Android, a foreground service asked for while the app
   * is in the background). A `TypeError` for invalid options, an `Error` when
   * no task of that name was defined.
   */
  start: (options: BackgroundLocationOptions) => Promise<void>;
  /** Stops the updates; resolves too when none were running. */
  stop: () => Promise<void>;
  /** Re-reads `isRunning`. The hook does it on mount and on every return to the foreground. */
  refresh: () => Promise<boolean>;
}

/**
 * Starts and stops the background updates delivered to the task `name`
 * (see `defineLocationTask`). Every component using the same name shares
 * one state.
 */
export function useBackgroundLocation(name: string): UseBackgroundLocation {
  checkTaskName(name, "useBackgroundLocation()");
  const adapter = useBackgroundLocationAdapter();
  const store = getRunningStore(adapter, "location", name);
  const isSupported = useSupport(adapter);
  const isRunning = usePermissionSnapshot(store);

  const start = useCallback(
    async (options: BackgroundLocationOptions) => {
      const checked = checkOptions(options);
      if (!adapter.isSupported()) throw new LocationError("unsupported");
      checkDefined(
        name,
        "location",
        `useBackgroundLocation("${name}").start()`,
        "defineLocationTask",
      );
      await ensureLocationReady(adapter);
      try {
        await adapter.start(name, checked);
      } catch (error) {
        throw toError(error);
      }
      store.set(true);
    },
    [adapter, name, store],
  );

  const stop = useCallback(async () => {
    if (!adapter.isSupported()) return;
    try {
      await adapter.stop(name);
    } catch (error) {
      throw toError(error);
    }
    store.set(false);
  }, [adapter, name, store]);

  return useMemo(
    () => ({ isSupported, isRunning, start, stop, refresh: store.refresh }),
    [isSupported, isRunning, start, stop, store],
  );
}

export interface UseGeofencing {
  /** `null` while a static page hydrates; `false` on the web. */
  isSupported: boolean | null;
  /** Whether regions are watched under this name. `null` until the first read. */
  isRunning: boolean | null;
  /** How many regions the platform watches for the app at once (20 on iOS, 100 on Android). */
  limit: number;
  /**
   * Watches `regions`, replacing what this name watched before. Never
   * prompts. Rejects with a `LocationError`: `unsupported`,
   * `permission-denied` (the foreground permission, then the background one:
   * geofencing needs both on every platform), `services-disabled`. A
   * `TypeError` for an invalid region, a `RangeError` for more than `limit`,
   * an `Error` when no geofence task of that name was defined.
   */
  start: (regions: GeofenceRegion[]) => Promise<void>;
  /** Stops watching; resolves too when nothing was watched. */
  stop: () => Promise<void>;
  /** Re-reads `isRunning`. The hook does it on mount and on every return to the foreground. */
  refresh: () => Promise<boolean>;
}

/**
 * Watches circular regions and reports entering and leaving them to the
 * task `name` (see `defineGeofenceTask`), with the app in the background or
 * not running. The regions outlive the app: stop them explicitly. The limit
 * is the app's, shared by every name.
 */
export function useGeofencing(name: string): UseGeofencing {
  checkTaskName(name, "useGeofencing()");
  const adapter = useBackgroundLocationAdapter();
  const store = getRunningStore(adapter, "geofence", name);
  const isSupported = useSupport(adapter);
  const isRunning = usePermissionSnapshot(store);

  const start = useCallback(
    async (regions: GeofenceRegion[]) => {
      const checked = checkRegions(regions, adapter.geofenceLimit);
      if (!adapter.isSupported()) throw new LocationError("unsupported");
      checkDefined(
        name,
        "geofence",
        `useGeofencing("${name}").start()`,
        "defineGeofenceTask",
      );
      await ensureLocationReady(adapter);
      const background = await adapter.getPermission();
      if (background.status !== "granted") {
        throw new LocationError(
          "permission-denied",
          "Geofencing needs the background location permission (useBackgroundLocationPermission).",
        );
      }
      try {
        await adapter.startGeofencing(name, checked);
      } catch (error) {
        throw toError(error);
      }
      store.set(true);
    },
    [adapter, name, store],
  );

  const stop = useCallback(async () => {
    if (!adapter.isSupported()) return;
    try {
      await adapter.stopGeofencing(name);
    } catch (error) {
      throw toError(error);
    }
    store.set(false);
  }, [adapter, name, store]);

  return useMemo(
    () => ({
      isSupported,
      isRunning,
      limit: adapter.geofenceLimit,
      start,
      stop,
      refresh: store.refresh,
    }),
    [adapter, isSupported, isRunning, start, stop, store],
  );
}
