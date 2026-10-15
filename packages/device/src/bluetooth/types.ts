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
}
