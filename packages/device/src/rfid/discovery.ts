import { useSyncExternalStore } from "react";
import { AppState, type NativeEventSubscription } from "react-native";

import { createEmitter, getOrCreate } from "../core/shared";
import type { Unsubscribe } from "../core/types";
import { createThrottle, getRfidEngine, type RfidEngine } from "./engine";
import { RfidError, toRfidError } from "./errors";
import { useRfidAdapter } from "./hooks";
import type { RfidDiscoveredReader } from "./types";

export interface RfidDiscoveryOptions {
  /** Stop after this many ms (default 10000); `0` searches until `stop()`. */
  timeout?: number;
}

/** A reader the search found, with when it was last heard. */
export interface DiscoveredRfidReader extends RfidDiscoveredReader {
  lastSeen: number;
}

export interface RfidDiscoverySnapshot {
  /** Every reader found since `start()`, once each, in the order found. */
  readers: DiscoveredRfidReader[];
  isDiscovering: boolean;
  error: RfidError | null;
}

export const DEFAULT_DISCOVERY_TIMEOUT = 10_000;
const DISCOVERY_UPDATE_INTERVAL = 250;

const IDLE: RfidDiscoverySnapshot = {
  readers: [],
  isDiscovering: false,
  error: null,
};

interface DiscoveryStore {
  getSnapshot(): RfidDiscoverySnapshot;
  subscribe(listener: () => void): Unsubscribe;
  start(options?: RfidDiscoveryOptions): Promise<void>;
  stop(): Promise<void>;
}

/**
 * The search for readers, apart from the modes: it needs no connection and
 * may run beside one. It stops at its timeout, in the background, and when
 * no component reads it.
 */
function createDiscoveryStore(engine: RfidEngine): DiscoveryStore {
  const { adapter } = engine;
  let snapshot = IDLE;
  const emitter = createEmitter();
  const readers = new Map<string, DiscoveredRfidReader>();
  let session = 0;
  let running = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let appState: NativeEventSubscription | null = null;

  function set(next: Partial<RfidDiscoverySnapshot>) {
    snapshot = { ...snapshot, ...next };
    emitter.emit();
  }

  const render = createThrottle(DISCOVERY_UPDATE_INTERVAL, () =>
    set({ readers: [...readers.values()] }),
  );

  function finish(error: RfidError | null) {
    session++;
    running = false;
    if (timer) clearTimeout(timer);
    timer = null;
    appState?.remove();
    appState = null;
    render.now();
    set({ isDiscovering: false, error });
  }

  async function stop() {
    if (!snapshot.isDiscovering) return;
    const wasRunning = running;
    finish(null);
    if (wasRunning) await adapter.stopDiscovery?.();
  }

  async function start({
    timeout = DEFAULT_DISCOVERY_TIMEOUT,
  }: RfidDiscoveryOptions = {}) {
    if (
      typeof timeout !== "number" ||
      !(timeout >= 0) ||
      timeout === Infinity
    ) {
      throw new RangeError(
        `useRfidReaderDiscovery().start(): timeout must be 0 or more milliseconds, got ${String(timeout)}.`,
      );
    }
    if (running) await stop();
    const id = ++session;
    readers.clear();
    render.now();
    render.reset();
    set({ isDiscovering: true, error: null });
    try {
      if (!adapter.startDiscovery || !adapter.stopDiscovery) {
        throw new RfidError(
          "unsupported",
          `The ${adapter.vendor} RFID adapter cannot search for readers: check capabilities.discovery and connect by id.`,
        );
      }
      await engine.ensureReady({ connected: false });
      if (id !== session) return;
      running = true;
      await adapter.startDiscovery({
        onReader(reader) {
          if (id !== session) return;
          readers.set(reader.id, { ...reader, lastSeen: Date.now() });
          render.schedule();
        },
        onStop: (error) => {
          if (id === session) finish(error);
        },
      });
    } catch (error) {
      const failure = toRfidError(error);
      if (id === session) finish(failure);
      throw failure;
    }
    if (id !== session) return;
    if (timeout > 0) timer = setTimeout(() => void stop(), timeout);
    appState = AppState.addEventListener("change", (next) => {
      if (next === "background" && id === session) void stop();
    });
  }

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      const unsubscribe = emitter.subscribe(listener);
      return () => {
        unsubscribe();
        queueMicrotask(() => {
          if (emitter.size() === 0) stop().catch(() => {});
        });
      };
    },
    start,
    stop,
  };
}

const stores = new WeakMap<RfidEngine, DiscoveryStore>();

const getServerSnapshot = () => IDLE;

export interface UseRfidReaderDiscovery extends RfidDiscoverySnapshot {
  /**
   * Searches for readers to connect to, clearing the list. Rejects with
   * `unsupported` when the adapter cannot search (connect by a known id
   * then), or the `RfidError` naming what is missing.
   */
  start: (options?: RfidDiscoveryOptions) => Promise<void>;
  stop: () => Promise<void>;
}

/** Readers nearby, for a picker; `capabilities.discovery` says whether the adapter can search. */
export function useRfidReaderDiscovery(): UseRfidReaderDiscovery {
  const engine = getRfidEngine(useRfidAdapter());
  const store = getOrCreate(stores, engine, () => createDiscoveryStore(engine));
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    getServerSnapshot,
  );
  return { ...snapshot, start: store.start, stop: store.stop };
}
