import React, { useMemo } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { Theme, useTheme } from "../../providers/ThemeProvider";

export interface CardActionsProps {
  children: React.ReactNode;
  /** Where the buttons sit on the row. M3 puts card actions on the right. */
  align?: "start" | "end" | "space-between";
  style?: StyleProp<ViewStyle>;
}

/** The action row of a `Card`. Keep it to two buttons, per M3. */
const CardActions = ({ children, align = "end", style }: CardActionsProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const justifyContent =
    align === "start"
      ? "flex-start"
      : align === "space-between"
        ? "space-between"
        : "flex-end";

  return (
    <View style={[styles.row, { justifyContent }, style]}>{children}</View>
  );
};

export default CardActions;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.s,
      paddingTop: theme.spacing.m,
    },
  });
