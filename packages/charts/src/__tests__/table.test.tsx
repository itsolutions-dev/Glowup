import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ThemeProvider } from "@its/glowup-ui";
import { BarChart, ChartTable, DonutChart, StackedBar } from "..";

const data = [
  { label: "Jan", a: 10, b: 20 },
  { label: "Feb", a: 30, b: null },
];
const series = [
  { key: "a", label: "North" },
  { key: "b", label: "South" },
];
const parts = [
  { id: "x", label: "Answered", value: 3 },
  { id: "y", label: "Missed", value: 1 },
];

const mount = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

describe("chart table", () => {
  it("is not there unless asked for", async () => {
    await mount(<BarChart data={data} series={series} testID="c" />);
    expect(screen.queryByTestId("c-table")).toBeNull();
  });

  it("lists a category chart's values, one row per category", async () => {
    await mount(
      <BarChart data={data} series={series} table testID="c" locale="en-US" />,
    );
    expect(screen.getByTestId("c-table")).toBeTruthy();
    expect(screen.getByLabelText("Jan, North 10, South 20")).toBeTruthy();
    expect(screen.getByLabelText("Feb, North 30, South –")).toBeTruthy();
    expect(screen.getByText("South")).toBeTruthy();
  });

  it("picks a category from its row, and marks the row that is active", async () => {
    const onSelect = jest.fn();
    await mount(
      <BarChart
        data={data}
        series={series}
        table
        onSelect={onSelect}
        testID="c"
        locale="en-US"
      />,
    );
    await fireEvent.press(screen.getByTestId("c-table-row-1"));
    expect(onSelect).toHaveBeenLastCalledWith(1);
    expect(
      screen.getByLabelText("Feb, North 30, South –").props.accessibilityState,
    ).toEqual({ selected: true });
    await fireEvent.press(screen.getByTestId("c-table-row-1"));
    expect(onSelect).toHaveBeenLastCalledWith(null);
  });

  it("follows the series the legend switches off", async () => {
    await mount(
      <BarChart
        data={data}
        series={series}
        table
        legend
        testID="c"
        locale="en-US"
      />,
    );
    await fireEvent.press(screen.getByTestId("c-legend-b"));
    expect(screen.getByLabelText("Jan, North 10")).toBeTruthy();
    expect(screen.queryByText("South")).toBeTruthy(); // the legend's own item
  });

  it("shows each part with its value and share, and picks a part from its row", async () => {
    const onSelect = jest.fn();
    await mount(
      <DonutChart
        data={parts}
        table
        onSelect={onSelect}
        testID="c"
        locale="en-US"
      />,
    );
    expect(screen.getByLabelText("Answered, Value 3, Share 75%")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("c-table-row-1"));
    expect(onSelect).toHaveBeenLastCalledWith("y");
  });

  it("is on a stacked bar too, and not while loading or with no data", async () => {
    await mount(<StackedBar data={parts} table testID="c" locale="en-US" />);
    expect(screen.getByLabelText("Missed, Value 1, Share 25%")).toBeTruthy();
    await screen.unmount();
    await mount(<BarChart data={[]} series={series} table testID="c" />);
    expect(screen.queryByTestId("c-table")).toBeNull();
    await screen.unmount();
    await mount(
      <BarChart data={data} series={series} table loading testID="c" />,
    );
    expect(screen.queryByTestId("c-table")).toBeNull();
  });
});

describe("ChartTable", () => {
  it("cuts a long table and says how many rows it left out", async () => {
    const rows = Array.from({ length: 60 }, (_, i) => [`r${i}`, `${i}`]);
    await mount(<ChartTable header={["", "N"]} rows={rows} testID="t" />);
    expect(screen.getAllByTestId(/^t-row-/)).toHaveLength(50);
    expect(screen.getByText("10 more rows not shown")).toBeTruthy();
  });
});
