import { PivotEngine } from "@its/glowup-pivot";

// Invented data with the shape a CRM report's query returns: rows already counted, several per site and
// category (one per reason and priority), a true/false column, a reason that is sometimes empty, and one
// category that only ever has `true`. Nothing here comes from a real report.
const SITES = [
  "Northgate",
  "Riverside",
  "Harbour",
  "Hillcrest",
  "Lakeside",
  "Meadow",
];
const CATEGORIES = ["Standard", "Premium", "Corporate", "Seasonal"];
const ONLY_ACTIVE = "Seasonal";
const REASONS = [null, "Recent contact", "Opted out", "Missing number"];
const PRIORITIES = [1, 2, 3];

export type SamplePivotRow = {
  siteId: number;
  site: string;
  categoryId: number;
  category: string;
  active: "true" | "false";
  reasonId: number;
  reason: string | null;
  priority: number;
  n: number;
};

export const SAMPLE_PIVOT_METADATA = {
  siteId: { type: "number", caption: "Site ID" },
  site: { type: "string", caption: "Site" },
  categoryId: { type: "number", caption: "Category ID" },
  category: { type: "string", caption: "Category" },
  active: { type: "string", caption: "Active" },
  reasonId: { type: "number", caption: "Reason ID" },
  reason: { type: "string", caption: "Reason" },
  priority: { type: "number", caption: "Priority" },
  n: { type: "number", caption: "Count" },
};

const siteRows = (i: number): SamplePivotRow[] =>
  CATEGORIES.flatMap((category, j) =>
    (category === ONLY_ACTIVE ? ["true"] : ["true", "false"]).flatMap(
      (active, k) =>
        REASONS.flatMap((reason, r) =>
          PRIORITIES.flatMap((priority, p) =>
            // Deterministic (the page is prerendered, and its tests must agree with it): a sparse mix, as
            // a real query has, but every site and category keeps its row with no reason.
            r > 0 && (i * 7 + j * 5 + k * 3 + r * 11 + p * 13) % 10 < 4
              ? []
              : [
                  {
                    siteId: i + 1,
                    site: SITES[i] ?? `Site ${i + 1}`,
                    categoryId: j + 1,
                    category,
                    active: active as "true" | "false",
                    reasonId: r,
                    reason,
                    priority,
                    n:
                      (((i + 2) * (j + 3) * (k + 5) * (r + 1) * (p + 2)) % 41) +
                      1,
                  },
                ],
          ),
        ),
    ),
  );

/**
 * The sample's rows: the six sites, or exactly `count` rows (more sites, `Site 7`, `Site 8`…) for a large
 * dataset. The same rows every time, and a shorter count is the start of a longer one.
 */
export const samplePivotRows = (count?: number): SamplePivotRow[] => {
  if (count === undefined) return SITES.flatMap((_, i) => siteRows(i));
  const rows: SamplePivotRow[] = [];
  for (let i = 0; rows.length < count; i++) rows.push(...siteRows(i));
  return rows.slice(0, count);
};

/** A fresh engine on the sample (`count` as in `samplePivotRows`), everything open, the grand total on top. */
export const samplePivotEngine = (count?: number): PivotEngine => {
  const engine = new PivotEngine();
  engine.setLocale("en-US");
  engine.setData([SAMPLE_PIVOT_METADATA, ...samplePivotRows(count)]);
  engine.setSlice({
    rows: [{ uniqueName: "site" }, { uniqueName: "category" }],
    columns: [{ uniqueName: "active" }],
    measures: [{ uniqueName: "n", aggregation: "sum" }],
    expands: { expandAll: true },
    filters: [],
  } as never);
  return engine;
};
