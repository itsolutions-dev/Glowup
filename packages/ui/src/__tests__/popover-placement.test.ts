import {
  placeBesideAnchor,
  planPopoverHeight,
} from "../components/internal/popoverPlacement";

const VIEW = { width: 1280, height: 900 };
const SIZE = { width: 328, height: 470 };
const GAP = 6;
const MARGIN = 8;

const place = (
  anchor: { top: number; bottom: number; left?: number },
  size = SIZE,
  view = VIEW,
) => placeBesideAnchor({ left: 100, ...anchor }, view, size, GAP, MARGIN);

describe("placeBesideAnchor", () => {
  it("hangs below the field when there is room", () => {
    expect(place({ top: 100, bottom: 150 })).toMatchObject({
      top: 156,
      left: 100,
    });
  });

  it("stands above it when only that side has room", () => {
    const placed = place({ top: 700, bottom: 750 });
    expect(placed.top).toBeUndefined();
    expect(placed.bottom).toBe(VIEW.height - 700 + GAP);
  });

  it("keeps the whole surface in view over the field when neither side has room", () => {
    // The field sits mid-page in a short window: 435 px below it, 386 above.
    const placed = place({ top: 400, bottom: 451 });
    expect(placed.top).toBe(VIEW.height - SIZE.height - MARGIN);
    expect(placed.maxHeight).toBe(SIZE.height);
  });

  it("planned for the tallest step, shows every step in full from a fixed edge", () => {
    // A date-and-time picker is 470 px tall on its date and 554 on its time.
    // Placed for 554, the pinned top leaves room for both, so the move from one
    // to the other only grows the surface downward and nothing jumps.
    const placed = place({ top: 400, bottom: 451 }, { ...SIZE, height: 554 });
    expect(placed.top).toBeDefined();
    expect(placed.top! + 554).toBeLessThanOrEqual(VIEW.height - MARGIN);
    expect(placed.top! + 470).toBeLessThanOrEqual(VIEW.height - MARGIN);
  });

  it("never offers less room than the height it was planned for", () => {
    // A surface that fits its plan must not scroll: whichever side it lands on,
    // the room is at least the plan (the caller plans with a measured height
    // rounded up, so a surface of 430.3 px gets 431 and no scrollbar).
    for (const view of [VIEW, { width: 1280, height: 500 }]) {
      for (let top = 0; top < view.height - 60; top += 37) {
        const placed = place({ top, bottom: top + 51 }, SIZE, view);
        expect(placed.maxHeight).toBeGreaterThanOrEqual(
          Math.min(SIZE.height, view.height - MARGIN * 2),
        );
      }
    }
  });

  it("keeps the surface inside the window sideways", () => {
    expect(place({ top: 100, bottom: 150, left: 1200 }).left).toBe(
      VIEW.width - SIZE.width - MARGIN,
    );
    expect(place({ top: 100, bottom: 150, left: -40 }).left).toBe(MARGIN);
  });
});

describe("planPopoverHeight", () => {
  // A hovered footer button gains a border (about 3 px); the surface must keep
  // that much room wherever it lands, or the popover grows a scrollbar.
  const HOVER_GROWTH = 3;

  it("plans a few pixels taller than the measured content", () => {
    expect(planPopoverHeight(430, 0, 900, MARGIN)).toBeGreaterThan(
      430 + HOVER_GROWTH,
    );
  });

  it("plans for the tallest step of a datetime picker", () => {
    expect(planPopoverHeight(431, 560, 900, MARGIN)).toBeGreaterThan(560);
  });

  it("never plans past the window, where scrolling is the answer", () => {
    expect(planPopoverHeight(554, 0, 400, MARGIN)).toBe(400 - MARGIN * 2);
  });

  it.each([
    ["below the field", { top: 100, bottom: 150 }],
    ["above the field", { top: 700, bottom: 750 }],
    ["over the field in a short window", { top: 400, bottom: 451 }],
  ])("leaves room for a hovered button when placed %s", (_name, anchor) => {
    const view = anchor.top === 400 ? { width: 1280, height: 860 } : VIEW;
    const measured = 554;
    const placed = place(
      anchor,
      {
        width: 328,
        height: planPopoverHeight(measured, 0, view.height, MARGIN),
      },
      view,
    );
    expect(placed.maxHeight).toBeGreaterThanOrEqual(measured + HOVER_GROWTH);
  });
});
