export type SummarySeries = {
  name: string;
  values: (number | null | undefined)[];
};

type Describe = {
  title?: string;
  labels: string[];
  series: SummarySeries[];
  format: (value: number | null | undefined) => string;
  /** Up to this many categories are read out one by one; beyond it only the extremes and the last. Default 12. */
  maxListed?: number;
};

const isNum = (v: number | null | undefined): v is number =>
  typeof v === "number" && Number.isFinite(v);

/**
 * A text for a screen reader: what the chart shows, per series. Few points are
 * read one by one; many are summed up by lowest, highest and last.
 */
export const describeChart = ({
  title,
  labels,
  series,
  format,
  maxListed = 12,
}: Describe): string => {
  if (!labels.length || !series.length)
    return title ? `${title}. No data.` : "No data.";
  const head = `${title ? `${title}. ` : ""}${series.length} series, ${labels.length} ${
    labels.length === 1 ? "category" : "categories"
  }.`;
  const parts = series.map((s) => {
    if (labels.length <= maxListed) {
      return `${s.name}: ${labels.map((l, i) => `${l} ${format(s.values[i])}`).join(", ")}.`;
    }
    const known = s.values
      .map((v, i) => ({ v, i }))
      .filter((p): p is { v: number; i: number } => isNum(p.v));
    if (!known.length) return `${s.name}: no values.`;
    const lo = known.reduce((a, b) => (b.v < a.v ? b : a));
    const hi = known.reduce((a, b) => (b.v > a.v ? b : a));
    const last = known[known.length - 1];
    return `${s.name}: lowest ${format(lo.v)} at ${labels[lo.i]}, highest ${format(hi.v)} at ${labels[hi.i]}, last ${format(last.v)} at ${labels[last.i]}.`;
  });
  return [head, ...parts].join(" ");
};

/** The same data as rows, for a "table" mode of the chart: a header row, then one row per category. */
export const chartTable = ({
  labels,
  series,
  format,
}: Pick<Describe, "labels" | "series" | "format">): string[][] => [
  ["", ...series.map((s) => s.name)],
  ...labels.map((l, i) => [l, ...series.map((s) => format(s.values[i]))]),
];

type DescribeParts = {
  title?: string;
  parts: { name: string; value: number }[];
  /** The whole the parts are shares of; default their sum. */
  total?: number;
  format: (value: number | null | undefined) => string;
  percent: (value: number | null | undefined) => string;
};

/** A text for a screen reader: each part with its value and share of the whole. */
export const describeParts = ({
  title,
  parts,
  total,
  format,
  percent,
}: DescribeParts): string => {
  const shown = parts.filter((p) => isNum(p.value) && p.value > 0);
  const sum = shown.reduce((s, p) => s + p.value, 0);
  if (!shown.length) return title ? `${title}. No data.` : "No data.";
  const whole = Math.max(total ?? sum, sum);
  const head = `${title ? `${title}. ` : ""}${shown.length} ${shown.length === 1 ? "part" : "parts"}, total ${format(whole)}.`;
  const list = shown
    .map((p) => `${p.name} ${format(p.value)} (${percent(p.value / whole)})`)
    .join(", ");
  return `${head} ${list}.`;
};
