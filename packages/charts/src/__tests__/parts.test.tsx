import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ThemeProvider } from "@its/glowup-ui";
import { DonutChart, PieChart, Sparkline, StackedBar } from "..";
import type { DonutChartProps, SparklineProps, StackedBarProps } from "..";

const parts = [
  { id: "a", label: "Answered", value: 1 },
  { id: "b", label: "Missed", value: 1 },
  { id: "c", label: "Busy", value: 2 },
];

const layout = (id: string, width: number, height: number) =>
  fireEvent(screen.getByTestId(id), "layout", {
    nativeEvent: { layout: { width, height, x: 0, y: 0 } },
  });

const mount = async (ui: React.ReactElement, width = 300, height = 200) => {
  await render(<ThemeProvider>{ui}</ThemeProvider>);
  await layout("c", width, height);
};

const donut = (props: Partial<DonutChartProps> = {}) =>
  mount(<DonutChart data={parts} testID="c" locale="en-US" {...props} />);

const stacked = (props: Partial<StackedBarProps> = {}) =>
  mount(
    <StackedBar data={parts} testID="c" locale="en-US" {...props} />,
    300,
    32,
  );

const spark = (props: Partial<SparklineProps> = {}) =>
  mount(
    <Sparkline values={[1, 3, 2, 5]} testID="c" locale="en-US" {...props} />,
    120,
    32,
  );

// Points relative to the chart box (300 x 200, so the centre is 150,100 and the ring runs from about 61 to 96)
const IN_A = { locationX: 206.6, locationY: 43.4 };
const IN_C = { locationX: 70, locationY: 100 };
const HOLE = { locationX: 150, locationY: 100 };

describe("DonutChart", () => {
  it("draws one slice per part with a value, and none for zero or negative values", async () => {
    await donut({
      data: [...parts, { id: "z", value: 0 }, { id: "n", value: -3 }],
    });
    expect(screen.queryAllByTestId(/^c-slice-/)).toHaveLength(3);
    expect(screen.queryByTestId("c-slice-z")).toBeNull();
    expect(screen.queryByTestId("c-slice-n")).toBeNull();
  });

  it("says there is no data when no part has a value", async () => {
    await donut({ data: [{ id: "a", value: 0 }], emptyLabel: "Nothing" });
    expect(screen.getByText("Nothing")).toBeTruthy();
    expect(screen.queryAllByTestId(/^c-slice-/)).toHaveLength(0);
  });

  it("is a gauge with a total: the ring is partly filled over a track", async () => {
    await donut({
      data: [{ id: "a", value: 30 }],
      total: 100,
      centerValue: "30%",
      centerLabel: "done",
    });
    expect(screen.getByTestId("c-track")).toBeTruthy();
    expect(screen.getAllByTestId(/^c-slice-/)).toHaveLength(1);
    const json = JSON.stringify(screen.toJSON());
    expect(json).toContain(`"content":"30%"`);
    expect(json).toContain(`"content":"done"`);
  });

  it("keeps the ring and the centre of a gauge at zero", async () => {
    await donut({
      data: [{ id: "a", value: 0 }],
      total: 100,
      centerValue: "0%",
    });
    expect(screen.queryByText("No data")).toBeNull();
    expect(screen.getByTestId("c-track")).toBeTruthy();
    expect(screen.queryAllByTestId(/^c-slice-/)).toHaveLength(0);
    expect(JSON.stringify(screen.toJSON())).toContain(`"content":"0%"`);
  });

  it("makes the tapped slice active, shows its value and label, and clears it on a second tap", async () => {
    const onSelect = jest.fn();
    await donut({ onSelect });
    const hit = screen.getByTestId("c-hit");
    await fireEvent.press(hit, { nativeEvent: IN_A });
    expect(onSelect).toHaveBeenLastCalledWith("a");
    let json = JSON.stringify(screen.toJSON());
    expect(json).toContain(`"content":"Answered"`);
    expect(json).toContain(`"content":"1"`);
    await fireEvent.press(hit, { nativeEvent: IN_C });
    expect(onSelect).toHaveBeenLastCalledWith("c");
    json = JSON.stringify(screen.toJSON());
    expect(json).toContain(`"content":"Busy"`);
    expect(json).toContain(`"content":"2"`);
    await fireEvent.press(hit, { nativeEvent: IN_C });
    expect(onSelect).toHaveBeenLastCalledWith(null);
    expect(JSON.stringify(screen.toJSON())).not.toContain(`"content":"Busy"`);
  });

  it("ignores a tap in the hole", async () => {
    const onSelect = jest.fn();
    await donut({ onSelect });
    await fireEvent.press(screen.getByTestId("c-hit"), { nativeEvent: HOLE });
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("follows a pointer over the slices", async () => {
    await donut();
    const hit = screen.getByTestId("c-hit");
    await fireEvent(hit, "pointerMove", {
      nativeEvent: { offsetX: IN_C.locationX, offsetY: IN_C.locationY },
    });
    expect(JSON.stringify(screen.toJSON())).toContain(`"content":"Busy"`);
    await fireEvent(hit, "pointerLeave", { nativeEvent: {} });
    expect(JSON.stringify(screen.toJSON())).not.toContain(`"content":"Busy"`);
  });

  it("writes each share on its slice when asked", async () => {
    await donut({ showPercent: true });
    const json = JSON.stringify(screen.toJSON());
    expect(json).toContain(`"content":"25%"`);
    expect(json).toContain(`"content":"50%"`);
  });

  it("draws a single part as a full ring", async () => {
    await donut({ data: [{ id: "only", value: 7 }] });
    expect(screen.getAllByTestId(/^c-slice-/)).toHaveLength(1);
  });

  it("gives the whole chart a text for a screen reader", async () => {
    await donut({ title: "Calls" });
    expect(screen.getByTestId("c").props.accessibilityLabel).toBe(
      "Calls. 3 parts, total 4. Answered 1 (25%), Missed 1 (25%), Busy 2 (50%).",
    );
  });

  it("a pie has no centre text: its active slice gets a tooltip with the value and share", async () => {
    await mount(
      <PieChart
        data={parts}
        testID="c"
        locale="en-US"
        centerValue="4"
        centerLabel="calls"
      />,
    );
    expect(JSON.stringify(screen.toJSON())).not.toContain(`"content":"calls"`);
    await fireEvent.press(screen.getByTestId("c-hit"), {
      nativeEvent: { locationX: 230, locationY: 70 },
    });
    expect(screen.getByText("Answered")).toBeTruthy();
    expect(screen.getByText("1 (25%)")).toBeTruthy();
  });

  it("PieChart has no hole: a tap in the middle hits a slice", async () => {
    const onSelect = jest.fn();
    await mount(<PieChart data={parts} testID="c" onSelect={onSelect} />);
    await fireEvent.press(screen.getByTestId("c-hit"), {
      nativeEvent: { locationX: 170, locationY: 90 },
    });
    expect(onSelect).toHaveBeenCalledWith("a");
  });
});

describe("StackedBar", () => {
  it("makes each segment as wide as its share", async () => {
    await stacked({
      data: [
        { id: "a", value: 1 },
        { id: "b", value: 3 },
      ],
    });
    expect(Number(screen.getByTestId("c-segment-a").props.width)).toBeCloseTo(
      75,
    );
    expect(Number(screen.getByTestId("c-segment-b").props.width)).toBeCloseTo(
      225,
    );
    expect(Number(screen.getByTestId("c-segment-b").props.x)).toBeCloseTo(75);
  });

  it("leaves the rest empty when the total is bigger than the parts", async () => {
    await stacked({ data: [{ id: "a", value: 25 }], total: 100 });
    expect(Number(screen.getByTestId("c-segment-a").props.width)).toBeCloseTo(
      75,
    );
  });

  it("draws no segment for zero or negative values, and says so when none is left", async () => {
    await stacked({
      data: [
        { id: "a", value: 0 },
        { id: "b", value: -2 },
      ],
      emptyLabel: "Empty",
    });
    expect(screen.queryAllByTestId(/^c-segment-/)).toHaveLength(0);
    expect(screen.getByText("Empty")).toBeTruthy();
  });

  it("shows a tooltip with the value and share on tap, and clears it on a second tap", async () => {
    const onSelect = jest.fn();
    await stacked({ onSelect });
    await fireEvent.press(screen.getByTestId("c-hit-c"));
    expect(screen.getByText("Busy")).toBeTruthy();
    expect(screen.getByText("2 (50%)")).toBeTruthy();
    expect(onSelect).toHaveBeenLastCalledWith("c");
    await fireEvent.press(screen.getByTestId("c-hit-c"));
    expect(screen.queryByText("2 (50%)")).toBeNull();
    expect(onSelect).toHaveBeenLastCalledWith(null);
  });

  it("shows the loading state", async () => {
    await stacked({ loading: true });
    expect(screen.queryAllByTestId(/^c-segment-/)).toHaveLength(0);
    expect(screen.getByTestId("c").props.accessibilityLabel).toBe("Loading");
  });
});

describe("Sparkline", () => {
  it("draws the line and a dot on the last value", async () => {
    await spark();
    expect(screen.getByTestId("c-line").props.d).toMatch(/^M/);
    expect(screen.getByTestId("c-last")).toBeTruthy();
    expect(screen.queryByTestId("c-area")).toBeNull();
  });

  it("fills under the line when asked, and can leave out the dot", async () => {
    await spark({ area: true, lastDot: false });
    expect(screen.getByTestId("c-area").props.d.endsWith("Z")).toBe(true);
    expect(screen.queryByTestId("c-last")).toBeNull();
  });

  it("leaves a gap for a missing value and puts the dot on the last known one", async () => {
    await spark({ values: [1, null, 3, null] });
    expect(
      (screen.getByTestId("c-line").props.d as string).match(/M/g),
    ).toHaveLength(2);
    expect(screen.getByTestId("c-last")).toBeTruthy();
  });

  it("copes with one value and with equal values", async () => {
    await spark({ values: [4] });
    expect(screen.getByTestId("c-last")).toBeTruthy();
  });

  it("copes with equal values", async () => {
    await spark({ values: [2, 2, 2] });
    expect(screen.getByTestId("c-line").props.d).toMatch(/^M/);
  });

  it("says there is no data when nothing has a value", async () => {
    await spark({ values: [null, undefined] });
    expect(screen.getByText("No data")).toBeTruthy();
    expect(screen.queryByTestId("c-line")).toBeNull();
  });

  it("gives a screen reader the first, lowest, highest and last values", async () => {
    await spark();
    expect(screen.getByTestId("c").props.accessibilityLabel).toBe(
      "Trend of 4 values: first 1, lowest 1, highest 5, last 5.",
    );
  });
});
