import { getSwitchGeometry } from "../components/Switch";

// [width, height]: the three sizes, then custom tracks.
const TRACKS = [
  ["small", 24, 14],
  ["medium", 32, 18],
  ["large", 40, 22],
  ["wide", 50, 28],
] as const;

describe("Switch geometry", () => {
  it.each(TRACKS)("%s: the thumb stays inside the track", (_, w, h) => {
    const g = getSwitchGeometry(w, h);
    // Off: clear of the left edge by its inset, a circle inside the height.
    expect(g.offLeft).toBeGreaterThanOrEqual(g.offInset);
    expect(g.offInset).toBeGreaterThan(0);
    expect(g.offTop + g.offSize).toBeLessThanOrEqual(
      g.innerHeight - g.offInset,
    );
    // On: right edge short of the right edge of the inside by the inset.
    expect(g.onLeft + g.onSize).toBeLessThanOrEqual(g.innerWidth - g.onInset);
    expect(g.onTop + g.onSize).toBeLessThanOrEqual(g.innerHeight - g.onInset);
    expect(g.onLeft).toBeGreaterThanOrEqual(g.onInset);
  });

  it.each(TRACKS)("%s: the same inset on both sides", (_, w, h) => {
    const g = getSwitchGeometry(w, h);
    expect(g.offTop).toBeCloseTo(g.innerHeight - g.offTop - g.offSize);
    expect(g.onTop).toBeCloseTo(g.innerHeight - g.onTop - g.onSize);
    expect(g.onLeft).toBeCloseTo(g.innerWidth - g.onSize - g.onInset);
    // Off and on travel the whole inside: nothing is left over on the right.
    expect(g.innerWidth - (g.onLeft + g.onSize)).toBeCloseTo(g.onInset);
  });

  it.each(TRACKS)("%s: in the whole track, border included", (_, w, h) => {
    const g = getSwitchGeometry(w, h);
    const border = (w - g.innerWidth) / 2;
    expect(border + g.onLeft + g.onSize + g.onInset + border).toBeCloseTo(w);
    expect(border + g.offLeft).toBeGreaterThanOrEqual(border);
  });

  it("never gives the thumb more than the track has", () => {
    const g = getSwitchGeometry(6, 6);
    expect(g.onSize).toBeGreaterThanOrEqual(0);
    expect(g.onLeft).toBeGreaterThanOrEqual(0);
  });
});
