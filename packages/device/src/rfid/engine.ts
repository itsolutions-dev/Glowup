import { AppState, type NativeEventSubscription } from "react-native";

import { createLiveStore, type LiveStore } from "../core/liveStore";
import { UNKNOWN, UNSUPPORTED } from "../core/permissions";
import {
  createPermissionStore,
  type PermissionStore,
} from "../core/permissionStore";
import { createEmitter, getOrCreate } from "../core/shared";
import type { PermissionState, Unsubscribe } from "../core/types";
import { isCompatibleRfidAdapter } from "./adapter";
import { RfidError, toRfidError } from "./errors";
import {
  RFID_CONTRACT_VERSION,
  type RfidAdapter,
  type RfidBeeperVolume,
  type RfidConnection,
  type RfidReaderInfo,
  type RfidSettings,
  type RfidSettingsPatch,
} from "./types";

export const DEFAULT_CONNECT_TIMEOUT = 20_000;

const DISCONNECTED: RfidConnection = { state: "disconnected", readerId: null };

const BEEPER_VOLUMES: readonly RfidBeeperVolume[] = [
  "off",
  "low",
  "medium",
  "high",
];

/**
 * A mode the reader runs: an inventory, a single read or a locate. The
 * engine runs one at a time per adapter.
 */
export interface RfidMode {
  /** Ends the mode's own state, with why (`null`: stopped or replaced). */
  end(error: RfidError | null): void;
  /** Stops the reader's side: awaits the start first, then stops it. */
  stop(): Promise<void>;
}

export interface ConnectOptions {
  /** Give up after this many ms (default 20000). */
  timeout?: number;
}

export interface RfidEngine {
  adapter: RfidAdapter;
  connection: LiveStore<RfidConnection>;
  permission: PermissionStore<PermissionState>;
  /** The latest `connect()` failure; `null` once one succeeds or `disconnect()` runs. */
  getError(): RfidError | null;
  subscribeError(listener: () => void): Unsubscribe;
  connect(readerId: string, options?: ConnectOptions): Promise<void>;
  disconnect(): Promise<void>;
  getSettings(): Promise<RfidSettings>;
  setSettings(patch: RfidSettingsPatch): Promise<RfidSettings>;
  getBatteryLevel(): Promise<number | null>;
  getReaderInfo(): Promise<RfidReaderInfo | null>;
  /**
   * Supported, the contract's version, the permission and, with
   * `connected`, a connected reader: rejects with the `RfidError` naming
   * the first one missing. Never prompts.
   */
  ensureReady(options: { connected: boolean }): Promise<void>;
  /**
   * Makes `mode` the running one: ends the previous (and waits for the
   * reader to stop it), then checks the reader is ready. Rejects with
   * `cancelled` when another mode took over meanwhile; the caller then
   * calls `abandon()`.
   */
  begin(mode: RfidMode): Promise<void>;
  /** Whether `mode` still runs. */
  isActive(mode: RfidMode): boolean;
  /** The reader ended `mode` by itself: its state ends with `error`. */
  finish(mode: RfidMode, error: RfidError | null): void;
  /** The app stops `mode`: its state ends and the reader stops. */
  stop(mode: RfidMode): Promise<void>;
  /** `mode` reached its result: the reader stops, its state is the caller's. */
  complete(mode: RfidMode): Promise<void>;
  /** `begin()` failed: `mode` stops being the running one. */
  abandon(mode: RfidMode): void;
}

/** Rejects with `timeout` unless `promise` settles within `ms`. */
export function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message: string,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new RfidError("timeout", message)),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/** Runs an adapter call, its failures as `RfidError`s. */
async function call<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    throw toRfidError(error);
  }
}

function checkTimeout(timeout: unknown, caller: string): number {
  if (typeof timeout !== "number" || !(timeout > 0) || timeout === Infinity) {
    throw new RangeError(
      `${caller}: timeout must be more than 0 milliseconds, got ${String(timeout)}.`,
    );
  }
  return timeout;
}

function checkPatch(
  adapter: RfidAdapter,
  patch: RfidSettingsPatch,
): RfidSettingsPatch {
  const { power, session, beeperVolume } = patch;
  const { min, max } = adapter.powerRange;
  if (
    power !== undefined &&
    (typeof power !== "number" || !(power >= min && power <= max))
  ) {
    throw new RangeError(
      `setSettings(): power must be between ${min} and ${max} dBm on this reader, got ${String(power)}.`,
    );
  }
  if (session !== undefined && ![0, 1, 2, 3].includes(session)) {
    throw new RangeError(
      `setSettings(): session must be 0, 1, 2 or 3, got ${String(session)}.`,
    );
  }
  if (beeperVolume !== undefined && !BEEPER_VOLUMES.includes(beeperVolume)) {
    throw new RangeError(
      `setSettings(): beeperVolume must be one of ${BEEPER_VOLUMES.join(", ")}, got ${String(beeperVolume)}.`,
    );
  }
  return patch;
}

function createEngine(adapter: RfidAdapter): RfidEngine {
  const compatible = () =>
    adapter.isSupported() && isCompatibleRfidAdapter(adapter);

  const connection = createLiveStore<RfidConnection>({
    isSupported: compatible,
    read: () => adapter.getConnection(),
    subscribe: (listener) => adapter.subscribeConnection(listener),
    unsupported: DISCONNECTED,
  });

  const permission = createPermissionStore<PermissionState>({
    isSupported: () => adapter.isSupported(),
    read: () => adapter.getPermission(),
    request: () => adapter.requestPermission(),
    unsupported: UNSUPPORTED,
    unknown: UNKNOWN,
  });

  let error: RfidError | null = null;
  const errorEmitter = createEmitter();
  function setError(next: RfidError | null) {
    if (next === error) return;
    error = next;
    errorEmitter.emit();
  }

  async function ensureReady({ connected }: { connected: boolean }) {
    if (!adapter.isSupported()) throw new RfidError("unsupported");
    if (!isCompatibleRfidAdapter(adapter)) {
      throw new RfidError(
        "incompatible-adapter",
        `The ${adapter.vendor} RFID adapter implements contract version ${String(adapter.contractVersion)}, this @its/glowup-device implements ${RFID_CONTRACT_VERSION}: install versions that match.`,
      );
    }
    const state = await permission.refresh();
    if (state.status === "unsupported") throw new RfidError("unsupported");
    if (state.status !== "granted") {
      throw new RfidError(
        "permission-denied",
        state.status === "undetermined"
          ? "The RFID reader's permission was not asked for yet: call request() from useRfidPermission()."
          : undefined,
      );
    }
    if (!connected) return;
    const link = await connection.refresh();
    if (link.state !== "connected") {
      throw new RfidError(
        "not-connected",
        link.state === "disconnected"
          ? undefined
          : `The RFID reader is ${link.state}: wait until it is connected.`,
      );
    }
  }

  // The running mode, and the reader's side of the ones that ended, which
  // stop in order: a new mode starts only once the previous one stopped.
  let active: RfidMode | null = null;
  let stopping: Promise<void> = Promise.resolve();
  let watchers: Unsubscribe[] = [];

  function unwatch() {
    watchers.forEach((stop) => stop());
    watchers = [];
  }

  function deactivate(mode: RfidMode): boolean {
    if (active !== mode) return false;
    active = null;
    unwatch();
    return true;
  }

  function stopReader(mode: RfidMode): Promise<void> {
    stopping = stopping.then(() => mode.stop()).catch(() => {});
    return stopping;
  }

  function stop(mode: RfidMode): Promise<void> {
    if (!deactivate(mode)) return stopping;
    mode.end(null);
    return stopReader(mode);
  }

  function interrupt(error: RfidError | null) {
    const mode = active;
    if (!mode) return;
    deactivate(mode);
    mode.end(error);
    void stopReader(mode);
  }

  function watch(mode: RfidMode) {
    const app: NativeEventSubscription = AppState.addEventListener(
      "change",
      (next) => {
        // Not on `inactive`: iOS passes through it for a pulled-down notification.
        if (next === "background" && active === mode) interrupt(null);
      },
    );
    const link = connection.subscribe(() => {
      const state = connection.getSnapshot()?.state;
      if (active === mode && state !== undefined && state !== "connected") {
        interrupt(new RfidError("disconnected"));
      }
    });
    watchers.push(() => app.remove(), link);
  }

  async function begin(mode: RfidMode) {
    const previous = active;
    if (previous) {
      deactivate(previous);
      previous.end(null);
      void stopReader(previous);
    }
    active = mode;
    await stopping;
    if (active !== mode) throw new RfidError("cancelled");
    await ensureReady({ connected: true });
    if (active !== mode) throw new RfidError("cancelled");
    watch(mode);
  }

  let connectCount = 0;

  async function connect(
    readerId: string,
    { timeout = DEFAULT_CONNECT_TIMEOUT }: ConnectOptions = {},
  ) {
    if (typeof readerId !== "string" || readerId.trim() === "") {
      throw new TypeError("connect(): readerId must be a non-empty string.");
    }
    checkTimeout(timeout, "connect()");
    const id = ++connectCount;
    try {
      await ensureReady({ connected: false });
      const current = await connection.refresh();
      if (current.state === "connected" && current.readerId === readerId) {
        if (id === connectCount) setError(null);
        return;
      }
      interrupt(null);
      await stopping;
      await withTimeout(
        call(() => adapter.connect(readerId)),
        timeout,
        `The RFID reader ${readerId} did not connect within ${timeout} ms.`,
      ).catch(async (failure: unknown) => {
        if (failure instanceof RfidError && failure.code === "timeout") {
          await adapter.disconnect().catch(() => {});
        }
        throw failure;
      });
      if (id === connectCount) setError(null);
    } catch (failure) {
      const rfidError = toRfidError(failure);
      if (id === connectCount) setError(rfidError);
      throw rfidError;
    } finally {
      connection.refresh().catch(() => {});
    }
  }

  async function disconnect() {
    connectCount++;
    setError(null);
    interrupt(null);
    await stopping;
    try {
      await call(() => adapter.disconnect());
    } finally {
      connection.refresh().catch(() => {});
    }
  }

  return {
    adapter,
    connection,
    permission,
    getError: () => error,
    subscribeError: errorEmitter.subscribe,
    connect,
    disconnect,
    async getSettings() {
      await ensureReady({ connected: true });
      return call(() => adapter.getSettings());
    },
    async setSettings(patch) {
      checkPatch(adapter, patch);
      await ensureReady({ connected: true });
      return call(() => adapter.setSettings(patch));
    },
    async getBatteryLevel() {
      if (!adapter.getBatteryLevel) return null;
      await ensureReady({ connected: true });
      return call(() => adapter.getBatteryLevel!());
    },
    async getReaderInfo() {
      if (!adapter.getReaderInfo) return null;
      await ensureReady({ connected: true });
      return call(() => adapter.getReaderInfo!());
    },
    ensureReady,
    begin,
    isActive: (mode) => active === mode,
    finish(mode, failure) {
      if (deactivate(mode)) mode.end(failure);
    },
    stop,
    complete(mode) {
      return deactivate(mode) ? stopReader(mode) : stopping;
    },
    abandon(mode) {
      deactivate(mode);
    },
  };
}

const engines = new WeakMap<RfidAdapter, RfidEngine>();

/** The adapter's engine: one per adapter, shared by every hook. */
export function getRfidEngine(adapter: RfidAdapter): RfidEngine {
  return getOrCreate(engines, adapter, () => createEngine(adapter));
}

/**
 * Renders at most every `interval` ms; the first call after `reset()` at
 * once, so the first tag shows without waiting.
 */
export function createThrottle(interval: number, run: () => void) {
  let last = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  function now() {
    if (timer) clearTimeout(timer);
    timer = null;
    last = Date.now();
    run();
  }
  return {
    schedule() {
      if (timer) return;
      const wait = last + interval - Date.now();
      if (wait <= 0) now();
      else timer = setTimeout(now, wait);
    },
    now,
    reset() {
      if (timer) clearTimeout(timer);
      timer = null;
      last = 0;
    },
  };
}
