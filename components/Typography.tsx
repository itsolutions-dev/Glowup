import React, { useMemo } from "react";
import { View, Text, StyleSheet, StyleProp, TextStyle } from "react-native";
import { useTheme, Theme } from "providers/ThemeProvider";

interface TypographyProps {
  children: React.ReactNode;
  variant?:
    | "displayLarge"
    | "displayMedium"
    | "displaySmall"
    | "headlineLarge"
    | "headlineMedium"
    | "headlineSmall"
    | "titleLarge"
    | "titleMedium"
    | "titleSmall"
    | "bodyLarge"
    | "bodyMedium"
    | "bodySmall"
    | "labelLarge"
    | "labelMedium"
    | "labelSmall";
  style?: StyleProp<TextStyle>;
}

const Typography = ({
  children,
  variant = "displayLarge",
  style,
}: TypographyProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <Text style={[styles.text, theme.typography[variant], style]}>
      {children}
    </Text>
  );
};

export default Typography;

const makeStyles: (theme: Theme) => StyleSheet.NamedStyles<any> = (
  theme: Theme,
) =>
  StyleSheet.create({
    text: {
      ...theme.typography.displayLarge,
      color: theme.colors.onSurface,
    },
  });
