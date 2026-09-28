import React, { useMemo } from "react";
import { Text, StyleSheet, TextProps } from "react-native";
import {
  useTheme,
  Theme,
  type TypographyVariant,
} from "../providers/ThemeProvider";

export interface TypographyProps extends TextProps {
  children: React.ReactNode;
  /** M3 type-scale role. Defaults to `"displayLarge"`. */
  variant?: TypographyVariant;
}

/**
 * Text in one of the Material 3 type-scale roles, coloured `onSurface`.
 * Every other `Text` prop — `numberOfLines`, `selectable`, `accessibilityRole`,
 * `onPress`, `testID` — is forwarded as is.
 */
const Typography = ({
  children,
  variant = "displayLarge",
  style,
  ...rest
}: TypographyProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <Text {...rest} style={[styles.text, theme.typography[variant], style]}>
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
