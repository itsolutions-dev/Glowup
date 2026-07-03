import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "../providers/ThemeProvider";

interface StatusBadgeProps {
  label: string;
  icon?: string;
  type?: "success" | "error" | "warning";
}

const LIGHT_THEMES = {
  success: { bg: "#ECFDF5", text: "#065F46", icon: "check-circle" },
  error: { bg: "#FEF2F2", text: "#991B1B", icon: "alert-circle" },
  warning: { bg: "#FFFBEB", text: "#92400E", icon: "alert" },
};

const DARK_THEMES = {
  success: { bg: "#064E3B", text: "#6EE7B7", icon: "check-circle" },
  error: { bg: "#7F1D1D", text: "#FCA5A5", icon: "alert-circle" },
  warning: { bg: "#78350F", text: "#FCD34D", icon: "alert" },
};

const StatusBadge = ({ label, icon, type = "success" }: StatusBadgeProps) => {
  const { theme } = useTheme();
  const themes = theme.isDark ? DARK_THEMES : LIGHT_THEMES;
  const activeTheme = themes[type];

  return (
    <View
      style={[styles.statusContainer, { backgroundColor: activeTheme.bg }]}
      accessibilityRole="text"
      accessibilityLabel={`${type}: ${label}`}
    >
      <Icons
        name={(icon || activeTheme.icon) as any}
        size={14}
        color={activeTheme.text}
      />
      <Text style={[styles.statusText, { color: activeTheme.text }]}>
        {label}
      </Text>
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
