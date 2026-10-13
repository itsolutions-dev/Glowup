import type { BarcodeType, ScannedBarcode } from "./types";

// The forms a platform may report, compared without case or punctuation and
// by suffix: iOS has used UTIs ("org.iso.QRCode", "org.gs1.EAN-13").
const ALIASES: [BarcodeType, string[]][] = [
  ["qr", ["qr", "qrcode"]],
  ["aztec", ["aztec"]],
  ["codabar", ["codabar"]],
  ["code39", ["code39"]],
  ["code93", ["code93"]],
  ["code128", ["code128"]],
  ["datamatrix", ["datamatrix"]],
  ["ean8", ["ean8"]],
  ["ean13", ["ean13"]],
  ["itf14", ["itf14", "itf"]],
  ["pdf417", ["pdf417"]],
  ["upc_a", ["upca"]],
  ["upc_e", ["upce"]],
];

export function toBarcodeType(raw: string): BarcodeType | "unknown" {
  const normalized = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
  const match = ALIASES.find(([, forms]) =>
    forms.some((form) => normalized.endsWith(form)),
  );
  return match ? match[0] : "unknown";
}

interface RawBarcode {
  type: string | number;
  data: string;
  bounds?: {
    origin: { x: number; y: number };
    size: { width: number; height: number };
  };
}

export function toScannedBarcode(raw: RawBarcode): ScannedBarcode {
  const rawType = String(raw.type);
  return {
    type: toBarcodeType(rawType),
    rawType,
    data: raw.data,
    bounds: raw.bounds
      ? {
          x: raw.bounds.origin.x,
          y: raw.bounds.origin.y,
          width: raw.bounds.size.width,
          height: raw.bounds.size.height,
        }
      : null,
  };
}
