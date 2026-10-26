import React from "react";
import { BarChart, type BarChartProps } from "./BarChart";
import { DonutChart, PieChart, type DonutChartProps } from "./DonutChart";
import { AreaChart, LineChart, type LineChartProps } from "./LineChart";
import { StackedBar, type StackedBarProps } from "./StackedBar";

export type ChartProps =
  | ({ type: "bar" } & BarChartProps)
  | ({ type: "line" } & LineChartProps)
  | ({ type: "area" } & Omit<LineChartProps, "area">)
  | ({ type: "donut" } & DonutChartProps)
  | ({ type: "pie" } & Omit<DonutChartProps, "thickness">)
  | ({ type: "stacked" } & StackedBarProps);

/**
 * One entry point for the chart that fits the data: `type` picks the component
 * and the rest of the props are that component's own, so `<Chart type="bar" … />`
 * is a `BarChart`. Use the component directly when the type never changes.
 */
const Chart = (props: ChartProps) => {
  switch (props.type) {
    case "bar":
      return <BarChart {...props} />;
    case "line":
      return <LineChart {...props} />;
    case "area":
      return <AreaChart {...props} />;
    case "donut":
      return <DonutChart {...props} />;
    case "pie":
      return <PieChart {...props} />;
    case "stacked":
      return <StackedBar {...props} />;
  }
};

export default Chart;
export { Chart };
