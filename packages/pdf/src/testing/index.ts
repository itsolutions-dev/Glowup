import type { PdfAdapters, PdfError, PdfMatch, PdfPageSize } from "../types";

/** A 1 x 1 transparent PNG: a valid image for `renderPage` to hand back. */
const PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

export type MemoryPdfOptions = {
  /** Default: three pages of A4 proportions. */
  pages?: PdfPageSize[];
  /** `false`: the device cannot search. An object maps a query to its hits (each on its `page`); any other query finds none. Default: can search, finds none. */
  search?: boolean | Record<string, PdfMatch[]>;
  /** What `open` rejects with. */
  openError?: PdfError;
  /** What a download rejects with. */
  downloadError?: Error;
  /** What a download reports before it resolves (the share received, 0 to 1; `null`: size unknown). */
  downloadProgress?: (number | null)[];
};

/** The viewer's adapters in memory, and a record of what they were asked. For tests. */
export const createMemoryPdf = (options: MemoryPdfOptions = {}) => {
  const pages = options.pages ?? [
    { width: 595, height: 842 },
    { width: 595, height: 842 },
    { width: 595, height: 842 },
  ];
  const calls = {
    downloaded: [] as { uri: string; headers?: Record<string, string> }[],
    /** The signal each download was given. */
    signals: [] as (AbortSignal | undefined)[],
    written: [] as Uint8Array[],
    removed: [] as string[],
    opened: [] as string[],
    closed: [] as string[],
    rendered: [] as { uri: string; index: number; width: number }[],
    searched: [] as { uri: string; page: number; query: string }[],
    printed: [] as { uri: string; name?: string }[],
    saved: [] as { uri: string; name?: string }[],
  };
  let files = 0;
  const hits = typeof options.search === "object" ? options.search : {};

  const adapters: PdfAdapters = {
    native: {
      capabilities: async () => ({ search: options.search !== false }),
      open: async (uri) => {
        calls.opened.push(uri);
        if (options.openError) throw options.openError;
        return { pages };
      },
      renderPage: async (uri, index, width) => {
        calls.rendered.push({ uri, index, width });
        return PIXEL;
      },
      searchPage: async (uri, page, query) => {
        calls.searched.push({ uri, page, query });
        return (hits[query] ?? []).filter((hit) => hit.page === page);
      },
      close: async (uri) => {
        calls.closed.push(uri);
      },
    },
    files: {
      download: async (uri, headers, downloadOptions) => {
        calls.downloaded.push({ uri, headers });
        calls.signals.push(downloadOptions?.signal);
        options.downloadProgress?.forEach((p) =>
          downloadOptions?.onProgress?.(p),
        );
        if (options.downloadError) throw options.downloadError;
        return `file:///memory/${++files}.pdf`;
      },
      write: async (bytes) => {
        calls.written.push(bytes);
        return `file:///memory/${++files}.pdf`;
      },
      remove: async (uri) => {
        calls.removed.push(uri);
      },
    },
    actions: {
      print: async (uri, name) => {
        calls.printed.push({ uri, name });
      },
      save: async (uri, name) => {
        calls.saved.push({ uri, name });
      },
    },
  };

  return { adapters, calls };
};
