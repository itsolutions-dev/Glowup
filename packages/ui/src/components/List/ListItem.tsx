import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme, Theme, getGlowStyles } from "../../providers/ThemeProvider";
import { PressableState } from "../types";

export interface ListItemProps {
  /** The first line. Text is drawn in the theme's type; any other node is drawn as given. */
  children: React.ReactNode;
  onPress?: () => void;
  /** Leading slot — an Avatar, an icon, a Checkbox. */
  leading?: React.ReactNode;
  /** Trailing slot — a value, a Toggle, a chevron. */
  trailing?: React.ReactNode;
  /** Second line below `children`. Text or any node, like `children`. */
  secondary?: React.ReactNode;
  /** A coloured bar on the left edge, for a status or a priority. */
  indicatorColor?: string;
  /** Faded, for a row that is removed or inactive. Still pressable. */
  dimmed?: boolean;
  /** Fixes the width of the trailing slot and right-aligns it, so a column of rows lines its trailing values up. */
  trailingWidth?: number;
  itemContainerStyle?: object;
  itemTextStyle?: object;
  itemSecondaryTextStyle?: object;
  itemPressedStyle?: object;
  itemHoveredStyle?: object;
}

const isText = (node: React.ReactNode) =>
  typeof node === "string" || typeof node === "number";

function ListItem({
  children,
  onPress,
  leading,
  trailing,
  secondary,
  indicatorColor,
  dimmed = false,
  trailingWidth,
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

  const content = (
    <View style={[styles.content, isRow && styles.row]}>
      {!!leading && <View style={styles.leading}>{leading}</View>}

      <View style={isRow ? styles.textBlock : undefined}>
        {isText(children) ? (
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
        ) : (
          children
        )}
        {!!secondary &&
          (isText(secondary) ? (
            <Text
              style={[styles.secondaryText, itemSecondaryTextStyle]}
              numberOfLines={2}
            >
              {secondary}
            </Text>
          ) : (
            secondary
          ))}
      </View>

      {!!trailing && (
        <View
          style={[
            styles.trailing,
            trailingWidth !== undefined && {
              width: trailingWidth,
              alignItems: "flex-end",
            },
          ]}
        >
          {/* Its own box, so the right edge holds even for a child with an alignSelf of its own (StatusBadge). */}
          {trailingWidth !== undefined ? <View>{trailing}</View> : trailing}
        </View>
      )}
    </View>
  );

  const accent = indicatorColor
    ? { borderLeftWidth: 4, borderLeftColor: indicatorColor }
    : null;

  return (
    <View style={[styles.outerContainer, dimmed && styles.dimmed]}>
      {onPress ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          style={({ hovered, pressed }: PressableState) => [
            styles.itemContainer,
            accent,
            itemContainerStyle,
            (hovered || pressed) && getGlowStyles(theme, true),
            hovered && { ...styles.itemHovered, ...itemHoveredStyle }, // Web-only hover
            pressed && { ...styles.itemPressed, ...itemPressedStyle }, // Mobile-friendly press state
          ]}
        >
          {content}
        </Pressable>
      ) : (
        // Not a disabled Pressable: that marks the row disabled for screen
        // readers (aria-disabled on the web), and with it the controls in
        // its slots, such as a Toggle in `trailing`.
        <View style={[styles.itemContainer, accent, itemContainerStyle]}>
          {content}
        </View>
      )}
    </View>
  );
}

export default ListItem;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    outerContainer: {
      padding: theme.spacing.xs,
    },
    itemContainer: {
      backgroundColor: theme.colors.secondaryContainer,
      shadowColor: theme.colors.shadow,
      borderRadius: theme.shape.medium,
    },
    dimmed: {
      opacity: 0.55,
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
