import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";

import type {
  CellularGeneration,
  NetworkAdapter,
  NetworkState,
  NetworkType,
} from "./types";

const TYPES: Record<string, NetworkType> = {
  none: "none",
  unknown: "unknown",
  cellular: "cellular",
  wifi: "wifi",
  bluetooth: "bluetooth",
  ethernet: "ethernet",
  wimax: "wimax",
  vpn: "vpn",
  other: "other",
};

const GENERATIONS = new Set<string>(["2g", "3g", "4g", "5g"]);

export function toNetworkState(raw: NetInfoState): NetworkState {
  const details = raw.details as {
    isConnectionExpensive?: boolean;
    cellularGeneration?: string | null;
  } | null;
  const generation = details?.cellularGeneration ?? null;
  return {
    isConnected: raw.isConnected ?? null,
    isInternetReachable: raw.isInternetReachable ?? null,
    type: TYPES[raw.type] ?? "unknown",
    isExpensive: details?.isConnectionExpensive ?? null,
    cellularGeneration:
      raw.type === "cellular" && generation && GENERATIONS.has(generation)
        ? (generation as CellularGeneration)
        : null,
  };
}

/**
 * The native default: `@react-native-community/netinfo`, whose reachability
 * probe and its URL the app can tune with `NetInfo.configure()`.
 */
export const netInfoNetworkAdapter: NetworkAdapter = {
  isSupported: () => true,
  getState: async () => toNetworkState(await NetInfo.fetch()),
  subscribe: (listener) =>
    NetInfo.addEventListener((raw) => listener(toNetworkState(raw))),
  refresh: async () => toNetworkState(await NetInfo.refresh()),
};
