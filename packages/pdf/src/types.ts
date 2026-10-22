import type { StyleProp, ViewStyle } from "react-native";

/** Where the PDF comes from. A `uri` may need request headers (a login); a local `file://` is used as it is. */
export type PdfSource =
  | { uri: string; headers?: Record<string, string> }
  | { base64: string }
  | { bytes: Uint8Array };

export type PdfErrorCode =
  "network" | "format" | "password" | "unsupported" | "native-missing";

export type PdfError = Error & { code: PdfErrorCode };

/** A page's size in points; only the proportions matter to the viewer. */
export type PdfPageSize = { width: number; height: number };

/** A rectangle on a page, as fractions (0..1) of the page, origin at the top left. */
export type PdfRect = { x: number; y: number; width: number; height: number };

/** One hit of a text search: the page (0-based) and the rectangles it covers (a hit can wrap over lines). */
export type PdfMatch = { page: number; rects: PdfRect[] };

export type PdfCapabilities = { search: boolean };

/**
 * What the viewer asks of the device: open a file, draw a page, search it. Files are
 * local `file://` URIs. The Expo module is the default; `@its/glowup-pdf/testing`
 * supplies an in-memory one.
 */
export interface PdfNative {
  capabilities(): Promise<PdfCapabilities>;
  open(uri: string): Promise<{ pages: PdfPageSize[] }>;
  /** Draws the page `index` (0-based) `width` pixels wide, on a white background; returns an image URI. */
  renderPage(uri: string, index: number, width: number): Promise<string>;
  /**
   * Searches one page (0-based) and returns its hits, in reading order. One page at a time, so that the module is
   * never busy for long and the viewer can stop between pages (`startSearch`, src/searchDocument.ts).
   */
  searchPage(uri: string, page: number, query: string): Promise<PdfMatch[]>;
  close(uri: string): Promise<void>;
}

/** Local files the viewer needs: the downloaded or decoded PDF lives in the cache and is removed afterwards. */
export interface PdfFiles {
  download(uri: string, headers?: Record<string, string>): Promise<string>;
  write(bytes: Uint8Array): Promise<string>;
  remove(uri: string): Promise<void>;
}

export interface PdfActions {
  print(uri: string, name?: string): Promise<void>;
  save(uri: string, name?: string): Promise<void>;
}

export type PdfAdapters = {
  native: PdfNative;
  files: PdfFiles;
  actions: PdfActions;
};

/** Every text the viewer shows. `{page}`, `{pages}`, `{current}`, `{total}` and `{done}` are replaced. */
export type PdfLabels = {
  loading: string;
  page: string;
  pageOf: string;
  goToPage: string;
  previousPage: string;
  nextPage: string;
  zoomIn: string;
  zoomOut: string;
  fitWidth: string;
  search: string;
  searchPlaceholder: string;
  searchResult: string;
  /** Shown while a search is going on and nothing is found yet. `{done}` pages searched of `{pages}`. */
  searching: string;
  noResults: string;
  previousResult: string;
  nextResult: string;
  print: string;
  save: string;
  /** The web viewer's button that opens the PDF in a tab: the way to read it on a phone's browser. */
  openInTab: string;
  retry: string;
  /** Shown on a page that could not be drawn; a tap draws it again. */
  pageFailed: string;
  errorTitle: string;
  actionFailed: string;
  errors: Record<PdfErrorCode, string>;
};

export type PdfViewerProps = {
  source: PdfSource;
  /** Names the file for saving and printing. */
  fileName?: string;
  /** The page to open on, from 1. */
  initialPage?: number;
  /** `pages` is `null` on the web, where the browser's own viewer shows the document and does not tell. */
  onLoad?: (info: { pages: number | null }) => void;
  onError?: (error: PdfError) => void;
  onPageChange?: (page: number, pages: number) => void;
  /** The bar with the page, zoom, search, print and save controls. Defaults to true. */
  toolbar?: boolean;
  labels?: Partial<PdfLabels>;
  style?: StyleProp<ViewStyle>;
};
