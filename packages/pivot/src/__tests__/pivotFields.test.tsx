import React from "react";
import {
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react-native";
import { ThemeProvider } from "@its/glowup-ui";
import { PivotEngine, localizationIt } from "../index";
import PivotGrid from "../PivotGrid";
import { filterSummary } from "../fields/FilterBar";

const engineFor = () => {
  const engine = new PivotEngine();
  engine.setLocale("en-US");
  engine.setData([
    {
      site: { type: "string", caption: "Site" },
      cat: { type: "string", caption: "Category" },
      flag: { type: "string", caption: "Flag" },
      who: { type: "string", caption: "Owner" },
      n: { type: "number", caption: "Count" },
    },
    { site: "A", cat: "x", flag: "t", who: "Ann", n: 5 },
    { site: "A", cat: "y", flag: "f", who: "Bob", n: 7 },
    { site: "B", cat: "x", flag: "t", who: "Ann", n: 11 },
  ]);
  engine.setSlice({
    rows: [{ uniqueName: "site" }, { uniqueName: "cat" }],
    columns: [{ uniqueName: "flag" }],
    measures: [{ uniqueName: "n", aggregation: "sum" }],
    filters: [],
    expands: { expandAll: true },
  } as never);
  return engine;
};

const show = (engine = engineFor(), onReset?: () => void) =>
  render(
    <ThemeProvider>
      <PivotGrid engine={engine} toolbar onReset={onReset} />
    </ThemeProvider>,
  );

const names = (list: { uniqueName: string }[]) => list.map((f) => f.uniqueName);

describe("PivotGrid field panel", () => {
  test("Fields is in the toolbar, in English and in Italian", async () => {
    await show();
    expect(await screen.findByLabelText("Fields")).toBeTruthy();
    await render(
      <ThemeProvider>
        <PivotGrid engine={engineFor()} toolbar localization={localizationIt} />
      </ThemeProvider>,
    );
    expect(await screen.findByLabelText("Campi")).toBeTruthy();
  });

  test("a field moved to columns from its menu is applied to the engine, Cancel leaves it", async () => {
    const engine = engineFor();
    await show(engine);
    await fireEvent.press(await screen.findByLabelText("Fields"));
    const panel = await screen.findByTestId("pivot-fields");
    // The chip's menu offers the other zones.
    await fireEvent.press(
      within(within(panel).getByTestId("pivot-zone-rows")).getByText(
        "Category",
      ),
    );
    await fireEvent.press(await screen.findByLabelText("Columns"));
    await fireEvent.press(within(panel).getByText("Cancel"));
    expect(names(engine.getSlice().rows)).toEqual(["site", "cat"]);

    await fireEvent.press(screen.getByLabelText("Fields"));
    await fireEvent.press(
      within(await screen.findByTestId("pivot-zone-rows")).getByText(
        "Category",
      ),
    );
    await fireEvent.press(await screen.findByLabelText("Columns"));
    await fireEvent.press(screen.getByTestId("pivot-fields-apply"));
    expect(names(engine.getSlice().rows)).toEqual(["site"]);
    expect(names(engine.getSlice().columns)).toEqual([
      "flag",
      "Measures",
      "cat",
    ]);
    expect(screen.queryByTestId("pivot-fields")).toBeNull();
  });

  test("a measure's aggregation changes from its chip, and the last visible one cannot be hidden", async () => {
    const engine = engineFor();
    await show(engine);
    await fireEvent.press(await screen.findByLabelText("Fields"));
    await fireEvent.press(await screen.findByText("Count · Sum"));
    await fireEvent.press(await screen.findByLabelText("Average"));
    await fireEvent.press(await screen.findByText("Count · Average"));
    await fireEvent.press(await screen.findByLabelText("Hide measure"));
    expect(
      await screen.findByText("At least one measure must be visible."),
    ).toBeTruthy();
    await fireEvent.press(await screen.findByText("Count · Average"));
    await fireEvent.press(await screen.findByLabelText("Show measure"));
    await fireEvent.press(screen.getByTestId("pivot-fields-apply"));
    expect(engine.getSlice().measures).toEqual([
      { uniqueName: "n", aggregation: "avg", hidden: false },
    ]);
  });

  test("a filter shows above the grid, its editor keeps the values picked", async () => {
    const engine = engineFor();
    await show(engine);
    await fireEvent.press(await screen.findByLabelText("Fields"));
    // Owner, from All fields, into Filters.
    await fireEvent.press(
      within(await screen.findByTestId("pivot-field-who")).getByText("Owner"),
    );
    await fireEvent.press(await screen.findByLabelText("Filters"));
    await fireEvent.press(screen.getByTestId("pivot-fields-apply"));
    expect(names(engine.getSlice().filters)).toEqual(["who"]);

    await fireEvent.press(await screen.findByText("Owner: All"));
    const editor = await screen.findByTestId("pivot-filter-editor");
    await fireEvent.press(within(editor).getByText("Multiple values"));
    await fireEvent.press(within(editor).getByText("Ann"));
    await fireEvent.press(screen.getByTestId("pivot-filter-apply"));
    expect(engine.getSlice().filters).toEqual([
      { uniqueName: "who", members: ["Ann"] },
    ]);
    expect(await screen.findByText("Owner: Ann")).toBeTruthy();
    // Bob's only row, category "y", is filtered out.
    expect(screen.queryByText("y")).toBeNull();
  });

  test("Reset calls the app's onReset when it has one", async () => {
    const onReset = jest.fn();
    await show(engineFor(), onReset);
    await fireEvent.press(await screen.findByLabelText("Reset"));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  test("the summary of a filter", () => {
    expect(filterSummary({ uniqueName: "a" })).toBe("All");
    expect(filterSummary({ uniqueName: "a", members: ["x", "y"] })).toBe(
      "2 values",
    );
    expect(filterSummary({ uniqueName: "a", range: { min: 1, max: 3 } })).toBe(
      "1 … 3",
    );
    expect(filterSummary({ uniqueName: "a", value: "x" })).toBe("= x");
  });
});
