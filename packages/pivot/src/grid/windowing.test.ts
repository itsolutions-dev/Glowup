import { sameRange, visibleRange } from "./windowing";

describe("visibleRange", () => {
  const base = { viewportHeight: 100, rowHeight: 10, count: 1000 };

  test("at the top, with no margin, it is the rows that fit", () => {
    expect(visibleRange({ ...base, scrollTop: 0, overscan: 0 })).toEqual({
      start: 0,
      end: 10,
    });
  });

  test("in the middle, the margin is added on both sides", () => {
    expect(visibleRange({ ...base, scrollTop: 500, overscan: 2 })).toEqual({
      start: 48,
      end: 62,
    });
  });

  test("past the end it stops at the last row and never goes negative", () => {
    const { start, end } = visibleRange({ ...base, scrollTop: 50000 });
    expect(end).toBe(1000);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(start).toBeLessThanOrEqual(end);
  });

  test("an offset past the new end (groups closed at the bottom) still fills the viewport", () => {
    // 61 rows of 10 px in a 100 px viewport: the largest offset is 510, rows 51..60 are in view.
    expect(
      visibleRange({
        ...base,
        count: 61,
        scrollTop: 1810,
        overscan: 0,
      }),
    ).toEqual({ start: 51, end: 61 });
  });

  test("fewer rows than the viewport holds start at the first row", () => {
    expect(
      visibleRange({ ...base, count: 3, scrollTop: 500, overscan: 0 }),
    ).toEqual({ start: 0, end: 3 });
  });

  test("a margin is five rows unless told otherwise", () => {
    expect(visibleRange({ ...base, scrollTop: 500 })).toEqual({
      start: 45,
      end: 65,
    });
  });

  test("no rows, or no height, is an empty range", () => {
    expect(visibleRange({ ...base, count: 0, scrollTop: 0 })).toEqual({
      start: 0,
      end: 0,
    });
    expect(visibleRange({ ...base, viewportHeight: 0, scrollTop: 0 })).toEqual({
      start: 0,
      end: 0,
    });
  });
});

describe("sameRange", () => {
  test("two ranges are the same only when both ends are", () => {
    expect(sameRange({ start: 0, end: 10 }, { start: 0, end: 10 })).toBe(true);
    expect(sameRange({ start: 0, end: 10 }, { start: 1, end: 10 })).toBe(false);
    expect(sameRange({ start: 0, end: 10 }, { start: 0, end: 11 })).toBe(false);
  });
});
