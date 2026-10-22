import { requireOptionalNativeModule } from "expo";

/**
 * The Kotlin module's surface (`android/…/ZebraScannerModule.kt`). Values are
 * DataWedge's own: the label type and the decoded text as its intent output
 * carries them, its parameters' names and string values. The adapter
 * converts them.
 */
export interface NativeRead {
  /** `com.symbol.datawedge.data_string`. */
  data: string;
  /** `com.symbol.datawedge.label_type` (`LABEL-TYPE-QRCODE`). */
  labelType: string | null;
  /** `com.symbol.datawedge.source` (`scanner`). */
  source: string | null;
  /** When the module received it, in ms since the epoch: DataWedge sends no decode time. */
  receivedAt: number;
}

/** One scanner from DataWedge's `ENUMERATE_SCANNERS`. */
export interface NativeScanner {
  name: string | null;
  index: number | null;
  /** `INTERNAL_IMAGER`, `INTERNAL_CAMERA`, `BLUETOOTH_ZEBRA`… */
  identifier: string | null;
  connected: boolean | null;
}

/** DataWedge's `GET_VERSION_INFO` and `ENUMERATE_SCANNERS`, field by field. */
export interface NativeScannerInfo {
  datawedge: string | null;
  barcodeScanning: string | null;
  decoderLibrary: string | null;
  /** `SCANNER_FIRMWARE`, one entry per scanner. */
  firmware: string[];
  scanners: NativeScanner[];
}

/** DataWedge parameters: every value is a string (`"true"`, `"1"`, `"UTF-8"`). */
export type NativeParams = Record<string, string>;

export interface NativeOpenConfig {
  /** The DataWedge profile; `null`: the app's package name. */
  profileName: string | null;
  /** Barcode input parameters stored in the profile (the data's shape). */
  profile: NativeParams;
  /**
   * Barcode input parameters for this claim only (`SWITCH_SCANNER_PARAMS`).
   * A key an earlier call set and this one leaves out goes back to the
   * profile's value.
   */
  scanner: NativeParams;
}

/** A diagnostic event: what DataWedge did, raw, while diagnostics are on. */
export interface ZebraScannerDiagnostic {
  type: string;
  /** ms since the epoch. */
  at: number;
  /** The thread the module ran on. */
  thread: string;
  [detail: string]: unknown;
}

export interface NativeEvents {
  onRead: (event: NativeRead) => void;
  onClose: (event: { code: string; message: string }) => void;
  onDiagnostic: (event: ZebraScannerDiagnostic) => void;
}

export interface NativeSubscription {
  remove(): void;
}

/**
 * The native module's revision this JavaScript expects: the Kotlin's
 * `NATIVE_REVISION`, raised together. A Metro reload changes the JavaScript
 * only, so an app built before a native change reports a lower one.
 */
export const ZEBRA_SCANNER_NATIVE_REVISION = 1;

export interface ZebraScannerNativeModule {
  getRevision(): number;
  /** Whether DataWedge (`com.symbol.datawedge`) is installed. Synchronous. */
  isDataWedgeInstalled(): boolean;
  setDiagnostics(enabled: boolean): void;
  /**
   * Sets the profile up (once per process and set of values), checks that
   * DataWedge is using it, applies `scanner` and enables the barcode input.
   * Again while open, it applies the new `scanner` parameters.
   */
  open(config: NativeOpenConfig): Promise<void>;
  /** Disables the barcode input, while DataWedge is still on the profile. */
  close(): Promise<void>;
  softwareTrigger(pressed: boolean): Promise<void>;
  getScannerInfo(): Promise<NativeScannerInfo>;
  /** The profile's stored barcode input parameters (`GET_CONFIG`). */
  getProfileParams(): Promise<Record<string, string | null>>;
  /** The profile DataWedge is using now (`GET_ACTIVE_PROFILE`). */
  getActiveProfile(): Promise<string | null>;
  addListener<K extends keyof NativeEvents>(
    event: K,
    listener: NativeEvents[K],
  ): NativeSubscription;
}

let loaded: ZebraScannerNativeModule | null | undefined;

/**
 * The native module, or `null` where it is not linked: iOS, the web, Expo Go,
 * or a build without this package.
 */
export function loadZebraScannerModule(): ZebraScannerNativeModule | null {
  if (loaded === undefined) {
    loaded =
      requireOptionalNativeModule<ZebraScannerNativeModule>("ZebraScanner");
  }
  return loaded;
}
