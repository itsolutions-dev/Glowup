/**
 * `@its/glowup-device/bluetooth` — Bluetooth Low Energy as the central (the
 * GATT client): the radio, the permission, scanning, connections and GATT.
 * Needs `react-native-ble-manager` and a development build; the web and Expo
 * Go read `unsupported`.
 */
export {
  BluetoothError,
  isBluetoothError,
  type BluetoothErrorCode,
} from "./errors";
export {
  useBluetoothPermission,
  useBluetoothState,
  type UseBluetoothPermission,
  type UseBluetoothState,
} from "./hooks";
export {
  bleManagerAdapter,
  createBleManagerAdapter,
  type BleManagerAdapterOptions,
} from "./bleManager";
export {
  DEFAULT_SCAN_TIMEOUT,
  useBluetoothScan,
  type BluetoothScanOptions,
  type BluetoothScanSnapshot,
  type ScannedDevice,
  type UseBluetoothScan,
} from "./scan";
export { shortBluetoothUuid, toBluetoothUuid } from "./uuid";
export type {
  BluetoothAdapter,
  BluetoothAdvertisement,
  BluetoothDevice,
  BluetoothScanHandlers,
  BluetoothScanRequest,
  BluetoothState,
} from "./types";
