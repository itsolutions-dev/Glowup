import type { Unsubscribe } from "../core/types";

export type NetworkType =
  | "none"
  | "unknown"
  | "cellular"
  | "wifi"
  | "bluetooth"
  | "ethernet"
  | "wimax"
  | "vpn"
  | "other";

export type CellularGeneration = "2g" | "3g" | "4g" | "5g";

/** Every `null` means "not known (yet)", never "no". */
export interface NetworkState {
  /** A network interface is up. Says nothing about the internet behind it. */
  isConnected: boolean | null;
  /**
   * The internet answers. On iOS and Android this is probed (netinfo); a
   * browser cannot tell without a request of its own, so on web it is `null`
   * while online and `false` while offline.
   */
  isInternetReachable: boolean | null;
  type: NetworkType;
  /** Metered or data-saving connection: hold back on large downloads. */
  isExpensive: boolean | null;
  /** Set on cellular connections only. */
  cellularGeneration: CellularGeneration | null;
}

/** The contract between `useNetwork()` and whatever reads the connection. */
export interface NetworkAdapter {
  isSupported(): boolean;
  getState(): Promise<NetworkState>;
  /** Calls `listener` on every change (and may call it right away). */
  subscribe(listener: (state: NetworkState) => void): Unsubscribe;
  /** Asks the platform again instead of answering from its cache. */
  refresh(): Promise<NetworkState>;
}
