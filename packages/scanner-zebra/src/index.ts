/**
 * `@its/scanner-zebra` — the imager of Zebra mobile computers (the TC22)
 * behind `@its/glowup-device/scanner`, through DataWedge, the scanning
 * service every Zebra device runs. Android only, in a development build; no
 * SDK and no config plugin: the package creates a DataWedge profile for the
 * app and receives its reads as intents.
 *
 * ```tsx
 * <DeviceAdaptersProvider adapters={{ barcodeScanner: getZebraBarcodeScannerAdapter() }}>
 * ```
 */
export {
  createZebraBarcodeScannerAdapter,
  getZebraBarcodeScannerAdapter,
  type ZebraBarcodeScannerAdapter,
  type ZebraBarcodeScannerAdapterOptions,
} from "./adapter";
export {
  ZEBRA_SCANNER_NATIVE_REVISION,
  type NativeScanner as ZebraScanner,
  type NativeScannerInfo as ZebraScannerInfo,
  type ZebraScannerDiagnostic,
  type ZebraSymbologyMethod,
} from "./native";
