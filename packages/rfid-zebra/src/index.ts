/**
 * `@its/rfid-zebra` — Zebra RFID readers (the RFD40 Premium over Bluetooth,
 * RFID SDK for Android 2.0.5.297) behind `@its/glowup-device/rfid`. Android
 * only, in a development build made with this package's config plugin and the
 * app's own copy of the SDK (`aarPath`): it is not on a public repository,
 * and this package does not ship it.
 *
 * ```tsx
 * <DeviceAdaptersProvider adapters={{ rfid: getZebraRfidAdapter() }}>
 * ```
 */
export {
  createZebraRfidAdapter,
  getZebraRfidAdapter,
  type ZebraRfidAdapter,
  type ZebraRfidAdapterOptions,
} from "./adapter";
export { ZEBRA_NATIVE_REVISION, type ZebraDiagnostic } from "./native";
