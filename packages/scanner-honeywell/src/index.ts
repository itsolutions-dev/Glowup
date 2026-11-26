/**
 * `@its/scanner-honeywell` — the imager of Honeywell mobile computers (the
 * CT40) behind `@its/glowup-device/scanner`, through Honeywell's Data
 * Collection SDK. Android only, in a development build made with this
 * package's config plugin and the app's own copy of the SDK
 * (`dataCollectionAarPath`): its licence forbids shipping it here.
 *
 * ```tsx
 * <DeviceAdaptersProvider adapters={{ barcodeScanner: getHoneywellBarcodeScannerAdapter() }}>
 * ```
 */
export {
  createHoneywellBarcodeScannerAdapter,
  getHoneywellBarcodeScannerAdapter,
  type HoneywellBarcodeScannerAdapter,
  type HoneywellBarcodeScannerAdapterOptions,
} from "./adapter";
export {
  HONEYWELL_SCANNER_NATIVE_REVISION,
  type HoneywellScannerDiagnostic,
  type HoneywellTriggerControl,
  type NativeProperty as HoneywellScannerProperty,
  type NativeScannerInfo as HoneywellScannerInfo,
} from "./native";
