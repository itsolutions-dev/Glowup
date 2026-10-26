import { gridSizes } from "./layout";

describe("gridSizes", () => {
  test("without a measured width, or on a wide one, the sizes are the roomy ones", () => {
    const roomy = { chevron: 32, label: 240, cell: 120 };
    expect(gridSizes(undefined)).toEqual(roomy);
    expect(gridSizes(1280)).toEqual(roomy);
    expect(gridSizes(600)).toEqual(roomy);
  });

  test("on a narrow width the fixed columns shrink to leave room for the numbers", () => {
    expect(gridSizes(310)).toEqual({ chevron: 28, label: 124, cell: 84 });
    expect(gridSizes(390)).toEqual({ chevron: 28, label: 156, cell: 84 });
  });

  test("the label never drops below its floor and the numbers keep room", () => {
    const tiny = gridSizes(200);
    expect(tiny.label).toBe(112);
    expect(tiny.chevron + tiny.label).toBeLessThan(200);
    for (const width of [280, 310, 390, 480, 599]) {
      const { chevron, label, cell } = gridSizes(width);
      // At least one number column and a half is in view next to the fixed columns.
      expect(width - chevron - label).toBeGreaterThanOrEqual(cell * 1.5 - 20);
    }
  });
});
