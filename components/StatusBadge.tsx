import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";

const StatusBadge = ({ label, icon, type = "success" }) => {
  const themes = {
    success: { bg: "#ECFDF5", text: "#065F46", icon: "check-circle" },
    error: { bg: "#FEF2F2", text: "#991B1B", icon: "alert-circle" },
    warning: { bg: "#FFFBEB", text: "#92400E", icon: "alert" },
  };

  const activeTheme = themes[type];

  return (
    <View style={[styles.statusContainer, { backgroundColor: activeTheme.bg }]}>
      <Icons
        name={icon || activeTheme.icon}
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
