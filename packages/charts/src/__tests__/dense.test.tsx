import React from "react";
import { StyleSheet } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ThemeProvider } from "@its/glowup-ui";
import { BarChart, LineChart } from "..";
import type { BarChartProps, LineChartProps } from "..";

const data = [
  { label: "Jan", a: 10, b: 20 },
  { label: "Feb", a: 30, b: 0 },
  { label: "Mar", a: 5, b: null },
];
const series = [
  { key: "a", label: "North" },
  { key: "b", label: "South" },
];

const many = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    label: `c${i}`,
    a: (i % 7) + 1,
    b: (i % 5) + 1,
  }));

const bars = async (props: Partial<BarChartProps> = {}) => {
  await render(
    <ThemeProvider>
      <BarChart
        data={data}
        series={series}
        testID="c"
        locale="en-US"
        {...props}
      />
    </ThemeProvider>,
  );
  await fireEvent(screen.getByTestId("c"), "layout", {
    nativeEvent: { layout: { width: 300, height: 240, x: 0, y: 0 } },
  });
};

const lines = async (props: Partial<LineChartProps> = {}) => {
  await render(
    <ThemeProvider>
      <LineChart
        data={data}
        series={series}
        testID="c"
        locale="en-US"
        {...props}
      />
    </ThemeProvider>,
  );
  await fireEvent(screen.getByTestId("c"), "layout", {
    nativeEvent: { layout: { width: 300, height: 240, x: 0, y: 0 } },
  });
};

/** Size of the touch layer, which is the plot. */
const plotSize = () => {
  const style = StyleSheet.flatten(screen.getByTestId("c-hit").props.style);
  return { width: Number(style.width), height: Number(style.height) };
};

describe("BarChart, dense", () => {
  it("is a path per series and one touch layer, not a node per bar", async () => {
    await bars({ dense: true });
    expect(screen.queryAllByTestId(/^c-bar-/)).toHaveLength(0);
    expect(screen.queryAllByTestId(/^c-category-/)).toHaveLength(0);
    // North has 3 bars; South 1 (a zero and a missing value draw nothing)
    expect(screen.getByTestId("c-dense-a").props.d.match(/M/g)).toHaveLength(3);
    expect(screen.getByTestId("c-dense-b").props.d.match(/M/g)).toHaveLength(1);
    expect(screen.getByTestId("c-hit")).toBeTruthy();
  });

  it("goes dense by itself from 400 bars, and not before", async () => {
    await bars({ data: many(100), series });
    expect(screen.queryAllByTestId(/^c-bar-/).length).toBeGreaterThan(0);
    expect(screen.queryByTestId("c-dense-a")).toBeNull();
  });

  it("goes dense by itself from 400 bars", async () => {
    await bars({ data: many(250), series });
    expect(screen.queryAllByTestId(/^c-bar-/)).toHaveLength(0);
    expect(screen.getByTestId("c-dense-a")).toBeTruthy();
  });

  it("can be switched off for a long chart", async () => {
    await bars({ data: many(250), series, dense: false });
    expect(screen.queryAllByTestId(/^c-bar-/)).toHaveLength(500);
  });

  it("finds the category under a tap, shows its tooltip and clears it on a second tap", async () => {
    const onSelect = jest.fn();
    await bars({ dense: true, onSelect });
    const { width } = plotSize();
    const at = (i: number) => ({
      nativeEvent: { locationX: ((i + 0.5) * width) / 3, locationY: 50 },
    });
    await fireEvent.press(screen.getByTestId("c-hit"), at(1));
    expect(onSelect).toHaveBeenLastCalledWith(1);
    expect(screen.getByText("Feb")).toBeTruthy();
    expect(screen.getByText("North: 30")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("c-hit"), at(2));
    expect(onSelect).toHaveBeenLastCalledWith(2);
    expect(screen.getByText("South: –")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("c-hit"), at(2));
    expect(onSelect).toHaveBeenLastCalledWith(null);
  });

  it("ignores a tap outside the bars and follows a pointer", async () => {
    const onSelect = jest.fn();
    await bars({ dense: true, onSelect });
    const { width } = plotSize();
    await fireEvent.press(screen.getByTestId("c-hit"), {
      nativeEvent: { locationX: width + 5, locationY: 10 },
    });
    expect(onSelect).not.toHaveBeenCalled();
    await fireEvent(screen.getByTestId("c-hit"), "pointerMove", {
      nativeEvent: { offsetX: width / 6, offsetY: 10 },
    });
    expect(screen.getByText("Jan")).toBeTruthy();
    await fireEvent(screen.getByTestId("c-hit"), "pointerLeave", {
      nativeEvent: {},
    });
    expect(screen.queryByText("North: 10")).toBeNull();
  });

  it("finds the row of a horizontal chart by the height of the tap", async () => {
    await bars({ dense: true, horizontal: true });
    const { height } = plotSize();
    await fireEvent.press(screen.getByTestId("c-hit"), {
      nativeEvent: { locationX: 10, locationY: (2.5 * height) / 3 },
    });
    expect(screen.getByText("Mar")).toBeTruthy();
  });
});

describe("LineChart, dense", () => {
  it("swaps its Pressable per category for one touch layer from 200 categories", async () => {
    await lines({ data: many(250) });
    expect(screen.queryAllByTestId(/^c-category-/)).toHaveLength(0);
    expect(screen.getByTestId("c-hit")).toBeTruthy();
    expect(screen.getByTestId("c-line-a")).toBeTruthy();
  });

  it("keeps a Pressable per category before that", async () => {
    await lines();
    expect(screen.queryByTestId("c-hit")).toBeNull();
    expect(screen.getAllByTestId(/^c-category-/)).toHaveLength(3);
  });

  it("finds the nearest point under a tap", async () => {
    const onSelect = jest.fn();
    await lines({ dense: true, onSelect });
    const { width } = plotSize();
    // the points sit 12 px in from the plot's edges and evenly between
    const step = (width - 24) / 2;
    await fireEvent.press(screen.getByTestId("c-hit"), {
      nativeEvent: { locationX: 12 + step + 3, locationY: 20 },
    });
    expect(onSelect).toHaveBeenLastCalledWith(1);
    expect(screen.getByText("Feb")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("c-hit"), {
      nativeEvent: { locationX: width + 40, locationY: 20 },
    });
    // past the end it still means the last point
    expect(onSelect).toHaveBeenLastCalledWith(2);
  });
});
