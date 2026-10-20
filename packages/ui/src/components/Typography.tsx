import React, { useMemo } from "react";
import { Text, StyleSheet, TextProps } from "react-native";
import {
  useTheme,
  Theme,
  type ThemeColorTokens,
  type TypographyVariant,
} from "../providers/ThemeProvider";

/** The Material Design type scale, by name. */
export type TypographyName =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "subtitle1"
  | "subtitle2"
  | "body1"
  | "body2"
  | "button"
  | "caption"
  | "overline";

/** The theme's type-scale role each name is drawn with. */
const ROLE: Record<TypographyName, TypographyVariant> = {
  h1: "displayLarge",
  h2: "displayMedium",
  h3: "displaySmall",
  h4: "headlineLarge",
  h5: "headlineSmall",
  h6: "titleLarge",
  subtitle1: "titleMedium",
  subtitle2: "titleSmall",
  body1: "bodyLarge",
  body2: "bodyMedium",
  button: "labelLarge",
  caption: "bodySmall",
  overline: "labelSmall",
};

export interface TypographyProps extends Omit<TextProps, "onPress"> {
  children: React.ReactNode;
  /**
   * Type-scale name: `h1`–`h6`, `subtitle1`, `subtitle2`, `body1`, `body2`,
   * `button`, `caption`, `overline`. The M3 role names (`displayLarge`,
   * `bodyMedium`, …) still work and name the same styles. Defaults to `"h1"`.
   */
  variant?: TypographyName | TypographyVariant;
  /**
   * A theme colour token (`"primary"`, `"onSurfaceVariant"`, `"error"`, …) or,
   * failing that, any colour string. Defaults to `onSurface`.
   */
  color?: keyof ThemeColorTokens | (string & {});
  /** Overrides the size of the variant; the line height scales with it. */
  fontSize?: number;
  /** Keeps the text on one line, ending it with an ellipsis when it is cut. */
  nowrap?: boolean;
  /** Horizontal alignment of the text within its box. */
  align?: "left" | "center" | "right" | "justify";
  /** Makes the text pressable. */
  onClick?: TextProps["onPress"];
}

/**
 * Text in one of the Material type-scale variants, coloured `onSurface`.
 * Every other `Text` prop — `numberOfLines`, `selectable`, `accessibilityRole`,
 * `testID` — is forwarded as is.
 */
const Typography = ({
  children,
  variant = "h1",
  color,
  fontSize,
  nowrap = false,
  align,
  onClick,
  style,
  ...rest
}: TypographyProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const role =
    variant in ROLE
      ? ROLE[variant as TypographyName]
      : (variant as TypographyVariant);
  const base = theme.typography[role];
  const resolvedColor =
    color && color in theme.colors
      ? theme.colors[color as keyof ThemeColorTokens]
      : color;

  return (
    <Text
      numberOfLines={nowrap ? 1 : undefined}
      {...rest}
      onPress={onClick}
      style={[
        styles.text,
        base,
        resolvedColor ? { color: resolvedColor } : null,
        fontSize != null
          ? {
              fontSize,
              lineHeight:
                base.lineHeight && base.fontSize
                  ? Math.round((base.lineHeight * fontSize) / base.fontSize)
                  : undefined,
            }
          : null,
        align ? { textAlign: align } : null,
        style,
      ]}
    >
      {children}
    </Text>
  );
};

export default Typography;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    text: {
      color: theme.colors.onSurface,
    },
  });
