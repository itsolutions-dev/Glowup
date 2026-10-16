import { UNSUPPORTED } from "../core/permissions";
import { RfidError } from "./errors";
import {
  RFID_CONTRACT_VERSION,
  type RfidAdapter,
  type RfidCapabilities,
} from "./types";

const DISCONNECTED = { state: "disconnected", readerId: null } as const;

const unsupported = () => Promise.reject(new RfidError("unsupported"));

/**
 * What the hooks use without a vendor adapter: every operation rejects with
 * `unsupported`. `/rfid` ships no vendor: install one (`@its/rfid-honeywell`)
 * and pass its adapter to `DeviceAdaptersProvider` as `rfid`.
 */
export const unsupportedRfidAdapter: RfidAdapter = {
  contractVersion: RFID_CONTRACT_VERSION,
  vendor: "none",
  supportsTid: false,
  proximityBounds: { near: -35, far: -75 },
  powerRange: { min: 0, max: 0 },
  isSupported: () => false,
  getPermission: () => Promise.resolve(UNSUPPORTED),
  requestPermission: () => Promise.resolve(UNSUPPORTED),
  connect: unsupported,
  disconnect: () => Promise.resolve(),
  getConnection: () => Promise.resolve(DISCONNECTED),
  subscribeConnection: () => () => {},
  startInventory: unsupported,
  stopInventory: () => Promise.resolve(),
  getSettings: unsupported,
  setSettings: unsupported,
};

/** Whether the adapter implements this package's contract version. */
export function isCompatibleRfidAdapter(adapter: RfidAdapter): boolean {
  return adapter.contractVersion === RFID_CONTRACT_VERSION;
}

/** What the adapter offers, read from the optional methods it implements. */
export function getRfidCapabilities(adapter: RfidAdapter): RfidCapabilities {
  return {
    locate: adapter.startLocate && adapter.stopLocate ? "native" : "emulated",
    singleRead: adapter.readOnce ? "native" : "emulated",
    tid: adapter.supportsTid,
    trigger: typeof adapter.subscribeTrigger === "function",
    discovery: Boolean(adapter.startDiscovery && adapter.stopDiscovery),
    battery: typeof adapter.getBatteryLevel === "function",
    readerInfo: typeof adapter.getReaderInfo === "function",
  };
}

/**
 * The first adapter that is supported here and implements this contract
 * version, or `unsupportedRfidAdapter`: for an app that ships several
 * vendors and picks at run time (`[honeywellRfidAdapter, zebraRfidAdapter]`).
 * Call it on the client: `isSupported()` reads the platform.
 */
export function firstSupportedRfidAdapter(
  adapters: readonly RfidAdapter[],
): RfidAdapter {
  return (
    adapters.find(
      (adapter) => isCompatibleRfidAdapter(adapter) && adapter.isSupported(),
    ) ?? unsupportedRfidAdapter
  );
}
