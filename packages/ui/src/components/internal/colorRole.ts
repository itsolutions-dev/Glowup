import type { Theme } from "../../providers/ThemeProvider";

/** The colour roles a control can take through its `color` prop. */
export type ColorRole =
  | "primary"
  | "secondary"
  | "tertiary"
  | "error"
  | "success"
  | "warning"
  | "info"
  | "neutral";

/** A role's four tokens: the accent, what sits on it, and the same for its container. */
export interface ColorRoleTokens {
  main: string;
  onMain: string;
  container: string;
  onContainer: string;
}

/** Reads a role's four tokens from the theme, as the control would paint them. */
export const colorRoleTokens = (
  theme: Theme,
  role: ColorRole,
): ColorRoleTokens => {
  const c = theme.colors;
  switch (role) {
    case "secondary":
      return {
        main: c.secondary,
        onMain: c.onSecondary,
        container: c.secondaryContainer,
        onContainer: c.onSecondaryContainer,
      };
    case "tertiary":
      return {
        main: c.tertiary,
        onMain: c.onTertiary,
        container: c.tertiaryContainer,
        onContainer: c.onTertiaryContainer,
      };
    case "error":
      return {
        main: c.error,
        onMain: c.onError,
        container: c.errorContainer,
        onContainer: c.onErrorContainer,
      };
    case "success":
      return {
        main: c.success,
        onMain: c.onSuccess,
        container: c.successContainer,
        onContainer: c.onSuccessContainer,
      };
    case "warning":
      return {
        main: c.warning,
        onMain: c.onWarning,
        container: c.warningContainer,
        onContainer: c.onWarningContainer,
      };
    case "info":
      return {
        main: c.info,
        onMain: c.onInfo,
        container: c.infoContainer,
        onContainer: c.onInfoContainer,
      };
    case "neutral":
      return {
        main: c.neutral,
        onMain: c.onNeutral,
        container: c.neutralContainer,
        onContainer: c.onNeutralContainer,
      };
    case "primary":
    default:
      return {
        main: c.primary,
        onMain: c.onPrimary,
        container: c.primaryContainer,
        onContainer: c.onPrimaryContainer,
      };
  }
};
