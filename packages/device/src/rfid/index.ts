/**
 * `@its/glowup-device/rfid` — UHF RFID readers behind one contract: the
 * multiple scan (`useRfidInventory`), the single search (`useRfidLocate`)
 * and the single read (`useRfidSingleRead`), whichever vendor runs them.
 * No vendor ships here: install one (`@its/rfid-honeywell`) and pass its
 * adapter to `DeviceAdaptersProvider` as `rfid`. Without one, everything
 * reads `unsupported`.
 */
export {
  isRfidError,
  RfidError,
  toRfidError,
  type RfidErrorCode,
} from "./errors";
export {
  firstSupportedRfidAdapter,
  getRfidCapabilities,
  isCompatibleRfidAdapter,
  unsupportedRfidAdapter,
} from "./adapter";
export { DEFAULT_CONNECT_TIMEOUT, type ConnectOptions } from "./engine";
export {
  useRfidPermission,
  useRfidReader,
  type UseRfidPermission,
  type UseRfidReader,
} from "./hooks";
export {
  INVENTORY_UPDATE_INTERVAL,
  useRfidInventory,
  type RfidInventoryOptions,
  type RfidInventorySnapshot,
  type UseRfidInventory,
} from "./inventory";
export {
  DEFAULT_SINGLE_READ_WINDOW,
  useRfidSingleRead,
  type RfidSingleReadOptions,
  type RfidSingleReadSnapshot,
  type UseRfidSingleRead,
} from "./singleRead";
export {
  LOCATE_LOST_AFTER,
  LOCATE_UPDATE_INTERVAL,
  useRfidLocate,
  type RfidLocateOptions,
  type RfidLocateSnapshot,
  type UseRfidLocate,
} from "./locate";
export {
  useRfidTrigger,
  type RfidTriggerHandlers,
  type UseRfidTrigger,
} from "./trigger";
export {
  DEFAULT_DISCOVERY_TIMEOUT,
  useRfidReaderDiscovery,
  type DiscoveredRfidReader,
  type RfidDiscoveryOptions,
  type RfidDiscoverySnapshot,
  type UseRfidReaderDiscovery,
} from "./discovery";
export { normalizeEpc, toProximity } from "./tags";
export {
  RFID_CONTRACT_VERSION,
  type RfidAdapter,
  type RfidBeeperVolume,
  type RfidCapabilities,
  type RfidConnection,
  type RfidConnectionState,
  type RfidDiscoveredReader,
  type RfidDiscoveryHandlers,
  type RfidInventoryHandlers,
  type RfidInventoryRequest,
  type RfidLocateHandlers,
  type RfidProximityBounds,
  type RfidReadOnceRequest,
  type RfidReaderInfo,
  type RfidSettings,
  type RfidSettingsPatch,
  type RfidTag,
  type RfidTagRead,
} from "./types";
