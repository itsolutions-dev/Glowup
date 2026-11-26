import { useSyncExternalStore } from "react";

import { createEmitter } from "./shared";
import type { Unsubscribe } from "./types";

/** A value the platform pushes changes of: the network, the battery. */
export interface LiveSource<T> {
  isSupported(): boolean;
  read(): Promise<T>;
  /** Asks the platform again instead of its cache; `read` when absent. */
  refresh?(): Promise<T>;
  /** Calls `listener` on every change; may also call it right away. */
  subscribe(listener: (value: T) => void): Unsubscribe;
  /** Answered without asking when `isSupported()` is false. */
  unsupported: T;
}

export interface LiveStore<T> {
  /** `null` until the first answer. */
  getSnapshot(): T | null;
  subscribe(listener: () => void): Unsubscribe;
  /** Reads again now (the listeners hear the answer too). */
  refresh(): Promise<T>;
}

/**
 * One platform subscription however many components listen: it opens with
 * the first listener and closes with the last. The last value is kept while
 * nobody listens, and read again when someone does.
 */
export function createLiveStore<T>(source: LiveSource<T>): LiveStore<T> {
  let value: T | null = null;
  let stop: Unsubscribe | null = null;
  const emitter = createEmitter();

  function set(next: T) {
    if (sameValue(value, next)) return;
    value = next;
    emitter.emit();
  }

  async function load(read: () => Promise<T>): Promise<T> {
    if (!source.isSupported()) {
      set(source.unsupported);
      return source.unsupported;
    }
    const next = await read();
    set(next);
    return next;
  }

  return {
    getSnapshot: () => value,
    subscribe(listener) {
      const unsubscribe = emitter.subscribe(listener);
      if (emitter.size() === 1) {
        if (source.isSupported()) {
          stop = source.subscribe(set);
          load(() => source.read()).catch(() => {});
        } else {
          set(source.unsupported);
        }
      }
      return () => {
        unsubscribe();
        if (emitter.size() === 0) {
          stop?.();
          stop = null;
        }
      };
    },
    refresh: () => load(() => (source.refresh ?? source.read)()),
  };
}

/**
 * Platforms re-send equal states (netinfo emits on every reachability probe):
 * a shallow comparison keeps them from re-rendering every listener.
 */
export function sameValue<T>(a: T | null, b: T): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || typeof b !== "object" || !a || !b) {
    return false;
  }
  const keys = Object.keys(a) as (keyof T)[];
  return (
    keys.length === Object.keys(b).length &&
    keys.every((key) => Object.is(a[key], b[key]))
  );
}

const getServerSnapshot = () => null;

/**
 * The store's value; `null` while hydrating a statically exported page (the
 * prerender in Node has no network or battery to read) and until the
 * platform's first answer.
 */
export function useLiveValue<T>(store: LiveStore<T>): T | null {
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    getServerSnapshot,
  );
}
