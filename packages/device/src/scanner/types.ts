import type { BarcodeScan, BarcodeType } from "../core/barcodes";
import type { BarcodeScannerError } from "./errors";

/**
 * The version of the contract below. A vendor adapter declares the one it
 * implements in `contractVersion`, and the engine refuses a mismatch with
 * `BarcodeScannerError("incompatible-adapter")`. It changes only when the
 * contract does, never for an addition an adapter may leave out.
 */
export const BARCODE_SCANNER_CONTRACT_VERSION = 1;

/** One decode as the vendor's SDK reported it, in the contract's terms. */
export interface BarcodeScannerRead {
  /** The decoded text, as the SDK decoded it (its charset applied). */
  data: string;
  /** The ISO/IEC 15424 symbology identifier (`]Q1`, `]C0`), when the SDK gives one. */
  aimId: string | null;
  /** The vendor's own symbology id (Honeywell's code id), kept for diagnostics. */
  rawType: string;
  /** The symbology, when the adapter knows it better than the AIM id says. */
  type?: BarcodeType | "unknown";
  /** When it was decoded, in ms since the epoch. Default: when it arrived. */
  timestamp?: number;
}

export interface BarcodeScannerOpenRequest {
  /**
   * The symbologies to decode, every other off; `null` keeps the scanner's
   * own configuration (the device's settings). Only from `symbologies`.
   */
  symbologies: readonly BarcodeType[] | null;
}

export interface BarcodeScannerHandlers {
  /** Each decode, while open. Never called after `close()` resolves. */
  onRead(read: BarcodeScannerRead): void;
  /** The hardware trigger, when the SDK reports its presses. */
  onTrigger(pressed: boolean): void;
  /**
   * The scanner closed without `close()`: another app claimed it
   * (`unavailable`) or it failed. Not called after `close()`.
   */
  onClose(error: BarcodeScannerError | null): void;
}

export interface BarcodeScannerInfo {
  name: string | null;
  model: string | null;
  serialNumber: string | null;
  firmwareVersion: string | null;
}

/**
 * What a vendor package implements: the device's imager, held by the app
 * while open. The engine in `@its/glowup-device/scanner` decides when: open
 * while a screen wants it and the app is in the foreground, closed
 * otherwise, so the device's own keyboard wedge or another app gets it back.
 */
export interface BarcodeScannerAdapter {
  /**
   * The contract version the adapter was written for, as a number literal:
   * importing `BARCODE_SCANNER_CONTRACT_VERSION` would always match.
   */
  readonly contractVersion: number;
  /** Who made the scanner: `"honeywell"`, `"zebra"`, … */
  readonly vendor: string;
  /** The symbologies `open()` can turn on. */
  readonly symbologies: readonly BarcodeType[];

  /** Whether this device and build can reach the vendor's scanner. Synchronous. */
  isSupported(): boolean;

  /**
   * Claims the scanner, applies the request and resolves once decodes reach
   * `handlers`. Called again while open, it applies the new request and
   * keeps the claim (and the handlers: reads are delivered once).
   */
  open(
    request: BarcodeScannerOpenRequest,
    handlers: BarcodeScannerHandlers,
  ): Promise<void>;
  /** Releases the scanner. Resolves at once when it is not open. */
  close(): Promise<void>;

  /**
   * Starts (`true`) or stops a decode, as the hardware trigger would: an
   * on-screen scan button. Rejects with `not-open` when it is not open.
   */
  softwareTrigger?(pressed: boolean): Promise<void>;
  getScannerInfo?(): Promise<BarcodeScannerInfo>;
}

/** What an adapter offers beyond the required primitives. */
export interface BarcodeScannerCapabilities {
  softwareTrigger: boolean;
  scannerInfo: boolean;
  /** The symbologies the scanner can be told to read. */
  symbologies: readonly BarcodeType[];
}

/** A hardware scanner's read, as `onScan` receives it. */
export interface BarcodeScannerScan extends BarcodeScan {
  aimId: string | null;
  /** When it was decoded, in ms since the epoch. */
  timestamp: number;
}
