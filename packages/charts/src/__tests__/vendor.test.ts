// The d3 copy (src/vendor/d3) runs under jest without configuration: a few
// results taken from d3's own documentation.
import {
  arc,
  area,
  curveMonotoneX,
  line,
  pie,
  scaleBand,
  scaleLinear,
  scaleTime,
  scaleUtc,
  stack,
} from "../vendor/d3";

describe("vendored d3", () => {
  it("scaleLinear maps, inverts and finds round ticks", () => {
    const x = scaleLinear().domain([0, 10]).range([0, 100]);
    expect(x(5)).toBe(50);
    expect(x.invert(25)).toBe(2.5);
    expect(x.ticks(5)).toEqual([0, 2, 4, 6, 8, 10]);
    expect(scaleLinear().domain([0.13, 9.7]).nice().domain()).toEqual([0, 10]);
  });

  it("scaleBand splits the range into bands", () => {
    const x = scaleBand()
      .domain(["a", "b", "c"])
      .range([0, 90])
      .paddingInner(0);
    expect(x("b")).toBe(30);
    expect(x.bandwidth()).toBe(30);
    expect(x("zzz")).toBeUndefined();
  });

  it("scaleTime and scaleUtc take dates and numbers", () => {
    const a = new Date(Date.UTC(2024, 0, 1));
    const b = new Date(Date.UTC(2024, 0, 11));
    const t = scaleUtc().domain([a, b]).range([0, 100]);
    expect(t(new Date(Date.UTC(2024, 0, 6)))).toBe(50);
    expect(t.invert(100)).toEqual(b);
    expect(t.ticks(2).every((d) => d instanceof Date)).toBe(true);
    expect(scaleTime().domain([a, b]).domain()).toHaveLength(2);
  });

  it("line and area draw paths, curves included", () => {
    const pts: [number, number][] = [
      [0, 0],
      [10, 20],
      [20, 10],
    ];
    expect(line()(pts)).toBe("M0,0L10,20L20,10");
    expect(line().curve(curveMonotoneX)(pts)).toMatch(/^M0,0C/);
    const a = area<[number, number]>()
      .x((d) => d[0])
      .y0(30)
      .y1((d) => d[1]);
    expect(a(pts)).toBe("M0,0L10,20L20,10L20,30L10,30L0,30Z");
  });

  it("pie, arc and stack", () => {
    const slices = pie<number>().sort(null)([1, 1, 2]);
    expect(slices.map((s) => s.value)).toEqual([1, 1, 2]);
    expect(slices[2].endAngle).toBeCloseTo(2 * Math.PI);
    expect(
      arc()({
        innerRadius: 0,
        outerRadius: 10,
        startAngle: 0,
        endAngle: Math.PI,
      }),
    ).toMatch(/^M/);
    const s = stack<{ a: number; b: number }>().keys(["a", "b"])([
      { a: 1, b: 2 },
    ]);
    expect(s[0][0].slice(0, 2)).toEqual([0, 1]);
    expect(s[1][0].slice(0, 2)).toEqual([1, 3]);
  });
});
