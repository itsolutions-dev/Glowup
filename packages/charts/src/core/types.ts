/** One category of a chart: its label and one value per series key (the CRM's and recharts' shape). */
export type ChartDatum = { label: string } & Record<
  string,
  string | number | null | undefined
>;

/** A series: the key it reads from each datum, a name for legends and summaries, an optional colour. */
export type ChartSeries = {
  key: string;
  label?: string;
  color?: string;
};

export type CurveName = "linear" | "monotone" | "natural" | "step";

export type Point = { x: number; y: number | null };

/** A part of a whole: a slice of a donut, a segment of a stacked bar. */
export type PartDatum = {
  id: string;
  value: number;
  /** Shown in tooltips and summaries instead of the id. */
  label?: string;
  color?: string;
};
