import {
  arc,
  area,
  curveLinear,
  curveMonotoneX,
  curveNatural,
  curveStep,
  line,
  pie,
  stack,
  stackOffsetDiverging,
  stackOrderNone,
} from "../vendor/d3";
import type { ChartDatum, CurveName, Point } from "./types";

const curves = {
  linear: curveLinear,
  monotone: curveMonotoneX,
  natural: curveNatural,
  step: curveStep,
};

const defined = (p: Point) => p.y != null && Number.isFinite(p.y);

/** SVG path of a line through `points`; a point without a value leaves a gap. "" when nothing can be drawn. */
export const linePath = (points: Point[], curve: CurveName = "linear") =>
  line<Point>()
    .defined(defined)
    .x((p) => p.x)
    .y((p) => p.y as number)
    .curve(curves[curve])(points) ?? "";

/** SVG path of the area between `points` and the horizontal line at `baseline`. */
export const areaPath = (
  points: Point[],
  baseline: number,
  curve: CurveName = "linear",
) =>
  area<Point>()
    .defined(defined)
    .x((p) => p.x)
    .y0(baseline)
    .y1((p) => p.y as number)
    .curve(curves[curve])(points) ?? "";

export type StackedValue = { start: number; end: number };

/**
 * Stacks the `keys` of each datum. `result[k][i]` is the span of key `k` in
 * category `i`: positives pile up from 0, negatives down from 0, a missing
 * value counts as 0.
 */
export const stackValues = (
  data: ChartDatum[],
  keys: string[],
): StackedValue[][] =>
  stack<ChartDatum>()
    .keys(keys)
    .value((d, key) => {
      const v = d[key];
      return typeof v === "number" && Number.isFinite(v) ? v : 0;
    })
    .order(stackOrderNone)
    .offset(stackOffsetDiverging)(data)
    .map((series) => series.map(([start, end]) => ({ start, end })));

export type DonutSlice = {
  id: string;
  value: number;
  /** Share of the total, 0..1. */
  fraction: number;
  startAngle: number;
  endAngle: number;
  path: string;
  /** Middle of the slice, for a label; relative to the centre of the donut. */
  centroid: [number, number];
};

type DonutOptions = {
  innerRadius: number;
  outerRadius: number;
  /** Gap between slices, in radians. */
  padAngle?: number;
};

/**
 * Slices of a donut or a pie, in the order given, clockwise from the top.
 * Zero, negative and non-finite values get no slice; no positive value gives [].
 */
export const donutSlices = (
  items: { id: string; value: number }[],
  { innerRadius, outerRadius, padAngle = 0 }: DonutOptions,
): DonutSlice[] => {
  const positive = items.filter((i) => Number.isFinite(i.value) && i.value > 0);
  const total = positive.reduce((sum, i) => sum + i.value, 0);
  if (total <= 0) return [];
  const slices = pie<{ id: string; value: number }>()
    .sort(null)
    .padAngle(positive.length > 1 ? padAngle : 0)
    .value((i) => i.value)(positive);
  const shape = arc();
  return slices.map((s) => {
    const geometry = { innerRadius, outerRadius, ...s };
    return {
      id: s.data.id,
      value: s.value,
      fraction: s.value / total,
      startAngle: s.startAngle,
      endAngle: s.endAngle,
      path: shape(geometry) ?? "",
      centroid: shape.centroid(geometry),
    };
  });
};
