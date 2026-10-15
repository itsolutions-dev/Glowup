import type { PermissionState, Unsubscribe } from "../core/types";
import type { BluetoothError } from "./errors";

/**
 * The Bluetooth radio, as far as an app can tell.
 *
 * - `unknown`: not known yet. iOS reports nothing before the app has asked
 *   for the permission (the question and the first state come together),
 *   and passes through it while the radio restarts.
 * - `unsupported`: no Bluetooth Low Energy here (the web, Expo Go, a
 *   simulator, a device without the radio).
 * - `unauthorized`: iOS only, the permission was refused. Android reports
 *   the radio whatever the permission: read `useBluetoothPermission()`.
 * - `off`: switched off, or (Android) switching on or off.
 * - `on`: ready.
 */
export type BluetoothState =
  "unknown" | "unsupported" | "unauthorized" | "off" | "on";

/** What a device broadcasts, as the platforms report it. */
export interface BluetoothAdvertisement {
  /** The advertised name, which may differ from the device's GATT name. */
  localName: string | null;
  /** The services it advertises (lowercase 128-bit UUIDs). */
  serviceUuids: string[];
  /** Data per service UUID: Eddystone, for example, travels here. */
  serviceData: Record<string, Uint8Array>;
  /**
   * The manufacturer-specific data: the Bluetooth SIG company identifier and
   * the bytes after it. Both platforms report at most one. iOS hides Apple's
   * iBeacon frames from apps here.
   */
  manufacturerData: { companyId: number; data: Uint8Array } | null;
  /** The transmit power it advertises, in dBm. */
  txPowerLevel: number | null;
  /** `null` where the platform does not say (Android before 8). */
  isConnectable: boolean | null;
}

/** A device seen by a scan. */
export interface BluetoothDevice {
  /**
   * How this phone addresses it: a per-app UUID on iOS (stable for this app
   * on this phone, not elsewhere), the MAC address on Android (which a
   * device may randomise). Use it to connect; never send it to another phone.
   */
  id: string;
  /** The advertised name, else the name the platform knows; `null` when none. */
  name: string | null;
  /** The signal strength of the latest advertisement, in dBm. */
  rssi: number;
  advertisement: BluetoothAdvertisement;
}

/** What a scan asks the platform for. */
export interface BluetoothScanRequest {
  /** Only devices advertising one of these services (UUIDs as given to the hook, normalised); all when empty. */
  services: string[];
}

export interface BluetoothScanHandlers {
  /** Every advertisement, repeats included: the hooks deduplicate. */
  onDevice(device: BluetoothDevice): void;
  /** The platform ended the scan on its own (an error, the radio going off). */
  onStop(error: BluetoothError): void;
}

/** What a characteristic allows, from its GATT properties. */
export interface BluetoothCharacteristicProperties {
  read: boolean;
  /** Write with response: the device acknowledges each write. */
  write: boolean;
  /** Write without response: faster, unacknowledged. */
  writeWithoutResponse: boolean;
  notify: boolean;
  /** Notifications the device wants acknowledged; subscribed the same way. */
  indicate: boolean;
}

export interface BluetoothCharacteristic {
  /** Lowercase 128-bit UUID. */
  uuid: string;
  /** Its service's UUID. */
  service: string;
  properties: BluetoothCharacteristicProperties;
}

export interface BluetoothService {
  /** Lowercase 128-bit UUID. */
  uuid: string;
  characteristics: BluetoothCharacteristic[];
}

/** A value a device sent through a notification or an indication. */
export interface BluetoothValueEvent {
  deviceId: string;
  service: string;
  characteristic: string;
  value: Uint8Array;
}

export interface BluetoothWriteRequest {
  withResponse: boolean;
}

/**
 * Bluetooth Low Energy as the central (the GATT client). The package's hooks
 * call only this; `bleManagerAdapter` is the default, on
 * `react-native-ble-manager`.
 */
export interface BluetoothAdapter {
  /** False where the native module is missing: the web, Expo Go, a build without it. */
  isSupported(): boolean;
  getState(): Promise<BluetoothState>;
  /** Calls `listener` on every change of the radio's state. */
  subscribeState(listener: (state: BluetoothState) => void): Unsubscribe;
  /**
   * Whether `enable()` can ask the user to switch Bluetooth on (Android's
   * system dialog). iOS gives apps no way to: tell the user where to.
   */
  canEnable(): boolean;
  /**
   * Asks the user to switch Bluetooth on. Resolves `true` when they accepted
   * (the radio then turns on, and the state follows), `false` when they
   * refused. Rejects `unsupported` where `canEnable()` is false.
   */
  enable(): Promise<boolean>;
  /**
   * Never prompts. On iOS it reads `undetermined` until the app has asked in
   * this launch: iOS has no way to read the permission without the risk of
   * showing the prompt.
   */
  getPermission(): Promise<PermissionState>;
  /**
   * Shows the system prompt when it can. iOS shows it once ever: afterwards
   * this answers at once, without UI, so an app can call it whenever a
   * Bluetooth screen opens.
   */
  requestPermission(): Promise<PermissionState>;
  /**
   * Starts the one scan of this adapter, replacing a running one. Called
   * only once the permission is granted and the radio is on.
   */
  startScan(
    request: BluetoothScanRequest,
    handlers: BluetoothScanHandlers,
  ): Promise<void>;
  /** Stops the scan; nothing happens when none runs. */
  stopScan(): Promise<void>;

  /*
   * GATT. UUIDs come in normalised (lowercase 128-bit); the hooks call these
   * only on a connected device, except connect().
   */

  /** Opens a connection. May never settle on iOS: the hooks time it out. */
  connect(deviceId: string): Promise<void>;
  /** Closes the connection, or cancels one being opened. */
  disconnect(deviceId: string): Promise<void>;
  /** Discovers the services and characteristics; needed before any other GATT call. */
  discoverServices(deviceId: string): Promise<BluetoothService[]>;
  read(
    deviceId: string,
    service: string,
    characteristic: string,
  ): Promise<Uint8Array>;
  /**
   * Writes `value`. One longer than a write can carry on this connection is
   * sent as several consecutive writes (what serial over BLE expects).
   */
  write(
    deviceId: string,
    service: string,
    characteristic: string,
    value: Uint8Array,
    request: BluetoothWriteRequest,
  ): Promise<void>;
  /** Turns notifications (or indications) on; values reach `subscribeValues`. */
  startNotifications(
    deviceId: string,
    service: string,
    characteristic: string,
  ): Promise<void>;
  stopNotifications(
    deviceId: string,
    service: string,
    characteristic: string,
  ): Promise<void>;
  /** Every notified value, of every device. */
  subscribeValues(listener: (event: BluetoothValueEvent) => void): Unsubscribe;
  /** Every closed connection, asked for or not. */
  subscribeDisconnects(listener: (deviceId: string) => void): Unsubscribe;
  /**
   * Asks for a larger MTU and resolves the one in force. Android negotiates
   * it on request; iOS negotiates on its own and only reports it.
   */
  requestMtu(deviceId: string, mtu: number): Promise<number>;
  readRssi(deviceId: string): Promise<number>;
  /**
   * Android only: pairs (bonds) with the device. iOS pairs by itself when a
   * characteristic needs encryption; absent there.
   */
  bond?(deviceId: string): Promise<void>;
}
