import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Icons from "./Glyph";
import { useTheme } from "../providers/ThemeProvider";
import { toneFrom as resolveTone } from "../providers/toneFrom";

export interface StatusBadgeProps {
  label: string;
  icon?: string;
  /** The state, which picks the colours and the icon: `info` for something to look at, `neutral` for neither good nor bad. Defaults to `"success"`. */
  type?: "success" | "error" | "warning" | "info" | "neutral";
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
  info: "information",
  neutral: "minus-circle",
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
    const roles = {
      success: ["successContainer", "onSuccessContainer"],
      error: ["errorContainer", "onErrorContainer"],
      warning: ["warningContainer", "onWarningContainer"],
      info: ["infoContainer", "onInfoContainer"],
      neutral: ["neutralContainer", "onNeutralContainer"],
    } as const;
    const [container, onContainer] = roles[type] ?? roles.success;
    return { bg: theme.colors[container], on: theme.colors[onContainer] };
  }, [type, theme, toneFrom]);

  return (
    <View
      style={[styles.statusContainer, { backgroundColor: bg }]}
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      <Icons name={(icon || ICONS[type]) as any} size={14} color={on} />
      {/* The badge is named by its label already: inside a pressable row the
          text would be read a second time ("Due, Due"). */}
      <Text
        style={[styles.statusText, { color: on }]}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        aria-hidden
      >
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
