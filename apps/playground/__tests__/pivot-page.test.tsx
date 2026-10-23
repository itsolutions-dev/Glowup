import { render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "@its/glowup-ui";
import { buildGridModel } from "@its/glowup-pivot";

import PivotPage from "../app/pivot";
import { samplePivotEngine } from "../site/samplePivot";

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
    // Jest runs as a phone, where the grid says it is not there yet; the web grid is tested in the package.
    expect(
      screen.getByText("The pivot grid is not available on this platform yet."),
    ).toBeTruthy();
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
});
