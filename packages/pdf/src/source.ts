import { createPdfError } from "./errors";
import type { PdfFiles, PdfSource } from "./types";

const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const LOOKUP = new Map([...ALPHABET].map((c, i) => [c, i]));

/** Base64 (or a `data:application/pdf;base64,` URL) to bytes. Throws a `format` error on anything else. */
export const decodeBase64 = (input: string): Uint8Array => {
  const clean = input
    .replace(/^data:[^,]*,/, "")
    .replace(/\s+/g, "")
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .replace(/=+$/, "");
  if (clean.length === 0 || clean.length % 4 === 1) {
    throw createPdfError("format", "The base64 text is not valid.");
  }
  const bytes = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let out = 0;
  let buffer = 0;
  let bits = 0;
  for (const char of clean) {
    const value = LOOKUP.get(char);
    if (value === undefined) {
      throw createPdfError("format", "The base64 text is not valid.");
    }
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes[out++] = (buffer >> bits) & 0xff;
    }
  }
  return bytes;
};

/**
 * What identifies a source, so a viewer re-opens when the document changes and not
 * when a parent passes the same content as a new object on every render.
 */
export const sourceKey = (source: PdfSource): string => {
  if ("uri" in source) {
    const headers = source.headers
      ? JSON.stringify(Object.entries(source.headers).sort())
      : "";
    return `uri:${source.uri}|${headers}`;
  }
  const sample = (text: string) =>
    `${text.length}:${text.slice(0, 24)}:${text.slice(-24)}`;
  if ("base64" in source) return `b64:${sample(source.base64)}`;
  const { bytes } = source;
  return `bytes:${bytes.length}:${bytes.slice(0, 16).join(",")}:${bytes.slice(-16).join(",")}`;
};

export type ResolvedFile = {
  uri: string;
  /** A copy this viewer made in the cache, to remove when done. A local `file://` the app passed is never ours to remove. */
  temporary: boolean;
};

/** Turns any source into a local file the native side can open. */
export const resolveSource = async (
  source: PdfSource,
  files: PdfFiles,
): Promise<ResolvedFile> => {
  if ("uri" in source) {
    if (source.uri.startsWith("file://")) {
      return { uri: source.uri, temporary: false };
    }
    try {
      return {
        uri: await files.download(source.uri, source.headers),
        temporary: true,
      };
    } catch (error) {
      throw createPdfError(
        "network",
        error instanceof Error ? error.message : String(error),
      );
    }
  }
  const bytes = "base64" in source ? decodeBase64(source.base64) : source.bytes;
  return { uri: await files.write(bytes), temporary: true };
};
