import { useMemo, useState } from "react";
import { useTheme } from "@its/glowup-ui";
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

/** What the donut and the stacked bar have in common: colours, formatting, the screen-reader text and the active part. */
export const usePartsBase = ({
  data,
  total,
  colors,
  title,
  locale,
  numberFormat,
  formatValue,
  onSelect,
}: PartsCommonProps) => {
  const { theme } = useTheme();
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const partColors = resolveSeriesColors(
    data.map((d) => ({ key: d.id, color: d.color })),
    colors ?? themeSeriesColors(theme.colors),
  );
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
    parts: data.map((d) => ({ name: nameOf(d), value: d.value })),
    total,
    format,
    percent,
  });
  const toggle = (id: string) => {
    const next = selected === id ? null : id;
    setSelected(next);
    onSelect?.(next);
  };
  return {
    theme,
    partColors,
    format,
    percent,
    nameOf,
    summary,
    active: hovered ?? selected,
    setHovered,
    toggle,
  };
};
