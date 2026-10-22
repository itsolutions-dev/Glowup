import { MAX_MATCHES, mergeMatches, startSearch } from "../searchDocument";
import type { PdfMatch } from "../types";

const rect = { x: 0.1, y: 0.1, width: 0.2, height: 0.02 };
const hit = (page: number): PdfMatch => ({ page, rects: [rect] });

/** A module that finds the words in `pages` (0-based page numbers) and records the pages it was asked about. */
const makeNative = (pages: Record<number, number> = {}) => {
  const asked: number[] = [];
  return {
    asked,
    native: {
      searchPage: async (_uri: string, page: number) => {
        asked.push(page);
        return Array.from({ length: pages[page] ?? 0 }, () => hit(page));
      },
    },
  };
};

const run = async (
  native: ReturnType<typeof makeNative>["native"],
  pages: number,
  from: number,
) => {
  const found: PdfMatch[][] = [];
  const progress: number[] = [];
  const search = startSearch(native, "file:///a.pdf", "x", pages, from, {
    found: (m) => found.push(m),
    progress: (n) => progress.push(n),
  });
  await search.finished;
  return { found, progress };
};

describe("startSearch", () => {
  it("starts at the page being read and goes round to the ones before it", async () => {
    const { native, asked } = makeNative();
    await run(native, 5, 3);
    expect(asked).toEqual([3, 4, 0, 1, 2]);
  });

  it("reports the hits of a page when it is searched, and how far it got", async () => {
    const { native } = makeNative({ 1: 2, 3: 1 });
    const { found, progress } = await run(native, 4, 0);
    expect(found.map((m) => m.map((x) => x.page))).toEqual([[1, 1], [3]]);
    expect(progress).toEqual([1, 2, 3, 4]);
  });

  it("stops between two pages when cancelled, and reports nothing more", async () => {
    const asked: number[] = [];
    let search!: ReturnType<typeof startSearch>;
    const found: PdfMatch[][] = [];
    const native = {
      searchPage: async (_u: string, page: number) => {
        asked.push(page);
        if (page === 1) search.cancel();
        return [hit(page)];
      },
    };
    search = startSearch(native, "file:///a.pdf", "x", 5, 0, {
      found: (m) => found.push(m),
      progress: () => {},
    });
    await search.finished;
    expect(asked).toEqual([0, 1]);
    expect(found).toHaveLength(1); // page 1's hit, found after the cancel, is dropped
  });

  it("stops once it has found enough", async () => {
    const { native, asked } = makeNative({ 0: MAX_MATCHES, 1: 1 });
    await run(native, 3, 0);
    expect(asked).toEqual([0]);
  });

  it("rejects when a page fails", async () => {
    const native = {
      searchPage: async () => {
        throw new Error("boom");
      },
    };
    await expect(
      startSearch(native, "file:///a.pdf", "x", 2, 0, {
        found: () => {},
        progress: () => {},
      }).finished,
    ).rejects.toThrow("boom");
  });

  it("does nothing for a document without pages", async () => {
    const { native, asked } = makeNative();
    await run(native, 0, 0);
    expect(asked).toEqual([]);
  });
});

describe("mergeMatches", () => {
  it("shows the first hit added when none was shown", () => {
    const a = hit(4);
    const { matches, cursor } = mergeMatches([], [a], -1);
    expect(matches).toEqual([a]);
    expect(cursor).toBe(0);
  });

  it("keeps the document's order and the hit being shown when a hit comes in before it", () => {
    const shown = hit(4);
    const later = hit(7);
    const earlier = hit(1); // found last: the search wrapped round to it
    const first = mergeMatches([], [shown], -1);
    const second = mergeMatches(first.matches, [later], first.cursor);
    const third = mergeMatches(second.matches, [earlier], second.cursor);
    expect(third.matches.map((m) => m.page)).toEqual([1, 4, 7]);
    expect(third.matches[third.cursor]).toBe(shown);
    expect(third.cursor).toBe(1);
  });

  it("keeps a page's hits together and in the order they came", () => {
    const one = hit(2);
    const two = { ...hit(2), rects: [{ ...rect, y: 0.5 }] };
    const { matches } = mergeMatches([hit(0)], [one, two], 0);
    expect(matches[1]).toBe(one);
    expect(matches[2]).toBe(two);
  });
});
