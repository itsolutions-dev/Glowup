import { useEffect, useSyncExternalStore } from "react";
import { AppState } from "react-native";

import type { PermissionState, Unsubscribe } from "./types";

export interface PermissionSource<S extends PermissionState> {
  isSupported(): boolean;
  read(): Promise<S>;
  request(): Promise<S>;
  /** Answered without asking when `isSupported()` is false. */
  unsupported: S;
  /** Set when the first read fails, so no hook stays loading forever. */
  unknown: S;
}

export interface PermissionStore<S extends PermissionState> {
  /** `null` until the first read answers. */
  getSnapshot(): S | null;
  subscribe(listener: () => void): Unsubscribe;
  refresh(): Promise<S>;
  request(): Promise<S>;
}

function shallowEqual(a: object | null, b: object | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  const keys = Object.keys(a) as (keyof typeof a)[];
  return (
    keys.length === Object.keys(b).length &&
    keys.every((key) => a[key] === b[key])
  );
}

/**
 * One permission's state, shared by every hook that reads it: a request made
 * in one component updates the others, and concurrent refreshes share a read.
 */
export function createPermissionStore<S extends PermissionState>(
  source: PermissionSource<S>,
): PermissionStore<S> {
  let state: S | null = null;
  let pendingRefresh: Promise<S> | null = null;
  // Last call wins: a slow refresh must not overwrite a newer request's answer.
  let sequence = 0;
  const listeners = new Set<() => void>();

  function set(next: S) {
    if (shallowEqual(state, next)) return;
    state = next;
    listeners.forEach((listener) => listener());
  }

  async function run(read: () => Promise<S>): Promise<S> {
    const id = ++sequence;
    let next: S;
    try {
      next = source.isSupported() ? await read() : source.unsupported;
    } catch (error) {
      if (id === sequence && state === null) set(source.unknown);
      throw error;
    }
    if (id === sequence) set(next);
    return next;
  }

  return {
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    refresh() {
      pendingRefresh ??= run(source.read).finally(() => {
        pendingRefresh = null;
      });
      return pendingRefresh;
    },
    request: () => run(source.request),
  };
}

const getServerSnapshot = () => null;
const subscribeNothing = () => () => {};
const getNothing = () => null;

/**
 * Subscribes to a store (or to nothing, for `null`), reads it on first use and
 * again whenever the app returns to the foreground: the user may have changed
 * the permission in the system settings meanwhile.
 */
export function usePermissionSnapshot<S extends PermissionState>(
  store: PermissionStore<S> | null,
): S | null {
  const state = useSyncExternalStore(
    store ? store.subscribe : subscribeNothing,
    store ? store.getSnapshot : getNothing,
    getServerSnapshot,
  );

  useEffect(() => {
    if (!store) return;
    const refresh = () => {
      store.refresh().catch(() => {});
    };
    if (store.getSnapshot() === null) refresh();
    const subscription = AppState.addEventListener("change", (next) => {
      if (next === "active") refresh();
    });
    return () => subscription.remove();
  }, [store]);

  return state;
}
