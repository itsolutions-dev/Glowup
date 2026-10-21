import type { ChartDatum } from "./types";

/** A run of whole categories, `from` included and `to` not. */
export type Run = { from: number; to: number };

export type Aggregate = {
  runs: Run[];
  /** One datum per run: the mean of each key over the run (null when the run has no value). */
  mean: ChartDatum[];
  min: ChartDatum[];
  max: ChartDatum[];
};

const num = (v: ChartDatum[string]) =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

/**
 * Folds more categories than `columns` into `columns` runs of about the same length, so that
 * thousands of points can be drawn as what a screen can show: the mean of each run, and the
 * range its points span. Returns null when there are no more categories than columns.
 */
export const aggregate = (
  data: ChartDatum[],
  keys: string[],
  columns: number,
): Aggregate | null => {
  const n = data.length;
  const count = Math.max(1, Math.floor(columns));
  if (n <= count) return null;
  const runs: Run[] = Array.from({ length: count }, (_, c) => ({
    from: Math.floor((c * n) / count),
    to: Math.floor(((c + 1) * n) / count),
  }));
  const mean: ChartDatum[] = [];
  const min: ChartDatum[] = [];
  const max: ChartDatum[] = [];
  for (const { from, to } of runs) {
    const label = data[from].label;
    const m: ChartDatum = { label };
    const lo: ChartDatum = { label };
    const hi: ChartDatum = { label };
    for (const k of keys) {
      let sum = 0;
      let seen = 0;
      let low = Infinity;
      let high = -Infinity;
      for (let i = from; i < to; i++) {
        const x = num(data[i][k]);
        if (x === null) continue;
        sum += x;
        seen++;
        low = Math.min(low, x);
        high = Math.max(high, x);
      }
      m[k] = seen ? sum / seen : null;
      lo[k] = seen ? low : null;
      hi[k] = seen ? high : null;
    }
    mean.push(m);
    min.push(lo);
    max.push(hi);
  }
  return { runs, mean, min, max };
};
