import {
  BarcodeScannerError,
  isBarcodeScannerError,
  type BarcodeScannerErrorCode,
  type BarcodeScannerInfo,
  type BarcodeScannerRead,
  type BarcodeType,
} from "@its/glowup-device/scanner";

import type {
  NativeOpenConfig,
  NativeParams,
  NativeRead,
  NativeScannerInfo,
  ZebraSymbologyMethod,
} from "./native";

/**
 * DataWedge's decoder switch for each `BarcodeType` (its barcode input
 * parameters). Code 128 includes GS1-128 (its `decoder_code128_enable_ean128`
 * subtype, on by default, is left alone): a GS1 label reads as Code 128,
 * unparsed (C7). ITF-14 is Interleaved 2 of 5 of 14 digits.
 */
export const SYMBOLOGY_PARAMS: Readonly<Record<BarcodeType, string>> = {
  aztec: "decoder_aztec",
  codabar: "decoder_codabar",
  code39: "decoder_code39",
  code93: "decoder_code93",
  code128: "decoder_code128",
  datamatrix: "decoder_datamatrix",
  ean8: "decoder_ean8",
  ean13: "decoder_ean13",
  itf14: "decoder_i2of5",
  pdf417: "decoder_pdf417",
  qr: "decoder_qrcode",
  upc_a: "decoder_upca",
  upc_e: "decoder_upce0",
};

/** What the adapter can turn on: every `BarcodeType` has a switch. */
export const ZEBRA_SYMBOLOGIES = Object.keys(SYMBOLOGY_PARAMS) as BarcodeType[];

/**
 * DataWedge's decoders outside `BarcodeType`: off whenever a request names
 * its own, since the contract turns "every other" off. The GS1 variants of
 * Data Matrix and QR are left alone: whether the plain decoder reads them is
 * to measure (ZB2). DataWedge 15 stores every name below (the TC22's
 * `GET_CONFIG` lists them); `decoder_us_postnet` and `decoder_us_planet`,
 * absent there, are not sent.
 */
export const OTHER_SYMBOLOGY_PARAMS: Readonly<NativeParams> = {
  decoder_australian_postal: "false",
  decoder_canadian_postal: "false",
  decoder_chinese_2of5: "false",
  decoder_code11: "false",
  decoder_composite_ab: "false",
  decoder_composite_c: "false",
  decoder_d2of5: "false",
  decoder_dutch_postal: "false",
  decoder_gs1_databar: "false",
  decoder_gs1_databar_exp: "false",
  decoder_gs1_databar_lim: "false",
  decoder_japanese_postal: "false",
  decoder_korean_3of5: "false",
  decoder_matrix_2of5: "false",
  decoder_maxicode: "false",
  decoder_micropdf: "false",
  decoder_microqr: "false",
  decoder_msi: "false",
  decoder_tlc39: "false",
  decoder_trioptic39: "false",
  decoder_uk_postal: "false",
  decoder_upce1: "false",
  decoder_us4state: "false",
  decoder_us4state_fics: "false",
};

/**
 * Stored in the app's profile: the decoded text reaches `onRead` in UTF-8
 * with every digit of a UPC (its check digit and its number system: 12
 * digits for a UPC-A, 8 for a UPC-E, as the camera reads them). EAN-13 and
 * EAN-8 always carry their check digit on Zebra's decoders. The profile's
 * intent output, its keystroke output (off) and its data formatting (off)
 * are the module's: they are how reads reach it.
 *
 * The charset: DataWedge 14's guide gives UTF-8 as the default, set anyway
 * (the CT40 decoded with Latin-1 by default, ignoring a QR's ECI).
 */
export const DATA_PARAMS: Readonly<NativeParams> = {
  scanner_selection: "auto",
  scanner_input_enabled: "true",
  charset_name: "UTF-8",
  decoder_upca_report_check_digit: "true",
  decoder_upca_preamble: "1",
  decoder_upce0_report_check_digit: "true",
  decoder_upce0_preamble: "1",
  decoder_upce0_convert_to_upca: "false",
};

/**
 * What an `open()` sends: the profile's data parameters, and the symbology
 * switches for this claim. Without symbologies, none: the module puts back
 * any an earlier request switched, so the profile's own settings apply.
 */
export function toOpenConfig(
  symbologies: readonly BarcodeType[] | null,
  profileName: string | null,
  method: ZebraSymbologyMethod = "switch",
): NativeOpenConfig {
  const config = { profileName, profile: { ...DATA_PARAMS }, method };
  if (symbologies === null) return { ...config, scanner: {} };
  const wanted = new Set(symbologies);
  const scanner: NativeParams = { ...OTHER_SYMBOLOGY_PARAMS };
  for (const type of ZEBRA_SYMBOLOGIES) {
    scanner[SYMBOLOGY_PARAMS[type]] = wanted.has(type) ? "true" : "false";
  }
  return { ...config, scanner };
}

/**
 * DataWedge's label types, the ones the contract names. DataWedge sends no
 * AIM id, so the adapter gives the type itself.
 */
const LABEL_TYPES: Readonly<Record<string, BarcodeType>> = {
  "LABEL-TYPE-AZTEC": "aztec",
  "LABEL-TYPE-CODABAR": "codabar",
  "LABEL-TYPE-CODE39": "code39",
  "LABEL-TYPE-CODE93": "code93",
  "LABEL-TYPE-CODE128": "code128",
  "LABEL-TYPE-EAN128": "code128",
  "LABEL-TYPE-DATAMATRIX": "datamatrix",
  "LABEL-TYPE-GS1-DATAMATRIX": "datamatrix",
  "LABEL-TYPE-EAN8": "ean8",
  "LABEL-TYPE-EAN13": "ean13",
  "LABEL-TYPE-I2OF5": "itf14",
  "LABEL-TYPE-PDF417": "pdf417",
  "LABEL-TYPE-QRCODE": "qr",
  "LABEL-TYPE-GS1-QRCODE": "qr",
  "LABEL-TYPE-UPCA": "upc_a",
  "LABEL-TYPE-UPCE0": "upc_e",
};

/** A read in the contract's terms. */
export function fromNativeRead(read: NativeRead): BarcodeScannerRead {
  const labelType = read.labelType || null;
  return {
    data: read.data,
    aimId: null,
    rawType: labelType ?? "unknown",
    type: (labelType && LABEL_TYPES[labelType.toUpperCase()]) || "unknown",
    timestamp: read.receivedAt,
  };
}

/**
 * The internal imager when DataWedge lists one, else the first scanner. Its
 * firmware is the `SCANNER_FIRMWARE` entry named after it: the TC22 measured
 * one entry, `"2D Barcode Imager: PAAFNS00-002-R06"`, for ten scanners listed
 * with the camera first, so the list does not follow the scanners' order.
 */
export function fromNativeInfo(info: NativeScannerInfo): BarcodeScannerInfo {
  const scanner =
    info.scanners.find((s) => s.identifier === "INTERNAL_IMAGER") ??
    info.scanners[0] ??
    null;
  const prefix = scanner?.name ? `${scanner.name}:` : null;
  const firmware = prefix
    ? info.firmware.find((entry) => entry.startsWith(prefix))
    : undefined;
  return {
    name: scanner?.name || null,
    model: scanner?.identifier || null,
    serialNumber: null,
    firmwareVersion: firmware?.slice(prefix!.length).trim() || null,
  };
}

const CODES: Record<string, BarcodeScannerErrorCode> = {
  ERR_UNAVAILABLE: "unavailable",
  ERR_NOT_OPEN: "not-open",
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
