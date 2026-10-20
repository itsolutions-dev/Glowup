import React, { useMemo } from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import { Theme, useTheme } from "../../providers/ThemeProvider";

export interface CardTitleProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Leading slot — an `Avatar`, an `Icon`, a `StatusBadge`. */
  startIcon?: React.ReactNode;
  /** Trailing slot — an `IconButton`, a `Menu` anchor, a `Chip`. */
  endIcon?: React.ReactNode;
  titleNumberOfLines?: number;
  subtitleNumberOfLines?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * The header row of a `Card`: leading slot, title + subtitle, trailing slot.
 * Every card header was previously a hand-built row; this keeps the type
 * roles and the 16px gutters identical across them.
 */
const CardTitle = ({
  title,
  subtitle,
  startIcon,
  endIcon,
  titleNumberOfLines = 1,
  subtitleNumberOfLines = 2,
  style,
}: CardTitleProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={[styles.row, style]}>
      {!!startIcon && <View style={styles.slot}>{startIcon}</View>}

      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={titleNumberOfLines}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={styles.subtitle} numberOfLines={subtitleNumberOfLines}>
            {subtitle}
          </Text>
        )}
      </View>

      {!!endIcon && <View style={styles.slot}>{endIcon}</View>}
    </View>
  );
};

export default CardTitle;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.m,
    },
    slot: {
      justifyContent: "center",
    },
    text: {
      flex: 1,
    },
    title: {
      ...theme.typography.titleMedium,
      color: theme.colors.onSurface,
    },
    subtitle: {
      ...theme.typography.bodyMedium,
      color: theme.colors.onSurfaceVariant,
    },
  });
