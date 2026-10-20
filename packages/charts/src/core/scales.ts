import { scaleBand, scaleLinear } from "../vendor/d3";

export type ValueScale = {
  /** Value to pixel. */
  at: (value: number) => number;
  /** The rounded domain the ticks and the drawing use. */
  domain: [number, number];
  ticks: number[];
};

type ValueScaleOptions = {
  values: readonly (number | null | undefined)[];
  /** Pixel range, `[from, to]` (a vertical axis passes `[bottom, top]`). */
  range: [number, number];
  tickCount?: number;
  /** Keep 0 inside the domain: bars and areas need it, a line may not. Default true. */
  zero?: boolean;
};

const finite = (v: number | null | undefined): v is number =>
  typeof v === "number" && Number.isFinite(v);

/**
 * A linear scale over the data, rounded to nice ticks. No values, one value or
 * all equal values still give a usable domain (never a zero-width one).
 */
export const valueScale = ({
  values,
  range,
  tickCount = 5,
  zero = true,
}: ValueScaleOptions): ValueScale => {
  const nums = values.filter(finite);
  let min = nums.length ? Math.min(...nums) : 0;
  let max = nums.length ? Math.max(...nums) : 1;
  if (zero) {
    min = Math.min(0, min);
    max = Math.max(0, max);
  }
  if (min === max) {
    if (zero) max = min + 1;
    else {
      min -= 1;
      max += 1;
    }
  }
  const scale = scaleLinear().domain([min, max]).range(range).nice(tickCount);
  const [d0, d1] = scale.domain();
  return {
    at: (value) => scale(value),
    domain: [d0, d1],
    ticks: scale.ticks(tickCount),
  };
};

export type BandScale = {
  /** Left edge of the band of the category at `index`. */
  start: (index: number) => number;
  width: number;
  step: number;
};

/**
 * Equal bands for `count` categories, by position and not by label, so two
 * equal labels still get two bands. `padding` is the gap between bands as a
 * fraction of a step.
 */
export const bandScale = (
  count: number,
  range: [number, number],
  padding = 0.2,
): BandScale => {
  const scale = scaleBand<number>()
    .domain(Array.from({ length: count }, (_, i) => i))
    .range(range)
    .paddingInner(padding)
    .paddingOuter(padding / 2);
  return {
    start: (index) => scale(index) ?? range[0],
    width: scale.bandwidth(),
    step: scale.step(),
  };
};

/**
 * Evenly spaced positions for `count` points between the ends of `range`; a
 * single point sits in the middle. Line and area charts use it: the x axis is
 * the order of the points, as in the CRM's own line charts.
 */
export const pointPositions = (
  count: number,
  range: [number, number],
): number[] => {
  if (count <= 0) return [];
  if (count === 1) return [(range[0] + range[1]) / 2];
  const step = (range[1] - range[0]) / (count - 1);
  return Array.from({ length: count }, (_, i) => range[0] + i * step);
};
