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
  /** Rounded slice corners, in pixels. */
  cornerRadius?: number;
  /**
   * The whole the slices are shares of. When it is more than their sum, the
   * rest is left empty (a gauge: 30 of 100). Default: their sum.
   */
  total?: number;
};

const REST = "\u0000rest";

/**
 * Slices of a donut or a pie, in the order given, clockwise from the top.
 * Zero, negative and non-finite values get no slice; no positive value gives [].
 */
export const donutSlices = (
  items: { id: string; value: number }[],
  {
    innerRadius,
    outerRadius,
    padAngle = 0,
    cornerRadius = 0,
    total,
  }: DonutOptions,
): DonutSlice[] => {
  const positive = items.filter((i) => Number.isFinite(i.value) && i.value > 0);
  const sum = positive.reduce((s, i) => s + i.value, 0);
  if (sum <= 0) return [];
  const whole = Math.max(total ?? sum, sum);
  const rest = whole - sum;
  const input = rest > 0 ? [...positive, { id: REST, value: rest }] : positive;
  const slices = pie<{ id: string; value: number }>()
    .sort(null)
    .padAngle(input.length > 1 ? padAngle : 0)
    .value((i) => i.value)(input);
  const shape = arc().cornerRadius(cornerRadius);
  return slices
    .filter((s) => s.data.id !== REST)
    .map((s) => {
      const geometry = { innerRadius, outerRadius, ...s };
      return {
        id: s.data.id,
        value: s.value,
        fraction: s.value / whole,
        startAngle: s.startAngle,
        endAngle: s.endAngle,
        path: shape(geometry) ?? "",
        centroid: shape.centroid(geometry),
      };
    });
};

/** The path of one arc, for a slice drawn larger than the others (the active one). */
export const arcPath = (
  slice: Pick<DonutSlice, "startAngle" | "endAngle">,
  innerRadius: number,
  outerRadius: number,
  cornerRadius = 0,
) =>
  arc().cornerRadius(cornerRadius)({
    innerRadius,
    outerRadius,
    startAngle: slice.startAngle,
    endAngle: slice.endAngle,
  }) ?? "";

/**
 * The slice under a point, given relative to the centre of the donut (x right,
 * y down), or null when the point is in the hole or outside the ring.
 */
export const sliceAt = (
  slices: Pick<DonutSlice, "startAngle" | "endAngle">[],
  dx: number,
  dy: number,
  innerRadius: number,
  outerRadius: number,
): number | null => {
  const r = Math.hypot(dx, dy);
  if (r < innerRadius || r > outerRadius) return null;
  // d3's angles run clockwise from 12 o'clock.
  let angle = Math.atan2(dx, -dy);
  if (angle < 0) angle += 2 * Math.PI;
  const index = slices.findIndex(
    (s) => angle >= s.startAngle && angle < s.endAngle,
  );
  return index === -1 ? null : index;
};
