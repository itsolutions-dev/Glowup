import { stackValues } from "./paths";
import type { ChartDatum } from "./types";

/** How the series of one column share it: piled up, or each from zero with the longest behind. */
export type ColumnMode = "stack" | "overlap";

/** One bar of a category: the series it holds and how they share it. */
export type BarColumn = { id: string; keys: string[]; mode: ColumnMode };

const value = (v: ChartDatum[string]): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

/**
 * The columns of a bar chart, in the order their first series comes: series with the same `column`
 * share one, a series without one is a column of its own. `stacked` puts every series in one
 * stacked column.
 */
export const barColumns = (
  series: { key: string; column?: string }[],
  {
    stacked,
    columnMode,
  }: {
    stacked?: boolean;
    columnMode?: ColumnMode | Record<string, ColumnMode>;
  },
): BarColumn[] => {
  if (!series.length) return [];
  if (stacked)
    return [{ id: "all", keys: series.map((s) => s.key), mode: "stack" }];
  const columns: BarColumn[] = [];
  for (const s of series) {
    const id = s.column ?? s.key;
    const found = columns.find((c) => c.id === id);
    if (found) {
      found.keys.push(s.key);
      continue;
    }
    const mode =
      typeof columnMode === "string"
        ? columnMode
        : (columnMode?.[id] ?? "stack");
    columns.push({ id, keys: [s.key], mode });
  }
  return columns;
};

/** `[k][i]`: the low and high value of the column's k-th series in category i, or null when it has none. */
export const columnSpans = (
  data: ChartDatum[],
  column: BarColumn,
): ([number, number] | null)[][] => {
  if (column.mode === "stack")
    return stackValues(data, column.keys).map((s) =>
      s.map((p) => [Math.min(p.start, p.end), Math.max(p.start, p.end)]),
    );
  return column.keys.map((k) =>
    data.map((d) => {
      const x = value(d[k]);
      return x === null ? null : [Math.min(x, 0), Math.max(x, 0)];
    }),
  );
};

/** What a column comes to in one category: the sum when stacked, the highest when overlapping, 0 for no value. */
export const columnTotal = (datum: ChartDatum, column: BarColumn): number => {
  const xs = column.keys
    .map((k) => value(datum[k]))
    .filter((x): x is number => x !== null);
  if (!xs.length) return 0;
  return column.mode === "stack"
    ? xs.reduce((a, b) => a + b, 0)
    : Math.max(...xs);
};
