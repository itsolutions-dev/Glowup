import {
  extent,
  firstFreeCell,
  overlaps,
  pushDown,
  rowsFor,
  snapCell,
} from "../editor/engine";

const GRID = { columns: 12, rowHeight: 48, gap: 16 };
const p = (id: string, x: number, y: number, w: number, h: number) => ({
  id,
  x,
  y,
  w,
  h,
});

describe("the grid maths", () => {
  it("snaps a preview to a cell, inside the columns", () => {
    expect(snapCell({ x: 160, y: 100 }, 600, GRID, { w: 4, h: 1 })).toEqual({
      x: 3,
      y: 2,
    });
    expect(snapCell({ x: 590, y: -30 }, 600, GRID, { w: 4, h: 1 })).toEqual({
      x: 8,
      y: 0,
    });
  });

  it("tells overlapping cells apart from touching ones", () => {
    expect(overlaps(p("a", 0, 0, 6, 2), p("b", 5, 1, 2, 2))).toBe(true);
    expect(overlaps(p("a", 0, 0, 6, 2), p("b", 6, 0, 2, 2))).toBe(false);
    expect(overlaps(p("a", 0, 0, 6, 2), p("b", 0, 2, 2, 2))).toBe(false);
  });

  it("pushes down along a chain, and nothing up", () => {
    const out = pushDown(
      [
        p("A", 0, 0, 6, 2),
        p("B", 0, 1, 4, 2),
        p("C", 0, 3, 4, 1),
        p("D", 8, 0, 4, 1),
        p("E", 0, 9, 2, 1),
      ],
      "A",
    );
    expect(out.map((i) => [i.id, i.y])).toEqual([
      ["A", 0],
      ["B", 2],
      ["C", 4],
      ["D", 0],
      ["E", 9],
    ]);
  });

  it("finds the first free cell", () => {
    expect(
      firstFreeCell(
        [p("a", 0, 0, 6, 2), p("b", 6, 0, 6, 1)],
        { w: 6, h: 1 },
        12,
      ),
    ).toEqual({ x: 6, y: 1 });
    expect(firstFreeCell([], { w: 4, h: 1 }, 12, 3)).toEqual({ x: 0, y: 3 });
  });

  it("counts the rows a height needs", () => {
    expect(rowsFor(10, 48, 16)).toBe(1);
    expect(rowsFor(240, 48, 16)).toBe(4);
    expect(rowsFor(241, 48, 16)).toBe(5);
  });

  it("measures how far items reach", () => {
    expect(extent([])).toEqual({ columns: 0, rows: 0 });
    expect(extent([p("a", 0, 0, 6, 2), p("b", 6, 1, 4, 3)])).toEqual({
      columns: 10,
      rows: 4,
    });
  });
});
