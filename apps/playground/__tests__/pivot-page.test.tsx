import { render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "@its/glowup-ui";
import { buildGridModel } from "@its/glowup-pivot";

import PivotPage from "../app/pivot";
import { samplePivotEngine, samplePivotRows } from "../site/samplePivot";

describe("the pivot page", () => {
  it("shows the live section and the usage section", async () => {
    await render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 1280, height: 900 },
          insets: { top: 0, left: 0, right: 0, bottom: 0 },
        }}
      >
        <ThemeProvider>
          <PivotPage />
        </ThemeProvider>
      </SafeAreaProvider>,
    );
    expect(await screen.findByText("Pivot")).toBeTruthy();
    expect(screen.getByText("Live")).toBeTruthy();
    expect(screen.getByText("Use it")).toBeTruthy();
    // Jest runs as a phone, so this is the phone grid; the web grid is tested in the package.
    expect(screen.getByLabelText("Pivot grid")).toBeTruthy();
    expect(screen.getByText("Harbour")).toBeTruthy();
    expect(screen.getByLabelText("Export to Excel")).toBeTruthy();
    expect(screen.getByLabelText("Fullscreen")).toBeTruthy();
    expect(screen.getByLabelText("Reset")).toBeTruthy();
  });
});

describe("the sample pivot", () => {
  const modelOf = (locale: string) => {
    const engine = samplePivotEngine();
    engine.setLocale(locale);
    return {
      engine,
      model: buildGridModel({
        matrix: engine.processMatrix(),
        slice: engine.getSlice(),
        format: engine.getFormat(),
        metadata: engine.getMetadata(),
        locale,
      }),
    };
  };

  it("has the sites with their categories under them, and the grand total first", () => {
    const { model } = modelOf("en-US");
    expect(model.rows[0].isGrandTotal).toBe(true);
    const sites = model.rows.filter((r) => r.depth === 0);
    expect(sites.length).toBeGreaterThanOrEqual(6);
    expect(model.rows.filter((r) => r.depth === 1).length).toBe(
      sites.length * 4,
    );
    expect(model.columns.map((c) => c.label)).toContain("true");
  });

  it("totals the counts of every data row", () => {
    const { engine, model } = modelOf("en-US");
    const sum = engine
      .getRows()
      .reduce((total, row) => total + Number((row as { n: number }).n), 0);
    expect(model.rows[0].cells[0].text).toBe(
      new Intl.NumberFormat("en-US").format(sum),
    );
  });

  it("has several counted rows per site and category, as a report's query returns them", () => {
    const rows = samplePivotRows();
    const keys = new Set(rows.map((r) => `${r.site}|${r.category}`));
    expect(keys.size).toBe(24);
    expect(rows.length).toBeGreaterThan(keys.size * 2);
  });

  it("leaves a cell empty where a category never has the other flag", () => {
    const { model } = modelOf("en-US");
    const falseColumn = model.columns.findIndex((c) => c.label === "false");
    const seasonal = model.rows.filter((r) => r.label === "Seasonal");
    expect(seasonal.length).toBe(6);
    for (const row of seasonal) expect(row.cells[falseColumn].text).toBe("");
  });

  it("totals the same with a field that is sometimes empty on the rows", () => {
    const engine = samplePivotEngine();
    expect(samplePivotRows().some((r) => r.reason === null)).toBe(true);
    const totalOf = (field: string) => {
      engine.setSlice({
        rows: [{ uniqueName: field }],
        columns: [{ uniqueName: "Measures" }],
        measures: [{ uniqueName: "n", aggregation: "sum" }],
        expands: { expandAll: true },
        filters: [],
      } as never);
      return buildGridModel({
        matrix: engine.processMatrix(),
        slice: engine.getSlice(),
        format: engine.getFormat(),
        metadata: engine.getMetadata(),
        locale: "en-US",
      }).rows[0].cells[0].text;
    };
    expect(totalOf("reason")).toBe(totalOf("site"));
  });

  it("makes as many rows as asked, the same every time", () => {
    const rows = samplePivotRows(50_000);
    expect(rows.length).toBe(50_000);
    expect(new Set(rows.map((r) => r.site)).size).toBeGreaterThan(6);
    expect(samplePivotRows(50_000)).toEqual(rows);
    expect(samplePivotRows(500)).toEqual(rows.slice(0, 500));
  });
});
