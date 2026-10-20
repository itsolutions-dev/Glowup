/**
 * `@its/glowup-device/scanner` — a hardware barcode scanner (a rugged
 * device's imager) behind one contract: `useBarcodeScanner({ onScan })`
 * holds it while a screen wants it and hands each read to `onScan`, which
 * confirms by itself. No vendor ships here: install one
 * (`@its/scanner-honeywell`) and pass its adapter to `DeviceAdaptersProvider`
 * as `barcodeScanner`. Without one, everything reads unsupported: read
 * through `/camera`'s `CameraView` with the same handler.
 */
export {
  aimToBarcodeType,
  BARCODE_TYPES,
  type BarcodeScan,
  type BarcodeType,
} from "../core/barcodes";
export {
  BarcodeScannerError,
  isBarcodeScannerError,
  toBarcodeScannerError,
  type BarcodeScannerErrorCode,
} from "./errors";
export {
  firstSupportedBarcodeScannerAdapter,
  getBarcodeScannerCapabilities,
  isCompatibleBarcodeScannerAdapter,
  unsupportedBarcodeScannerAdapter,
} from "./adapter";
export type { BarcodeScannerState } from "./engine";
export {
  DEFAULT_REPEAT_INTERVAL,
  useBarcodeScanner,
  type BarcodeScannerOptions,
  type UseBarcodeScanner,
} from "./hooks";
export {
  BARCODE_SCANNER_CONTRACT_VERSION,
  type BarcodeScannerAdapter,
  type BarcodeScannerCapabilities,
  type BarcodeScannerHandlers,
  type BarcodeScannerInfo,
  type BarcodeScannerOpenRequest,
  type BarcodeScannerRead,
  type BarcodeScannerScan,
} from "./types";
