import { act, renderHook } from "@testing-library/react-native";
import { PivotEngine } from "../index";
import { usePivotGrid } from "./usePivotGrid";

const META = {
  site: { type: "string", caption: "Site" },
  cat: { type: "string", caption: "Category" },
  flag: { type: "string", caption: "Flag" },
  n: { type: "number", caption: "Count" },
};
const ROWS = [
  { site: "A", cat: "x", flag: "t", n: 5 },
  { site: "A", cat: "y", flag: "f", n: 7 },
  { site: "B", cat: "x", flag: "t", n: 11 },
];

const engineFor = (rows: object[], dims: string[]) => {
  const engine = new PivotEngine();
  engine.setLocale("en-US");
  engine.setData([META, ...rows]);
  engine.setSlice({
    rows: dims.map((uniqueName) => ({ uniqueName })),
    columns: [{ uniqueName: "flag" }],
    measures: [{ uniqueName: "n", aggregation: "sum" }],
    filters: [],
    expands: { expandAll: true },
  } as never);
  return engine;
};

const labels = (model: { rows: { label: string }[] } | null) =>
  model?.rows.map((r) => r.label);

describe("usePivotGrid", () => {
  test("returns null while there is no engine", async () => {
    const { result } = await renderHook(() => usePivotGrid(null));
    expect(result.current.model).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  test("builds the model of the engine", async () => {
    const engine = engineFor(ROWS, ["site"]);
    const { result } = await renderHook(() => usePivotGrid(engine));
    expect(labels(result.current.model)).toEqual([
      "Sum Total of Count",
      "A",
      "B",
    ]);
  });

  test("toggle collapses a node and the model follows", async () => {
    const engine = engineFor(ROWS, ["site", "cat"]);
    const { result } = await renderHook(() => usePivotGrid(engine));
    expect(labels(result.current.model)).toEqual([
      "Sum Total of Count",
      "A",
      "x",
      "y",
      "B",
      "x",
    ]);
    await act(async () => {
      result.current.toggle("__root__|site:A");
    });
    expect(labels(result.current.model)).toEqual([
      "Sum Total of Count",
      "A",
      "B",
      "x",
    ]);
  });

  test("keeps the last model while a large dataset recomputes", async () => {
    // Fake timers: with real ones, whether the deferred recompute has run when act returns depends on the machine.
    jest.useFakeTimers();
    try {
      const engine = engineFor(ROWS, ["site"]);
      const { result } = await renderHook(() => usePivotGrid(engine));
      const before = result.current.model;
      expect(before).not.toBeNull();

      const many = Array.from({ length: 5001 }, (_, i) => ({
        site: `S${i % 7}`,
        cat: "x",
        flag: "t",
        n: i,
      }));
      await act(async () => {
        engine.setData([META, ...many]);
      });
      expect(result.current.loading).toBe(true);
      expect(result.current.model).toBe(before);

      await act(async () => {
        jest.runOnlyPendingTimers();
      });
      expect(result.current.loading).toBe(false);
      expect(result.current.model).not.toBe(before);
    } finally {
      jest.useRealTimers();
    }
  });

  test("a format change that leaves the matrix as it was still reaches the model", async () => {
    const engine = engineFor(ROWS, ["site"]);
    const { result } = await renderHook(() => usePivotGrid(engine));
    expect(result.current.model?.rows[1].cells[0].text).toBe("12");
    await act(async () => {
      engine.setFormat({
        valuesByMeasure: { "n:sum": { numberOfDecimals: 3 } },
      });
    });
    expect(result.current.model?.rows[1].cells[0].text).toBe("12.000");
  });
});
