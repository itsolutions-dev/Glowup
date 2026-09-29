import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "../providers/ThemeProvider";
import { getSuccessRoles, getWarningRoles } from "../providers/successRoles";

export interface StatusBadgeProps {
  label: string;
  icon?: string;
  type?: "success" | "error" | "warning";
}

const ICONS = {
  success: "check-circle",
  error: "alert-circle",
  warning: "alert",
} as const;

const StatusBadge = ({ label, icon, type = "success" }: StatusBadgeProps) => {
  const { theme } = useTheme();
  // Container roles from the theme — error from the palette, success and
  // warning from their fixed hues — so a badge follows the scheme and the
  // palette instead of a hand-picked hex pair per mode.
  const { bg, on } = useMemo(() => {
    if (type === "error") {
      return {
        bg: theme.colors.errorContainer,
        on: theme.colors.onErrorContainer,
      };
    }
    if (type === "warning") {
      const roles = getWarningRoles(theme.isDark);
      return { bg: roles.warningContainer, on: roles.onWarningContainer };
    }
    const roles = getSuccessRoles(theme.isDark);
    return { bg: roles.successContainer, on: roles.onSuccessContainer };
  }, [type, theme]);

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
