import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { AppState, Linking } from "react-native";

import { useDeviceAdapter } from "../core/adapters";
import { isLocationError, LocationError } from "../core/geo";
import {
  createPermissionStore,
  usePermissionSnapshot,
  type PermissionStore,
} from "../core/permissionStore";
import { UNKNOWN, UNSUPPORTED } from "../core/permissions";
import type { PermissionState, Unsubscribe } from "../core/types";
import { expoBackgroundLocationAdapter } from "./expo";
import { checkOptions } from "./options";
import { checkTaskName, isLocationTaskDefined } from "./tasks";
import type {
  BackgroundLocationAdapter,
  BackgroundLocationOptions,
} from "./types";

/** The provided adapter, or expo-location's. */
export function useBackgroundLocationAdapter(): BackgroundLocationAdapter {
  return (
    useDeviceAdapter("backgroundLocation") ?? expoBackgroundLocationAdapter
  );
}

function toError(error: unknown): LocationError {
  if (isLocationError(error)) return error;
  return new LocationError(
    "unavailable",
    error instanceof Error ? error.message : undefined,
    error,
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
  let store = permissionStores.get(adapter);
  if (!store) {
    store = createPermissionStore({
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
    });
    permissionStores.set(adapter, store);
  }
  return store;
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
  const state = usePermissionSnapshot(store);

  return {
    ...(state ?? UNKNOWN),
    isLoading: state === null,
    request: store.request,
    refresh: store.refresh,
    openSettings: () => Linking.openSettings(),
  };
}

interface RunningStore {
  getSnapshot(): boolean | null;
  subscribe(listener: () => void): Unsubscribe;
  refresh(): Promise<boolean>;
  set(running: boolean): void;
}

function createRunningStore(
  adapter: BackgroundLocationAdapter,
  name: string,
): RunningStore {
  let running: boolean | null = null;
  let pending: Promise<boolean> | null = null;
  // Bumped by every start and stop: a read that began before one is stale.
  let version = 0;
  const listeners = new Set<() => void>();

  function apply(next: boolean) {
    if (running === next) return;
    running = next;
    listeners.forEach((listener) => listener());
  }

  return {
    getSnapshot: () => running,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    refresh() {
      if (!pending) {
        const at = version;
        const read = adapter.isSupported()
          ? adapter.hasStarted(name)
          : Promise.resolve(false);
        pending = read
          .then((next) => {
            if (version === at) apply(next);
            return next;
          })
          .finally(() => {
            pending = null;
          });
      }
      return pending;
    },
    set(next) {
      version++;
      apply(next);
    },
  };
}

const runningStores = new WeakMap<
  BackgroundLocationAdapter,
  Map<string, RunningStore>
>();

function getRunningStore(
  adapter: BackgroundLocationAdapter,
  name: string,
): RunningStore {
  let byName = runningStores.get(adapter);
  if (!byName) {
    byName = new Map();
    runningStores.set(adapter, byName);
  }
  let store = byName.get(name);
  if (!store) {
    store = createRunningStore(adapter, name);
    byName.set(name, store);
  }
  return store;
}

const subscribeNothing = () => () => {};
const getServerValue = () => null;

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
  const store = getRunningStore(adapter, name);

  const getSupport = useCallback(() => adapter.isSupported(), [adapter]);
  const isSupported = useSyncExternalStore(
    subscribeNothing,
    getSupport,
    getServerValue,
  );
  const isRunning = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    getServerValue,
  );

  useEffect(() => {
    const refresh = () => {
      store.refresh().catch(() => {});
    };
    if (store.getSnapshot() === null) refresh();
    // The system may have stopped them meanwhile (a revoked permission).
    const subscription = AppState.addEventListener("change", (next) => {
      if (next === "active") refresh();
    });
    return () => subscription.remove();
  }, [store]);

  const start = useCallback(
    async (options: BackgroundLocationOptions) => {
      const checked = checkOptions(options);
      if (!adapter.isSupported()) throw new LocationError("unsupported");
      if (!isLocationTaskDefined(name)) {
        throw new Error(
          `useBackgroundLocation("${name}").start(): no task "${name}". Call defineLocationTask("${name}", handler) at module scope first.`,
        );
      }
      const foreground = await adapter.getForegroundPermission();
      if (foreground.status === "unsupported") {
        throw new LocationError("unsupported");
      }
      if (foreground.status !== "granted") {
        throw new LocationError(
          "permission-denied",
          "Background updates need the foreground location permission first.",
        );
      }
      if (!(await adapter.hasServicesEnabled())) {
        throw new LocationError("services-disabled");
      }
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
