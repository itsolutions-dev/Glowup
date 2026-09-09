import React, { useMemo } from "react";
import { StyleProp, StyleSheet, Text, TextStyle } from "react-native";
import { Theme, useTheme } from "../../providers/ThemeProvider";

export interface ListSubheaderProps {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}

/**
 * A group label above a run of `ListItem`s. Marked as a heading so assistive
 * tech can jump between groups, which a plain `Typography` line cannot do.
 */
const ListSubheader = ({ children, style }: ListSubheaderProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <Text accessibilityRole="header" style={[styles.subheader, style]}>
      {children}
    </Text>
  );
};

export default ListSubheader;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    subheader: {
      ...theme.typography.titleSmall,
      color: theme.colors.primary,
      paddingHorizontal: theme.spacing.m,
      paddingTop: theme.spacing.m,
      paddingBottom: theme.spacing.s,
    },
  });
