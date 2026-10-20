import type { Theme } from "../../providers/ThemeProvider";

/**
 * The box of a `variant="filled"` field, laid over `getGlowStyles`: a tinted
 * fill that shows its border only while the field is focused (open, for a
 * select) or in error. The same box `PinInput` draws for its cells.
 */
export const filledField = (theme: Theme, active: boolean, error?: string) => ({
  backgroundColor: theme.colors.surfaceContainerHighest,
  ...(!active && !error ? { borderColor: "transparent" } : null),
});
