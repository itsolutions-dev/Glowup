import { createEmitter } from "./shared";
import type { Unsubscribe } from "./types";

/**
 * The symbologies the package names. `/camera` scans them through the
 * camera, `/scanner` through a hardware imager; both report them the same
 * way, so one `onScan` serves either.
 */
export type BarcodeType =
  | "aztec"
  | "codabar"
  | "code39"
  | "code93"
  | "code128"
  | "datamatrix"
  | "ean8"
  | "ean13"
  | "itf14"
  | "pdf417"
  | "qr"
  | "upc_a"
  | "upc_e";

/** Every `BarcodeType`, in a stable order. */
export const BARCODE_TYPES: readonly BarcodeType[] = [
  "aztec",
  "codabar",
  "code39",
  "code93",
  "code128",
  "datamatrix",
  "ean8",
  "ean13",
  "itf14",
  "pdf417",
  "qr",
  "upc_a",
  "upc_e",
];

/**
 * A code read by the camera (`/camera`'s `ScannedBarcode`) or a hardware
 * scanner (`/scanner`'s `BarcodeScannerScan`): what both have, so an app
 * writes one handler for either.
 */
export interface BarcodeScan {
  /** `"unknown"` for a symbology outside `BarcodeType`; see `rawType`. */
  type: BarcodeType | "unknown";
  /** The symbology as the platform or the vendor reported it. */
  rawType: string;
  /** The decoded text. */
  data: string;
}

/**
 * The ISO/IEC 15424 symbology identifiers (AIM ids, `]Q1`) by their first
 * character: the vendor-neutral way a hardware scanner names what it read.
 * `]E0` is EAN-13 and also UPC-A (sent as EAN-13 with a leading 0).
 */
const AIM_TYPES: Record<string, BarcodeType> = {
  A: "code39",
  C: "code128",
  F: "codabar",
  G: "code93",
  I: "itf14",
  L: "pdf417",
  Q: "qr",
  d: "datamatrix",
  z: "aztec",
};

/** The `BarcodeType` an AIM id (`]C0`, `]d2`) names, or `"unknown"`. */
export function aimToBarcodeType(
  aimId: string | null | undefined,
): BarcodeType | "unknown" {
  if (typeof aimId !== "string" || aimId[0] !== "]" || aimId.length < 2) {
    return "unknown";
  }
  const symbology = aimId[1]!;
  if (symbology === "E") {
    if (aimId[2] === "0") return "ean13";
    if (aimId[2] === "4") return "ean8";
    return "unknown";
  }
  return AIM_TYPES[symbology] ?? "unknown";
}

export interface ScanGateOptions {
  /**
   * Milliseconds during which the same code (`rawType` and `data`) is
   * delivered once; 0 delivers every read.
   */
  repeatInterval: number;
  /**
   * Drop reads while the previous delivery's promise is pending, so a
   * confirmation that runs on a read cannot run twice.
   */
  dropWhileBusy: boolean;
}

/** One handler's guards: its repeat filter and whether it is busy. */
export interface ScanGate {
  /**
   * Delivers `scan` unless a guard drops it; returns whether it was
   * delivered. A delivery returning a promise makes the gate busy until it
   * settles; a rejection stays the app's (it is not swallowed).
   */
  offer<S extends BarcodeScan>(
    scan: S,
    options: ScanGateOptions,
    deliver: (scan: S) => unknown,
  ): boolean;
  isBusy(): boolean;
  subscribe(listener: () => void): Unsubscribe;
  /** Forgets the last code: the next read of it is delivered. */
  reset(): void;
}

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { then?: unknown }).then === "function"
  );
}

export function createScanGate(): ScanGate {
  const emitter = createEmitter();
  let last: { key: string; at: number } | null = null;
  let busy = false;

  function setBusy(next: boolean) {
    if (busy === next) return;
    busy = next;
    emitter.emit();
  }

  return {
    offer(scan, { repeatInterval, dropWhileBusy }, deliver) {
      if (dropWhileBusy && busy) return false;
      const key = `${scan.rawType}:${scan.data}`;
      const now = Date.now();
      if (last && last.key === key && now - last.at < repeatInterval) {
        return false;
      }
      last = { key, at: now };
      const result = deliver(scan);
      if (isThenable(result)) {
        setBusy(true);
        void Promise.resolve(result).then(
          () => setBusy(false),
          (error: unknown) => {
            setBusy(false);
            throw error;
          },
        );
      }
      return true;
    },
    isBusy: () => busy,
    subscribe: emitter.subscribe,
    reset() {
      last = null;
    },
  };
}
