import { PinchController } from "../pinch";

// Two pages of 100 and 200 high (gap 12 each, padding 12), then the same at twice the width.
const small = { offsets: [12, 124], lengths: [112, 212] };
const big = { offsets: [12, 236], lengths: [212, 412] };

const idle = () => {
  const pinch = new PinchController();
  pinch.sync(
    1,
    small,
    () => {},
    () => false,
  );
  return pinch;
};

describe("pinch controller", () => {
  it("plans nothing when the zoom would not change, and never past the limits", () => {
    const pinch = idle();
    expect(pinch.plan(1, { x: 0, y: 0 })).toBeNull();
    expect(pinch.plan(0.4, { x: 0, y: 0 })).toBeNull();
    expect(pinch.plan(9, { x: 0, y: 0 })).toBe(3);
  });

  it("says where to scroll so that what was under the fingers still is, once, after the new layout", () => {
    const pinch = idle();
    pinch.scroll("y", 50);
    // Fingers 20 px below the top of the area: the list's point 70, 58 into the first page of 100.
    expect(pinch.plan(2, { x: 100, y: 20 })).toBe(2);
    const to = pinch.settle(big);
    // 58 of 100 into page 1 is 116 of 200: offset 12 + 116, less the 20 the fingers sit below the top.
    expect(to?.x).toBe(100);
    expect(to?.y).toBeCloseTo(12 + 116 - 20);
    expect(pinch.settle(big)).toBeNull();
  });

  it("forgets a sideways scroll left from an earlier zoom when starting from the fit", () => {
    const pinch = idle();
    pinch.scroll("x", 300); // stale: the sideways list does not exist at the fit
    pinch.plan(2, { x: 0, y: 0 });
    expect(pinch.settle(big)?.x).toBe(0);
  });

  it("keeps the sideways scroll when already zoomed in", () => {
    const pinch = new PinchController();
    pinch.sync(
      2,
      big,
      () => {},
      () => false,
    );
    pinch.scroll("x", 300);
    pinch.plan(3, { x: 50, y: 0 });
    // (300 + 50) * 1.5 - 50
    expect(pinch.settle(big)?.x).toBe(475);
  });

  it("answers a button's zoom about the middle of the area", () => {
    const pinch = idle();
    pinch.resize(400, 600);
    expect(pinch.center()).toEqual({ x: 200, y: 300 });
  });
});
