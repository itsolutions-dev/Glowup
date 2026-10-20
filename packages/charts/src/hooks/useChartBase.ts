import { useMemo, useState } from "react";
import { useTheme } from "@its/glowup-ui";
import { makeValueFormatter } from "../core/format";
import { resolveSeriesColors, themeSeriesColors } from "../core/palette";
import { describeChart } from "../core/summary";
import type { ChartDatum, ChartSeries } from "../core/types";

/** The props every chart shares. */
export type ChartCommonProps = {
  /** One object per category: its `label` and one number per series key. */
  data: ChartDatum[];
  series: ChartSeries[];
  height?: number;
  /** One colour per series, in order; a series' own `color` wins. Default: roles of the theme. */
  colors?: string[];
  title?: string;
  /** BCP 47 tag for the numbers. Default "en-US". */
  locale?: string;
  numberFormat?: Intl.NumberFormatOptions;
  /** Replaces the number formatting altogether. */
  formatValue?: (value: number) => string;
  loading?: boolean;
  emptyLabel?: string;
  /** A category was tapped (its index) or the same one tapped again (null). */
  onSelect?: (index: number | null) => void;
  testID?: string;
};

export const num = (v: ChartDatum[string]): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

/**
 * What the category charts have in common: the theme, the colours, the number
 * formatting, the text for a screen reader, and which category is active (hovered,
 * else the one last tapped).
 */
export const useChartBase = ({
  data,
  series,
  colors,
  title,
  locale,
  numberFormat,
  formatValue,
  onSelect,
}: ChartCommonProps) => {
  const { theme } = useTheme();
  const [selected, setSelected] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const seriesColors = resolveSeriesColors(
    series,
    colors ?? themeSeriesColors(theme.colors),
  );
  const format = useMemo(() => {
    const f = makeValueFormatter({ locale, options: numberFormat });
    return formatValue
      ? (v: number | null | undefined) => (v == null ? f(v) : formatValue(v))
      : f;
  }, [locale, numberFormat, formatValue]);
  const keys = series.map((s) => s.key);
  const names = series.map((s) => s.label ?? s.key);
  const labels = data.map((d) => d.label);
  const summary = describeChart({
    title,
    labels,
    series: series.map((s, i) => ({
      name: names[i],
      values: data.map((d) => num(d[s.key])),
    })),
    format,
  });
  const toggle = (index: number) => {
    const next = selected === index ? null : index;
    setSelected(next);
    onSelect?.(next);
  };
  return {
    theme,
    seriesColors,
    format,
    keys,
    names,
    labels,
    summary,
    fontSize: theme.typography.labelSmall.fontSize ?? 11,
    empty: data.length === 0 || series.length === 0,
    active: hovered ?? selected,
    setHovered,
    toggle,
  };
};
