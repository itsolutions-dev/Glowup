import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme, Theme } from "../providers/ThemeProvider";
import Badge from "./Badge";
import { MaterialCommunityIconsGlyphs, PressableState } from "./types";

export interface NavigationBarItem {
  id: string;
  label: string;
  /** Outline variant; the active state strips the "-outline" suffix. */
  icon: MaterialCommunityIconsGlyphs;
  badgeCount?: number;
  disabled?: boolean;
}

interface NavigationBarProps {
  items: NavigationBarItem[];
  activeId: string;
  onItemPress: (id: string) => void;
  /** "always" shows every label, "selected" only the active one. */
  showLabels?: "always" | "selected";
}

const NavigationBar = ({
  items,
  activeId,
  onItemPress,
  showLabels = "always",
}: NavigationBarProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.container} accessibilityRole="tablist">
      {items.map((item) => {
        const active = item.id === activeId;
        const iconName = (
          active && item.icon.endsWith("-outline")
            ? item.icon.replace(/-outline$/, "")
            : item.icon
        ) as MaterialCommunityIconsGlyphs;
        const showLabel = showLabels === "always" || active;

        return (
          <Pressable
            key={item.id}
            onPress={() => onItemPress(item.id)}
            disabled={item.disabled}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected: active, disabled: item.disabled }}
            style={[styles.item, item.disabled && { opacity: 0.38 }]}
          >
            {({ hovered, pressed }: PressableState) => (
              <>
                <View
                  style={[
                    styles.iconPill,
                    active && {
                      backgroundColor: theme.colors.secondaryContainer,
                    },
                    !active &&
                      (hovered || pressed) && {
                        backgroundColor: theme.colors.surfaceContainerHigh,
                      },
                  ]}
                >
                  <Icons
                    name={iconName}
                    size={24}
                    color={
                      active
                        ? theme.colors.onSecondaryContainer
                        : theme.colors.onSurfaceVariant
                    }
                  />
                  {item.badgeCount != null && item.badgeCount > 0 && (
                    <View style={styles.badge}>
                      <Badge count={item.badgeCount} />
                    </View>
                  )}
                </View>
                {showLabel && (
                  <Text
                    style={[
                      theme.typography.labelMedium,
                      {
                        color: active
                          ? theme.colors.onSurface
                          : theme.colors.onSurfaceVariant,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                )}
              </>
            )}
          </Pressable>
        );
      })}
    </View>
  );
};

export default NavigationBar;

const makeStyles: (theme: Theme) => StyleSheet.NamedStyles<any> = (
  theme: Theme,
) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      backgroundColor: theme.colors.surfaceContainer,
      paddingVertical: 12,
      paddingHorizontal: 8,
      width: "100%",
    },
    item: {
      flex: 1,
      alignItems: "center",
      gap: 4,
      ...Platform.select({
        web: { cursor: "pointer" },
      }),
    },
    iconPill: {
      width: 64,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({
        web: {
          transitionProperty: "background-color" as any,
          transitionDuration: "150ms" as any,
        },
      }),
    },
    badge: {
      position: "absolute",
      top: -4,
      right: 8,
    },
  });
