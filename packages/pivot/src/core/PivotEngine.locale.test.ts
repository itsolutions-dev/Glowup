import { PivotEngine } from "./index";

const dataset = [
  {
    day: { type: "date", caption: "Day" },
    revenue: { type: "number", caption: "Revenue" },
  },
  { day: "2026-10-23", revenue: 1200 },
];

const rowHeaders = (locale: string | undefined) => {
  const engine = new PivotEngine();
  engine.setLocale(locale);
  engine.setData(dataset);
  engine.setSlice({
    rows: [{ uniqueName: "day" }],
    columns: [{ uniqueName: "Measures" }],
    measures: [{ uniqueName: "revenue", aggregation: "sum" }],
    expands: { expandAll: true },
    filters: [],
  });
  return JSON.stringify(engine.processMatrix().rowLeaves);
};

describe("date headers follow the engine locale", () => {
  const day = new Date(2026, 9, 23);

  test("it-IT", () => {
    expect(rowHeaders("it-IT")).toContain(
      new Intl.DateTimeFormat("it-IT").format(day),
    );
  });

  test("en-US, and no locale at all", () => {
    const us = new Intl.DateTimeFormat("en-US").format(day);
    expect(rowHeaders("en-US")).toContain(us);
    expect(rowHeaders(undefined)).toContain(us);
  });
});
