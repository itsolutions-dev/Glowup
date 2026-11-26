import { requireOptionalNativeModule } from "expo";

/**
 * The Kotlin module's surface (`android/…/HoneywellScannerModule.kt`). Values
 * are the SDK's own: Honeywell's code id, the AIM id, the timestamp string
 * and the charset's name as `BarcodeReadEvent` gives them. The adapter
 * converts them.
 */
export interface NativeRead {
  data: string;
  /** Honeywell's symbology id (`s` QR, `j` Code 128). */
  codeId: string | null;
  /** ISO/IEC 15424 (`]Q1`). */
  aimId: string | null;
  charset: string | null;
  /** `BarcodeReadEvent.getTimestamp()`, as the service formats it. */
  timestamp: string | null;
  /** When the module received it, in ms since the epoch. */
  receivedAt: number;
}

/** `BarcodeReaderInfo`, field by field. */
export interface NativeScannerInfo {
  name: string | null;
  friendlyName: string | null;
  scannerId: string | null;
  firmwareVersion: string | null;
  serialNumber: string | null;
  versionNumber: string | null;
  controlLogicVersion: string | null;
  fullDecodeVersion: string | null;
  fastDecodeVersion: string | null;
}

/** A value of one of the SDK's `PROPERTY_*` keys. */
export type NativeProperty = boolean | number | string;

/**
 * Who decodes on a trigger press: the scanner service (`auto`, its
 * `autoControl`) or the module, which aims, lights and decodes on each
 * trigger event (`client`, `clientControl`).
 */
export type HoneywellTriggerControl = "auto" | "client";

/** A diagnostic event: what the SDK did, raw, while diagnostics are on. */
export interface HoneywellScannerDiagnostic {
  type: string;
  /** ms since the epoch. */
  at: number;
  /** The thread the SDK called back on. */
  thread: string;
  [detail: string]: unknown;
}

export interface NativeEvents {
  onRead: (event: NativeRead) => void;
  onTrigger: (event: { pressed: boolean }) => void;
  onClose: (event: { code: string; message: string }) => void;
  onDiagnostic: (event: HoneywellScannerDiagnostic) => void;
}

export interface NativeSubscription {
  remove(): void;
}

/**
 * The native module's revision this JavaScript expects: the Kotlin's
 * `NATIVE_REVISION`, raised together. A Metro reload changes the JavaScript
 * only, so an app built before a native change reports a lower one.
 */
export const HONEYWELL_SCANNER_NATIVE_REVISION = 1;

export interface HoneywellScannerNativeModule {
  getRevision(): number;
  setDiagnostics(enabled: boolean): void;
  /**
   * Claims the imager with these properties set; again while claimed, it
   * applies them. A key an earlier call set and this one leaves out goes back
   * to the value it had before.
   */
  open(
    properties: Record<string, NativeProperty>,
    triggerControl: HoneywellTriggerControl,
  ): Promise<void>;
  close(): Promise<void>;
  softwareTrigger(pressed: boolean): Promise<void>;
  getScannerInfo(): Promise<NativeScannerInfo>;
  listDevices(): Promise<NativeScannerInfo[]>;
  getAllProperties(): Promise<Record<string, NativeProperty | null>>;
  addListener<K extends keyof NativeEvents>(
    event: K,
    listener: NativeEvents[K],
  ): NativeSubscription;
}

let loaded: HoneywellScannerNativeModule | null | undefined;

/**
 * The native module, or `null` where it is not linked: iOS, the web, Expo Go,
 * or a build made without the config plugin.
 */
export function loadHoneywellScannerModule(): HoneywellScannerNativeModule | null {
  if (loaded === undefined) {
    loaded =
      requireOptionalNativeModule<HoneywellScannerNativeModule>(
        "HoneywellScanner",
      );
  }
  return loaded;
}
