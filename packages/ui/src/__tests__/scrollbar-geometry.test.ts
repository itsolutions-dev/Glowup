import {
  MIN_THUMB,
  PAGE_RATIO,
  hasScrollbar,
  isOverflowing,
  maxScroll,
  scrollFromDrag,
  scrollFromTrackPress,
  scrollbarShown,
  thumbMetrics,
} from "../components/internal/scrollbar";

// A 400 dp window onto 1600 dp of content, on a 400 dp track: the thumb is a
// quarter of the track and has 300 dp to travel while the content scrolls 1200.
const metrics = { scroll: 0, viewport: 400, content: 1600 };
const track = { track: 400 };

describe("maxScroll / isOverflowing", () => {
  it("is the content past the viewport, never negative", () => {
    expect(maxScroll(metrics)).toBe(1200);
    expect(maxScroll({ content: 100, viewport: 400 })).toBe(0);
  });

  it("is overflowing only past 1dp of rounding, and only once measured", () => {
    expect(isOverflowing(metrics)).toBe(true);
    expect(isOverflowing({ content: 401, viewport: 400 })).toBe(false);
    expect(isOverflowing({ content: 402, viewport: 400 })).toBe(true);
    expect(isOverflowing({ content: 1600, viewport: 0 })).toBe(false);
    expect(isOverflowing({ content: 300, viewport: 400 })).toBe(false);
  });
});

describe("thumbMetrics", () => {
  it("sizes the thumb to the visible share of the content", () => {
    expect(thumbMetrics(metrics, track).size).toBe(100);
    expect(thumbMetrics({ ...metrics, content: 800 }, track).size).toBe(200);
  });

  it("scales with the track, not the viewport", () => {
    expect(thumbMetrics(metrics, { track: 200 }).size).toBe(50);
  });

  it("starts at the start of the track and ends at the end of it", () => {
    expect(thumbMetrics(metrics, track).offset).toBe(0);
    const end = thumbMetrics({ ...metrics, scroll: 1200 }, track);
    expect(end.offset).toBe(300);
    expect(end.offset + end.size).toBe(400);
  });

  it("moves in proportion to the scroll offset", () => {
    expect(thumbMetrics({ ...metrics, scroll: 600 }, track).offset).toBe(150);
    expect(thumbMetrics({ ...metrics, scroll: 300 }, track).offset).toBe(75);
  });

  it("keeps the thumb on the track while the scroll overshoots (iOS bounce)", () => {
    expect(thumbMetrics({ ...metrics, scroll: -80 }, track).offset).toBe(0);
    expect(thumbMetrics({ ...metrics, scroll: 1500 }, track).offset).toBe(300);
  });

  it("never shrinks the thumb below the minimum, and the offset adapts", () => {
    const long = { scroll: 0, viewport: 400, content: 400_000 };
    expect(thumbMetrics(long, track).size).toBe(MIN_THUMB);
    const end = thumbMetrics({ ...long, scroll: 399_600 }, track);
    expect(end.offset + end.size).toBeCloseTo(400);
    expect(thumbMetrics(long, { track: 400, minThumb: 40 }).size).toBe(40);
  });

  it("never grows the minimum past a track shorter than it", () => {
    const short = thumbMetrics(
      { scroll: 0, viewport: 10, content: 10_000 },
      { track: 12 },
    );
    expect(short.size).toBe(12);
  });

  it("fills the track when there is nothing to scroll or nothing measured", () => {
    expect(
      thumbMetrics({ scroll: 0, viewport: 400, content: 300 }, track),
    ).toEqual({
      size: 400,
      offset: 0,
    });
    expect(
      thumbMetrics({ scroll: 0, viewport: 0, content: 300 }, track),
    ).toEqual({
      size: 400,
      offset: 0,
    });
  });

  it("is empty on a track with no length", () => {
    expect(thumbMetrics(metrics, { track: 0 })).toEqual({ size: 0, offset: 0 });
    expect(thumbMetrics(metrics, { track: -5 })).toEqual({
      size: 0,
      offset: 0,
    });
  });
});

describe("scrollFromDrag", () => {
  it("scrolls max/free dp of content per dp of thumb travel", () => {
    // free = 300, max = 1200: one dp of thumb is four dp of content.
    expect(scrollFromDrag(metrics, track, 0, 10)).toBe(40);
    expect(scrollFromDrag(metrics, track, 0, 150)).toBe(600);
  });

  it("is the inverse of the thumb offset: dragging by an offset lands the thumb there", () => {
    const scroll = scrollFromDrag(metrics, track, 0, 180);
    expect(thumbMetrics({ ...metrics, scroll }, track).offset).toBeCloseTo(180);
  });

  it("counts from where the drag began, whatever the thumb did since", () => {
    expect(scrollFromDrag(metrics, track, 400, 50)).toBe(600);
    expect(scrollFromDrag(metrics, track, 400, -50)).toBe(200);
  });

  it("stops at both ends of the content", () => {
    expect(scrollFromDrag(metrics, track, 100, -9999)).toBe(0);
    expect(scrollFromDrag(metrics, track, 100, 9999)).toBe(1200);
  });

  it("does nothing when there is nothing to scroll", () => {
    expect(scrollFromDrag({ content: 100, viewport: 400 }, track, 0, 50)).toBe(
      0,
    );
    // A thumb filling the track has no room to travel.
    expect(scrollFromDrag(metrics, { track: 400, minThumb: 400 }, 20, 50)).toBe(
      20,
    );
  });

  it("works with a thumb pinned at the minimum length", () => {
    const long = { viewport: 400, content: 400_000 };
    // free = 376, max = 399_600
    expect(scrollFromDrag(long, track, 0, 376)).toBeCloseTo(399_600);
    expect(scrollFromDrag(long, track, 0, 188)).toBeCloseTo(199_800);
  });
});

describe("scrollFromTrackPress", () => {
  const at = (scroll: number) => ({ ...metrics, scroll });
  const page = 400 * PAGE_RATIO;

  it("pages forward on a press after the thumb", () => {
    expect(scrollFromTrackPress(at(0), track, 250)).toBe(page);
  });

  it("pages back on a press before the thumb", () => {
    expect(scrollFromTrackPress(at(600), track, 10)).toBe(600 - page);
  });

  it("leaves the offset alone on a press on the thumb", () => {
    // The thumb sits at 150..250 for scroll 600.
    expect(scrollFromTrackPress(at(600), track, 150)).toBe(600);
    expect(scrollFromTrackPress(at(600), track, 200)).toBe(600);
    expect(scrollFromTrackPress(at(600), track, 250)).toBe(600);
  });

  it("stops at both ends of the content", () => {
    // The thumb sits at 12.5..112.5 for scroll 50, and at 275..375 for 1100.
    expect(scrollFromTrackPress(at(50), track, 0)).toBe(0);
    expect(scrollFromTrackPress(at(1100), track, 399)).toBe(1200);
  });

  it("leaves the end of the content where it is", () => {
    // The thumb is at 300..400 for scroll 1200: nowhere further to go.
    expect(scrollFromTrackPress(at(1200), track, 399)).toBe(1200);
  });
});

describe("visibility", () => {
  it("lays a scrollbar out for `always`, and for the rest only on overflow", () => {
    expect(hasScrollbar("always", false)).toBe(true);
    expect(hasScrollbar("auto", false)).toBe(false);
    expect(hasScrollbar("scroll", true)).toBe(true);
    expect(hasScrollbar("hover", false)).toBe(false);
  });

  it("shows `always` whatever happens", () => {
    expect(scrollbarShown("always", false, false)).toBe(true);
  });

  it("shows `auto` while the content overflows, engaged or not", () => {
    expect(scrollbarShown("auto", true, false)).toBe(true);
    expect(scrollbarShown("auto", false, true)).toBe(false);
  });

  it("shows `scroll` and `hover` only while engaged and overflowing", () => {
    for (const type of ["scroll", "hover"] as const) {
      expect(scrollbarShown(type, true, false)).toBe(false);
      expect(scrollbarShown(type, true, true)).toBe(true);
      expect(scrollbarShown(type, false, true)).toBe(false);
    }
  });
});
