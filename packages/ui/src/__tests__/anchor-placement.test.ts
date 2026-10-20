import {
  placeAnchored,
  type AnchorPosition,
} from "../components/internal/anchorPlacement";

const WINDOW = { width: 800, height: 600 };
const POPOVER = { width: 200, height: 100 };
// A 100 x 40 anchor in the middle of the window.
const ANCHOR = { x: 300, y: 250, width: 100, height: 40 };

const at = (
  position?: AnchorPosition,
  anchor = ANCHOR,
  popover = POPOVER,
  window = WINDOW,
) => placeAnchored(anchor, popover, window, position);

describe("placeAnchored", () => {
  it("defaults to below the anchor, left edges aligned", () => {
    expect(at()).toEqual({ top: 250 + 40 + 8, left: 300, width: 200 });
    expect(at({ vertical: "bottom", horizontal: "left" })).toEqual(at());
  });

  describe("vertical", () => {
    it("bottom hangs below the anchor", () => {
      const placed = at({ vertical: "bottom", horizontal: "left" });
      expect(placed.top).toBe(298);
      expect(placed.bottom).toBeUndefined();
    });

    it("top stands above the anchor, growing upward from its top edge", () => {
      const placed = at({ vertical: "top", horizontal: "left" });
      expect(placed.top).toBeUndefined();
      expect(placed.bottom).toBe(WINDOW.height - ANCHOR.y + 8);
    });

    it("center is centred on the anchor, overlapping it", () => {
      const placed = at({ vertical: "center", horizontal: "left" });
      // Anchor centre is 270; a 100 tall popover centred there starts at 220.
      expect(placed.top).toBe(220);
      expect(placed.bottom).toBeUndefined();
    });

    it("bottom flips above when there is no room below", () => {
      const placed = at(
        { vertical: "bottom", horizontal: "left" },
        { ...ANCHOR, y: 540 },
      );
      expect(placed.top).toBeUndefined();
      expect(placed.bottom).toBe(WINDOW.height - 540 + 8);
    });

    it("top flips below when there is no room above", () => {
      const placed = at(
        { vertical: "top", horizontal: "left" },
        { ...ANCHOR, y: 20 },
      );
      expect(placed.bottom).toBeUndefined();
      expect(placed.top).toBe(20 + 40 + 8);
    });

    it("center slides back inside the window at the edges", () => {
      const nearTop = at(
        { vertical: "center", horizontal: "left" },
        { ...ANCHOR, y: 0 },
      );
      expect(nearTop.top).toBe(16);
      const nearBottom = at(
        { vertical: "center", horizontal: "left" },
        { ...ANCHOR, y: 590 },
      );
      expect(nearBottom.top).toBe(WINDOW.height - POPOVER.height - 16);
    });
  });

  describe("horizontal", () => {
    it("left aligns the left edges", () => {
      expect(at({ vertical: "bottom", horizontal: "left" }).left).toBe(300);
    });

    it("right aligns the right edges", () => {
      // Anchor right edge is 400; the 200 wide popover starts at 200.
      expect(at({ vertical: "bottom", horizontal: "right" }).left).toBe(200);
    });

    it("center aligns the centres", () => {
      // Anchor centre is 350; the popover starts 100 before it.
      expect(at({ vertical: "bottom", horizontal: "center" }).left).toBe(250);
    });

    it("slides back inside the margins instead of leaving the window", () => {
      const farRight = { ...ANCHOR, x: 760 };
      expect(
        at({ vertical: "bottom", horizontal: "left" }, farRight).left,
      ).toBe(WINDOW.width - POPOVER.width - 16);
      const farLeft = { ...ANCHOR, x: 0, width: 50 };
      expect(
        at({ vertical: "bottom", horizontal: "right" }, farLeft).left,
      ).toBe(16);
    });

    it("never makes the popover wider than the window less the margins", () => {
      const placed = at(undefined, ANCHOR, { width: 5000, height: 100 });
      expect(placed.width).toBe(WINDOW.width - 32);
      expect(placed.left).toBe(16);
    });
  });
});
