import React, { useMemo } from "react";
import { View, Text, StyleSheet, StyleProp, ViewStyle } from "react-native";
import Icons from "./Glyph";
import { Theme, useTheme } from "../providers/ThemeProvider";
import { MaterialCommunityIconsGlyphs } from "./types";
import { resolveColor, type ThemeColor } from "./internal/themeColor";

export interface StatProps {
  /** What the number measures. */
  label: string;
  /** The number itself; pre-formatted by the caller. */
  value: string;
  /** Signed change shown next to an up/down arrow, e.g. `"12.5%"`. */
  delta?: string;
  /** Direction of `delta`. Drives the arrow, and the colour unless `trendColor` is set. */
  trend?: "up" | "down" | "flat";
  /**
   * The colour of the arrow and `delta`: a theme colour token (a role such as
   * `"success"` or `"error"`, or `"onSurfaceVariant"`, ...) or any colour string.
   * Left out, `"up"` is `success`, `"down"` is `error` and `"flat"` neutral. For a
   * metric where down is good, pass the colour yourself.
   */
  trendColor?: ThemeColor;
  /**
   * `"column"` stacks the label over the value. `"row"` puts them on one line,
   * the value after the label, with the delta right behind the value. Defaults
   * to `"column"`.
   */
  direction?: "column" | "row";
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
  trendColor: trendColorProp,
  direction = "column",
  helpText,
  icon,
  style,
  testID,
}: StatProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const row = direction === "row";

  const trendColor = useMemo(() => {
    const given = resolveColor(theme, trendColorProp);
    if (given) return given;
    if (trend === "up") return theme.colors.success;
    if (trend === "down") return theme.colors.error;
    return theme.colors.onSurfaceVariant;
  }, [trend, trendColorProp, theme]);

  const labelNode = (
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
  );

  const valueNode = (
    <View style={[styles.valueRow, row && styles.valueRowInline]}>
      <Text
        style={[
          theme.typography.headlineMedium,
          { color: theme.colors.onSurface },
        ]}
      >
        {value}
      </Text>
      {!!delta && (
        <View style={[styles.deltaRow, row && styles.deltaRowInline]}>
          {!!trend && (
            <Icons name={TREND_ICONS[trend]} size={16} color={trendColor} />
          )}
          <Text style={[theme.typography.labelLarge, { color: trendColor }]}>
            {delta}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View
      style={[styles.container, style]}
      testID={testID}
      accessibilityLabel={[label, value, delta].filter(Boolean).join(", ")}
    >
      {row ? (
        <View style={styles.line}>
          {labelNode}
          {valueNode}
        </View>
      ) : (
        <>
          {labelNode}
          {valueNode}
        </>
      )}

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
    // The label and the value of the "row" direction.
    line: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      columnGap: theme.spacing.m,
      rowGap: theme.spacing.xs,
    },
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
    valueRowInline: { alignItems: "center" },
    deltaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 2,
      paddingBottom: 4,
    },
    // Centred with the value, which the column layout's baseline padding is not.
    deltaRowInline: { paddingBottom: 0 },
  });
