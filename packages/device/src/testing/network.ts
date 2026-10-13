import type { NetworkAdapter, NetworkState } from "../network/types";

/** Online on Wi-Fi, internet reachable, not metered. */
export const MOCK_NETWORK: NetworkState = {
  isConnected: true,
  isInternetReachable: true,
  type: "wifi",
  isExpensive: false,
  cellularGeneration: null,
};

/** Offline: no interface up, nothing reachable. */
export const OFFLINE_NETWORK: NetworkState = {
  isConnected: false,
  isInternetReachable: false,
  type: "none",
  isExpensive: null,
  cellularGeneration: null,
};

export interface MockNetworkAdapter extends NetworkAdapter {
  /** Changes the state and notifies every subscriber, as a platform event would. */
  setState(next: Partial<NetworkState>): void;
  /** Active platform subscriptions: the hooks share one per adapter. */
  readonly subscriberCount: number;
  /** How many times `refresh()` was called. */
  readonly refreshCount: number;
}

/**
 * An in-memory `NetworkAdapter`, starting from `MOCK_NETWORK` merged with
 * `initial`. Inject it with `<DeviceAdaptersProvider adapters={{ network }}>`
 * and drive it with `setState(OFFLINE_NETWORK)`.
 */
export function createMockNetworkAdapter(
  initial: Partial<NetworkState> = {},
): MockNetworkAdapter {
  let state: NetworkState = { ...MOCK_NETWORK, ...initial };
  let refreshCount = 0;
  const listeners = new Set<(state: NetworkState) => void>();

  return {
    isSupported: () => true,
    getState: async () => state,
    async refresh() {
      refreshCount++;
      return state;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setState(next) {
      state = { ...state, ...next };
      [...listeners].forEach((listener) => listener(state));
    },
    get subscriberCount() {
      return listeners.size;
    },
    get refreshCount() {
      return refreshCount;
    },
  };
}
