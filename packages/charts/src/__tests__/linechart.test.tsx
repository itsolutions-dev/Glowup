import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ThemeProvider } from "@its/glowup-ui";
import { AreaChart, LineChart } from "..";
import type { LineChartProps } from "..";

const data = [
  { label: "Mon", a: 10, b: 20 },
  { label: "Tue", a: 30, b: null },
  { label: "Wed", a: 5, b: 15 },
];
const series = [
  { key: "a", label: "North" },
  { key: "b", label: "South" },
];

const show = async (
  props: Partial<LineChartProps> = {},
  Chart: typeof LineChart | typeof AreaChart = LineChart,
) => {
  await render(
    <ThemeProvider>
      <Chart data={data} series={series} testID="c" locale="en-US" {...props} />
    </ThemeProvider>,
  );
  await fireEvent(screen.getByTestId("c"), "layout", {
    nativeEvent: { layout: { width: 300, height: 240, x: 0, y: 0 } },
  });
};

const pathOf = (id: string) => screen.getByTestId(id).props.d as string;
const dots = () => screen.queryAllByTestId(/^c-dot-/);

describe("LineChart", () => {
  it("draws a line and a dot per value, and leaves a gap where a value is missing", async () => {
    await show();
    expect(pathOf("c-line-a")).toMatch(/^M[^M]*$/);
    // South has no value on Tuesday: its line is two lone points, so two subpaths
    expect(pathOf("c-line-b").match(/M/g)).toHaveLength(2);
    // 3 values for North, 2 for South
    expect(dots()).toHaveLength(5);
    expect(screen.queryByTestId("c-dot-1-b")).toBeNull();
  });

  it("fills under the lines only for an area", async () => {
    await show();
    expect(screen.queryByTestId("c-area-a")).toBeNull();
  });

  it("AreaChart closes each line down to the baseline", async () => {
    await show({}, AreaChart);
    const fill = pathOf("c-area-a");
    expect(fill.endsWith("Z")).toBe(true);
    expect(screen.getByTestId("c-line-a")).toBeTruthy();
  });

  it("curves the line when asked", async () => {
    await show({ curve: "monotone" });
    expect(pathOf("c-line-a")).toContain("C");
  });

  it("draws nothing for a series with no value, and does not break", async () => {
    await show({
      data: [
        { label: "x", a: null },
        { label: "y", a: null },
      ],
      series: [{ key: "a" }],
    });
    expect(screen.queryByTestId("c-line-a")).toBeNull();
    expect(dots()).toHaveLength(0);
  });

  it("copes with a single category", async () => {
    await show({ data: [{ label: "only", a: 7 }], series: [{ key: "a" }] });
    expect(dots()).toHaveLength(1);
    await fireEvent.press(screen.getByTestId("c-category-0"));
    expect(screen.getByText("only")).toBeTruthy();
  });

  it("shows a tooltip on tap, reports the selection and clears it on a second tap", async () => {
    const onSelect = jest.fn();
    await show({ onSelect });
    await fireEvent.press(screen.getByTestId("c-category-1"));
    expect(screen.getByText("Tue")).toBeTruthy();
    expect(screen.getByText("North: 30")).toBeTruthy();
    expect(screen.getByText("South: –")).toBeTruthy();
    expect(onSelect).toHaveBeenLastCalledWith(1);
    await fireEvent.press(screen.getByTestId("c-category-1"));
    expect(screen.queryByText("North: 30")).toBeNull();
    expect(onSelect).toHaveBeenLastCalledWith(null);
  });

  it("drops the dots over 24 categories, except where a category is active, unless asked", async () => {
    const many = Array.from({ length: 30 }, (_, i) => ({
      label: `d${i}`,
      a: i,
    }));
    await show({ data: many, series: [{ key: "a" }] });
    expect(dots()).toHaveLength(0);
    await fireEvent.press(screen.getByTestId("c-category-4"));
    expect(dots()).toHaveLength(1);
  });

  it("can draw every dot of a long series", async () => {
    const many = Array.from({ length: 30 }, (_, i) => ({
      label: `d${i}`,
      a: i,
    }));
    await show({ data: many, series: [{ key: "a" }], showDots: true });
    expect(dots()).toHaveLength(30);
  });

  it("gives the whole chart a text for a screen reader", async () => {
    await show({ title: "Rolling" });
    expect(screen.getByTestId("c").props.accessibilityLabel).toBe(
      "Rolling. 2 series, 3 categories. North: Mon 10, Tue 30, Wed 5. South: Mon 20, Tue –, Wed 15.",
    );
  });

  it("shows the loading and empty states", async () => {
    await show({ loading: true });
    expect(screen.queryByTestId("c-line-a")).toBeNull();
    expect(screen.getByTestId("c").props.accessibilityLabel).toBe("Loading");
  });

  it("draws a target line with its value", async () => {
    await show({ target: 25 });
    expect(JSON.stringify(screen.toJSON())).toContain(`"content":"25"`);
  });
});
