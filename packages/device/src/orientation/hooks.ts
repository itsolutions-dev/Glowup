import { useCallback, useEffect, useId, useSyncExternalStore } from "react";
import { Platform } from "react-native";

import { useDeviceAdapter } from "../core/adapters";
import {
  createLiveStore,
  useLiveValue,
  type LiveStore,
} from "../core/liveStore";
import { getOrCreate, useClientValue } from "../core/shared";
import { expoOrientationAdapter } from "./expo";
import {
  createLockStack,
  IDLE_LOCK,
  type LockStack,
  type OrientationLockState,
} from "./lockStack";
import type { Orientation, OrientationAdapter, OrientationLock } from "./types";
import { webOrientationAdapter } from "./web";

const defaultOrientationAdapter =
  Platform.OS === "web" ? webOrientationAdapter : expoOrientationAdapter;

function useOrientationAdapter(): OrientationAdapter {
  return useDeviceAdapter("orientation") ?? defaultOrientationAdapter;
}

const stores = new WeakMap<OrientationAdapter, LiveStore<Orientation>>();
const stacks = new WeakMap<OrientationAdapter, LockStack>();

function getStore(adapter: OrientationAdapter): LiveStore<Orientation> {
  return getOrCreate(stores, adapter, () =>
    createLiveStore<Orientation>({
      isSupported: () => adapter.isSupported(),
      read: () => adapter.getOrientation(),
      subscribe: (listener) => adapter.subscribe(listener),
      unsupported: "unknown",
    }),
  );
}

function getStack(adapter: OrientationAdapter): LockStack {
  return getOrCreate(stacks, adapter, () => createLockStack(adapter));
}

export interface UseOrientation {
  orientation: Orientation;
  /** `null` while the orientation is unknown. */
  isLandscape: boolean | null;
  /** True until the first answer (`orientation` reads `unknown` meanwhile). */
  isLoading: boolean;
}

/**
 * The interface orientation, kept live. One platform subscription is shared
 * by every component that asks.
 */
export function useOrientation(): UseOrientation {
  const orientation = useLiveValue(getStore(useOrientationAdapter()));
  const value = orientation ?? "unknown";
  return {
    orientation: value,
    isLandscape: value === "unknown" ? null : value.startsWith("landscape"),
    isLoading: orientation === null,
  };
}

export interface UseOrientationLockOptions {
  /** Hold the lock while true (default true). */
  enabled?: boolean;
}

export type UseOrientationLock = OrientationLockState;

/**
 * Locks the orientation while the component is mounted (and `enabled`), and
 * gives it back on unmount. The most recent lock wins; when it lets go, the
 * one before applies again, and after the last the app's own orientation.
 * A refused lock (most browsers) is reported in `error`, never thrown.
 */
export function useOrientationLock(
  lock: OrientationLock,
  { enabled = true }: UseOrientationLockOptions = {},
): UseOrientationLock {
  const stack = getStack(useOrientationAdapter());
  const id = useId();

  useEffect(() => {
    if (!enabled) return;
    stack.set(id, lock);
    return () => stack.remove(id);
  }, [stack, id, lock, enabled]);

  const subscribe = useCallback(
    (listener: () => void) => stack.subscribe(listener),
    [stack],
  );
  const getState = useCallback(() => stack.getState(id), [stack, id]);
  return useSyncExternalStore(subscribe, getState, getIdleLock);
}

const getIdleLock = () => IDLE_LOCK;

/**
 * Whether this platform has a lock API at all: true on iOS and Android, false
 * in browsers without `screen.orientation.lock`. Chromium has one even on
 * desktop, where it refuses every lock, so the lock's `error` is the real
 * answer. False while a statically exported page hydrates.
 */
export function useOrientationLockSupport(): boolean {
  const adapter = useOrientationAdapter();
  return useClientValue(() => adapter.supportsLock(), false);
}
