import { makeValueFormatter } from "../core/format";
import { resolveSeriesColors, themeSeriesColors } from "../core/palette";
import { areaPath, donutSlices, linePath, stackValues } from "../core/paths";
import { bandScale, pointPositions, valueScale } from "../core/scales";
import { chartTable, describeChart } from "../core/summary";

describe("valueScale", () => {
  it("rounds the domain to nice ticks and keeps 0 for bars", () => {
    const s = valueScale({ values: [3, 87], range: [100, 0] });
    expect(s.domain).toEqual([0, 100]);
    expect(s.ticks[0]).toBe(0);
    expect(s.ticks[s.ticks.length - 1]).toBe(100);
    expect(s.at(0)).toBe(100);
    expect(s.at(100)).toBe(0);
  });

  it("gives a usable domain for no values, one value and equal values", () => {
    for (const values of [[], [0], [5, 5], [null, undefined, NaN]]) {
      const s = valueScale({ values, range: [100, 0] });
      expect(s.domain[1]).toBeGreaterThan(s.domain[0]);
      expect(Number.isFinite(s.at(s.domain[0]))).toBe(true);
    }
  });

  it("includes negatives and ignores values that are not numbers", () => {
    const s = valueScale({ values: [-40, null, 10], range: [100, 0] });
    expect(s.domain[0]).toBeLessThanOrEqual(-40);
    expect(s.domain[1]).toBeGreaterThanOrEqual(10);
  });

  it("can leave 0 out for a line", () => {
    const s = valueScale({ values: [90, 95], range: [100, 0], zero: false });
    expect(s.domain[0]).toBeGreaterThan(0);
  });
});

describe("bandScale", () => {
  it("gives two equal labels two bands: it works by position", () => {
    const b = bandScale(2, [0, 100], 0);
    expect(b.start(0)).toBe(0);
    expect(b.start(1)).toBe(50);
    expect(b.width).toBe(50);
  });

  it("keeps the bands inside the range with padding", () => {
    const b = bandScale(3, [0, 90]);
    const last = b.start(2) + b.width;
    expect(b.start(0)).toBeGreaterThanOrEqual(0);
    expect(last).toBeLessThanOrEqual(90);
  });

  it("handles no categories", () => {
    expect(bandScale(0, [0, 100]).width).toBeGreaterThanOrEqual(0);
  });
});

describe("pointPositions", () => {
  it("spreads points over the range, a single one in the middle, none for none", () => {
    expect(pointPositions(3, [0, 100])).toEqual([0, 50, 100]);
    expect(pointPositions(1, [0, 100])).toEqual([50]);
    expect(pointPositions(0, [0, 100])).toEqual([]);
  });
});

describe("paths", () => {
  it("linePath leaves a gap for a missing value and is empty for no data", () => {
    const d = linePath([
      { x: 0, y: 0 },
      { x: 10, y: 5 },
      { x: 20, y: null },
      { x: 30, y: 8 },
      { x: 40, y: 2 },
    ]);
    expect(d.match(/M/g)).toHaveLength(2);
    expect(linePath([])).toBe("");
    expect(linePath([{ x: 0, y: null }])).toBe("");
  });

  it("linePath draws a single point and a curve", () => {
    expect(linePath([{ x: 5, y: 5 }])).toBe("M5,5Z");
    expect(
      linePath(
        [
          { x: 0, y: 0 },
          { x: 10, y: 10 },
          { x: 20, y: 0 },
        ],
        "monotone",
      ),
    ).toContain("C");
  });

  it("areaPath closes down to the baseline", () => {
    const d = areaPath(
      [
        { x: 0, y: 10 },
        { x: 10, y: 20 },
      ],
      100,
    );
    expect(d).toBe("M0,10L10,20L10,100L0,100Z");
  });

  it("stackValues piles positives up, negatives down, and counts a missing value as 0", () => {
    const data = [
      { label: "a", x: 2, y: 3 },
      { label: "b", x: -1, y: 4 },
      { label: "c", x: null },
    ];
    const s = stackValues(data, ["x", "y"]);
    expect(s[0][0]).toEqual({ start: 0, end: 2 });
    expect(s[1][0]).toEqual({ start: 2, end: 5 });
    expect(s[0][1]).toEqual({ start: -1, end: 0 });
    expect(s[1][1]).toEqual({ start: 0, end: 4 });
    expect(s[0][2]).toEqual({ start: 0, end: 0 });
    expect(s[1][2]).toEqual({ start: 0, end: 0 });
  });

  it("donutSlices shares the circle by value and drops what has no value", () => {
    const slices = donutSlices(
      [
        { id: "a", value: 1 },
        { id: "zero", value: 0 },
        { id: "neg", value: -5 },
        { id: "nan", value: NaN },
        { id: "b", value: 3 },
      ],
      { innerRadius: 20, outerRadius: 40 },
    );
    expect(slices.map((s) => s.id)).toEqual(["a", "b"]);
    expect(slices[0].fraction).toBeCloseTo(0.25);
    expect(slices[1].endAngle).toBeCloseTo(2 * Math.PI);
    expect(slices.every((s) => s.path.startsWith("M"))).toBe(true);
  });

  it("donutSlices gives a single full ring and nothing for no total", () => {
    const one = donutSlices([{ id: "a", value: 7 }], {
      innerRadius: 20,
      outerRadius: 40,
      padAngle: 0.1,
    });
    expect(one).toHaveLength(1);
    expect(one[0].fraction).toBe(1);
    expect(donutSlices([], { innerRadius: 0, outerRadius: 10 })).toEqual([]);
    expect(
      donutSlices([{ id: "a", value: 0 }], { innerRadius: 0, outerRadius: 10 }),
    ).toEqual([]);
  });
});

describe("makeValueFormatter", () => {
  it("formats with the locale it is given and shows a dash for no value", () => {
    expect(makeValueFormatter({ locale: "en-US" })(1234.5)).toBe("1,234.5");
    expect(makeValueFormatter({ locale: "de-DE" })(1234.5)).toBe("1.234,5");
    const f = makeValueFormatter();
    expect(f(null)).toBe("–");
    expect(f(undefined)).toBe("–");
    expect(f(NaN)).toBe("–");
  });

  it("takes Intl options", () => {
    const pct = makeValueFormatter({
      locale: "en-US",
      options: { style: "percent" },
    });
    expect(pct(0.256)).toBe("26%");
  });
});

describe("palette", () => {
  it("uses a series' own colour, else the palette in turn, repeating", () => {
    const colors = resolveSeriesColors(
      [{ key: "a" }, { key: "b", color: "#123456" }, { key: "c" }],
      ["red", "green"],
    );
    expect(colors).toEqual(["red", "#123456", "red"]);
  });

  it("themeSeriesColors reads roles of the theme only", () => {
    const roles = new Proxy(
      {},
      { get: (_, name) => `role:${String(name)}` },
    ) as never;
    const list = themeSeriesColors(roles);
    expect(list[0]).toBe("role:primary");
    expect(list.every((c) => c.startsWith("role:"))).toBe(true);
  });
});

describe("summary", () => {
  const format = makeValueFormatter({ locale: "en-US" });
  const labels = ["Jan", "Feb", "Mar"];

  it("reads few points one by one", () => {
    const text = describeChart({
      title: "Sales",
      labels,
      series: [{ name: "North", values: [1, 2, null] }],
      format,
    });
    expect(text).toBe(
      "Sales. 1 series, 3 categories. North: Jan 1, Feb 2, Mar –.",
    );
  });

  it("sums up many points by lowest, highest and last", () => {
    const many = Array.from({ length: 20 }, (_, i) => `L${i}`);
    const values = many.map((_, i) => (i === 5 ? -3 : i === 9 ? 50 : 10));
    const text = describeChart({
      labels: many,
      series: [{ name: "S", values }],
      format,
    });
    expect(text).toContain("lowest -3 at L5");
    expect(text).toContain("highest 50 at L9");
    expect(text).toContain("last 10 at L19");
  });

  it("says so when there is no data or no value", () => {
    expect(describeChart({ labels: [], series: [], format })).toBe("No data.");
    expect(
      describeChart({
        labels: Array.from({ length: 20 }, (_, i) => `${i}`),
        series: [{ name: "S", values: [] }],
        format,
      }),
    ).toContain("S: no values.");
  });

  it("chartTable is a header row and one row per category", () => {
    expect(
      chartTable({
        labels,
        series: [{ name: "A", values: [1, 2, 3] }],
        format,
      }),
    ).toEqual([
      ["", "A"],
      ["Jan", "1"],
      ["Feb", "2"],
      ["Mar", "3"],
    ]);
  });
});
