import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme, Theme, getGlowStyles } from "../../providers/ThemeProvider";
import { PressableState } from "../types";

interface ListItemProps {
  children: React.ReactNode;
  onPress?: () => void;
  /** Leading slot — an Avatar, an icon, a Checkbox. */
  leading?: React.ReactNode;
  /** Trailing slot — a value, a Toggle, a chevron. */
  trailing?: React.ReactNode;
  /** Second line below `children`. */
  secondary?: React.ReactNode;
  itemContainerStyle?: object;
  itemTextStyle?: object;
  itemSecondaryTextStyle?: object;
  itemPressedStyle?: object;
  itemHoveredStyle?: object;
}

function ListItem({
  children,
  onPress,
  leading,
  trailing,
  secondary,
  itemContainerStyle,
  itemTextStyle,
  itemSecondaryTextStyle,
  itemPressedStyle,
  itemHoveredStyle,
}: ListItemProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  // With no slots filled this stays the original single-line centred tile.
  const isRow = !!leading || !!trailing || !!secondary;

  return (
    <View style={styles.outerContainer}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole={onPress ? "button" : undefined}
        style={({ hovered, pressed }: PressableState) => [
          styles.itemContainer,
          itemContainerStyle,
          (hovered || pressed) && getGlowStyles(theme, true),
          hovered && { ...styles.itemHovered, ...itemHoveredStyle }, // Web-only hover
          pressed && { ...styles.itemPressed, ...itemPressedStyle }, // Mobile-friendly press state
        ]}
      >
        <View style={[styles.content, isRow && styles.row]}>
          {!!leading && <View style={styles.leading}>{leading}</View>}

          <View style={isRow ? styles.textBlock : undefined}>
            <Text
              style={[
                styles.itemText,
                isRow && styles.itemTextRow,
                itemTextStyle,
              ]}
              numberOfLines={1}
            >
              {children}
            </Text>
            {!!secondary && (
              <Text
                style={[styles.secondaryText, itemSecondaryTextStyle]}
                numberOfLines={2}
              >
                {secondary}
              </Text>
            )}
          </View>

          {!!trailing && <View style={styles.trailing}>{trailing}</View>}
        </View>
      </Pressable>
    </View>
  );
}

export default ListItem;

const makeStyles: (theme: Theme) => StyleSheet.NamedStyles<any> = (
  theme: Theme,
) =>
  StyleSheet.create({
    outerContainer: {
      padding: theme.spacing.xs,
    },
    itemContainer: {
      backgroundColor: theme.colors.secondaryContainer,
      shadowColor: theme.colors.shadow,
      borderRadius: theme.shape.medium,
    },
    content: {
      flex: 1,
      justifyContent: "center",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
      gap: theme.spacing.m,
    },
    textBlock: {
      flex: 1,
    },
    leading: {
      justifyContent: "center",
    },
    trailing: {
      justifyContent: "center",
    },
    itemText: {
      ...theme.typography.titleMedium,
      padding: theme.spacing.m,
      textAlign: "center",
      color: theme.colors.secondary,
    },
    // In row mode the padding lives on the row and the text aligns left.
    itemTextRow: {
      padding: 0,
      textAlign: "left",
      color: theme.colors.onSecondaryContainer,
    },
    secondaryText: {
      ...theme.typography.bodyMedium,
      marginTop: 2,
      color: theme.colors.onSurfaceVariant,
    },
    itemHovered: {
      backgroundColor: theme.colors.onPrimary,
      borderRadius: theme.shape.medium,
      shadowColor: theme.colors.shadow,
    },
    itemPressed: {
      backgroundColor: theme.colors.onPrimary,
      borderRadius: theme.shape.medium,
      shadowColor: theme.colors.shadow,
    },
  });
