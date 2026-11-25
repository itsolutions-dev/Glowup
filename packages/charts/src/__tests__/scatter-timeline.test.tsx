import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { ThemeProvider } from "@its/glowup-ui";
import { ScatterChart, TimelineChart } from "..";
import type { ScatterChartProps, TimelineChartProps } from "..";
import { formatMoment, timeScale } from "../core/time";

const measure = async (id: string, height = 240) =>
  fireEvent(screen.getByTestId(id), "layout", {
    nativeEvent: { layout: { width: 400, height, x: 0, y: 0 } },
  });

const points = [
  { x: 1, y: 10, series: "a" },
  { x: 2, y: 30, series: "a", label: "Peak" },
  { x: 3, y: 20, series: "b" },
];
const series = [
  { key: "a", label: "North" },
  { key: "b", label: "South" },
];

const scatter = async (props: Partial<ScatterChartProps> = {}) => {
  await render(
    <ThemeProvider>
      <ScatterChart data={points} series={series} testID="s" {...props} />
    </ThemeProvider>,
  );
  await measure("s");
};

const cx = (id: string) => Number(screen.getByTestId(id).props.cx);
const cy = (id: string) => Number(screen.getByTestId(id).props.cy);

describe("ScatterChart", () => {
  it("places a point per datum, x left to right and y bottom to top", async () => {
    await scatter();
    expect(screen.getAllByTestId(/^s-point-/)).toHaveLength(3);
    expect(cx("s-point-0")).toBeLessThan(cx("s-point-1"));
    expect(cx("s-point-1")).toBeLessThan(cx("s-point-2"));
    // 30 is above 20, which is above 10
    expect(cy("s-point-1")).toBeLessThan(cy("s-point-2"));
    expect(cy("s-point-2")).toBeLessThan(cy("s-point-0"));
  });

  it("shows a point's tooltip on tap and tells who listens", async () => {
    const onSelect = jest.fn();
    await scatter({ onSelect });
    await fireEvent.press(screen.getByTestId("s-hit-1"));
    expect(onSelect).toHaveBeenLastCalledWith(1);
    expect(screen.getByTestId("s-tooltip")).toBeTruthy();
    expect(screen.getByText("Peak")).toBeTruthy();
    await fireEvent.press(screen.getByTestId("s-hit-1"));
    expect(onSelect).toHaveBeenLastCalledWith(null);
    expect(screen.queryByTestId("s-tooltip")).toBeNull();
  });

  it("joins each group's points when asked, and a legend switches a group off", async () => {
    await scatter({ line: "stepAfter", legend: true });
    // held level, then up: M x0,y0 L x1,y0 L x1,y1
    const [, y0, y1] =
      /^M[\d.]+,([\d.]+)L[\d.]+,([\d.]+)L/.exec(
        screen.getByTestId("s-line-a").props.d,
      ) ?? [];
    expect(y0).toBeDefined();
    expect(y1).toBe(y0);
    await fireEvent.press(screen.getByText("South"));
    expect(screen.queryByTestId("s-point-2")).toBeNull();
    expect(screen.getAllByTestId(/^s-point-/)).toHaveLength(2);
  });

  it("reads dates on x as a time line, within a fixed value range", async () => {
    await scatter({
      data: [
        { x: new Date(2026, 0, 1), y: 0 },
        { x: new Date(2026, 0, 11), y: 100 },
      ],
      series: undefined,
      yDomain: [0, 100],
      locale: "it-IT",
    });
    expect(cx("s-point-0")).toBeLessThan(cx("s-point-1"));
    expect(screen.getByTestId("s").props.accessibilityLabel).toContain(
      "01/01/2026",
    );
  });

  it("says so when there is nothing to draw", async () => {
    await scatter({ data: [], emptyLabel: "Nothing" });
    expect(screen.getByText("Nothing")).toBeTruthy();
  });
});

const day = (d: number, h = 0) => new Date(2026, 4, d, h);
const items = [
  { id: "1", lane: "Import", start: day(1), end: day(3) },
  { id: "2", lane: "Simulation", start: day(3), end: day(4), series: "late" },
  { id: "3", lane: "Simulation", start: day(5) },
];

const timeline = async (props: Partial<TimelineChartProps> = {}) => {
  await render(
    <ThemeProvider>
      <TimelineChart
        items={items}
        series={[{ key: "ok" }, { key: "late", label: "Late" }]}
        testID="t"
        {...props}
      />
    </ThemeProvider>,
  );
  await measure("t", 120);
};

const rect = (id: string) => {
  const p = screen.getByTestId(id).props;
  return { x: Number(p.x), y: Number(p.y), w: Number(p.width) };
};

describe("TimelineChart", () => {
  it("draws an interval as a bar on its lane and a moment as a dot", async () => {
    await timeline();
    const first = rect("t-bar-1");
    const second = rect("t-bar-2");
    // two days against one
    expect(first.w).toBeCloseTo(second.w * 2, 0);
    expect(second.x).toBeGreaterThan(first.x);
    // Simulation is the second lane
    expect(second.y).toBeGreaterThan(first.y);
    expect(screen.getByTestId("t-moment-3")).toBeTruthy();
  });

  it("is as tall as its lanes", async () => {
    await timeline({ laneHeight: 40 });
    const style = [screen.getByTestId("t").props.style].flat();
    expect(style.find((s) => s?.height)?.height).toBeGreaterThan(80);
  });

  it("tells an item's span on tap", async () => {
    const onSelect = jest.fn();
    await timeline({ onSelect, locale: "it-IT" });
    await fireEvent.press(screen.getByTestId("t-item-1"));
    expect(onSelect).toHaveBeenLastCalledWith("1");
    expect(screen.getByText("01/05/2026 – 03/05/2026")).toBeTruthy();
  });

  it("switches a series off from its legend and marks a moment", async () => {
    await timeline({ legend: true, marker: day(2) });
    expect(screen.getByTestId("t-marker")).toBeTruthy();
    await fireEvent.press(screen.getByText("Late"));
    expect(screen.queryByTestId("t-bar-2")).toBeNull();
  });
});

describe("time scale", () => {
  it("gives a usable domain for one moment and labels by the span", () => {
    const one = timeScale({ values: [day(1)], range: [0, 100] });
    expect(one.domain[1].getTime() - one.domain[0].getTime()).toBe(86400000);
    const hours = timeScale({
      values: [day(1, 8), day(1, 18)],
      range: [0, 100],
      locale: "it-IT",
    });
    expect(hours.format(day(1, 9))).toBe("09:00");
    expect(formatMoment(day(1), "it-IT")).toBe("01/05/2026");
  });
});
