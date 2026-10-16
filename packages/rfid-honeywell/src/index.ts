/**
 * `@its/rfid-honeywell` — Honeywell RFID readers (the IH40 over Bluetooth,
 * RFID SDK v1.1.0) behind `@its/glowup-device/rfid`. Android only, in a
 * development build made with this package's config plugin and the app's own
 * copy of the SDK (`aarPath`): its licence forbids shipping it here.
 *
 * ```tsx
 * <DeviceAdaptersProvider adapters={{ rfid: getHoneywellRfidAdapter() }}>
 * ```
 */
export {
  createHoneywellRfidAdapter,
  getHoneywellRfidAdapter,
  type HoneywellRfidAdapter,
  type HoneywellRfidAdapterOptions,
} from "./adapter";
export type { HoneywellDiagnostic } from "./native";
