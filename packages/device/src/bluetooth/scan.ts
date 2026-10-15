import { useSyncExternalStore } from "react";
import { AppState, type NativeEventSubscription } from "react-native";

import type { Unsubscribe } from "../core/types";
import { BluetoothError, isBluetoothError } from "./errors";
import {
  ensureBluetoothReady,
  getStateStore,
  useBluetoothAdapter,
} from "./hooks";
import type {
  BluetoothAdapter,
  BluetoothDevice,
  BluetoothScanRequest,
} from "./types";
import { toBluetoothUuid } from "./uuid";

export interface BluetoothScanOptions {
  /**
   * Only devices advertising one of these services, as SIG short forms
   * (`"180D"`) or 128-bit UUIDs. All devices when absent: slower to sift,
   * and iOS finds no device advertising nothing but a name in the background.
   */
  services?: string[];
  /**
   * Stop after this many milliseconds (default 10000); `0` scans until
   * `stop()`. A scan costs battery: keep it as short as the screen needs.
   */
  timeout?: number;
}

/** A device a scan found, with when it was first and last heard. */
export interface ScannedDevice extends BluetoothDevice {
  firstSeen: number;
  lastSeen: number;
}

export interface BluetoothScanSnapshot {
  /** Every device heard since `start()`, once each, in the order first heard. */
  devices: ScannedDevice[];
  /** True from `start()` until the scan ends (also while paused in the background). */
  isScanning: boolean;
  /** Why the latest scan could not start or stopped early; `null` otherwise. */
  error: BluetoothError | null;
}

export const DEFAULT_SCAN_TIMEOUT = 10_000;
// Advertisements arrive many times a second per device: the list renders at
// most this often.
export const SCAN_UPDATE_INTERVAL = 250;

const IDLE: BluetoothScanSnapshot = {
  devices: [],
  isScanning: false,
  error: null,
};

interface Running {
  request: BluetoothScanRequest;
  /** When the timeout ends it, `null` without one. */
  endsAt: number | null;
  /** The time left when it was paused in the background. */
  remaining: number | null;
  paused: boolean;
}

interface ScanStore {
  getSnapshot(): BluetoothScanSnapshot;
  subscribe(listener: () => void): Unsubscribe;
  start(options?: BluetoothScanOptions): Promise<void>;
  stop(): Promise<void>;
  clear(): void;
}

function toRequest(options: BluetoothScanOptions): {
  request: BluetoothScanRequest;
  timeout: number;
} {
  const { services = [], timeout = DEFAULT_SCAN_TIMEOUT } = options;
  if (!Array.isArray(services)) {
    throw new TypeError(
      "useBluetoothScan().start(): services must be an array of UUIDs.",
    );
  }
  if (typeof timeout !== "number" || !(timeout >= 0) || timeout === Infinity) {
    throw new RangeError(
      `useBluetoothScan().start(): timeout must be 0 or more milliseconds, got ${String(timeout)}.`,
    );
  }
  return {
    request: { services: [...new Set(services.map(toBluetoothUuid))] },
    timeout,
  };
}

function toError(error: unknown): BluetoothError {
  return isBluetoothError(error)
    ? error
    : new BluetoothError("failed", String(error), error);
}

/**
 * One scan per adapter, as the platform has one: a `start()` from any
 * component replaces the running scan, and every component sees the same
 * list. It pauses while the app is in the background and resumes for the
 * time it had left, ends when the radio goes off, and stops once no
 * component reads it.
 */
function createScanStore(adapter: BluetoothAdapter): ScanStore {
  let snapshot = IDLE;
  let session = 0;
  let running: Running | null = null;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let appState: NativeEventSubscription | null = null;
  let radio: Unsubscribe | null = null;
  const devices = new Map<string, ScannedDevice>();
  const listeners = new Set<() => void>();
  let lastFlush = 0;
  let flushTimer: ReturnType<typeof setTimeout> | null = null;

  function set(next: Partial<BluetoothScanSnapshot>) {
    snapshot = { ...snapshot, ...next };
    listeners.forEach((listener) => listener());
  }

  function flush() {
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = null;
    lastFlush = Date.now();
    set({ devices: [...devices.values()] });
  }

  /** Empties the list; the next device then shows at once. */
  function reset() {
    devices.clear();
    flush();
    lastFlush = 0;
  }

  function scheduleFlush() {
    if (flushTimer) return;
    const wait = lastFlush + SCAN_UPDATE_INTERVAL - Date.now();
    if (wait <= 0) flush();
    else flushTimer = setTimeout(flush, wait);
  }

  function onDevice(id: number, device: BluetoothDevice) {
    if (id !== session) return;
    const now = Date.now();
    const known = devices.get(device.id);
    devices.set(device.id, {
      ...device,
      // A repeat may carry less (a scan response without the name).
      name: device.name ?? known?.name ?? null,
      firstSeen: known?.firstSeen ?? now,
      lastSeen: now,
    });
    scheduleFlush();
  }

  function release() {
    if (timer) clearTimeout(timer);
    timer = null;
    appState?.remove();
    appState = null;
    radio?.();
    radio = null;
    running = null;
  }

  /** Ends the current scan here (the platform's side is the caller's). */
  function finish(error: BluetoothError | null) {
    session++;
    release();
    flush();
    set({ isScanning: false, error });
  }

  function armTimer(id: number, ms: number) {
    timer = setTimeout(() => {
      if (id === session) void stop();
    }, ms);
  }

  async function launch(id: number, request: BluetoothScanRequest) {
    await ensureBluetoothReady(adapter);
    if (id !== session) return;
    await adapter.startScan(request, {
      onDevice: (device) => onDevice(id, device),
      onStop: (error) => {
        if (id === session) finish(error);
      },
    });
  }

  function pause() {
    if (!running || running.paused) return;
    running.paused = true;
    running.remaining =
      running.endsAt === null ? null : Math.max(0, running.endsAt - Date.now());
    if (timer) clearTimeout(timer);
    timer = null;
    adapter.stopScan().catch(() => {});
  }

  function resume(id: number) {
    if (!running?.paused) return;
    const { request, remaining } = running;
    running.paused = false;
    if (remaining === 0) {
      finish(null);
      return;
    }
    running.endsAt = remaining === null ? null : Date.now() + remaining;
    launch(id, request).then(
      () => {
        if (id === session && remaining !== null) armTimer(id, remaining);
      },
      (error) => {
        if (id === session) finish(toError(error));
      },
    );
  }

  function watch(id: number) {
    appState = AppState.addEventListener("change", (next) => {
      if (id !== session) return;
      // Not on `inactive`: iOS passes through it for a pulled-down notification.
      if (next === "background") pause();
      else if (next === "active") resume(id);
    });
    const radioStore = getStateStore(adapter);
    radio = radioStore.subscribe(() => {
      if (id !== session || running?.paused) return;
      const state = radioStore.getSnapshot();
      if (state === "off") finish(new BluetoothError("powered-off"));
      else if (state === "unauthorized") {
        finish(new BluetoothError("permission-denied"));
      }
    });
  }

  async function stop() {
    const wasRunning = running !== null || snapshot.isScanning;
    finish(null);
    if (wasRunning) await adapter.stopScan();
  }

  async function start(options: BluetoothScanOptions = {}) {
    const { request, timeout } = toRequest(options);
    // The adapter's startScan replaces a running scan by itself.
    session++;
    const id = session;
    release();
    reset();
    set({ isScanning: true, error: null });
    try {
      await launch(id, request);
    } catch (error) {
      const failure = toError(error);
      if (id === session) finish(failure);
      throw failure;
    }
    if (id !== session) return;
    running = {
      request,
      endsAt: timeout > 0 ? Date.now() + timeout : null,
      remaining: null,
      paused: false,
    };
    if (timeout > 0) armTimer(id, timeout);
    watch(id);
  }

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        // A reader replaced in the same commit must not stop the scan.
        queueMicrotask(() => {
          if (listeners.size === 0 && snapshot.isScanning) {
            stop().catch(() => {});
          }
        });
      };
    },
    start,
    stop,
    clear: reset,
  };
}

const stores = new WeakMap<BluetoothAdapter, ScanStore>();

function getScanStore(adapter: BluetoothAdapter): ScanStore {
  let store = stores.get(adapter);
  if (!store) {
    store = createScanStore(adapter);
    stores.set(adapter, store);
  }
  return store;
}

const getServerSnapshot = () => IDLE;

export interface UseBluetoothScan extends BluetoothScanSnapshot {
  /**
   * Starts a scan, replacing any running one and clearing the list. Checks
   * the permission and the radio first (never prompts) and rejects with the
   * `BluetoothError` that stops it; a `TypeError` / `RangeError` for bad
   * options.
   */
  start: (options?: BluetoothScanOptions) => Promise<void>;
  stop: () => Promise<void>;
  /** Empties the list; a running scan fills it again. */
  clear: () => void;
}

/**
 * Scans for Bluetooth Low Energy devices. One scan runs per app: every
 * component using the hook shares it and its list, and it stops when the
 * last one unmounts.
 */
export function useBluetoothScan(): UseBluetoothScan {
  const store = getScanStore(useBluetoothAdapter());
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    getServerSnapshot,
  );
  return {
    ...snapshot,
    start: store.start,
    stop: store.stop,
    clear: store.clear,
  };
}
