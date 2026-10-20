import { createElement, useMemo, useState, type ReactElement } from "react";
import { useTheme } from "@its/glowup-ui";
import { ChartLegend } from "../ChartLegend";
import { makeValueFormatter } from "../core/format";
import { resolveSeriesColors, themeSeriesColors } from "../core/palette";
import { describeChart } from "../core/summary";
import type { ChartDatum, ChartSeries } from "../core/types";

/** The props every chart over categories shares. */
export type ChartCommonProps = {
  /** One object per category: its `label` and one number per series key. */
  data: ChartDatum[];
  series: ChartSeries[];
  height?: number;
  /** One colour per series, in order; a series' own `color` wins. Default: roles of the theme. */
  colors?: string[];
  /** A key under the chart; a tap on a series switches it off and the axes follow. */
  legend?: boolean;
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
 * formatting, the text for a screen reader, which category is active (hovered,
 * else the one last tapped) and which series the legend has switched off.
 * `keys`, `names` and `seriesColors` are those of the series still shown.
 */
export const useChartBase = ({
  data,
  series,
  colors,
  legend,
  title,
  locale,
  numberFormat,
  formatValue,
  onSelect,
  testID,
}: ChartCommonProps) => {
  const { theme } = useTheme();
  const [selected, setSelected] = useState<number | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [hidden, setHidden] = useState<string[]>([]);
  // Colours follow the position in the whole list, so switching a series off does not recolour the others.
  const allColors = resolveSeriesColors(
    series,
    colors ?? themeSeriesColors(theme.colors),
  );
  const shown = series
    .map((s, i) => ({ s, color: allColors[i] }))
    .filter(({ s }) => !hidden.includes(s.key));
  const format = useMemo(() => {
    const f = makeValueFormatter({ locale, options: numberFormat });
    return formatValue
      ? (v: number | null | undefined) => (v == null ? f(v) : formatValue(v))
      : f;
  }, [locale, numberFormat, formatValue]);
  const keys = shown.map(({ s }) => s.key);
  const names = shown.map(({ s }) => s.label ?? s.key);
  const labels = data.map((d) => d.label);
  const summary = describeChart({
    title,
    labels,
    series: shown.map(({ s }, i) => ({
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
  const toggleSeries = (key: string) =>
    setHidden((h) =>
      h.includes(key) ? h.filter((k) => k !== key) : [...h, key],
    );
  const legendNode: ReactElement | null = legend
    ? createElement(ChartLegend, {
        items: series.map((s, i) => ({
          key: s.key,
          label: s.label ?? s.key,
          color: allColors[i],
        })),
        hidden,
        onToggle: toggleSeries,
        testID: testID ? `${testID}-legend` : undefined,
      })
    : null;
  return {
    theme,
    seriesColors: shown.map(({ color }) => color),
    format,
    keys,
    names,
    labels,
    summary,
    fontSize: theme.typography.labelSmall.fontSize ?? 11,
    empty: data.length === 0 || keys.length === 0,
    active: hovered ?? selected,
    setHovered,
    toggle,
    legendNode,
  };
};
