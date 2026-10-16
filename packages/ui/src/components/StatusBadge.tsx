import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Icons from "./Glyph";
import { useTheme } from "../providers/ThemeProvider";
import { toneFrom as resolveTone } from "../providers/toneFrom";

export interface StatusBadgeProps {
  label: string;
  icon?: string;
  type?: "success" | "error" | "warning";
  /**
   * Tints the badge from a `#RRGGBB` colour or from any text instead of from
   * `type`, which still picks the default icon.
   */
  toneFrom?: string;
}

const ICONS = {
  success: "check-circle",
  error: "alert-circle",
  warning: "alert",
} as const;

const StatusBadge = ({
  label,
  icon,
  type = "success",
  toneFrom,
}: StatusBadgeProps) => {
  const { theme } = useTheme();
  // Container roles from the theme, so a badge follows the scheme and the
  // palette instead of a hand-picked hex pair per mode.
  const { bg, on } = useMemo(() => {
    if (toneFrom) {
      const tint = resolveTone(toneFrom, theme.isDark ? "dark" : "light");
      return { bg: tint.background, on: tint.foreground };
    }
    if (type === "error") {
      return {
        bg: theme.colors.errorContainer,
        on: theme.colors.onErrorContainer,
      };
    }
    if (type === "warning") {
      return {
        bg: theme.colors.warningContainer,
        on: theme.colors.onWarningContainer,
      };
    }
    return {
      bg: theme.colors.successContainer,
      on: theme.colors.onSuccessContainer,
    };
  }, [type, theme, toneFrom]);

  return (
    <View
      style={[styles.statusContainer, { backgroundColor: bg }]}
      accessibilityRole="text"
      accessibilityLabel={`${type}: ${label}`}
    >
      <Icons name={(icon || ICONS[type]) as any} size={14} color={on} />
      <Text style={[styles.statusText, { color: on }]}>{label}</Text>
    </View>
  );
};
export default StatusBadge;

const styles = StyleSheet.create({
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
});
