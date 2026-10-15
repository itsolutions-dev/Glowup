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
export {
  DEFAULT_CONNECT_TIMEOUT,
  GATT_TIMEOUT,
  useBluetoothDevice,
  useBluetoothNotifications,
  type BluetoothConnectionStatus,
  type BluetoothDeviceSnapshot,
  type BluetoothNotificationState,
  type ConnectOptions,
  type UseBluetoothDevice,
  type UseBluetoothDeviceOptions,
  type UseBluetoothNotificationsOptions,
  type WriteOptions,
} from "./connection";
export {
  BLUETOOTH_CHARACTERISTICS,
  BLUETOOTH_SERVICES,
  decodeUtf8,
  encodeUtf8,
  parseBatteryLevel,
  readBatteryLevel,
  readDeviceInformation,
  type DeviceInformation,
  type GattReader,
} from "./profiles";
export { shortBluetoothUuid, toBluetoothUuid } from "./uuid";
export type {
  BluetoothAdapter,
  BluetoothAdvertisement,
  BluetoothCharacteristic,
  BluetoothCharacteristicProperties,
  BluetoothDevice,
  BluetoothService,
  BluetoothValueEvent,
  BluetoothWriteRequest,
  BluetoothScanHandlers,
  BluetoothScanRequest,
  BluetoothState,
} from "./types";
