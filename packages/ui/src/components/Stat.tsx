import React, { useMemo } from "react";
import { View, Text, StyleSheet, StyleProp, ViewStyle } from "react-native";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import { Theme, useTheme } from "../providers/ThemeProvider";
import { MaterialCommunityIconsGlyphs } from "./types";

export interface StatProps {
  /** What the number measures. */
  label: string;
  /** The number itself; pre-formatted by the caller. */
  value: string;
  /** Signed change shown next to an up/down arrow, e.g. `"12.5%"`. */
  delta?: string;
  /** Direction of `delta`. Drives both the arrow and its color. */
  trend?: "up" | "down" | "flat";
  /** Inverts the trend colors, for metrics where down is good. */
  invertTrendColors?: boolean;
  /** Extra context under the value. */
  helpText?: string;
  icon?: MaterialCommunityIconsGlyphs;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const TREND_ICONS: Record<
  NonNullable<StatProps["trend"]>,
  MaterialCommunityIconsGlyphs
> = {
  up: "arrow-up",
  down: "arrow-down",
  flat: "arrow-right",
};

/** A single labelled metric with an optional trend delta. */
const Stat = ({
  label,
  value,
  delta,
  trend,
  invertTrendColors,
  helpText,
  icon,
  style,
  testID,
}: StatProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const trendColor = useMemo(() => {
    if (!trend || trend === "flat") return theme.colors.onSurfaceVariant;
    const positive = invertTrendColors ? trend === "down" : trend === "up";
    return positive ? theme.colors.primary : theme.colors.error;
  }, [trend, invertTrendColors, theme.colors]);

  return (
    <View
      style={[styles.container, style]}
      testID={testID}
      accessibilityLabel={[label, value, delta].filter(Boolean).join(", ")}
    >
      <View style={styles.labelRow}>
        {!!icon && (
          <Icons name={icon} size={16} color={theme.colors.onSurfaceVariant} />
        )}
        <Text
          style={[
            theme.typography.labelMedium,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          {label}
        </Text>
      </View>

      <View style={styles.valueRow}>
        <Text
          style={[
            theme.typography.headlineMedium,
            { color: theme.colors.onSurface },
          ]}
        >
          {value}
        </Text>
        {!!delta && (
          <View style={styles.deltaRow}>
            {!!trend && (
              <Icons name={TREND_ICONS[trend]} size={16} color={trendColor} />
            )}
            <Text style={[theme.typography.labelLarge, { color: trendColor }]}>
              {delta}
            </Text>
          </View>
        )}
      </View>

      {!!helpText && (
        <Text
          style={[
            theme.typography.bodySmall,
            { color: theme.colors.onSurfaceVariant },
          ]}
        >
          {helpText}
        </Text>
      )}
    </View>
  );
};

export default Stat;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { gap: theme.spacing.xs },
    labelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
    },
    valueRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: theme.spacing.s,
    },
    deltaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      paddingBottom: 4,
    },
  });
