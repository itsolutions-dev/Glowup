import { useSyncExternalStore } from "react";

import { useDeviceAdapter } from "../core/adapters";
import { useLiveValue } from "../core/liveStore";
import { UNKNOWN } from "../core/permissions";
import {
  toPermissionHook,
  usePermissionSnapshot,
} from "../core/permissionStore";
import { useClientValue } from "../core/shared";
import type { PermissionState } from "../core/types";
import {
  getRfidCapabilities,
  isCompatibleRfidAdapter,
  unsupportedRfidAdapter,
} from "./adapter";
import { type ConnectOptions, getRfidEngine } from "./engine";
import type { RfidError } from "./errors";
import type {
  RfidAdapter,
  RfidCapabilities,
  RfidConnectionState,
  RfidProximityBounds,
  RfidReaderInfo,
  RfidSettings,
  RfidSettingsPatch,
} from "./types";

/** The provided adapter, or `unsupportedRfidAdapter` without one. */
export function useRfidAdapter(): RfidAdapter {
  return useDeviceAdapter("rfid") ?? unsupportedRfidAdapter;
}

export interface UseRfidPermission extends PermissionState {
  /** True until the first read answers. */
  isLoading: boolean;
  /** Shows the system prompt when it can, and resolves with the answer. */
  request: () => Promise<PermissionState>;
  refresh: () => Promise<PermissionState>;
  /** Opens the app's page in the system settings. */
  openSettings: () => Promise<void>;
}

/**
 * What the reader's link needs (Honeywell, on Android: Bluetooth), shared
 * by every component that asks: a request made in one updates them all.
 */
export function useRfidPermission(): UseRfidPermission {
  const store = getRfidEngine(useRfidAdapter()).permission;
  return toPermissionHook(store, usePermissionSnapshot(store), UNKNOWN);
}

const capabilities = new WeakMap<RfidAdapter, RfidCapabilities>();

function capabilitiesOf(adapter: RfidAdapter): RfidCapabilities {
  let found = capabilities.get(adapter);
  if (!found) {
    found = getRfidCapabilities(adapter);
    capabilities.set(adapter, found);
  }
  return found;
}

export interface UseRfidReader {
  /**
   * Whether the provided adapter runs here and implements this package's
   * contract version. False while a static web page prerenders.
   */
  isSupported: boolean;
  /** The adapter's vendor (`"honeywell"`; `"none"` without an adapter). */
  vendor: string;
  capabilities: RfidCapabilities;
  /** The transmit power range, in dBm. */
  powerRange: { min: number; max: number };
  /** The adapter's default proximity bounds, in dBm. */
  proximityBounds: RfidProximityBounds;
  state: RfidConnectionState;
  /** The reader connected to (or connecting, reconnecting). */
  readerId: string | null;
  /** True until the first answer. */
  isLoading: boolean;
  /** Why the latest `connect()` failed; `null` once one succeeds. */
  error: RfidError | null;
  /**
   * Connects to a reader (Honeywell: its Bluetooth address) and resolves
   * once it is ready; the connection outlives the component, until
   * `disconnect()`. Checks the permission first, never prompts. Stops the
   * running mode when it switches reader.
   */
  connect: (readerId: string, options?: ConnectOptions) => Promise<void>;
  disconnect: () => Promise<void>;
  getSettings: () => Promise<RfidSettings>;
  /** A `RangeError` for a value the reader does not take. */
  setSettings: (patch: RfidSettingsPatch) => Promise<RfidSettings>;
  /** 0–100; `null` when the reader does not report it. Polled: the readers send no event. */
  getBatteryLevel: () => Promise<number | null>;
  /** `null` when the adapter does not report it. */
  getReaderInfo: () => Promise<RfidReaderInfo | null>;
}

const getNull = () => null;

/** The reader's connection, settings and what the adapter can do. */
export function useRfidReader(): UseRfidReader {
  const adapter = useRfidAdapter();
  const engine = getRfidEngine(adapter);
  const connection = useLiveValue(engine.connection);
  const error = useSyncExternalStore(
    engine.subscribeError,
    engine.getError,
    getNull,
  );
  const isSupported = useClientValue(
    () => adapter.isSupported() && isCompatibleRfidAdapter(adapter),
    false,
  );

  return {
    isSupported,
    vendor: adapter.vendor,
    capabilities: capabilitiesOf(adapter),
    powerRange: adapter.powerRange,
    proximityBounds: adapter.proximityBounds,
    state: connection?.state ?? "disconnected",
    readerId: connection?.readerId ?? null,
    isLoading: connection === null,
    error,
    connect: engine.connect,
    disconnect: engine.disconnect,
    getSettings: engine.getSettings,
    setSettings: engine.setSettings,
    getBatteryLevel: engine.getBatteryLevel,
    getReaderInfo: engine.getReaderInfo,
  };
}
