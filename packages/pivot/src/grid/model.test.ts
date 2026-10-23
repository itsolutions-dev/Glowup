import { PivotEngine } from "../index";
import { buildGridModel } from "./model";

const META = {
  site: { type: "string", caption: "Site" },
  cat: { type: "string", caption: "Category" },
  flag: { type: "string", caption: "Flag" },
  n: { type: "number", caption: "Count" },
  v: { type: "number", caption: "Value" },
};
const ROWS = [
  { site: "A", cat: "x", flag: "t", n: 5, v: 1 },
  { site: "A", cat: "y", flag: "f", n: 7, v: 2 },
  { site: "B", cat: "x", flag: "t", n: 11, v: 3 },
];
const N_SUM = { uniqueName: "n", aggregation: "sum" };
const V_SUM = { uniqueName: "v", aggregation: "sum" };

const engineFor = (slice: object, format?: object, data: object[] = ROWS) => {
  const engine = new PivotEngine();
  engine.setLocale("en-US");
  engine.setData([META, ...data]);
  engine.setSlice({
    filters: [],
    expands: { expandAll: true },
    ...slice,
  } as never);
  if (format) engine.setFormat(format);
  return engine;
};

const modelOf = (engine: PivotEngine, locale = engine.getLocale()) =>
  buildGridModel({
    matrix: engine.processMatrix(),
    slice: engine.getSlice(),
    format: engine.getFormat(),
    metadata: engine.getMetadata(),
    locale,
  });

const NESTED = {
  rows: [{ uniqueName: "site" }, { uniqueName: "cat" }],
  columns: [{ uniqueName: "flag" }],
  measures: [N_SUM],
};

describe("buildGridModel", () => {
  test("rows nest, with the grand total first", () => {
    const model = modelOf(engineFor(NESTED));
    // One measure, not on the columns: the grand-total row carries the measure caption.
    expect(model.rows.map((r) => r.label)).toEqual([
      "Sum Total of Count",
      "A",
      "x",
      "y",
      "B",
      "x",
    ]);
    expect(model.rows.map((r) => r.depth)).toEqual([-1, 0, 1, 1, 0, 1]);
    expect(model.rows.map((r) => r.indent)).toEqual([0, 0, 16, 16, 0, 16]);
    expect(model.rows.map((r) => r.isGrandTotal)).toEqual([
      true,
      false,
      false,
      false,
      false,
      false,
    ]);
    expect(model.columns.map((c) => c.label)).toEqual(["Total", "f", "t"]);
  });

  test("cells carry the formatted text of their intersection", () => {
    const model = modelOf(engineFor(NESTED));
    expect(model.rows[1].cells.map((c) => c.text)).toEqual(["12", "7", "5"]);
    expect(model.rows[0].cells.map((c) => c.text)).toEqual(["23", "7", "16"]);
  });

  test("only a node with children can toggle, and the nodeKey is the toggle key", () => {
    const model = modelOf(engineFor(NESTED));
    expect(model.rows.map((r) => r.canToggle)).toEqual([
      false,
      true,
      false,
      false,
      true,
      false,
    ]);
    expect(model.rows[1].nodeKey).toBe("__root__|site:A");
  });

  test("measures on columns put the measure in every column caption", () => {
    const model = modelOf(
      engineFor({
        rows: [{ uniqueName: "site" }],
        columns: [{ uniqueName: "flag" }, { uniqueName: "Measures" }],
        measures: [N_SUM, V_SUM],
      }),
    );
    expect(model.columns.map((c) => c.label)).toEqual([
      "Sum Total of Count",
      "Sum Total of Value",
      "f — Sum Total of Count",
      "f — Sum Total of Value",
      "t — Sum Total of Count",
      "t — Sum Total of Value",
    ]);
    // Measures on the columns: the grand-total row says plainly "Total".
    expect(model.rows[0].label).toBe("Total");
  });

  test("measures on rows repeat a node per measure but only the first owns the arrow", () => {
    const model = modelOf(
      engineFor({
        rows: [{ uniqueName: "site" }, { uniqueName: "Measures" }],
        columns: [{ uniqueName: "flag" }],
        measures: [N_SUM, V_SUM],
      }),
    );
    const a = model.rows.filter((r) => r.nodeKey === "__root__|site:A");
    expect(a).toHaveLength(2);
    expect(new Set(a.map((r) => r.key)).size).toBe(2);
    const keys = model.rows.map((r) => r.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(a.map((r) => r.canToggle)).toEqual([false, false]);
  });

  test("a collapsed column group can be expanded", () => {
    const model = modelOf(
      engineFor({
        rows: [{ uniqueName: "site" }],
        columns: [{ uniqueName: "flag" }, { uniqueName: "cat" }],
        measures: [N_SUM],
        expands: {
          expandAll: false,
          expandedMembers: ["__root__", "__root__|flag:t"],
        },
      }),
    );
    const f = model.columns.find((c) => c.nodeKey === "__root__|flag:f");
    const t = model.columns.find((c) => c.nodeKey === "__root__|flag:t");
    expect(f).toMatchObject({ canToggle: true, isExpanded: false });
    expect(t).toMatchObject({ canToggle: true, isExpanded: true });
  });

  test("a hidden measure leaves no column", () => {
    const model = modelOf(
      engineFor({
        rows: [{ uniqueName: "site" }],
        columns: [{ uniqueName: "Measures" }],
        measures: [N_SUM, { ...V_SUM, hidden: true }],
      }),
    );
    expect(model.columns.length).toBeGreaterThan(0);
    expect(model.columns.some((c) => c.label.includes("Value"))).toBe(false);
  });

  test("totals after: header clone, children, subtotal, grand total last", () => {
    const model = modelOf(
      engineFor(
        {
          rows: [{ uniqueName: "site" }, { uniqueName: "cat" }],
          columns: [{ uniqueName: "Measures" }],
          measures: [N_SUM, V_SUM],
        },
        { layout: { totalsRowsPosition: "after" } },
      ),
    );
    const last = model.rows[model.rows.length - 1];
    expect(last.isGrandTotal).toBe(true);
    const subtotal = model.rows.find((r) => r.label === "A Total");
    expect(subtotal).toMatchObject({ isSubtotal: true, canToggle: false });
    const header = model.rows[0];
    expect(header.label).toBe("A");
    expect(header.cells.every((c) => c.text === "")).toBe(true);
  });

  test("the numbers follow the locale it is given", () => {
    const engine = engineFor(NESTED, {
      valuesByMeasure: { "n:sum": { numberOfDecimals: 1 } },
    });
    expect(modelOf(engine, "it-IT").rows[2].cells[2].text).toBe("5,0");
    expect(modelOf(engine, "en-US").rows[2].cells[2].text).toBe("5.0");
  });

  test("a ratio measure is a percentage unless the format says otherwise", () => {
    const model = modelOf(
      engineFor({
        rows: [{ uniqueName: "site" }],
        columns: [{ uniqueName: "flag" }],
        measures: [{ uniqueName: "n", aggregation: "ratioTotal" }],
      }),
    );
    expect(model.rows[0].cells[0].text).toContain("%");
  });

  test("a missing cell and a null value are empty text", () => {
    const engine = engineFor(NESTED);
    const matrix = engine.processMatrix();
    matrix.cells.clear();
    const model = buildGridModel({
      matrix,
      slice: engine.getSlice(),
      format: engine.getFormat(),
      locale: "en-US",
    });
    const texts = model.rows.flatMap((r) => r.cells.map((c) => c.text));
    expect(texts.length).toBeGreaterThan(0);
    expect(texts.every((t) => t === "")).toBe(true);
    expect(model.rows[0].cells[0].value).toBeNull();
  });

  test("a cell with a formula error keeps the message and shows no number", () => {
    const engine = engineFor(NESTED);
    const matrix = engine.processMatrix();
    matrix.cells.set("__root__|site:A::__root__|flag:t", {
      value: null,
      formattedValue: "",
      rowKey: "__root__|site:A",
      colKey: "__root__|flag:t",
      measureKey: "n:sum",
      error: "boom",
    });
    const model = buildGridModel({
      matrix,
      slice: engine.getSlice(),
      format: engine.getFormat(),
      locale: "en-US",
    });
    const row = model.rows.find((r) => r.nodeKey === "__root__|site:A");
    expect(row!.cells[2]).toMatchObject({ error: "boom", text: "" });
  });

  test("no rows at all is an empty model, not an error", () => {
    const engine = engineFor(NESTED, undefined, []);
    expect(() => modelOf(engine)).not.toThrow();
    expect(modelOf(engine).rows.length).toBeLessThanOrEqual(1);
  });

  test("empty means no data rows, not just a lone total row", () => {
    const noData = modelOf(engineFor(NESTED, undefined, []));
    expect(noData.empty).toBe(true);
    // A report with no row dimension is one grand-total row, and it has data.
    const flat = modelOf(
      engineFor({
        rows: [],
        columns: [{ uniqueName: "flag" }],
        measures: [N_SUM],
      }),
    );
    expect(flat.rows).toHaveLength(1);
    expect(flat.rows[0].cells.map((c) => c.text)).toEqual(["23", "7", "16"]);
    expect(flat.empty).toBe(false);
    expect(modelOf(engineFor(NESTED)).empty).toBe(false);
  });
});
