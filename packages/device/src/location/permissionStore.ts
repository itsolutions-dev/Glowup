import type { Unsubscribe } from "../core/types";
import type { LocationAdapter, LocationPermissionState } from "./types";

export const UNSUPPORTED_LOCATION: LocationPermissionState = {
  status: "unsupported",
  canAskAgain: false,
  precision: null,
};

export const UNKNOWN_LOCATION: LocationPermissionState = {
  status: "undetermined",
  canAskAgain: true,
  precision: null,
};

/** `null` until the first read answers. */
type Snapshot = LocationPermissionState | null;

export interface PermissionStore {
  getSnapshot(): Snapshot;
  subscribe(listener: () => void): Unsubscribe;
  refresh(): Promise<LocationPermissionState>;
  request(): Promise<LocationPermissionState>;
}

const same = (a: Snapshot, b: Snapshot) =>
  a === b ||
  (a !== null &&
    b !== null &&
    a.status === b.status &&
    a.canAskAgain === b.canAskAgain &&
    a.precision === b.precision);

function createPermissionStore(adapter: LocationAdapter): PermissionStore {
  let state: Snapshot = null;
  let pendingRefresh: Promise<LocationPermissionState> | null = null;
  // Last call wins: a slow refresh must not overwrite a newer request's answer.
  let sequence = 0;
  const listeners = new Set<() => void>();

  async function run(
    read: () => Promise<LocationPermissionState>,
  ): Promise<LocationPermissionState> {
    const id = ++sequence;
    let next: LocationPermissionState;
    try {
      next = adapter.isSupported() ? await read() : UNSUPPORTED_LOCATION;
    } catch (error) {
      // Leave no hook loading forever on a failed first read.
      if (id === sequence && state === null) set(UNKNOWN_LOCATION);
      throw error;
    }
    if (id === sequence) set(next);
    return next;
  }

  function set(next: LocationPermissionState) {
    if (same(state, next)) return;
    state = next;
    listeners.forEach((listener) => listener());
  }

  return {
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    // Every mounted hook refreshes on foreground: share one read between them.
    refresh() {
      pendingRefresh ??= run(() => adapter.getPermission()).finally(() => {
        pendingRefresh = null;
      });
      return pendingRefresh;
    },
    request: () => run(() => adapter.requestPermission()),
  };
}

// One store per adapter, so every component sees the same answer and a
// request made in one updates the others.
const stores = new WeakMap<LocationAdapter, PermissionStore>();

export function getPermissionStore(adapter: LocationAdapter): PermissionStore {
  let store = stores.get(adapter);
  if (!store) {
    store = createPermissionStore(adapter);
    stores.set(adapter, store);
  }
  return store;
}
