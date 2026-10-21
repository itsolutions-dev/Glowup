import {
  aimToBarcodeType,
  BarcodeScannerError,
  isBarcodeScannerError,
  type BarcodeScannerErrorCode,
  type BarcodeScannerInfo,
  type BarcodeScannerRead,
  type BarcodeType,
} from "@its/glowup-device/scanner";

import type { NativeProperty, NativeRead, NativeScannerInfo } from "./native";

/**
 * The SDK's switch for each `BarcodeType` (`BarcodeReader.PROPERTY_*`, read
 * from the AAR's public API). Code 128 includes GS1-128, which is Code 128
 * with a leading FNC1 (`]C1`): a GS1 label reads as Code 128, unparsed (C7).
 * ITF-14 is Interleaved 2 of 5 of 14 digits.
 */
export const SYMBOLOGY_PROPERTIES: Readonly<
  Record<BarcodeType, readonly string[]>
> = {
  aztec: ["DEC_AZTEC_ENABLED"],
  codabar: ["DEC_CODABAR_ENABLED"],
  code39: ["DEC_CODE39_ENABLED"],
  code93: ["DEC_CODE93_ENABLED"],
  code128: ["DEC_CODE128_ENABLED", "DEC_GS1_128_ENABLED"],
  datamatrix: ["DEC_DATAMATRIX_ENABLED"],
  ean8: ["DEC_EAN8_ENABLED"],
  ean13: ["DEC_EAN13_ENABLED"],
  itf14: ["DEC_I25_ENABLED"],
  pdf417: ["DEC_PDF417_ENABLED"],
  qr: ["DEC_QR_ENABLED"],
  upc_a: ["DEC_UPCA_ENABLE"],
  upc_e: ["DEC_UPCE0_ENABLED"],
};

/** What the adapter can turn on: every `BarcodeType` has a switch. */
export const HONEYWELL_SYMBOLOGIES = Object.keys(
  SYMBOLOGY_PROPERTIES,
) as BarcodeType[];

/**
 * The SDK's symbologies outside `BarcodeType`: off whenever a request names
 * its own, since the contract turns "every other" off.
 */
export const OTHER_SYMBOLOGY_PROPERTIES: Readonly<
  Record<string, NativeProperty>
> = {
  DEC_C128_ISBT_ENABLED: false,
  DEC_CODABLOCK_A_ENABLED: false,
  DEC_CODABLOCK_F_ENABLED: false,
  DEC_CODE11_ENABLED: false,
  DEC_COMPOSITE_ENABLED: false,
  DEC_DIGIMARC_ENABLED: false,
  DEC_DOTCODE_ENABLED: false,
  DEC_GRIDMATRIX_ENABLED: false,
  DEC_HANXIN_ENABLED: false,
  DEC_HK25_ENABLED: false,
  DEC_IATA25_ENABLED: false,
  DEC_KOREA_POST_ENABLED: false,
  DEC_M25_ENABLED: false,
  DEC_MAXICODE_ENABLED: false,
  DEC_MICROPDF_ENABLED: false,
  DEC_MSI_ENABLED: false,
  DEC_RSS_14_ENABLED: false,
  DEC_RSS_LIMITED_ENABLED: false,
  DEC_RSS_EXPANDED_ENABLED: false,
  DEC_S25_ENABLED: false,
  DEC_TELEPEN_ENABLED: false,
  DEC_TLC39_ENABLED: false,
  DEC_TRIOPTIC_ENABLED: false,
  DEC_UPCE1_ENABLED: false,
  // Not booleans: the postal codes' and OCR's modes.
  DEC_POSTAL_ENABLED: "none",
  DEC_OCR_MODE: "off",
};

/**
 * Set on every open: the decoded text reaches `onRead` as decoded (no
 * prefix, suffix or symbology id the device's wedge settings add, and every
 * digit of an EAN or UPC: the CT40 measured drops EAN-13's check digit by
 * default, and the camera reads all 13), and a scan does not also start an
 * intent, the browser or EZConfig. These are the app's claim's settings,
 * not the device's.
 */
export const DATA_PROPERTIES: Readonly<Record<string, NativeProperty>> = {
  DEC_EAN13_CHECK_DIGIT_TRANSMIT: true,
  DEC_EAN8_CHECK_DIGIT_TRANSMIT: true,
  DEC_UPCA_CHECK_DIGIT_TRANSMIT: true,
  DEC_UPCE_CHECK_DIGIT_TRANSMIT: true,
  DEC_UPCA_NUMBER_SYSTEM_TRANSMIT: true,
  DEC_UPCE_NUMBER_SYSTEM_TRANSMIT: true,
  DPR_PREFIX: "",
  DPR_SUFFIX: "",
  DPR_SYMBOLOGY_PREFIX: "none",
  DPR_DATA_INTENT: false,
  DPR_SCAN_TO_INTENT: false,
  DPR_LAUNCH_BROWSER: false,
  DPR_LAUNCH_EZ_CONFIG: false,
};

/**
 * The properties an `open()` sets. Without symbologies, the data properties
 * only: the module puts back any symbology an earlier request changed, so
 * the device's own configuration applies.
 */
export function toOpenProperties(
  symbologies: readonly BarcodeType[] | null,
): Record<string, NativeProperty> {
  if (symbologies === null) return { ...DATA_PROPERTIES };
  const wanted = new Set(symbologies);
  const properties: Record<string, NativeProperty> = {
    ...DATA_PROPERTIES,
    ...OTHER_SYMBOLOGY_PROPERTIES,
  };
  for (const type of HONEYWELL_SYMBOLOGIES) {
    for (const key of SYMBOLOGY_PROPERTIES[type]) {
      properties[key] = wanted.has(type);
    }
  }
  return properties;
}

/**
 * Honeywell's code ids where the AIM id cannot tell: UPC-A and UPC-E travel
 * as `]E0`, EAN-13's id. To confirm on the CT40 (the other symbologies' ids
 * are measured: plan, "Phase C2 — measured on the CT40").
 */
const CODE_ID_TYPES: Readonly<Record<string, BarcodeType>> = {
  c: "upc_a",
  E: "upc_e",
};

// BarcodeReadEvent's timestamp is a string; a parse before 2001 is no time.
const EARLIEST_REAL_TIME = 1_000_000_000_000;

// The CT40 writes the offset unpadded ("…09:27:47.246+2:00"): Hermes parses
// it, V8 does not, so it is padded to ISO 8601's "+02:00" first.
const UNPADDED_OFFSET = /([+-])(\d):(\d\d)$/;

function parseTimestamp(read: NativeRead): number {
  const parsed =
    typeof read.timestamp === "string"
      ? Date.parse(
          read.timestamp.replace(
            UNPADDED_OFFSET,
            (_, sign: string, hours: string, minutes: string) =>
              `${sign}0${hours}:${minutes}`,
          ),
        )
      : NaN;
  return Number.isFinite(parsed) && parsed >= EARLIEST_REAL_TIME
    ? parsed
    : read.receivedAt;
}

/** A read in the contract's terms. */
export function fromNativeRead(read: NativeRead): BarcodeScannerRead {
  const aimId =
    typeof read.aimId === "string" && read.aimId.startsWith("]")
      ? read.aimId
      : null;
  const codeId = read.codeId || null;
  const byAim = aimToBarcodeType(aimId);
  const byCode = codeId === null ? undefined : CODE_ID_TYPES[codeId];
  return {
    data: read.data,
    aimId,
    rawType: codeId ?? aimId ?? "unknown",
    ...(byAim === "ean13" && byCode ? { type: byCode } : {}),
    timestamp: parseTimestamp(read),
  };
}

export function fromNativeInfo(info: NativeScannerInfo): BarcodeScannerInfo {
  return {
    name: info.friendlyName || info.name || null,
    // BarcodeReaderInfo names no engine model; its fields are in the diagnostics.
    model: null,
    serialNumber: info.serialNumber || null,
    firmwareVersion: info.firmwareVersion || null,
  };
}

const CODES: Record<string, BarcodeScannerErrorCode> = {
  ERR_UNAVAILABLE: "unavailable",
  ERR_NOT_OPEN: "not-open",
  ERR_NO_SCANNER: "unsupported",
};

/** A native rejection or close as a `BarcodeScannerError`, by the module's code. */
export function fromNativeError(error: unknown): BarcodeScannerError {
  if (isBarcodeScannerError(error)) return error;
  const { code, message } = (error ?? {}) as {
    code?: unknown;
    message?: unknown;
  };
  return new BarcodeScannerError(
    (typeof code === "string" && CODES[code]) || "failed",
    typeof message === "string" && message !== "" ? message : undefined,
    error,
  );
}
