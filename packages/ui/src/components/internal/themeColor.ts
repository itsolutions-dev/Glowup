import type { Theme, ThemeColorTokens } from "../../providers/ThemeProvider";

/** A theme colour token (`"primary"`, `"onSurfaceVariant"`, ...) or any colour string. */
export type ThemeColor = keyof ThemeColorTokens | (string & {});

/**
 * Resolves a `ThemeColor`: a token name reads the theme's colour, anything else
 * is taken as a colour string and returned as given.
 */
export const resolveColor = (
  theme: Theme,
  color: ThemeColor | undefined,
): string | undefined =>
  color !== undefined &&
  Object.prototype.hasOwnProperty.call(theme.colors, color)
    ? (theme.colors[color as keyof ThemeColorTokens] as string)
    : color;
