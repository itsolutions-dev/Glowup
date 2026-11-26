/**
 * Why an RFID operation failed. The same codes for every vendor: an app
 * handles them once, whichever reader it runs on.
 *
 * - `unsupported`: no RFID here: no adapter was provided, the platform has
 *   no SDK for it (iOS and the web for Honeywell), or the build lacks it.
 * - `incompatible-adapter`: the adapter implements another version of the
 *   contract than this package: update the vendor package or this one.
 * - `permission-denied`: the permission the reader's link needs is not
 *   granted (Bluetooth on Android).
 * - `not-connected`: the operation needs a connected reader.
 * - `disconnected`: the reader dropped while the operation ran.
 * - `timeout`: the reader did not answer in time.
 * - `cancelled`: another mode replaced this one, or `stop()` ended it.
 * - `failed`: anything else the vendor reported; `cause` carries it.
 */
export type RfidErrorCode =
  | "unsupported"
  | "incompatible-adapter"
  | "permission-denied"
  | "not-connected"
  | "disconnected"
  | "timeout"
  | "cancelled"
  | "failed";

const DEFAULT_MESSAGES: Record<RfidErrorCode, string> = {
  unsupported: "No RFID reader support here.",
  "incompatible-adapter":
    "The RFID adapter implements another version of the contract.",
  "permission-denied": "The permission the RFID reader needs is not granted.",
  "not-connected": "No RFID reader is connected.",
  disconnected: "The RFID reader disconnected.",
  timeout: "The RFID reader did not answer in time.",
  cancelled: "The RFID operation was cancelled.",
  failed: "The RFID operation failed.",
};

export class RfidError extends Error {
  readonly code: RfidErrorCode;

  constructor(code: RfidErrorCode, message?: string, cause?: unknown) {
    super(message ?? DEFAULT_MESSAGES[code]);
    this.name = "RfidError";
    this.code = code;
    if (cause !== undefined) (this as { cause?: unknown }).cause = cause;
  }
}

export function isRfidError(error: unknown): error is RfidError {
  return (
    error instanceof Error &&
    error.name === "RfidError" &&
    typeof (error as RfidError).code === "string"
  );
}

/** Anything thrown, as an `RfidError`. */
export function toRfidError(error: unknown): RfidError {
  return isRfidError(error)
    ? error
    : new RfidError(
        "failed",
        error instanceof Error ? error.message : String(error),
        error,
      );
}
