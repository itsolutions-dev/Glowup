import { useSyncExternalStore } from "react";

import { createEmitter, getOrCreate } from "../core/shared";
import type { Unsubscribe } from "../core/types";
import {
  createThrottle,
  getRfidEngine,
  type RfidEngine,
  type RfidMode,
} from "./engine";
import { RfidError, toRfidError } from "./errors";
import { useRfidAdapter } from "./hooks";
import { mergeRead, normalizeEpc, requireBounds } from "./tags";
import type { RfidProximityBounds, RfidTag, RfidTagRead } from "./types";

export interface RfidInventoryOptions {
  /** Read each tag's TID too: slower, and only when `capabilities.tid`. */
  tid?: boolean;
  /** Calibrated bounds; the adapter's `proximityBounds` when absent. */
  proximity?: RfidProximityBounds;
  /**
   * `"proximity"` (default): nearest first, so the order moves as the
   * reader does. `"first-seen"`: a steady order, for a list to pick from.
   */
  sort?: "proximity" | "first-seen";
  /** Drop a tag not heard for this many ms (out of range); `0` (default) keeps every tag. */
  forgetAfter?: number;
  /** Stop after this many ms; `0` (default) runs until `stop()`. */
  duration?: number;
}

export interface RfidInventorySnapshot {
  /** Every tag heard since `start()`, once each, merged. */
  tags: RfidTag[];
  isRunning: boolean;
  /** Why the latest inventory could not start or stopped early; `null` otherwise. */
  error: RfidError | null;
}

// Readers report hundreds of reads a second: the list renders at most this often.
export const INVENTORY_UPDATE_INTERVAL = 250;
// How often a list with `forgetAfter` is swept while no tag arrives.
const FORGET_SWEEP = 1_000;

const IDLE: RfidInventorySnapshot = { tags: [], isRunning: false, error: null };

function checkMs(value: unknown, name: string): number {
  if (typeof value !== "number" || !(value >= 0) || value === Infinity) {
    throw new RangeError(
      `useRfidInventory().start(): ${name} must be 0 or more milliseconds, got ${String(value)}.`,
    );
  }
  return value;
}

function byProximity(a: RfidTag, b: RfidTag): number {
  return b.proximity - a.proximity || b.averageRssi - a.averageRssi;
}

interface InventoryStore {
  getSnapshot(): RfidInventorySnapshot;
  subscribe(listener: () => void): Unsubscribe;
  start(options?: RfidInventoryOptions): Promise<void>;
  stop(): Promise<void>;
  clear(): void;
}

/**
 * The inventory of one adapter: every component sees the same list. It ends
 * when another mode starts, the app goes to the background, the reader
 * drops, or no component reads it any more.
 */
function createInventoryStore(engine: RfidEngine): InventoryStore {
  const { adapter } = engine;
  let snapshot = IDLE;
  const emitter = createEmitter();
  const tags = new Map<string, RfidTag>();
  let bounds = adapter.proximityBounds;
  let sort: RfidInventoryOptions["sort"] = "proximity";
  let forgetAfter = 0;
  let current: RfidMode | null = null;
  let timers: ReturnType<typeof setTimeout>[] = [];

  function set(next: Partial<RfidInventorySnapshot>) {
    snapshot = { ...snapshot, ...next };
    emitter.emit();
  }

  function list(): RfidTag[] {
    if (forgetAfter > 0) {
      const since = Date.now() - forgetAfter;
      for (const [epc, tag] of tags) {
        if (tag.lastSeen < since) tags.delete(epc);
      }
    }
    const all = [...tags.values()];
    return sort === "first-seen" ? all : all.sort(byProximity);
  }

  const render = createThrottle(INVENTORY_UPDATE_INTERVAL, () =>
    set({ tags: list() }),
  );

  function onTags(mode: RfidMode, reads: RfidTagRead[]) {
    if (current !== mode) return;
    const now = Date.now();
    for (const read of reads) {
      const epc = normalizeEpc(read.epc);
      if (epc === null) continue;
      const merged = mergeRead(tags.get(epc), read, bounds, now);
      if (merged) tags.set(epc, merged);
    }
    render.schedule();
  }

  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function end(mode: RfidMode, error: RfidError | null) {
    if (current !== mode) return;
    current = null;
    clearTimers();
    render.now();
    set({ isRunning: false, error });
  }

  function reset() {
    tags.clear();
    render.now();
    render.reset();
  }

  async function start(options: RfidInventoryOptions = {}) {
    const {
      tid = false,
      proximity = adapter.proximityBounds,
      duration = 0,
    } = options;
    checkMs(duration, "duration");
    const nextForget = checkMs(options.forgetAfter ?? 0, "forgetAfter");
    const nextBounds = requireBounds(proximity, "useRfidInventory().start()");
    if (tid && !adapter.supportsTid) {
      throw new RfidError(
        "unsupported",
        `The ${adapter.vendor} RFID adapter does not read TIDs: check capabilities.tid.`,
      );
    }

    let starting: Promise<void> | null = null;
    const mode: RfidMode = {
      end: (error) => end(mode, error),
      async stop() {
        if (!starting) return;
        await starting.catch(() => {});
        await adapter.stopInventory();
      },
    };
    current = mode;
    clearTimers();
    bounds = nextBounds;
    sort = options.sort === "first-seen" ? "first-seen" : "proximity";
    forgetAfter = nextForget;
    reset();
    set({ isRunning: true, error: null });

    try {
      await engine.begin(mode);
      starting = adapter.startInventory(
        { tid },
        {
          onTags: (reads) => onTags(mode, reads),
          onStop: (error) => engine.finish(mode, error),
        },
      );
      await starting;
    } catch (error) {
      // A rejected start leaves nothing running on the reader.
      const failure = toRfidError(error);
      engine.abandon(mode);
      end(mode, failure);
      throw failure;
    }
    if (current !== mode) return;
    if (duration > 0) {
      timers.push(setTimeout(() => void engine.stop(mode), duration));
    }
    if (forgetAfter > 0) {
      const sweep = () => {
        if (current !== mode) return;
        render.schedule();
        timers.push(setTimeout(sweep, FORGET_SWEEP));
      };
      timers.push(setTimeout(sweep, FORGET_SWEEP));
    }
  }

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      const unsubscribe = emitter.subscribe(listener);
      return () => {
        unsubscribe();
        // A reader replaced in the same commit must not stop the inventory.
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
    clear: reset,
  };
}

const stores = new WeakMap<RfidEngine, InventoryStore>();

const getServerSnapshot = () => IDLE;

export interface UseRfidInventory extends RfidInventorySnapshot {
  /**
   * Reads every tag in range until `stop()`, replacing the running mode
   * and clearing the list. Checks the permission and the connection first
   * and rejects with the `RfidError` that stops it; a `RangeError` for bad
   * options.
   */
  start: (options?: RfidInventoryOptions) => Promise<void>;
  stop: () => Promise<void>;
  /** Empties the list; a running inventory fills it again. */
  clear: () => void;
}

/**
 * The multiple scan: every tag in range, each once, with how near it is.
 * One mode runs per reader: starting it ends a single read or a locate.
 */
export function useRfidInventory(): UseRfidInventory {
  const engine = getRfidEngine(useRfidAdapter());
  const store = getOrCreate(stores, engine, () => createInventoryStore(engine));
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
