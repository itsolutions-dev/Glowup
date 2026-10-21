import { makeValueFormatter } from "../core/format";
import { aggregate } from "../core/aggregate";
import {
  readableOn,
  resolveSeriesColors,
  themeSeriesColors,
} from "../core/palette";
import {
  arcPath,
  areaPath,
  bandPath,
  donutSlices,
  linePath,
  sliceAt,
  spreadAngles,
  stackValues,
  textFitsSlice,
} from "../core/paths";
import { bandScale, pointPositions, valueScale } from "../core/scales";
import { chartTable, describeChart, describeParts } from "../core/summary";

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

describe("donut helpers", () => {
  const opts = { innerRadius: 20, outerRadius: 40 };

  it("a total bigger than the parts leaves the rest empty", () => {
    const [a] = donutSlices([{ id: "a", value: 30 }], { ...opts, total: 100 });
    expect(a.fraction).toBeCloseTo(0.3);
    expect(a.endAngle).toBeCloseTo(0.3 * 2 * Math.PI);
  });

  it("a total smaller than the parts is ignored: the parts are the whole", () => {
    const slices = donutSlices(
      [
        { id: "a", value: 3 },
        { id: "b", value: 1 },
      ],
      { ...opts, total: 2 },
    );
    expect(slices[1].endAngle).toBeCloseTo(2 * Math.PI);
    expect(slices[0].fraction).toBeCloseTo(0.75);
  });

  it("sliceAt finds the slice under a point and nothing in the hole or outside", () => {
    const slices = donutSlices(
      [
        { id: "a", value: 1 },
        { id: "b", value: 1 },
      ],
      opts,
    );
    // clockwise from 12 o clock: a is the right half, b the left half
    expect(sliceAt(slices, 30, 0, 20, 40)).toBe(0);
    expect(sliceAt(slices, -30, 0, 20, 40)).toBe(1);
    expect(sliceAt(slices, 0, -30, 20, 40)).toBe(0);
    // exactly on the boundary between the two halves: it belongs to the next slice
    expect(sliceAt(slices, 0, 30, 20, 40)).toBe(1);
    expect(sliceAt(slices, 5, 0, 20, 40)).toBeNull();
    expect(sliceAt(slices, 50, 0, 20, 40)).toBeNull();
    expect(sliceAt([], 30, 0, 20, 40)).toBeNull();
  });

  it("arcPath draws a bigger arc for the same angles", () => {
    const s = { startAngle: 0, endAngle: 1 };
    expect(arcPath(s, 20, 44)).not.toBe(arcPath(s, 20, 40));
    expect(arcPath(s, 20, 44)).toMatch(/^M/);
  });
});

describe("describeParts", () => {
  const format = makeValueFormatter({ locale: "en-US" });
  const percent = makeValueFormatter({
    locale: "en-US",
    options: { style: "percent", maximumFractionDigits: 0 },
  });

  it("lists the parts with their share of the whole", () => {
    expect(
      describeParts({
        title: "Calls",
        parts: [
          { name: "A", value: 30 },
          { name: "B", value: 10 },
        ],
        total: 100,
        format,
        percent,
      }),
    ).toBe("Calls. 2 parts, total 100. A 30 (30%), B 10 (10%).");
  });

  it("skips parts without a value and says so when none is left", () => {
    expect(
      describeParts({
        parts: [{ name: "A", value: 0 }],
        format,
        percent,
      }),
    ).toBe("No data.");
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

describe("aggregate", () => {
  const data = Array.from({ length: 10 }, (_, i) => ({
    label: `c${i}`,
    a: i,
    b: i < 5 ? null : i,
  }));

  it("folds the categories into the columns it is given, with mean and range", () => {
    const f = aggregate(data, ["a", "b"], 5);
    expect(f?.runs).toEqual(
      [0, 1, 2, 3, 4].map((c) => ({ from: 2 * c, to: 2 * c + 2 })),
    );
    expect(f?.mean.map((d) => d.a)).toEqual([0.5, 2.5, 4.5, 6.5, 8.5]);
    expect(f?.min[4].a).toBe(8);
    expect(f?.max[4].a).toBe(9);
    // A run with no value stays a gap, a run with one value is that value.
    expect(f?.mean.map((d) => d.b)).toEqual([null, null, 5, 6.5, 8.5]);
    expect(f?.mean[0].label).toBe("c0");
  });

  it("covers every category once when they do not divide evenly", () => {
    const f = aggregate(data, ["a"], 3);
    expect(f?.runs[0].from).toBe(0);
    expect(f?.runs[2].to).toBe(10);
    f?.runs.forEach((r, i) => i > 0 && expect(r.from).toBe(f.runs[i - 1].to));
  });

  it("returns null when there are no more categories than columns", () => {
    expect(aggregate(data, ["a"], 10)).toBeNull();
    expect(aggregate(data, ["a"], 20)).toBeNull();
  });
});

describe("bandPath", () => {
  it("goes along the top and back along the bottom, one strip per run", () => {
    expect(
      bandPath([
        { x: 0, hi: 1, lo: 5 },
        { x: 1, hi: 2, lo: 6 },
        { x: 2, hi: null, lo: null },
        { x: 3, hi: 3, lo: 4 },
      ]),
    ).toBe("M0,1L1,2L1,6L0,5ZM3,3L3,4Z");
    expect(bandPath([])).toBe("");
  });
});

describe("spreadAngles", () => {
  it("keeps angles that already clear each other", () => {
    expect(spreadAngles([0.5, 2, 4], 0.3)).toEqual([0.5, 2, 4]);
  });

  it("moves close neighbours apart, across the top as well", () => {
    for (const angles of [
      [1, 1.01, 1.02],
      [0.01, 6.27],
      [3, 3],
    ]) {
      const out = spreadAngles(angles, 0.2);
      out.forEach((a, i) => {
        const next =
          out[(i + 1) % out.length] + (i + 1 === out.length ? 2 * Math.PI : 0);
        expect(next - a).toBeGreaterThanOrEqual(0.2 - 1e-6);
      });
    }
  });

  it("spreads evenly when there is no room for the gap", () => {
    const out = spreadAngles([0, 0.1, 0.2, 0.3], 2);
    expect(out[1] - out[0]).toBeCloseTo(Math.PI / 2);
  });
});

describe("textFitsSlice", () => {
  // A quarter of a ring from 12 to 3 o'clock, radii 40..60; its centroid sits at 45 degrees on radius 50.
  const quarter = {
    startAngle: 0,
    endAngle: Math.PI / 2,
    centroid: [50 * Math.SQRT1_2, -50 * Math.SQRT1_2] as [number, number],
  };
  it("fits a short text in a wide slice and refuses it in a narrow one", () => {
    expect(textFitsSlice(quarter, 40, 60, 14, 8)).toBe(true);
    // wider than the ring is thick, on a diagonal it still clears the edges: this one does not
    expect(textFitsSlice(quarter, 40, 60, 60, 10)).toBe(false);
    const sliver = { ...quarter, endAngle: 0.05 };
    expect(textFitsSlice(sliver, 40, 60, 20, 10)).toBe(false);
  });

  it("refuses a text on the side of a thin ring, wide as it is long", () => {
    const side = {
      startAngle: Math.PI / 4,
      endAngle: (3 * Math.PI) / 4,
      centroid: [50, 0] as [number, number],
    };
    expect(textFitsSlice(side, 40, 60, 16, 10)).toBe(true);
    expect(textFitsSlice(side, 45, 55, 26, 12)).toBe(false);
  });
});

describe("readableOn", () => {
  it("picks the colour with more contrast", () => {
    expect(readableOn("#000000", "#ffffff", "#000000")).toBe("#ffffff");
    expect(readableOn("#ffffff", "#ffffff", "#000000")).toBe("#000000");
    expect(readableOn("rgb(30, 30, 90)", "#fff", "#111")).toBe("#fff");
    expect(readableOn("#ccd", "#fff", "#111")).toBe("#111");
  });
  it("gives the first colour when one cannot be read", () => {
    expect(readableOn("currentColor", "#fff", "#000")).toBe("#fff");
    expect(readableOn("#000", "white", "#000")).toBe("white");
  });
});
