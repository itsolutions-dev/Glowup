import type { Theme } from "@its/glowup-ui";
import type { ChartSeries } from "./types";

/**
 * Colours for series, taken from the theme's roles. Provisional: the library has
 * no chart palette yet (B0 in docs/work-split.md); when it does, only this list
 * changes. The order puts the most distinct roles first.
 */
export const themeSeriesColors = (colors: Theme["colors"]): string[] => [
  colors.primary,
  colors.tertiary,
  colors.secondary,
  colors.primaryContainer,
  colors.tertiaryContainer,
  colors.secondaryContainer,
  colors.outline,
];

/** One colour per series: its own `color`, else the list in turn (it repeats when the series outnumber it). */
export const resolveSeriesColors = (
  series: ChartSeries[],
  palette: string[],
): string[] =>
  series.map(
    (s, i) => s.color ?? palette[i % palette.length] ?? "currentColor",
  );
