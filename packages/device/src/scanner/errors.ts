/**
 * Why a barcode scanner operation failed. The same codes for every vendor.
 *
 * - `unsupported`: no hardware scanner here: no adapter was provided, the
 *   device has no imager the vendor's SDK reaches, or the build lacks it.
 * - `incompatible-adapter`: the adapter implements another version of the
 *   contract than this package: update the vendor package or this one.
 * - `unavailable`: the scanner is held elsewhere (another app claimed it) or
 *   its service is not answering.
 * - `not-open`: the operation needs the scanner open (`useBarcodeScanner`
 *   enabled, the app in the foreground).
 * - `failed`: anything else the vendor reported; `cause` carries it.
 */
export type BarcodeScannerErrorCode =
  | "unsupported"
  | "incompatible-adapter"
  | "unavailable"
  | "not-open"
  | "failed";

const DEFAULT_MESSAGES: Record<BarcodeScannerErrorCode, string> = {
  unsupported: "No hardware barcode scanner here.",
  "incompatible-adapter":
    "The barcode scanner adapter implements another version of the contract.",
  unavailable: "The barcode scanner is held elsewhere or not answering.",
  "not-open": "The barcode scanner is not open.",
  failed: "The barcode scanner operation failed.",
};

export class BarcodeScannerError extends Error {
  readonly code: BarcodeScannerErrorCode;

  constructor(
    code: BarcodeScannerErrorCode,
    message?: string,
    cause?: unknown,
  ) {
    super(message ?? DEFAULT_MESSAGES[code]);
    this.name = "BarcodeScannerError";
    this.code = code;
    if (cause !== undefined) (this as { cause?: unknown }).cause = cause;
  }
}

export function isBarcodeScannerError(
  error: unknown,
): error is BarcodeScannerError {
  return (
    error instanceof Error &&
    error.name === "BarcodeScannerError" &&
    typeof (error as BarcodeScannerError).code === "string"
  );
}

/** Anything thrown, as a `BarcodeScannerError`. */
export function toBarcodeScannerError(error: unknown): BarcodeScannerError {
  return isBarcodeScannerError(error)
    ? error
    : new BarcodeScannerError(
        "failed",
        error instanceof Error ? error.message : String(error),
        error,
      );
}
