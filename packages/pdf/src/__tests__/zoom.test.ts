import {
  MAX_ZOOM,
  MIN_ZOOM,
  clampZoom,
  holdFocus,
  keepFocus,
  liveScale,
  mapOffset,
  middle,
  span,
  stepZoom,
} from "../zoom";

describe("zoom buttons", () => {
  it("step through the stops from the stops, and from wherever a pinch left the zoom", () => {
    expect(stepZoom(1, 1)).toBe(1.25);
    expect(stepZoom(1.25, 1)).toBe(1.5);
    expect(stepZoom(1.3, 1)).toBe(1.5);
    expect(stepZoom(1.3, -1)).toBe(1.25);
    expect(stepZoom(1.25, -1)).toBe(1);
    expect(stepZoom(MAX_ZOOM, 1)).toBe(MAX_ZOOM);
    expect(stepZoom(MIN_ZOOM, -1)).toBe(MIN_ZOOM);
  });

  it("never leave the limits", () => {
    expect(clampZoom(0.2)).toBe(MIN_ZOOM);
    expect(clampZoom(10)).toBe(MAX_ZOOM);
    expect(clampZoom(1.7)).toBe(1.7);
  });
});

describe("two fingers", () => {
  it("measure the distance between them and the point between them", () => {
    const a = { pageX: 0, pageY: 0 };
    const b = { pageX: 30, pageY: 40 };
    expect(span(a, b)).toBe(50);
    expect(middle(a, b)).toEqual({ x: 15, y: 20 });
  });

  it("scale the page by their ratio, and stop at the limits", () => {
    expect(liveScale(1, 1.5)).toBe(1.5);
    expect(liveScale(2, 0.5)).toBe(0.5);
    expect(liveScale(1, 0.5)).toBe(1); // already at the smallest
    expect(liveScale(2, 3)).toBe(MAX_ZOOM / 2);
  });

  it("hold the point under them still: that point lands on itself after the scale", () => {
    const centre = 200;
    const focus = 320;
    const scale = 1.8;
    const t = holdFocus(focus, centre, scale);
    expect(centre + t + scale * (focus - centre)).toBeCloseTo(focus);
  });
});

describe("scrolling after the zoom", () => {
  it("keeps the point under the fingers where it was", () => {
    // 100 px from the edge at offset 40: it is the content point 140. Content twice as big: 280, so offset 180.
    expect(keepFocus(40, 100, 2)).toBe(180);
    expect(keepFocus(0, 0, 2)).toBe(0);
  });

  it("never scrolls before the start when the zoom shrinks the content", () => {
    expect(keepFocus(10, 300, 0.5)).toBe(0);
  });

  describe("down the list", () => {
    const gap = 10;
    // Two pages of 100 and 200 with a gap of 10 after each, from a padding of 20: pages of 200 and 400 after.
    const from = { offsets: [20, 130], lengths: [110, 210] };
    const to = { offsets: [20, 230], lengths: [210, 410] };

    it("stays on the same place of the same page", () => {
      expect(mapOffset(from, to, gap, 20)).toBe(20); // top of page 1
      expect(mapOffset(from, to, gap, 70)).toBe(120); // middle of page 1
      expect(mapOffset(from, to, gap, 130)).toBe(230); // top of page 2
      expect(mapOffset(from, to, gap, 230)).toBe(430); // middle of page 2
    });

    it("keeps a position in a gap the same distance below its page", () => {
      expect(mapOffset(from, to, gap, 125)).toBe(225); // 5 into the gap after page 1
    });

    it("leaves a position above the first page where it is", () => {
      expect(mapOffset(from, to, gap, 5)).toBe(5);
    });
  });
});
