import { useEffect, useSyncExternalStore } from "react";
import { AppState, Linking } from "react-native";

import { sameValue } from "./liveStore";
import { createEmitter } from "./shared";
import type { Unsubscribe } from "./types";

export interface PermissionSource<S> {
  isSupported(): boolean;
  read(): Promise<S>;
  /** `read` when absent. */
  request?(): Promise<S>;
  /** Answered without asking when `isSupported()` is false. */
  unsupported: S;
  /** Set when the first read fails, so no hook stays loading forever. */
  unknown?: S;
}

export interface PermissionStore<S> {
  /** `null` until the first read answers. */
  getSnapshot(): S | null;
  subscribe(listener: () => void): Unsubscribe;
  refresh(): Promise<S>;
  request(): Promise<S>;
  /** A change the package made itself: a read already running is dropped. */
  set(next: S): void;
}

/**
 * One permission's state (or another value read the same way, such as
 * whether a background task runs), shared by every hook that reads it: a
 * request made in one component updates the others, and concurrent
 * refreshes share a read.
 */
export function createPermissionStore<S>(
  source: PermissionSource<S>,
): PermissionStore<S> {
  let state: S | null = null;
  let pendingRefresh: Promise<S> | null = null;
  // Last call wins: a slow refresh must not overwrite a newer request's answer.
  let sequence = 0;
  const emitter = createEmitter();

  function set(next: S) {
    if (sameValue(state, next)) return;
    state = next;
    emitter.emit();
  }

  async function run(read: () => Promise<S>): Promise<S> {
    const id = ++sequence;
    let next: S;
    try {
      next = source.isSupported() ? await read() : source.unsupported;
    } catch (error) {
      if (id === sequence && state === null && source.unknown !== undefined) {
        set(source.unknown);
      }
      throw error;
    }
    if (id === sequence) set(next);
    return next;
  }

  return {
    getSnapshot: () => state,
    subscribe: emitter.subscribe,
    refresh() {
      pendingRefresh ??= run(source.read).finally(() => {
        pendingRefresh = null;
      });
      return pendingRefresh;
    },
    request: () => run(source.request ?? source.read),
    set(next) {
      sequence++;
      set(next);
    },
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
export function usePermissionSnapshot<S>(
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

const openSettings = () => Linking.openSettings();

/**
 * What a permission hook returns: the state (`unknown` until the first read
 * answers), the store's `request` and `refresh`, and the app's page in the
 * system settings, where a refusal is undone.
 */
export function toPermissionHook<S extends object>(
  store: PermissionStore<S>,
  state: S | null,
  unknown: S,
) {
  return {
    ...(state ?? unknown),
    isLoading: state === null,
    request: store.request,
    refresh: store.refresh,
    openSettings,
  };
}
