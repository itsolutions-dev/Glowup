import {
  indicatorAt,
  insertionIndex,
  zoneAt,
} from "../components/internal/dragDrop";

// Three 40-high rows stacked with an 8 gap: 0..40, 48..88, 96..136.
const ROWS = [0, 48, 96].map((y) => ({ x: 10, y, width: 200, height: 40 }));

describe("zoneAt", () => {
  const outer = {
    id: "outer",
    depth: 0,
    rect: { x: 0, y: 0, width: 400, height: 400 },
  };
  const inner = {
    id: "inner",
    depth: 1,
    rect: { x: 100, y: 100, width: 100, height: 100 },
  };

  it("picks the deepest zone under the point", () => {
    expect(zoneAt([outer, inner], { x: 150, y: 150 })?.id).toBe("inner");
    expect(zoneAt([inner, outer], { x: 150, y: 150 })?.id).toBe("inner");
  });

  it("falls back to the outer zone around the inner one", () => {
    expect(zoneAt([outer, inner], { x: 50, y: 50 })?.id).toBe("outer");
  });

  it("is null outside every zone, right and bottom edges excluded", () => {
    expect(zoneAt([outer, inner], { x: 400, y: 10 })).toBeNull();
    expect(zoneAt([], { x: 0, y: 0 })).toBeNull();
  });
});

describe("insertionIndex", () => {
  it("counts the items whose middle the point has passed", () => {
    expect(insertionIndex(ROWS, { x: 0, y: 5 }, "vertical")).toBe(0);
    expect(insertionIndex(ROWS, { x: 0, y: 30 }, "vertical")).toBe(1);
    expect(insertionIndex(ROWS, { x: 0, y: 70 }, "vertical")).toBe(2);
    expect(insertionIndex(ROWS, { x: 0, y: 500 }, "vertical")).toBe(3);
  });

  it("reads the x axis for a row", () => {
    const cells = [0, 50].map((x) => ({ x, y: 0, width: 40, height: 40 }));
    expect(insertionIndex(cells, { x: 25, y: 0 }, "horizontal")).toBe(1);
    expect(insertionIndex(cells, { x: 75, y: 0 }, "horizontal")).toBe(2);
  });

  it("does not depend on the order the items were registered in", () => {
    const shuffled = [ROWS[2], ROWS[0], ROWS[1]];
    expect(insertionIndex(shuffled, { x: 0, y: 70 }, "vertical")).toBe(2);
  });
});

describe("indicatorAt", () => {
  const zone = { x: 0, y: 0, width: 220, height: 136 };

  it("sits in the middle of the gap between two items", () => {
    expect(indicatorAt(zone, ROWS, 1, "vertical")).toEqual({
      x: 10,
      y: 43,
      width: 200,
      height: 2,
    });
  });

  it("sits on the outer edge before the first and after the last", () => {
    expect(indicatorAt(zone, ROWS, 0, "vertical")?.y).toBe(-1);
    expect(indicatorAt(zone, ROWS, 3, "vertical")?.y).toBe(135);
  });

  it("is relative to the zone", () => {
    const moved = { ...zone, x: 100, y: 100 };
    const rows = ROWS.map((r) => ({ ...r, x: r.x + 100, y: r.y + 100 }));
    expect(indicatorAt(moved, rows, 1, "vertical")).toEqual(
      indicatorAt(zone, ROWS, 1, "vertical"),
    );
  });

  it("is a vertical line in a row", () => {
    const cells = [0, 50].map((x) => ({ x, y: 0, width: 40, height: 40 }));
    expect(indicatorAt(zone, cells, 1, "horizontal")).toEqual({
      x: 44,
      y: 0,
      width: 2,
      height: 40,
    });
  });

  it("draws nothing in an empty zone", () => {
    expect(indicatorAt(zone, [], 0, "vertical")).toBeNull();
  });
});
