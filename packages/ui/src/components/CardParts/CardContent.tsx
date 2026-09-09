import React, { useMemo } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { Theme, useTheme } from "../../providers/ThemeProvider";

export interface CardContentProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/** The body of a `Card`: vertical rhythm between the header and the actions. */
const CardContent = ({ children, style }: CardContentProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return <View style={[styles.content, style]}>{children}</View>;
};

export default CardContent;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    content: {
      gap: theme.spacing.s,
      paddingTop: theme.spacing.s,
    },
  });
