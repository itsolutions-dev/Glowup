import * as pivot from "../index";

describe("the public API", () => {
  test.each([
    "PivotEngine",
    "usePivotMatrix",
    "useEngineVersion",
    "formatNumberWithFormat",
    "PivotProvider",
    "usePivot",
    "mergeLocalization",
    "localizationEn",
    "localizationIt",
    "optionsToEngine",
    "engineToOptions",
    "DEFAULT_OPTIONS",
    "gridToXlsx",
    "saveXlsx",
    "xlsxName",
    "XLSX_MIME",
    "PivotExportError",
  ])("exports %s", (name) => {
    expect((pivot as Record<string, unknown>)[name]).toBeDefined();
  });

  test("an engine fed three rows computes a matrix with cells", () => {
    const engine = new pivot.PivotEngine();
    engine.setData([
      { region: "N", amount: 1 },
      { region: "S", amount: 2 },
      { region: "N", amount: 4 },
    ]);
    engine.setSlice({
      rows: [{ uniqueName: "region" }],
      measures: [{ uniqueName: "amount", aggregation: "sum" }],
    });
    const matrix = engine.processMatrix();
    expect(matrix.cells.size).toBeGreaterThan(0);
  });
});
