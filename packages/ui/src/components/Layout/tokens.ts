import { Theme } from "../../providers/ThemeProvider";

/** A spacing token name (`"m"`) or a raw density-independent pixel value. */
export type SpacingValue = keyof Theme["spacing"] | number;

/** A shape token name (`"large"`) or a raw corner radius. */
export type RadiusValue = keyof Theme["shape"] | number;

/** An M3 color role name (`"primaryContainer"`) or any raw color string. */
export type ColorValue = keyof Theme["colors"] | (string & {});

/**
 * A spacing token name (`"m"`), a number of px, or a string holding one
 * (`"12"`, `"12px"`). What `Stack` and `Grid` take for `spacing`.
 */
export type SpacingInput = SpacingValue | (string & {});

/**
 * Resolves a spacing token, a number or a numeric string to px. A string that
 * is neither a token nor a number resolves to `undefined` (no spacing).
 */
export const resolveSpacing = (
  theme: Theme,
  value: SpacingInput | undefined,
): number | undefined => {
  if (value === undefined) return undefined;
  if (typeof value === "number") return value;
  // Own tokens only: `"constructor"` is not a spacing.
  if (Object.prototype.hasOwnProperty.call(theme.spacing, value)) {
    return theme.spacing[value as keyof Theme["spacing"]];
  }
  const px = /^\s*(-?\d+(?:\.\d+)?)(?:px)?\s*$/.exec(value);
  return px ? Number(px[1]) : undefined;
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
  // `value` is a color role or a literal color; the cast asks the theme for the
  // role and the fallback covers the literal, which is not a key of it.
  const role = value as keyof Theme["colors"];
  return (theme.colors[role] as string | undefined) ?? value;
};
