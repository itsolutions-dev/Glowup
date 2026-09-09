import { Theme } from "../../providers/ThemeProvider";

/** A spacing token name (`"m"`) or a raw density-independent pixel value. */
export type SpacingValue = keyof Theme["spacing"] | number;

/** A shape token name (`"large"`) or a raw corner radius. */
export type RadiusValue = keyof Theme["shape"] | number;

/** An M3 color role name (`"primaryContainer"`) or any raw color string. */
export type ColorValue = keyof Theme["colors"] | (string & {});

export const resolveSpacing = (
  theme: Theme,
  value: SpacingValue | undefined,
): number | undefined => {
  if (value === undefined) return undefined;
  if (typeof value === "number") return value;
  return theme.spacing[value];
};

export const resolveRadius = (
  theme: Theme,
  value: RadiusValue | undefined,
): number | undefined => {
  if (value === undefined) return undefined;
  if (typeof value === "number") return value;
  return theme.shape[value];
};

/**
 * Maps a color role name onto the active theme, passing anything else through
 * so callers can still hand over a literal color when they need to.
 */
export const resolveColor = (
  theme: Theme,
  value: ColorValue | undefined,
): string | undefined => {
  if (value === undefined) return undefined;
  return (theme.colors as Record<string, string>)[value] ?? value;
};
