import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useTheme, Theme, getGlowStyles } from "../../providers/ThemeProvider";
import { PressableState } from "../types";

interface ListItemProps {
  children: React.ReactNode;
  onPress?: () => void;
  itemContainerStyle?: object;
  itemTextStyle?: object;
  itemPressedStyle?: object;
  itemHoveredStyle?: object;
}

function ListItem({
  children,
  onPress,
  itemContainerStyle,
  itemTextStyle,
  itemPressedStyle,
  itemHoveredStyle,
}: ListItemProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

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
        <View style={styles.content}>
          <Text style={[styles.itemText, itemTextStyle]} numberOfLines={1}>
            {children}
          </Text>
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
    itemText: {
      ...theme.typography.titleMedium,
      padding: theme.spacing.m,
      textAlign: "center",
      color: theme.colors.secondary,
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
