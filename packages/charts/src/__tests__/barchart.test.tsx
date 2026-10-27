import React from "react";
import { StyleSheet } from "react-native";
import {
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react-native";
import { ThemeProvider } from "@its/glowup-ui";
import { BarChart } from "..";
import type { BarChartProps, BarMarker, ChartDatum } from "..";

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

  it("lays horizontal bars out left to right, one row per category", async () => {
    await show({ horizontal: true });
    const jan = screen.getByTestId("c-bar-0-a").props;
    const feb = screen.getByTestId("c-bar-1-a").props;
    // same x origin, a length proportional to the value (10 vs 30), rows one below the other
    expect(Number(feb.x)).toBe(Number(jan.x));
    expect(Number(feb.width)).toBeCloseTo(3 * Number(jan.width));
    expect(Number(feb.y)).toBeGreaterThan(Number(jan.y));
    // two series share a row: South starts below North in the same category
    expect(Number(screen.getByTestId("c-bar-0-b").props.y)).toBeGreaterThan(
      Number(jan.y),
    );
  });

  it("piles horizontal bars end to end when stacked", async () => {
    await show({ horizontal: true, stacked: true });
    const a = screen.getByTestId("c-bar-0-a").props;
    const b = screen.getByTestId("c-bar-0-b").props;
    expect(Number(b.x)).toBeCloseTo(Number(a.x) + Number(a.width));
    expect(Number(b.y)).toBe(Number(a.y));
  });

  it("cuts long category labels in a horizontal chart and keeps the full title in the tooltip", async () => {
    const long = "A very long category name that cannot fit";
    await show({
      horizontal: true,
      data: [{ label: long, a: 5 }],
      series: [{ key: "a" }],
    });
    const json = JSON.stringify(screen.toJSON());
    expect(json).not.toContain(`"content":"${long}"`);
    expect(json).toContain("…");
    await fireEvent.press(screen.getByTestId("c-category-0"));
    expect(screen.getByText(long)).toBeTruthy();
  });
});

// Two columns per category, the CRM's "calls by branch": what came in, what was done with it.
const crm = [
  { label: "Capriate", rec: 1, uniq: 1, ok: 1, ko: 0 },
  { label: "Corsico", rec: 3, uniq: 2, ok: 0, ko: 2 },
];
const crmSeries = [
  { key: "rec", column: "in" },
  { key: "uniq", column: "in" },
  { key: "ok", column: "out" },
  { key: "ko", column: "out" },
];
const at = (id: string) => {
  const p = screen.getByTestId(id).props;
  return {
    x: Number(p.x),
    y: Number(p.y),
    width: Number(p.width),
    height: Number(p.height),
  };
};

describe("BarChart columns", () => {
  it("puts the series of a column in one bar and the columns side by side", async () => {
    await show({ data: crm, series: crmSeries });
    const rec = at("c-bar-1-rec");
    const ko = at("c-bar-1-ko");
    expect(ko.x).toBeGreaterThan(rec.x + rec.width - 1);
    expect(ko.width).toBeCloseTo(rec.width);
  });

  it("stacks a column by default", async () => {
    await show({ data: crm, series: crmSeries });
    const rec = at("c-bar-1-rec");
    const uniq = at("c-bar-1-uniq");
    expect(uniq.y + uniq.height).toBeCloseTo(rec.y);
    expect(uniq.x).toBe(rec.x);
  });

  it("overlapping series start at zero and the shorter one is drawn in front", async () => {
    // The shorter series comes first: the drawing order must not follow the list.
    const [rec0, uniq0, ...out] = crmSeries;
    await show({
      data: crm,
      series: [uniq0, rec0, ...out],
      columnMode: { in: "overlap" },
    });
    const rec = at("c-bar-1-rec"); // 3
    const uniq = at("c-bar-1-uniq"); // 2
    expect(uniq.x).toBe(rec.x);
    expect(uniq.width).toBe(rec.width);
    expect(rec.y + rec.height).toBeCloseTo(uniq.y + uniq.height);
    expect(uniq.height).toBeCloseTo((2 / 3) * rec.height);
    const order = bars().map((b) => b.props.testID);
    expect(order.indexOf("c-bar-1-uniq")).toBeGreaterThan(
      order.indexOf("c-bar-1-rec"),
    );
  });

  it("a column whose series are all switched off goes and the others widen", async () => {
    await show({ data: crm, series: crmSeries, legend: true });
    const before = at("c-bar-1-rec").width;
    await fireEvent.press(screen.getByTestId("c-legend-ok"));
    expect(screen.getByTestId("c-bar-1-ko")).toBeTruthy();
    expect(at("c-bar-1-rec").width).toBeCloseTo(before);
    await fireEvent.press(screen.getByTestId("c-legend-ko"));
    expect(at("c-bar-1-rec").width).toBeGreaterThan(before);
  });

  it("lays columns out one below the other in a horizontal chart", async () => {
    await show({
      data: crm,
      series: crmSeries,
      horizontal: true,
      columnMode: "overlap",
    });
    const rec = at("c-bar-1-rec");
    const uniq = at("c-bar-1-uniq");
    const ko = at("c-bar-1-ko");
    expect(uniq.y).toBe(rec.y);
    expect(ko.y).toBeGreaterThan(rec.y);
    expect(ko.x).toBe(rec.x);
  });
});

describe("BarChart, per category", () => {
  const febless = (d: { label: string }) => (d.label === "Feb" ? null : 25);

  it("draws a short target line per category, inside its band, and none where it is null", async () => {
    await show({ target: febless });
    expect(screen.queryByTestId("c-target-1")).toBeNull();
    const line = screen.getByTestId("c-target-0").props;
    const a = at("c-bar-0-a");
    const b = at("c-bar-0-b");
    expect(Number(line.x1)).toBeLessThanOrEqual(a.x);
    expect(Number(line.x2)).toBeGreaterThanOrEqual(b.x + b.width);
    expect(Number(line.x2)).toBeLessThan(at("c-bar-2-a").x);
    expect(Number(line.y1)).toBe(Number(line.y2));
  });

  it("the value axis reaches a category target above every bar", async () => {
    await show({
      data: [{ label: "x", a: 5 }],
      series: [{ key: "a" }],
      target: () => 50,
    });
    expect(JSON.stringify(screen.toJSON())).toContain(`"content":"50"`);
  });

  it("shows the category target in the tooltip, the table and the screen reader text", async () => {
    await show({ target: febless, table: true, title: "Sales" });
    await fireEvent.press(screen.getByTestId("c-category-0"));
    expect(screen.getByText("Target: 25")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("c-category-1"));
    expect(screen.queryByText(/^Target:/)).toBeNull();
    expect(screen.getByTestId("c").props.accessibilityLabel).toContain(
      "Target: Jan 25, Mar 25.",
    );
    expect(
      screen.getByLabelText("Feb, North 30, South 0, Target –"),
    ).toBeTruthy();
  });
});

describe("BarChart, outcome marker", () => {
  const met = (): BarMarker => ({
    icon: "check",
    color: "green",
    label: "Met",
  });
  const box = (id: string) =>
    StyleSheet.flatten(screen.getByTestId(id).props.style) as {
      left: number;
      top: number;
      width: number;
      height: number;
    };

  it("asks the app for a marker per category with the column totals and the target", async () => {
    const marker = jest.fn(
      (
        _d: ChartDatum,
        info: { totals: Record<string, number>; target: number | null },
      ) =>
        info.target == null
          ? null
          : info.totals.out >= info.target
            ? met()
            : ({ icon: "close", color: "red", label: "Missed" } as BarMarker),
    );
    await show({
      data: crm,
      series: crmSeries,
      columnMode: { in: "overlap" },
      target: (d) => d.uniq as number,
      marker,
    });
    expect(marker).toHaveBeenCalledWith(crm[1], {
      index: 1,
      totals: { in: 3, out: 2 },
      target: 2,
    });
    expect(screen.getByTestId("c-marker-0")).toBeTruthy();
    expect(screen.getByTestId("c-marker-1")).toBeTruthy();
  });

  it("puts the marker past the longest column of its category, centred on it", async () => {
    await show({ data: crm, series: crmSeries, marker: met });
    const m = box("c-marker-1");
    const uniq = at("c-bar-1-uniq"); // stacked on rec: rec+uniq = 5, the longest
    const ko = at("c-bar-1-ko");
    expect(m.top + m.height).toBeLessThanOrEqual(uniq.y - 3);
    expect(m.top).toBeGreaterThanOrEqual(0);
    expect(m.left + m.width / 2).toBeCloseTo((uniq.x + ko.x + ko.width) / 2, 0);
  });

  it("puts the marker to the right in a horizontal chart", async () => {
    await show({ data: crm, series: crmSeries, horizontal: true, marker: met });
    const m = box("c-marker-1");
    const uniq = at("c-bar-1-uniq");
    expect(m.left).toBeGreaterThanOrEqual(uniq.x + uniq.width + 3);
    expect(m.left + m.width).toBeLessThanOrEqual(300);
  });

  it("reads the marker in the tooltip, the table and the screen reader text, and none for null", async () => {
    await show({
      data: crm,
      series: crmSeries,
      table: true,
      marker: (d) =>
        d.label === "Corsico"
          ? { icon: "close", color: "red", label: "Missed" }
          : null,
    });
    expect(screen.queryByTestId("c-marker-0")).toBeNull();
    expect(screen.getByTestId("c").props.accessibilityLabel).toContain(
      "Status: Corsico Missed.",
    );
    expect(screen.getByLabelText(/^Corsico, .*Status Missed$/)).toBeTruthy();
    await fireEvent.press(screen.getByTestId("c-category-1"));
    expect(
      within(screen.getByTestId("c-tooltip")).getByText("Missed"),
    ).toBeTruthy();
  });

  it("keeps the totals of every series when the legend hides one: hiding is not a verdict", async () => {
    const marker = jest.fn(met);
    await show({ data: crm, series: crmSeries, legend: true, marker });
    await fireEvent.press(screen.getByTestId("c-legend-ko"));
    expect(marker).toHaveBeenLastCalledWith(crm[1], {
      index: 1,
      totals: { in: 5, out: 2 },
      target: null,
    });
  });

  it("calls marker once per category per render", async () => {
    const marker = jest.fn(met);
    await show(
      { data: crm, series: crmSeries, marker },
      null as unknown as number,
    );
    expect(marker).toHaveBeenCalledTimes(crm.length);
  });

  it("shrinks the marker to the width of a narrow category", async () => {
    const data = Array.from({ length: 40 }, (_, i) => ({
      label: `c${i}`,
      a: (i % 5) + 1,
    }));
    await show({ data, series: [{ key: "a" }], marker: met });
    const m = box("c-marker-0");
    const next = box("c-marker-1");
    expect(m.width).toBeLessThan(20);
    expect(m.left + m.width).toBeLessThanOrEqual(next.left + 0.01);
  });

  it("ignores marker and category targets when dense", async () => {
    await show({ dense: true, marker: met, target: () => 5 });
    expect(screen.queryByTestId("c-marker-0")).toBeNull();
    expect(screen.queryByTestId("c-target-0")).toBeNull();
    expect(screen.getByTestId("c-dense-a")).toBeTruthy();
  });

  it("leaves dense bars in their series colour even when a category is dimmed", async () => {
    await show({ dense: true });
    const fill = screen.getByTestId("c-dense-a").props.fill;
    await screen.unmount();
    await show({ dense: true, dimmed: () => true });
    expect(screen.getByTestId("c-dense-a").props.fill).toEqual(fill);
  });
});

describe("BarChart, dimmed categories", () => {
  it("draws a dimmed category in another colour, faded, and keeps its values", async () => {
    await show({ dimmed: (_, i) => i === 1 });
    const feb = screen.getByTestId("c-bar-1-a").props;
    const jan = screen.getByTestId("c-bar-0-a").props;
    expect(feb.fill).not.toEqual(jan.fill);
    expect(Number(feb.opacity)).toBeLessThan(1);
    expect(Number(jan.opacity)).toBe(1);
    await fireEvent.press(screen.getByTestId("c-category-1"));
    expect(screen.getByText("North: 30")).toBeTruthy();
  });
});
