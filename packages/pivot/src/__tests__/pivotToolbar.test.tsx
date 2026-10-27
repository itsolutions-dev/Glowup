import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { ThemeProvider } from "@its/glowup-ui";
import { PivotEngine, localizationIt } from "../index";
import { PivotExportError } from "../export/errors";
import { saveXlsx } from "../export/save";
import PivotGrid from "../PivotGrid";
import type { PivotGridProps } from "../grid/props";

jest.mock("../export/save", () => ({
  saveXlsx: jest.fn(async () => "shared"),
}));
const save = saveXlsx as jest.MockedFunction<typeof saveXlsx>;

const engineFor = () => {
  const engine = new PivotEngine();
  engine.setLocale("en-US");
  engine.setData([
    {
      site: { type: "string", caption: "Site" },
      cat: { type: "string", caption: "Category" },
      flag: { type: "string", caption: "Flag" },
      n: { type: "number", caption: "Count" },
    },
    { site: "A", cat: "x", flag: "t", n: 5 },
    { site: "A", cat: "y", flag: "f", n: 7 },
    { site: "B", cat: "x", flag: "t", n: 11 },
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

const show = (props: Partial<PivotGridProps> = {}) =>
  render(
    <ThemeProvider>
      <PivotGrid engine={engineFor()} {...props} />
    </ThemeProvider>,
  );

beforeEach(() => save.mockClear());

describe("PivotGrid toolbar", () => {
  test("no toolbar unless asked", async () => {
    await show();
    await screen.findByText("Total");
    expect(screen.queryByLabelText("Export to Excel")).toBeNull();
  });

  test("three buttons, in English and in Italian", async () => {
    await show({ toolbar: true });
    expect(await screen.findByLabelText("Export to Excel")).toBeTruthy();
    expect(screen.getByLabelText("Fullscreen")).toBeTruthy();
    expect(screen.getByLabelText("Reset")).toBeTruthy();
    await show({ toolbar: true, localization: localizationIt });
    expect(await screen.findByLabelText("Esporta in Excel")).toBeTruthy();
    expect(screen.getByLabelText("Schermo intero")).toBeTruthy();
    expect(screen.getByLabelText("Ripristina")).toBeTruthy();
  });

  test("Reset opens a group the person closed", async () => {
    await show({ toolbar: true });
    await screen.findByText("y");
    await fireEvent.press(screen.getAllByLabelText("Collapse")[0]);
    expect(screen.queryByText("y")).toBeNull();
    await fireEvent.press(screen.getByLabelText("Reset"));
    expect(await screen.findByText("y")).toBeTruthy();
  });

  test("Reset keeps the report an app sets after the grid appeared", async () => {
    // A common pattern: the grid mounts on an empty engine, the data and the report arrive after a fetch.
    const source = engineFor();
    const engine = new PivotEngine();
    engine.setLocale("en-US");
    await render(
      <ThemeProvider>
        <PivotGrid engine={engine} toolbar />
      </ThemeProvider>,
    );
    await act(async () => {
      engine.setData(source.getReport().dataSource.data);
      engine.setSlice(source.getSlice() as never);
    });
    await screen.findByText("y");
    await fireEvent.press(screen.getAllByLabelText("Collapse")[0]);
    expect(screen.queryByText("y")).toBeNull();
    await fireEvent.press(screen.getByLabelText("Reset"));
    expect(await screen.findByText("y")).toBeTruthy();
  });

  test("Fullscreen shows the grid in a dialog, Exit Fullscreen closes it", async () => {
    await show({ toolbar: true });
    await screen.findByText("Total");
    expect(screen.getAllByTestId("pivot-grid")).toHaveLength(1);
    await fireEvent.press(screen.getByLabelText("Fullscreen"));
    expect(await screen.findAllByTestId("pivot-grid")).toHaveLength(2);
    await fireEvent.press(screen.getByLabelText("Exit Fullscreen"));
    expect(screen.getAllByTestId("pivot-grid")).toHaveLength(1);
    expect(screen.queryByLabelText("Exit Fullscreen")).toBeNull();
  });

  test("Export to Excel saves an .xlsx of the grid", async () => {
    await show({ toolbar: true });
    await fireEvent.press(await screen.findByLabelText("Export to Excel"));
    expect(save).toHaveBeenCalledTimes(1);
    const [bytes, name] = save.mock.calls[0];
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(String.fromCharCode(bytes[0], bytes[1])).toBe("PK");
    expect(name).toBe("pivot.xlsx");
    await show({ toolbar: true, fileName: "Report 10/27" });
    await fireEvent.press(await screen.findByLabelText("Export to Excel"));
    expect(save.mock.calls[1][1]).toBe("Report 10_27.xlsx");
  });

  test("an export that fails says why under the toolbar", async () => {
    save.mockRejectedValueOnce(
      new PivotExportError("native-missing", "expo-sharing is not installed"),
    );
    await show({ toolbar: true });
    await fireEvent.press(await screen.findByLabelText("Export to Excel"));
    expect(
      (await screen.findByTestId("pivot-export-error")).props.children,
    ).toBe("expo-sharing is not installed");
    await fireEvent.press(screen.getByLabelText("Export to Excel"));
    expect(screen.queryByTestId("pivot-export-error")).toBeNull();
  });
});
