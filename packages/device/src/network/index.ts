/**
 * `@its/glowup-device/network` — the connection, kept live: connected,
 * internet reachable, type, metered. Needs `@react-native-community/netinfo`
 * on iOS and Android; the web uses the browser's own APIs.
 */
export { useIsOnline, useNetwork, type UseNetwork } from "./hooks";
export { netInfoNetworkAdapter } from "./netinfo";
export { webNetworkAdapter } from "./web";
export type {
  CellularGeneration,
  NetworkAdapter,
  NetworkState,
  NetworkType,
} from "./types";
