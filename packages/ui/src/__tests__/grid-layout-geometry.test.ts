import {
  clampGridItem,
  gridLayoutHeight,
  gridReadingOrder,
  itemPlacement,
} from "../components/internal/gridLayout";

const item = (id: string, x: number, y: number, w: number, h: number) => ({
  id,
  x,
  y,
  w,
  h,
});

describe("itemPlacement", () => {
  it("places an item from its cells, without a width", () => {
    expect(itemPlacement(item("a", 3, 2, 6, 3), 12, 48, 16)).toEqual({
      left: "25%",
      marginLeft: 4,
      right: "25%",
      marginRight: 4,
      top: 128,
      height: 176,
    });
  });

  it("spans the whole width", () => {
    expect(itemPlacement(item("a", 0, 0, 12, 1), 12, 48, 16)).toMatchObject({
      left: "0%",
      marginLeft: 0,
      right: "0%",
      marginRight: 0,
      height: 48,
    });
  });
});

describe("clampGridItem", () => {
  it("clamps an item into the grid", () => {
    expect(clampGridItem(item("a", 10, -1, 6, 0), 12)).toEqual(
      item("a", 6, 0, 6, 1),
    );
    expect(clampGridItem(item("a", -2, 1.4, 0, 2.6), 12)).toEqual(
      item("a", 0, 1, 1, 3),
    );
    expect(clampGridItem(item("a", 0, 0, 20, 1), 12)).toEqual(
      item("a", 0, 0, 12, 1),
    );
  });
});

describe("gridLayoutHeight", () => {
  it("is the bottom of the lowest item", () => {
    expect(gridLayoutHeight([], 48, 16)).toBe(0);
    expect(
      gridLayoutHeight([item("a", 0, 0, 1, 1), item("b", 0, 2, 1, 3)], 48, 16),
    ).toBe(304);
  });
});

describe("gridReadingOrder", () => {
  it("reads rows top to bottom, then left to right", () => {
    const order = gridReadingOrder([
      item("b", 6, 0, 1, 1),
      item("c", 0, 2, 1, 1),
      item("a", 0, 0, 1, 1),
    ]);
    expect(order.map((i) => i.id)).toEqual(["a", "b", "c"]);
  });
});
