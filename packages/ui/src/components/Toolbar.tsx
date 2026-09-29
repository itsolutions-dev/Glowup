import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, Theme } from "../providers/ThemeProvider";
import Paper from "./Paper";

// M3 Expressive toolbars are 64dp tall; the floating one sits at elevation 3.
const HEIGHT = 64;

export interface ToolbarProps {
  /** The actions: `IconButton`s, a `Button`, a `SplitButton`. */
  children: React.ReactNode;
  /**
   * `"docked"` spans the width of the screen's bottom edge (it replaces the
   * bottom app bar); `"floating"` is a pill that floats over the content.
   * Defaults to `"docked"`.
   */
  variant?: "docked" | "floating";
  /**
   * Floating only. `"standard"` is `surfaceContainer`; `"vibrant"` is
   * `primaryContainer` — give its actions `onPrimaryContainer` content.
   * Defaults to `"standard"`.
   */
  color?: "standard" | "vibrant";
  /** Floating only. Defaults to `"horizontal"`. */
  orientation?: "horizontal" | "vertical";
  /** Floating only: a FAB beside the toolbar, as M3 pairs them. */
  fab?: React.ReactNode;
  /** Docked only: pads the bottom safe-area inset. Defaults to `true`. */
  safeArea?: boolean;
  /** Names the toolbar for assistive tech. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * A container for the actions of the current screen, from M3 Expressive. It
 * lays them out; it does not position itself — put a floating toolbar in an
 * absolutely positioned wrapper where the screen wants it.
 */
const Toolbar = ({
  children,
  variant = "docked",
  color = "standard",
  orientation = "horizontal",
  fab,
  safeArea = true,
  accessibilityLabel,
  style,
  testID,
}: ToolbarProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const insets = useSafeAreaInsets();
  const a11y = {
    role: "toolbar" as const,
    accessibilityLabel,
    testID,
  };

  if (variant === "docked") {
    return (
      <View
        {...a11y}
        style={[
          styles.docked,
          { paddingBottom: safeArea ? insets.bottom : 0 },
          style,
        ]}
      >
        <View style={styles.dockedRow}>{children}</View>
      </View>
    );
  }

  const direction = orientation === "vertical" ? "column" : "row";
  // `style` always lands on the outer node, FAB or not, so a caller positioning
  // the toolbar does not have to know which element that is.
  return (
    <View
      {...a11y}
      style={[styles.floatingRow, { flexDirection: direction }, style]}
    >
      <Paper
        elevation={3}
        style={[
          styles.floating,
          { flexDirection: direction },
          direction === "row" ? { minHeight: HEIGHT } : { minWidth: HEIGHT },
          color === "vibrant" && {
            backgroundColor: theme.colors.primaryContainer,
          },
        ]}
      >
        {children}
      </Paper>
      {fab}
    </View>
  );
};

export default Toolbar;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    docked: {
      width: "100%",
      backgroundColor: theme.colors.surfaceContainer,
    },
    dockedRow: {
      height: HEIGHT,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: theme.spacing.m,
    },
    floating: {
      borderRadius: HEIGHT / 2,
      backgroundColor: theme.colors.surfaceContainer,
      padding: theme.spacing.s,
      gap: theme.spacing.xs,
      alignItems: "center",
    },
    floatingRow: { alignItems: "center", gap: theme.spacing.s },
  });
