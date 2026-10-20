import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ThemeProvider } from "@its/glowup-ui";
import { BarChart } from "..";
import type { BarChartProps } from "..";

const data = [
  { label: "Jan", a: 10, b: 20 },
  { label: "Feb", a: 30, b: 0 },
  { label: "Mar", a: 5, b: null },
];
const series = [
  { key: "a", label: "North" },
  { key: "b", label: "South" },
];

const show = async (props: Partial<BarChartProps> = {}, width = 300) => {
  const tree = (
    <ThemeProvider>
      <BarChart
        data={data}
        series={series}
        testID="c"
        locale="en-US"
        {...props}
      />
    </ThemeProvider>
  );
  const view = await render(tree);
  if (width !== null) {
    await fireEvent(screen.getByTestId("c"), "layout", {
      nativeEvent: { layout: { width, height: 240, x: 0, y: 0 } },
    });
  }
  return view;
};

const bars = () => screen.queryAllByTestId(/^c-bar-/);

describe("BarChart", () => {
  it("draws nothing before it has a width, then the bars", async () => {
    await show({}, null as unknown as number);
    expect(bars()).toHaveLength(0);
    await fireEvent(screen.getByTestId("c"), "layout", {
      nativeEvent: { layout: { width: 0, height: 240, x: 0, y: 0 } },
    });
    expect(bars()).toHaveLength(0);
    await fireEvent(screen.getByTestId("c"), "layout", {
      nativeEvent: { layout: { width: 300, height: 240, x: 0, y: 0 } },
    });
    // 3 categories x 2 series, minus a 0 and a missing value
    expect(bars()).toHaveLength(4);
  });

  it("gives the whole chart a text for a screen reader", async () => {
    await show({ title: "Sales" });
    expect(screen.getByTestId("c").props.accessibilityLabel).toBe(
      "Sales. 2 series, 3 categories. North: Jan 10, Feb 30, Mar 5. South: Jan 20, Feb 0, Mar –.",
    );
  });

  it("piles the series up when stacked", async () => {
    await show({ stacked: true });
    const a = screen.getByTestId("c-bar-0-a").props;
    const b = screen.getByTestId("c-bar-0-b").props;
    // b sits on top of a: its top edge is higher (smaller y)
    expect(Number(b.y)).toBeLessThan(Number(a.y));
    expect(Number(a.width)).toBe(Number(b.width));
  });

  it("shows the loading and empty states instead of the bars", async () => {
    await show({ loading: true });
    expect(bars()).toHaveLength(0);
    expect(screen.getByTestId("c").props.accessibilityLabel).toBe("Loading");
  });

  it("says there is no data", async () => {
    await show({ data: [], emptyLabel: "Nothing here" });
    expect(screen.getByText("Nothing here")).toBeTruthy();
    expect(bars()).toHaveLength(0);
  });

  it("shows a tooltip on tap, reports the selection and clears it on a second tap", async () => {
    const onSelect = jest.fn();
    await show({ onSelect });
    expect(screen.queryByText("North: 10")).toBeNull();
    await fireEvent.press(screen.getByTestId("c-category-0"));
    expect(screen.getByText("Jan")).toBeTruthy();
    expect(screen.getByText("North: 10")).toBeTruthy();
    expect(screen.getByText("South: 20")).toBeTruthy();
    expect(onSelect).toHaveBeenLastCalledWith(0);
    await fireEvent.press(screen.getByTestId("c-category-0"));
    expect(screen.queryByText("North: 10")).toBeNull();
    expect(onSelect).toHaveBeenLastCalledWith(null);
  });

  it("shows a missing value as a dash in the tooltip", async () => {
    await show();
    await fireEvent.press(screen.getByTestId("c-category-2"));
    expect(screen.getByText("South: –")).toBeTruthy();
  });

  it("formats numbers with the locale and draws the target value", async () => {
    await show({
      data: [{ label: "x", a: 12345.6 }],
      series: [{ key: "a" }],
      locale: "de-DE",
      target: 20000,
    });
    // SVG text is not found by getByText: it sits in the `content` of the native node
    expect(JSON.stringify(screen.toJSON())).toContain(`"content":"20.000"`);
  });

  it("copes with one category, equal values and all zeros", async () => {
    await show({ data: [{ label: "x", a: 5 }], series: [{ key: "a" }] });
    expect(bars()).toHaveLength(1);
  });

  it("draws no bar for all zeros, and does not break", async () => {
    await show({ data: [{ label: "x", a: 0 }], series: [{ key: "a" }] });
    expect(bars()).toHaveLength(0);
  });
});
