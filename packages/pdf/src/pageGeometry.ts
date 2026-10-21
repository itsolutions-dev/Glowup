import type { PdfPageSize } from "./types";

/** A page drawn with more pixels than this fills a phone's memory (4 bytes each): A4 at the widest is 8.2 million. */
export const MAX_PAGE_PIXELS = 10_000_000;

const A4: PdfPageSize = { width: 595, height: 842 };

/** A page that reports no size (a damaged one) is laid out as A4: zero would make the list's offsets NaN. */
export const usableSize = (size: PdfPageSize): PdfPageSize =>
  Number.isFinite(size.width) &&
  Number.isFinite(size.height) &&
  size.width > 0 &&
  size.height > 0
    ? size
    : A4;

/** The width to ask for: the wanted one, lowered when a page this tall would need more than `MAX_PAGE_PIXELS`. */
export const drawWidth = (wanted: number, size: PdfPageSize): number =>
  Math.max(
    1,
    Math.floor(
      Math.min(wanted, Math.sqrt((MAX_PAGE_PIXELS * size.width) / size.height)),
    ),
  );
