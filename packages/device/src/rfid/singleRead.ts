import { useSyncExternalStore } from "react";

import { createEmitter, getOrCreate } from "../core/shared";
import {
  getRfidEngine,
  type RfidEngine,
  type RfidMode,
  withTimeout,
} from "./engine";
import { RfidError, toRfidError } from "./errors";
import { useRfidAdapter } from "./hooks";
import { mergeReads, requireBounds, strongestTag } from "./tags";
import type { RfidProximityBounds, RfidTag, RfidTagRead } from "./types";

export interface RfidSingleReadOptions {
  /**
   * How long the reader listens, in ms (default 500). Longer finds a tag
   * held at an angle; shorter answers sooner.
   */
  window?: number;
  /** Read the tag's TID too, when `capabilities.tid`. */
  tid?: boolean;
  /** Calibrated bounds for the tag's `proximity`. */
  proximity?: RfidProximityBounds;
}

export interface RfidSingleReadSnapshot {
  isReading: boolean;
  /** The latest read's tag; `null` before one, or when it found none. */
  tag: RfidTag | null;
  /** Why the latest read failed; `null` otherwise. */
  error: RfidError | null;
}

export const DEFAULT_SINGLE_READ_WINDOW = 500;
// A native read answers within its window: past this margin it hangs.
const READ_ONCE_MARGIN = 5_000;

const IDLE: RfidSingleReadSnapshot = {
  isReading: false,
  tag: null,
  error: null,
};

interface SingleReadStore {
  getSnapshot(): RfidSingleReadSnapshot;
  subscribe(listener: () => void): () => void;
  read(options?: RfidSingleReadOptions): Promise<RfidTag | null>;
}

function createSingleReadStore(engine: RfidEngine): SingleReadStore {
  const { adapter } = engine;
  let snapshot = IDLE;
  const emitter = createEmitter();
  let current: RfidMode | null = null;

  function set(next: Partial<RfidSingleReadSnapshot>) {
    snapshot = { ...snapshot, ...next };
    emitter.emit();
  }

  function read(options: RfidSingleReadOptions = {}): Promise<RfidTag | null> {
    try {
      return run(options);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Checks the options (throwing), then returns the result's promise at once
   * and reads in the background: a read replaced while the reader's own
   * window runs rejects then, not once the window ends.
   */
  function run(options: RfidSingleReadOptions): Promise<RfidTag | null> {
    const {
      window = DEFAULT_SINGLE_READ_WINDOW,
      tid = false,
      proximity = adapter.proximityBounds,
    } = options;
    if (typeof window !== "number" || !(window > 0) || window === Infinity) {
      throw new RangeError(
        `useRfidSingleRead().read(): window must be more than 0 milliseconds, got ${String(window)}.`,
      );
    }
    const bounds = requireBounds(proximity, "useRfidSingleRead().read()");
    if (tid && !adapter.supportsTid) {
      throw new RfidError(
        "unsupported",
        `The ${adapter.vendor} RFID adapter does not read TIDs: check capabilities.tid.`,
      );
    }

    const readOnce = adapter.readOnce?.bind(adapter);
    const reads: RfidTagRead[] = [];
    let starting: Promise<unknown> | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let settle!: {
      resolve(tag: RfidTag | null): void;
      reject(error: RfidError): void;
    };
    const result = new Promise<RfidTag | null>((resolve, reject) => {
      settle = { resolve, reject };
    });

    function fail(error: RfidError) {
      if (timer) clearTimeout(timer);
      if (current !== mode) return;
      current = null;
      set({ isReading: false, error });
      settle.reject(error);
    }

    function succeed() {
      if (current !== mode) return;
      current = null;
      const tag = strongestTag(mergeReads(reads, bounds, Date.now()).values());
      set({ isReading: false, tag, error: null });
      settle.resolve(tag);
    }

    const mode: RfidMode = {
      // Replaced or stopped before its window ended: the caller gets no tag.
      end: (error) => fail(error ?? new RfidError("cancelled")),
      async stop() {
        if (!starting) return;
        await starting.catch(() => {});
        if (!readOnce) await adapter.stopInventory();
      },
    };
    current = mode;
    set({ isReading: true, error: null });
    void perform();
    return result;

    async function perform() {
      try {
        await engine.begin(mode);
        if (readOnce) {
          const native = withTimeout(
            readOnce({ window, tid }),
            window + READ_ONCE_MARGIN,
            `The RFID reader did not answer a ${window} ms read.`,
          );
          starting = native;
          const got = await native;
          if (!engine.isActive(mode)) return;
          reads.push(...got);
          void engine.complete(mode);
          succeed();
        } else {
          starting = adapter.startInventory(
            { tid },
            {
              onTags: (batch) => {
                if (current === mode) reads.push(...batch);
              },
              onStop: (error) =>
                engine.finish(
                  mode,
                  error ??
                    new RfidError(
                      "failed",
                      "The reader stopped before the read's window ended.",
                    ),
                ),
            },
          );
          await starting;
          timer = setTimeout(() => {
            if (!engine.isActive(mode)) return;
            void engine.complete(mode);
            succeed();
          }, window);
        }
      } catch (error) {
        engine.abandon(mode);
        fail(toRfidError(error));
      }
    }
  }

  return {
    getSnapshot: () => snapshot,
    subscribe: emitter.subscribe,
    read,
  };
}

const stores = new WeakMap<RfidEngine, SingleReadStore>();

const getServerSnapshot = () => IDLE;

export interface UseRfidSingleRead extends RfidSingleReadSnapshot {
  /**
   * Listens for `window` ms and resolves with the nearest tag (the
   * strongest signal), or `null` when none answered. Replaces the running
   * mode; rejects with `cancelled` when another mode replaces it first.
   */
  read: (options?: RfidSingleReadOptions) => Promise<RfidTag | null>;
}

/** The single read: the one tag in front of the reader, for its id. */
export function useRfidSingleRead(): UseRfidSingleRead {
  const engine = getRfidEngine(useRfidAdapter());
  const store = getOrCreate(stores, engine, () =>
    createSingleReadStore(engine),
  );
  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    getServerSnapshot,
  );
  return { ...snapshot, read: store.read };
}
