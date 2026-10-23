import { PivotEngine } from "@its/glowup-pivot";

// Invented data with the shape of a CRM report: sites, four categories under each site, and a
// true/false column, counted. Nothing here comes from a real report.
const SITES = [
  "Northgate",
  "Riverside",
  "Harbour",
  "Hillcrest",
  "Lakeside",
  "Meadow",
];
const CATEGORIES = ["Standard", "Premium", "Corporate", "Seasonal"];

const METADATA = {
  site: { type: "string", caption: "Site" },
  category: { type: "string", caption: "Category" },
  active: { type: "string", caption: "Active" },
  n: { type: "number", caption: "Count" },
};

const ROWS = SITES.flatMap((site, i) =>
  CATEGORIES.flatMap((category, j) =>
    ["true", "false"].map((active, k) => ({
      site,
      category,
      active,
      // Deterministic, so the page and its test always agree.
      n: (((i + 2) * (j + 3) * (k + 5)) % 37) + 3,
    })),
  ),
);

/** A fresh engine on the sample, everything open, the grand total on top. */
export const samplePivotEngine = (): PivotEngine => {
  const engine = new PivotEngine();
  engine.setLocale("en-US");
  engine.setData([METADATA, ...ROWS]);
  engine.setSlice({
    rows: [{ uniqueName: "site" }, { uniqueName: "category" }],
    columns: [{ uniqueName: "active" }],
    measures: [{ uniqueName: "n", aggregation: "sum" }],
    expands: { expandAll: true },
    filters: [],
  } as never);
  return engine;
};
