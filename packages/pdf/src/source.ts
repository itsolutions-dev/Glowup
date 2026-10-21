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

/** FNV-1a over every element: two documents of one size that differ only in the middle must not share a key. */
const hashOf = (length: number, at: (i: number) => number) => {
  let hash = 0x811c9dc5;
  for (let i = 0; i < length; i++) hash = Math.imul(hash ^ at(i), 0x01000193);
  return `${length}:${(hash >>> 0).toString(36)}`;
};
// The key is asked for on every render: each array is read once (an array edited in place is not
// noticed), and the last text is compared by value, which is fast when it is the same one.
const bytesKeys = new WeakMap<Uint8Array, string>();
let lastText: { text: string; key: string } | null = null;

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
  if ("base64" in source) {
    const { base64 } = source;
    if (lastText?.text !== base64) {
      lastText = {
        text: base64,
        key: hashOf(base64.length, (i) => base64.charCodeAt(i)),
      };
    }
    return `b64:${lastText.key}`;
  }
  const { bytes } = source;
  let key = bytesKeys.get(bytes);
  if (key === undefined) {
    key = hashOf(bytes.length, (i) => bytes[i]);
    bytesKeys.set(bytes, key);
  }
  return `bytes:${key}`;
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
