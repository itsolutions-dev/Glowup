/**
 * Why a Bluetooth operation failed.
 *
 * - `unsupported`: no Bluetooth Low Energy here (the web, Expo Go, a
 *   simulator, a device without the radio), or the native module is missing
 *   from the build.
 * - `permission-denied`: the Bluetooth permission is not granted.
 * - `powered-off`: Bluetooth is switched off.
 * - `timeout`: the device did not answer in time.
 * - `not-connected`: the operation needs a connection that is not open.
 * - `disconnected`: the connection dropped while the operation ran.
 * - `failed`: anything else the platform reported; `cause` carries it.
 */
export type BluetoothErrorCode =
  | "unsupported"
  | "permission-denied"
  | "powered-off"
  | "timeout"
  | "not-connected"
  | "disconnected"
  | "failed";

const DEFAULT_MESSAGES: Record<BluetoothErrorCode, string> = {
  unsupported: "Bluetooth Low Energy is not available here.",
  "permission-denied": "The Bluetooth permission is not granted.",
  "powered-off": "Bluetooth is switched off.",
  timeout: "The Bluetooth device did not answer in time.",
  "not-connected": "The Bluetooth device is not connected.",
  disconnected: "The Bluetooth device disconnected.",
  failed: "The Bluetooth operation failed.",
};

export class BluetoothError extends Error {
  readonly code: BluetoothErrorCode;

  constructor(code: BluetoothErrorCode, message?: string, cause?: unknown) {
    super(message ?? DEFAULT_MESSAGES[code]);
    this.name = "BluetoothError";
    this.code = code;
    if (cause !== undefined) (this as { cause?: unknown }).cause = cause;
  }
}

export function isBluetoothError(error: unknown): error is BluetoothError {
  return (
    error instanceof Error &&
    error.name === "BluetoothError" &&
    typeof (error as BluetoothError).code === "string"
  );
}
