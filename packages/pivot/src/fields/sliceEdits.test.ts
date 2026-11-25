import {
  applyZoneDrop,
  dropTarget,
  ensureMeasuresAnchor,
  type FieldLookup,
  type LocalSlice,
} from "./sliceEdits";

const lookup: FieldLookup = {
  isKnownField: (name) => ["site", "cat", "flag", "n"].includes(name),
  allowedAggsFor: () => ["sum", "count"],
  isCalculated: () => false,
};

const base = (): LocalSlice => ({
  rows: [{ uniqueName: "site" }, { uniqueName: "cat" }],
  columns: [{ uniqueName: "Measures" }],
  measures: [{ uniqueName: "n", aggregation: "sum" }],
  filters: [],
});

const names = (list?: { uniqueName: string }[]) =>
  (list || []).map((f) => f.uniqueName);

describe("field panel edits", () => {
  test("a field dropped on columns leaves rows", () => {
    const next = applyZoneDrop(
      base(),
      "columns",
      { source: "rows", uniqueName: "cat", idx: 1 },
      null,
      lookup,
    )!;
    expect(names(next.rows)).toEqual(["site"]);
    expect(names(next.columns)).toEqual(["Measures", "cat"]);
  });

  test("a field into values takes the first free aggregation, and none when all are taken", () => {
    const once = applyZoneDrop(
      base(),
      "measures",
      { source: "all", uniqueName: "n" },
      null,
      lookup,
    )!;
    expect(once.measures).toEqual([
      { uniqueName: "n", aggregation: "sum" },
      { uniqueName: "n", aggregation: "count" },
    ]);
    expect(
      applyZoneDrop(
        once,
        "measures",
        { source: "all", uniqueName: "n" },
        null,
        lookup,
      ),
    ).toBeNull();
  });

  test("a chip moved to filters keeps the filter the field already had", () => {
    const slice = {
      ...base(),
      filters: [{ uniqueName: "site", members: ["A"] }],
    };
    const next = applyZoneDrop(
      slice,
      "filters",
      { source: "rows", uniqueName: "site", idx: 0 },
      null,
      lookup,
    )!;
    expect(next.filters).toEqual([{ uniqueName: "site", members: ["A"] }]);
    expect(names(next.rows)).toEqual(["cat"]);
  });

  test("an unknown field or a stale chip does nothing", () => {
    expect(
      applyZoneDrop(
        base(),
        "rows",
        { source: "all", uniqueName: "nope" },
        null,
        lookup,
      ),
    ).toBeNull();
    expect(
      applyZoneDrop(
        base(),
        "columns",
        { source: "rows", uniqueName: "site", idx: 1 },
        null,
        lookup,
      ),
    ).toBeNull();
  });

  test("the library's drop index becomes the chip index, the anchor and the dragged chip skipped", () => {
    const columns = [
      { uniqueName: "Measures" },
      { uniqueName: "a" },
      { uniqueName: "b" },
    ];
    expect(
      dropTarget(columns, "columns", { source: "all", uniqueName: "x" }, 0),
    ).toBe(1);
    expect(
      dropTarget(columns, "columns", { source: "all", uniqueName: "x" }, 2),
    ).toBeNull();
    // `a` dragged after `b`: index 1 among the others is the end.
    const move = { source: "columns", uniqueName: "a", idx: 1 } as const;
    expect(dropTarget(columns, "columns", move, 1)).toBeNull();
    const moved = applyZoneDrop(
      { columns },
      "columns",
      move,
      dropTarget(columns, "columns", move, 1),
      lookup,
    );
    expect(names(moved?.columns)).toEqual(["Measures", "b", "a"]);
  });

  test("the anchor goes where the measures axis says", () => {
    expect(names(ensureMeasuresAnchor({ rows: [] }, "rows").rows)).toEqual([
      "Measures",
    ]);
    expect(names(ensureMeasuresAnchor({}, undefined).columns)).toEqual([
      "Measures",
    ]);
  });
});
