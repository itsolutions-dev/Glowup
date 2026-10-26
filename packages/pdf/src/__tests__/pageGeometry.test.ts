import { MAX_PAGE_PIXELS, drawWidth, usableSize } from "../pageGeometry";

describe("usableSize", () => {
  it("keeps a real size and replaces one that would make the layout NaN", () => {
    const real = { width: 300, height: 400 };
    expect(usableSize(real)).toBe(real);
    for (const bad of [
      { width: 0, height: 0 },
      { width: 595, height: 0 },
      { width: -1, height: 842 },
      { width: NaN, height: 842 },
      { width: 595, height: Infinity },
    ]) {
      expect(usableSize(bad)).toEqual({ width: 595, height: 842 });
    }
  });
});

describe("drawWidth", () => {
  it("leaves the wanted width alone for an ordinary page", () => {
    expect(drawWidth(1100, { width: 595, height: 842 })).toBe(1100);
    expect(drawWidth(2400, { width: 595, height: 842 })).toBe(2400);
    expect(drawWidth(2400, { width: 842, height: 595 })).toBe(2400);
  });

  it("lowers it so a very tall page stays within the pixel budget", () => {
    const tall = { width: 595, height: 8420 };
    const width = drawWidth(2400, tall);
    expect(width).toBeLessThan(2400);
    expect((width * width * tall.height) / tall.width).toBeLessThanOrEqual(
      MAX_PAGE_PIXELS,
    );
  });

  it("never asks for less than a pixel", () => {
    expect(drawWidth(2400, { width: 1, height: 1e12 })).toBe(1);
  });
});
