import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";

import { useTheme, Theme } from "../providers/ThemeProvider";
import { colorRoleTokens, type ColorRole } from "./internal/colorRole";

export interface BadgeProps {
  count?: number;
  size?: "small" | "large";
  visible?: boolean;
  /** Cap shown as "max+" when count exceeds it. */
  max?: number;
  /** Render the badge even when count is 0 (hidden by default). */
  showZero?: boolean;
  /** Colour role of the badge. Defaults to `"error"`. */
  color?: ColorRole;
  /**
   * The corner of the parent the badge is pinned to, overlapping it slightly.
   * Left out, the badge is only absolutely placed and the parent (or `style`)
   * positions it.
   */
  position?: "top-right" | "bottom-right" | "top-left" | "bottom-left";
  style?: any;
}

const Badge = ({
  count,
  size = "large",
  visible = true,
  max = 99,
  showZero = false,
  color = "error",
  position,
  style,
}: BadgeProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const role = useMemo(() => colorRoleTokens(theme, color), [theme, color]);

  if (!visible) return null;
  if (count === 0 && !showZero) return null;

  // Determine if it's a small dot or a label badge
  const isDot = size === "small" || count === undefined;

  // Format count (e.g., 102 becomes 99+)
  const displayCount = count !== undefined && count > max ? `${max}+` : count;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: role.main },
        isDot ? styles.dot : styles.large,
        position && styles[position],
        style,
      ]}
    >
      {!isDot && (
        <Text style={[styles.text, { color: role.onMain }]} numberOfLines={1}>
          {displayCount}
        </Text>
      )}
    </View>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    badge: {
      alignItems: "center",
      justifyContent: "center",
      position: "absolute",
      zIndex: 1,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    large: {
      minWidth: 16,
      height: 16,
      borderRadius: theme.shape.small,
      paddingHorizontal: 4,
    },
    "top-right": { top: -theme.spacing.xs, right: -theme.spacing.xs },
    "bottom-right": { bottom: -theme.spacing.xs, right: -theme.spacing.xs },
    "top-left": { top: -theme.spacing.xs, left: -theme.spacing.xs },
    "bottom-left": { bottom: -theme.spacing.xs, left: -theme.spacing.xs },
    text: {
      fontSize: 10,
      fontWeight: "500",
      lineHeight: 12, // M3 specs for small text
      textAlign: "center",
    },
  });

export default Badge;
