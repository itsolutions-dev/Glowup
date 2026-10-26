import type { PdfMatch, PdfNative } from "./types";

/** A search that finds more hits than this stops: nobody steps through thousands, and each one is a layer on a page. */
export const MAX_MATCHES = 500;

export type SearchRun = {
  /** Stops after the page being searched; nothing more is reported. */
  cancel(): void;
  /** Settles when every page was searched, the limit was reached or the run was cancelled; rejects if a page failed. */
  finished: Promise<void>;
};

type Listener = {
  /** The hits of one page, in the order the pages are searched. */
  found(matches: PdfMatch[]): void;
  /** How many pages were searched so far. */
  progress(searched: number): void;
};

/**
 * Searches the document one page at a time, from the page being read and round to the pages before it: the first hit
 * is the nearest one ahead, the module is never busy for longer than one page (a drawing waits for it, not for the
 * whole document), and a new query or a closed panel can stop it between two pages.
 */
export const startSearch = (
  native: Pick<PdfNative, "searchPage">,
  uri: string,
  query: string,
  pages: number,
  from: number,
  listener: Listener,
): SearchRun => {
  let cancelled = false;
  const finished = (async () => {
    let hits = 0;
    for (let step = 0; step < pages; step += 1) {
      const page = (((from + step) % pages) + pages) % pages;
      const matches = await native.searchPage(uri, page, query);
      if (cancelled) return;
      if (matches.length > 0) {
        listener.found(matches);
        hits += matches.length;
      }
      listener.progress(step + 1);
      if (hits >= MAX_MATCHES) return;
    }
  })();
  return {
    cancel: () => {
      cancelled = true;
    },
    finished,
  };
};

/**
 * Adds the hits of a page to the list, which stays in the order of the document, and says where the hit being shown
 * is now: a page searched after the one the reader started on can come before it, and the shown hit must not change.
 * With no hit shown yet (`current` is -1) the first one added is shown.
 */
export const mergeMatches = (
  list: PdfMatch[],
  added: PdfMatch[],
  current: number,
): { matches: PdfMatch[]; cursor: number } => {
  const shown = current >= 0 ? list[current] : added[0];
  const matches = [...list, ...added].sort((a, b) => a.page - b.page);
  return { matches, cursor: matches.indexOf(shown) };
};
