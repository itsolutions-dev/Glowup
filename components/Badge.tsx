import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";

import { useTheme, Theme } from "providers/ThemeProvider";

interface BadgeProps {
  count?: number;
  size?: "small" | "large";
  visible?: boolean;
  /** Cap shown as "max+" when count exceeds it. */
  max?: number;
  /** Render the badge even when count is 0 (hidden by default). */
  showZero?: boolean;
  style?: any;
}

const Badge = ({
  count,
  size = "large",
  visible = true,
  max = 99,
  showZero = false,
  style,
}: BadgeProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  if (!visible) return null;
  if (count === 0 && !showZero) return null;

  // Determine if it's a small dot or a label badge
  const isDot = size === "small" || count === undefined;

  // Format count (e.g., 102 becomes 99+)
  const displayCount = count !== undefined && count > max ? `${max}+` : count;

  return (
    <View style={[styles.badge, isDot ? styles.dot : styles.large, style]}>
      {!isDot && (
        <Text style={styles.text} numberOfLines={1}>
          {displayCount}
        </Text>
      )}
    </View>
  );
};

const makeStyles: (theme: Theme) => StyleSheet.NamedStyles<any> = (
  theme: Theme,
) =>
  StyleSheet.create({
    badge: {
      backgroundColor: theme.colors.error, // "#B3261E", // M3 Error color
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
    text: {
      color: theme.colors.onError, //"#FFFFFF",
      fontSize: 10,
      fontWeight: "500",
      lineHeight: 12, // M3 specs for small text
      textAlign: "center",
    },
  });

export default Badge;
