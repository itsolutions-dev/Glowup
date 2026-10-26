import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ThemeProvider } from "@its/glowup-ui";
import {
  BarChart,
  Chart,
  ChartLegend,
  DonutChart,
  LineChart,
  StackedBar,
} from "..";

const data = [
  { label: "Jan", a: 10, b: 20 },
  { label: "Feb", a: 40, b: 5 },
];
const series = [
  { key: "a", label: "North" },
  { key: "b", label: "South" },
];
const parts = [
  { id: "x", label: "Answered", value: 30 },
  { id: "y", label: "Missed", value: 10 },
];

const mount = async (ui: React.ReactElement, width = 300, height = 240) => {
  await render(<ThemeProvider>{ui}</ThemeProvider>);
  await fireEvent(screen.getByTestId("c"), "layout", {
    nativeEvent: { layout: { width, height, x: 0, y: 0 } },
  });
};

const fillOf = (id: string) =>
  JSON.stringify(screen.getByTestId(id).props.fill);

describe("ChartLegend", () => {
  it("is a key to the colours when nothing is passed to switch", async () => {
    await render(
      <ThemeProvider>
        <ChartLegend
          testID="l"
          items={[{ key: "a", label: "North", color: "red" }]}
        />
      </ThemeProvider>,
    );
    expect(screen.getByText("North")).toBeTruthy();
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("is a set of checkboxes with a switch, checked while shown", async () => {
    const onToggle = jest.fn();
    await render(
      <ThemeProvider>
        <ChartLegend
          testID="l"
          items={[
            { key: "a", label: "North", color: "red" },
            { key: "b", label: "South", color: "blue" },
          ]}
          hidden={["b"]}
          onToggle={onToggle}
        />
      </ThemeProvider>,
    );
    expect(screen.getByRole("checkbox", { name: "North" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "South" })).not.toBeChecked();
    await fireEvent.press(screen.getByTestId("l-a"));
    expect(onToggle).toHaveBeenCalledWith("a");
  });
});

describe("the legend of a chart over categories", () => {
  it("has no legend unless asked", async () => {
    await mount(<BarChart data={data} series={series} testID="c" />);
    expect(screen.queryByTestId("c-legend")).toBeNull();
  });

  it("switching a series off removes its bars and redraws the axis for the rest", async () => {
    await mount(<BarChart data={data} series={series} legend testID="c" />);
    expect(screen.getByRole("checkbox", { name: "North" })).toBeChecked();
    const before = Number(screen.getByTestId("c-bar-0-b").props.height);
    const colour = fillOf("c-bar-0-b");
    expect(screen.queryByTestId("c-bar-0-a")).toBeTruthy();

    await fireEvent.press(screen.getByTestId("c-legend-a"));
    expect(screen.queryByTestId("c-bar-0-a")).toBeNull();
    expect(screen.getByRole("checkbox", { name: "North" })).not.toBeChecked();
    // South alone tops out at 20, not 40: its first bar is now taller, and keeps its colour
    expect(
      Number(screen.getByTestId("c-bar-0-b").props.height),
    ).toBeGreaterThan(before);
    expect(fillOf("c-bar-0-b")).toBe(colour);
    expect(screen.getByTestId("c").props.accessibilityLabel).not.toContain(
      "North",
    );

    await fireEvent.press(screen.getByTestId("c-legend-a"));
    expect(screen.queryByTestId("c-bar-0-a")).toBeTruthy();
    expect(Number(screen.getByTestId("c-bar-0-b").props.height)).toBe(before);
  });

  it("with every series off the chart says there is no data and the legend stays", async () => {
    await mount(
      <BarChart
        data={data}
        series={series}
        legend
        testID="c"
        emptyLabel="Nothing"
      />,
    );
    await fireEvent.press(screen.getByTestId("c-legend-a"));
    await fireEvent.press(screen.getByTestId("c-legend-b"));
    expect(screen.getByText("Nothing")).toBeTruthy();
    expect(screen.getByTestId("c-legend-a")).toBeTruthy();
  });

  it("works for lines too", async () => {
    await mount(<LineChart data={data} series={series} legend testID="c" />);
    expect(screen.getByTestId("c-line-b")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("c-legend-b"));
    expect(screen.queryByTestId("c-line-b")).toBeNull();
    expect(screen.getByTestId("c-line-a")).toBeTruthy();
  });
});

describe("the legend of a chart of parts", () => {
  it("switching a part off removes its slice and the shares are those of the rest", async () => {
    await mount(<DonutChart data={parts} legend testID="c" />, 300, 200);
    expect(screen.getAllByTestId(/^c-slice-/)).toHaveLength(2);
    await fireEvent.press(screen.getByTestId("c-legend-x"));
    expect(screen.queryByTestId("c-slice-x")).toBeNull();
    expect(screen.getByTestId("c-slice-y")).toBeTruthy();
    expect(screen.getByTestId("c").props.accessibilityLabel).toBe(
      "1 part, total 10. Missed 10 (100%).",
    );
  });

  it("a centre text given as a function follows the parts still shown", async () => {
    await mount(
      <DonutChart
        data={parts}
        legend
        testID="c"
        centerValue={(sum) => `${sum} calls`}
      />,
      300,
      200,
    );
    expect(JSON.stringify(screen.toJSON())).toContain(`"content":"40 calls"`);
    await fireEvent.press(screen.getByTestId("c-legend-x"));
    expect(JSON.stringify(screen.toJSON())).toContain(`"content":"10 calls"`);
  });

  it("works for the stacked bar, and keeps the colours of the parts still shown", async () => {
    await mount(<StackedBar data={parts} legend testID="c" />, 300, 32);
    const colour = fillOf("c-segment-y");
    await fireEvent.press(screen.getByTestId("c-legend-x"));
    expect(screen.queryByTestId("c-segment-x")).toBeNull();
    expect(Number(screen.getByTestId("c-segment-y").props.width)).toBeCloseTo(
      300,
    );
    expect(fillOf("c-segment-y")).toBe(colour);
  });
});

describe("Chart", () => {
  it("is the component its type names", async () => {
    await mount(<Chart type="bar" data={data} series={series} testID="c" />);
    expect(screen.queryAllByTestId(/^c-bar-/).length).toBeGreaterThan(0);
  });

  it("draws a line, an area, a donut, a pie and a stacked bar by type", async () => {
    await mount(<Chart type="line" data={data} series={series} testID="c" />);
    expect(screen.getByTestId("c-line-a")).toBeTruthy();
  });

  it("area", async () => {
    await mount(<Chart type="area" data={data} series={series} testID="c" />);
    expect(screen.getByTestId("c-area-a")).toBeTruthy();
  });

  it("donut", async () => {
    await mount(<Chart type="donut" data={parts} testID="c" />, 300, 200);
    expect(screen.getAllByTestId(/^c-slice-/)).toHaveLength(2);
  });

  it("pie", async () => {
    await mount(<Chart type="pie" data={parts} testID="c" />, 300, 200);
    expect(screen.getAllByTestId(/^c-slice-/)).toHaveLength(2);
  });

  it("stacked", async () => {
    await mount(<Chart type="stacked" data={parts} testID="c" />, 300, 32);
    expect(screen.getAllByTestId(/^c-segment-/)).toHaveLength(2);
  });
});
