import { BarcodeScannerError } from "./errors";
import {
  BARCODE_SCANNER_CONTRACT_VERSION,
  type BarcodeScannerAdapter,
  type BarcodeScannerCapabilities,
} from "./types";

/**
 * What the hooks use without a vendor adapter: nothing is supported and
 * `open()` rejects. `/scanner` ships no vendor: install one
 * (`@its/scanner-honeywell`) and pass its adapter to `DeviceAdaptersProvider`
 * as `barcodeScanner`; without one, read barcodes with `/camera`.
 */
export const unsupportedBarcodeScannerAdapter: BarcodeScannerAdapter = {
  contractVersion: BARCODE_SCANNER_CONTRACT_VERSION,
  vendor: "none",
  symbologies: [],
  isSupported: () => false,
  open: () => Promise.reject(new BarcodeScannerError("unsupported")),
  close: () => Promise.resolve(),
};

/** Whether the adapter implements this package's contract version. */
export function isCompatibleBarcodeScannerAdapter(
  adapter: BarcodeScannerAdapter,
): boolean {
  return adapter.contractVersion === BARCODE_SCANNER_CONTRACT_VERSION;
}

/** What the adapter offers, read from the optional methods it implements. */
export function getBarcodeScannerCapabilities(
  adapter: BarcodeScannerAdapter,
): BarcodeScannerCapabilities {
  return {
    softwareTrigger: typeof adapter.softwareTrigger === "function",
    scannerInfo: typeof adapter.getScannerInfo === "function",
    symbologies: adapter.symbologies,
  };
}

/**
 * The first adapter that is supported here and implements this contract
 * version, or `unsupportedBarcodeScannerAdapter`: for an app that ships
 * several vendors and picks at run time. Call it on the client:
 * `isSupported()` reads the device.
 */
export function firstSupportedBarcodeScannerAdapter(
  adapters: readonly BarcodeScannerAdapter[],
): BarcodeScannerAdapter {
  return (
    adapters.find(
      (adapter) =>
        isCompatibleBarcodeScannerAdapter(adapter) && adapter.isSupported(),
    ) ?? unsupportedBarcodeScannerAdapter
  );
}
