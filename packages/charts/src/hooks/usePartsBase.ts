import { createElement, useMemo, useState, type ReactElement } from "react";
import { useTheme } from "@its/glowup-ui";
import { ChartLegend } from "../ChartLegend";
import { makeValueFormatter } from "../core/format";
import { resolveSeriesColors, themeSeriesColors } from "../core/palette";
import { describeParts } from "../core/summary";
import type { PartDatum } from "../core/types";

/** The props the charts of parts of a whole (donut, stacked bar) share. */
export type PartsCommonProps = {
  /** The parts: an id, a value, and optionally a label and a colour. Zero and negative values are not drawn. */
  data: PartDatum[];
  /**
   * The whole the parts are shares of. More than their sum leaves the rest
   * empty (30 of 100, like a gauge); default their sum.
   */
  total?: number;
  /** One colour per part, in order; a part's own `color` wins. Default: roles of the theme. */
  colors?: string[];
  /** A key under the chart; a tap on a part switches it off. */
  legend?: boolean;
  title?: string;
  /** BCP 47 tag for the numbers. Default "en-US". */
  locale?: string;
  numberFormat?: Intl.NumberFormatOptions;
  /** Replaces the number formatting altogether. */
  formatValue?: (value: number) => string;
  loading?: boolean;
  emptyLabel?: string;
  /** A part was tapped (its id) or the same one tapped again (null). */
  onSelect?: (id: string | null) => void;
  testID?: string;
};

/**
 * What the donut and the stacked bar have in common: colours, formatting, the
 * screen-reader text, the active part and the parts the legend has switched off.
 * `visible` is `data` without those; `colorOf` keeps each part's colour by its
 * place in the whole list, so switching one off does not recolour the others.
 */
export const usePartsBase = ({
  data,
  total,
  colors,
  legend,
  title,
  locale,
  numberFormat,
  formatValue,
  onSelect,
  testID,
}: PartsCommonProps) => {
  const { theme } = useTheme();
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [hidden, setHidden] = useState<string[]>([]);
  const allColors = resolveSeriesColors(
    data.map((d) => ({ key: d.id, color: d.color })),
    colors ?? themeSeriesColors(theme.colors),
  );
  const colorOf = (id: string) =>
    allColors[data.findIndex((d) => d.id === id)] ?? "currentColor";
  const visible = data.filter((d) => !hidden.includes(d.id));
  const format = useMemo(() => {
    const f = makeValueFormatter({ locale, options: numberFormat });
    return formatValue
      ? (v: number | null | undefined) => (v == null ? f(v) : formatValue(v))
      : f;
  }, [locale, numberFormat, formatValue]);
  const percent = useMemo(
    () =>
      makeValueFormatter({
        locale,
        options: { style: "percent", maximumFractionDigits: 0 },
      }),
    [locale],
  );
  const nameOf = (d: PartDatum) => d.label ?? d.id;
  const summary = describeParts({
    title,
    parts: visible.map((d) => ({ name: nameOf(d), value: d.value })),
    total,
    format,
    percent,
  });
  const toggle = (id: string) => {
    const next = selected === id ? null : id;
    setSelected(next);
    onSelect?.(next);
  };
  const toggleOff = (id: string) =>
    setHidden((h) => (h.includes(id) ? h.filter((k) => k !== id) : [...h, id]));
  const legendNode: ReactElement | null = legend
    ? createElement(ChartLegend, {
        items: data.map((d) => ({
          key: d.id,
          label: nameOf(d),
          color: colorOf(d.id),
        })),
        hidden,
        onToggle: toggleOff,
        testID: testID ? `${testID}-legend` : undefined,
      })
    : null;
  return {
    theme,
    visible,
    colorOf,
    format,
    percent,
    nameOf,
    summary,
    active: hovered ?? selected,
    setHovered,
    toggle,
    legendNode,
  };
};
