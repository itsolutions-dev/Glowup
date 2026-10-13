import { hasDOM } from "../core/support";
import type {
  CellularGeneration,
  NetworkAdapter,
  NetworkState,
  NetworkType,
} from "./types";

/**
 * The web default, on `navigator.onLine`, the `online` / `offline` events and
 * the Network Information API where the browser has one (Chromium). Not
 * netinfo's web build: to tell whether the internet answers, it sends
 * `HEAD /` to the page's own origin every minute and counts anything but a
 * 200 as offline — wrong for an app served under a subpath, and traffic the
 * app did not ask for. A browser cannot know without a request, so here
 * `isInternetReachable` is `null` while online.
 */

interface Connection {
  type?: string;
  effectiveType?: string;
  saveData?: boolean;
  addEventListener(type: "change", listener: () => void): void;
  removeEventListener(type: "change", listener: () => void): void;
}

const connection = (): Connection | null =>
  (navigator as Navigator & { connection?: Connection }).connection ?? null;

const TYPES: Record<string, NetworkType> = {
  bluetooth: "bluetooth",
  cellular: "cellular",
  ethernet: "ethernet",
  none: "none",
  wifi: "wifi",
  wimax: "wimax",
  other: "other",
  mixed: "other",
  unknown: "unknown",
};

const GENERATIONS: Record<string, CellularGeneration> = {
  "slow-2g": "2g",
  "2g": "2g",
  "3g": "3g",
  "4g": "4g",
};

function readState(): NetworkState {
  const online = navigator.onLine;
  const info = connection();
  const type: NetworkType = !online
    ? "none"
    : info?.type
      ? (TYPES[info.type] ?? "other")
      : "unknown";
  return {
    isConnected: online,
    isInternetReachable: online ? null : false,
    type,
    isExpensive: info?.saveData ?? null,
    // effectiveType is a speed class ("4g" on a fast Wi-Fi too), not the
    // cellular generation: report it only on a cellular connection.
    cellularGeneration:
      type === "cellular"
        ? (GENERATIONS[info?.effectiveType ?? ""] ?? null)
        : null,
  };
}

export const webNetworkAdapter: NetworkAdapter = {
  isSupported: () => hasDOM() && typeof navigator.onLine === "boolean",
  getState: async () => readState(),
  refresh: async () => readState(),
  subscribe(listener) {
    const emit = () => listener(readState());
    window.addEventListener("online", emit);
    window.addEventListener("offline", emit);
    const info = connection();
    info?.addEventListener("change", emit);
    return () => {
      window.removeEventListener("online", emit);
      window.removeEventListener("offline", emit);
      info?.removeEventListener("change", emit);
    };
  },
};
