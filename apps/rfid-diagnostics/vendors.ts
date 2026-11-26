import type { RfidAdapter } from "@its/glowup-device/rfid";
import {
  getHoneywellRfidAdapter,
  HONEYWELL_NATIVE_REVISION,
} from "@its/rfid-honeywell";
import { getZebraRfidAdapter, ZEBRA_NATIVE_REVISION } from "@its/rfid-zebra";
import {
  getHoneywellBarcodeScannerAdapter,
  HONEYWELL_SCANNER_NATIVE_REVISION,
  type HoneywellBarcodeScannerAdapter,
} from "@its/scanner-honeywell";
import {
  getZebraBarcodeScannerAdapter,
  ZEBRA_SCANNER_NATIVE_REVISION,
  type ZebraBarcodeScannerAdapter,
} from "@its/scanner-zebra";

import type { RfidDiagnostic } from "./measurements";

/** The adapter's parts the diagnostics use, whichever vendor runs. */
export type DiagnosticsAdapter = RfidAdapter & {
  nativeRevision(): number | null;
  setDiagnostics(enabled: boolean): void;
  setDiscoveryFilter(enabled: boolean): void;
  subscribeDiagnostics(listener: (event: RfidDiagnostic) => void): () => void;
};

export interface DiagnosticsVendor {
  name: "honeywell" | "zebra";
  adapter: DiagnosticsAdapter;
  /** The native revision this JavaScript expects. */
  expectedRevision: number;
  /** Why `isSupported()` reads false here. */
  unsupportedReason(): string;
  /** The discovery filter's label. */
  filterLabel: string;
  /** The connect field's placeholder. */
  idPlaceholder: string;
  /** Adds or removes the reader's own search, where the vendor can (Zebra). */
  setNativeLocate?(enabled: boolean): void;
  /** The host's barcode scanner: the CT40's imager, the TC22's. */
  scanner: ScannerVendor;
}

/**
 * The barcode scanner the diagnostics drive, the build's vendor's: the other
 * vendor's module is left out of the build.
 */
export type ScannerVendor =
  | {
      name: "honeywell";
      adapter: HoneywellBarcodeScannerAdapter;
      expectedRevision: number;
      unsupportedReason(): string;
    }
  | {
      name: "zebra";
      adapter: ZebraBarcodeScannerAdapter;
      expectedRevision: number;
      unsupportedReason(): string;
    };

export function honeywellScanner(): ScannerVendor {
  const adapter = getHoneywellBarcodeScannerAdapter();
  return {
    name: "honeywell",
    adapter,
    expectedRevision: HONEYWELL_SCANNER_NATIVE_REVISION,
    unsupportedReason: () =>
      !adapter.isHoneywellHost()
        ? "unsupported: not a Honeywell host"
        : `${MISSING} (RFID_VENDOR=honeywell links it)`,
  };
}

export function zebraScanner(): ScannerVendor {
  const adapter = getZebraBarcodeScannerAdapter();
  return {
    name: "zebra",
    adapter,
    expectedRevision: ZEBRA_SCANNER_NATIVE_REVISION,
    unsupportedReason: () =>
      adapter.nativeRevision() === null
        ? "unsupported: the native module is missing (RFID_VENDOR=zebra links it)"
        : !adapter.isZebraHost()
          ? "unsupported: not a Zebra host"
          : "unsupported: DataWedge is not installed",
  };
}

const MISSING =
  "unsupported: the native module is missing (build with the plugin)";

export function honeywellVendor(): DiagnosticsVendor {
  const adapter = getHoneywellRfidAdapter();
  return {
    name: "honeywell",
    adapter,
    expectedRevision: HONEYWELL_NATIVE_REVISION,
    unsupportedReason: () =>
      adapter.isHoneywellHost() ? MISSING : "unsupported: not a Honeywell host",
    filterLabel: "Only Honeywell-looking readers",
    idPlaceholder: "Bluetooth address, e.g. 0C:23:69:19:AA:12",
    scanner: honeywellScanner(),
  };
}

export function zebraVendor(): DiagnosticsVendor {
  const adapter = getZebraRfidAdapter();
  return {
    name: "zebra",
    adapter,
    expectedRevision: ZEBRA_NATIVE_REVISION,
    unsupportedReason: () => `${MISSING} (RFID_VENDOR=zebra)`,
    filterLabel: "Only Zebra-looking readers (RFD…)",
    idPlaceholder: "Paired reader's address or name, e.g. RFD40+_2115…",
    setNativeLocate: (enabled) => adapter.setNativeLocate(enabled),
    scanner: zebraScanner(),
  };
}

/**
 * The vendor this build links (`RFID_VENDOR` at build time leaves the other
 * module out): Zebra when its module answers, Honeywell otherwise.
 */
export function linkedVendor(): DiagnosticsVendor {
  const zebra = zebraVendor();
  return zebra.adapter.nativeRevision() !== null ? zebra : honeywellVendor();
}
