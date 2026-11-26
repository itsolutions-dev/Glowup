import { useSyncExternalStore } from "react";

import { createEmitter, getOrCreate } from "../core/shared";
import type { Unsubscribe } from "../core/types";
import {
  createThrottle,
  getRfidEngine,
  type RfidEngine,
  type RfidMode,
} from "./engine";
import { type RfidError, toRfidError } from "./errors";
import { useRfidAdapter } from "./hooks";
import { normalizeEpc, requireBounds, requireEpc, toProximity } from "./tags";
import type { RfidProximityBounds } from "./types";

export interface RfidLocateOptions {
  /** Calibrated bounds; the adapter's `proximityBounds` when absent. */
  proximity?: RfidProximityBounds;
}

export interface RfidLocateSnapshot {
  /** The EPC searched for (uppercase hex); `null` before `start()`. */
  epc: string | null;
  isLocating: boolean;
  /** Whether the reader heard the tag in the last 2 seconds. */
  isInRange: boolean;
  /** The tag's smoothed signal in dBm; `null` while out of range. */
  rssi: number | null;
  /** 0–1 while in range, 0 out of it: drive a gauge or a beep with it. */
  proximity: number;
  /** When the reader last heard the tag. */
  lastSeen: number | null;
  /** Why the latest search could not start or stopped early; `null` otherwise. */
  error: RfidError | null;
}

// A gauge follows a hand's movement: it renders at most this often.
export const LOCATE_UPDATE_INTERVAL = 100;
/** A tag not heard for this long reads out of range. */
export const LOCATE_LOST_AFTER = 2_000;
// The search follows the hand: a read moves the average more than in an inventory.
const LOCATE_SMOOTHING = 0.5;

const IDLE: RfidLocateSnapshot = {
  epc: null,
  isLocating: false,
  isInRange: false,
  rssi: null,
  proximity: 0,
  lastSeen: null,
  error: null,
};

interface LocateStore {
  getSnapshot(): RfidLocateSnapshot;
  subscribe(listener: () => void): Unsubscribe;
  start(epc: string, options?: RfidLocateOptions): Promise<void>;
  stop(): Promise<void>;
}

function createLocateStore(engine: RfidEngine): LocateStore {
  const { adapter } = engine;
  let snapshot = IDLE;
  const emitter = createEmitter();
  let current: RfidMode | null = null;
  let bounds = adapter.proximityBounds;
  let average: number | null = null;
  let lastSeen: number | null = null;
  let sweep: ReturnType<typeof setInterval> | null = null;

  function set(next: Partial<RfidLocateSnapshot>) {
    snapshot = { ...snapshot, ...next };
    emitter.emit();
  }

  const render = createThrottle(LOCATE_UPDATE_INTERVAL, () => {
    const inRange =
      average !== null &&
      lastSeen !== null &&
      Date.now() - lastSeen <= LOCATE_LOST_AFTER;
    set({
      isInRange: inRange,
      rssi: inRange ? average : null,
      proximity: inRange ? toProximity(average!, bounds) : 0,
      lastSeen,
    });
  });

  function onValue(mode: RfidMode, rssi: number) {
    if (current !== mode || !Number.isFinite(rssi)) return;
    // A tag back in range starts a new average.
    const lost = lastSeen === null || Date.now() - lastSeen > LOCATE_LOST_AFTER;
    average =
      average === null || lost
        ? rssi
        : average + LOCATE_SMOOTHING * (rssi - average);
    lastSeen = Date.now();
    render.schedule();
  }

  function end(mode: RfidMode, error: RfidError | null) {
    if (current !== mode) return;
    current = null;
    if (sweep) clearInterval(sweep);
    sweep = null;
    render.reset();
    average = null;
    set({
      isLocating: false,
      isInRange: false,
      rssi: null,
      proximity: 0,
      error,
    });
  }

  async function start(epc: string, options: RfidLocateOptions = {}) {
    const target = requireEpc(epc, "useRfidLocate().start()");
    const nextBounds = requireBounds(
      options.proximity ?? adapter.proximityBounds,
      "useRfidLocate().start()",
    );
    const native =
      adapter.startLocate && adapter.stopLocate
        ? {
            start: adapter.startLocate.bind(adapter),
            stop: adapter.stopLocate.bind(adapter),
          }
        : null;

    let starting: Promise<void> | null = null;
    const mode: RfidMode = {
      end: (error) => end(mode, error),
      async stop() {
        if (!starting) return;
        await starting.catch(() => {});
        await (native ? native.stop() : adapter.stopInventory());
      },
    };
    current = mode;
    bounds = nextBounds;
    average = null;
    lastSeen = null;
    render.reset();
    if (sweep) clearInterval(sweep);
    sweep = null;
    set({ ...IDLE, epc: target, isLocating: true });

    const handlers = {
      onStop: (error: RfidError | null) => engine.finish(mode, error),
    };
    try {
      await engine.begin(mode);
      starting = native
        ? native.start(target, {
            ...handlers,
            onValue: (rssi) => onValue(mode, rssi),
          })
        : // Emulated: an inventory that keeps the searched tag's strongest read.
          adapter.startInventory(
            { tid: false },
            {
              ...handlers,
              onTags(reads) {
                let strongest = -Infinity;
                for (const read of reads) {
                  if (normalizeEpc(read.epc) === target) {
                    strongest = Math.max(strongest, read.rssi);
                  }
                }
                if (strongest > -Infinity) onValue(mode, strongest);
              },
            },
          );
      await starting;
    } catch (error) {
      const failure = toRfidError(error);
      engine.abandon(mode);
      end(mode, failure);
      throw failure;
    }
    if (current !== mode) return;
    // The tag going out of range is the absence of reads: look for it.
    sweep = setInterval(() => {
      if (current === mode && snapshot.isInRange) render.schedule();
    }, LOCATE_LOST_AFTER / 4);
  }

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      const unsubscribe = emitter.subscribe(listener);
      return () => {
        unsubscribe();
        queueMicrotask(() => {
          if (emitter.size() === 0 && current) {
            engine.stop(current).catch(() => {});
          }
        });
      };
    },
    start,
    async stop() {
      if (current) await engine.stop(current);
    },
  };
}

const stores = new WeakMap<RfidEngine, LocateStore>();

const getServerSnapshot = () => IDLE;

export interface UseRfidLocate extends RfidLocateSnapshot {
  /**
   * Searches for one tag by its EPC (hex; separators and case are
   * ignored) until `stop()`, replacing the running mode. Uses the reader's
   * own tag finder when it has one (it beeps faster as the tag nears),
   * an inventory filtered by the EPC otherwise. A `TypeError` for an EPC
   * that is not hex in 16-bit words.
   */
  start: (epc: string, options?: RfidLocateOptions) => Promise<void>;
  stop: () => Promise<void>;
}

/** The single search: how near one given tag is, as the reader moves. */
export function useRfidLocate(): UseRfidLocate {
  const engine = getRfidEngine(useRfidAdapter());
  const store = getOrCreate(stores, engine, () => createLocateStore(engine));
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    getServerSnapshot,
  );
  return { ...snapshot, start: store.start, stop: store.stop };
}
