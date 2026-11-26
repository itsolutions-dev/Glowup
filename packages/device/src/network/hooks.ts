import { useDeviceAdapter } from "../core/adapters";
import {
  createLiveStore,
  useLiveValue,
  type LiveStore,
} from "../core/liveStore";
import { getOrCreate } from "../core/shared";
import { defaultNetworkAdapter } from "./defaultAdapter";
import type { NetworkAdapter, NetworkState } from "./types";

export const UNKNOWN_NETWORK: NetworkState = {
  isConnected: null,
  isInternetReachable: null,
  type: "unknown",
  isExpensive: null,
  cellularGeneration: null,
};

// One store (and one platform subscription) per adapter.
const stores = new WeakMap<NetworkAdapter, LiveStore<NetworkState>>();

function getStore(adapter: NetworkAdapter): LiveStore<NetworkState> {
  return getOrCreate(stores, adapter, () =>
    createLiveStore({
      isSupported: () => adapter.isSupported(),
      read: () => adapter.getState(),
      refresh: () => adapter.refresh(),
      subscribe: (listener) => adapter.subscribe(listener),
      unsupported: UNKNOWN_NETWORK,
    }),
  );
}

function useNetworkStore(): LiveStore<NetworkState> {
  return getStore(useDeviceAdapter("network") ?? defaultNetworkAdapter);
}

export interface UseNetwork extends NetworkState {
  /** True until the first answer (every field reads unknown meanwhile). */
  isLoading: boolean;
  /** Asks the platform again; every component using the hook updates. */
  refresh: () => Promise<NetworkState>;
}

/**
 * The connection, kept live: one platform subscription is shared by every
 * component that asks and closed when the last one unmounts.
 */
export function useNetwork(): UseNetwork {
  const store = useNetworkStore();
  const state = useLiveValue(store);
  return {
    ...(state ?? UNKNOWN_NETWORK),
    isLoading: state === null,
    // Through the store, so every listener hears the fresh answer.
    refresh: store.refresh,
  };
}

/**
 * The one question most screens ask. `true` / `false` when known: the probe's
 * answer where there is one, else whether a network is up. `null` when not
 * known yet.
 */
export function useIsOnline(): boolean | null {
  const state = useLiveValue(useNetworkStore());
  if (!state) return null;
  return state.isInternetReachable ?? state.isConnected;
}
