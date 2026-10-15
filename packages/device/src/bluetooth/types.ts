import type { PermissionState, Unsubscribe } from "../core/types";

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
}
