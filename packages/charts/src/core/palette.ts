import type { Theme } from "@its/glowup-ui";
import type { ChartSeries } from "./types";

/**
 * Colours for series: the theme's categorical chart palette, in its order (the
 * order keeps neighbours apart for colour-blind readers).
 */
export const themeSeriesColors = (theme: Theme): string[] =>
  theme.charts.categorical;

/** One colour per series: its own `color`, else the list in turn (it repeats when the series outnumber it). */
export const resolveSeriesColors = (
  series: ChartSeries[],
  palette: string[],
): string[] =>
  series.map(
    (s, i) => s.color ?? palette[i % palette.length] ?? "currentColor",
  );

const channels = (color: string): [number, number, number] | null => {
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})([0-9a-f]{2})?$/i.exec(color.trim());
  if (hex) {
    const h =
      hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join("") : hex[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [
      number,
      number,
      number,
    ];
  }
  const rgb = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i.exec(color.trim());
  return rgb ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : null;
};

const luminance = (rgb: [number, number, number]) => {
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * Whichever of two colours reads better on `background` (WCAG contrast), for text drawn on a slice
 * or a bar. `first` when a colour cannot be read (a name, a variable).
 */
export const readableOn = (
  background: string,
  first: string,
  second: string,
) => {
  const bg = channels(background);
  const a = channels(first);
  const b = channels(second);
  if (!bg || !a || !b) return first;
  const L = luminance(bg);
  const ratio = (c: [number, number, number]) => {
    const l = luminance(c);
    return (Math.max(L, l) + 0.05) / (Math.min(L, l) + 0.05);
  };
  return ratio(b) > ratio(a) ? second : first;
};
