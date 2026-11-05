import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import Icons from "./Glyph";
import { useTheme, Theme } from "../providers/ThemeProvider";
import { useInsets } from "./internal/useInsets";
import Badge from "./Badge";
import { MaterialCommunityIconsGlyphs, PressableState } from "./types";
import { activeGlyph } from "./internal/activeGlyph";
import { a11yState } from "./internal/a11yState";

export interface NavBarItem {
  id: string;
  label: string;
  /** Outline variant; the active state strips the "-outline" suffix. */
  icon: MaterialCommunityIconsGlyphs;
  badgeCount?: number;
  disabled?: boolean;
}

export interface NavBarProps {
  /** Destinations, three to five per M3. */
  items: NavBarItem[];
  /** `id` of the current destination. */
  activeId: string;
  /** Called with the `id` of the pressed destination. */
  onClick: (id: string) => void;
  /** "always" shows every label, "selected" only the active one. */
  showLabels?: "always" | "selected";
  /**
   * Pads the bottom safe-area inset, so the bar clears the phone's gesture bar
   * or home indicator, as `AppBar` does at the top. Defaults to `true`.
   */
  safeArea?: boolean;
}

/**
 * The Material 3 navigation bar: the bottom-mounted destinations of a compact
 * window. Presentational only: it reports presses, and the app's router
 * decides what they mean. `NavigationRail` is its medium and expanded
 * counterpart.
 */
const NavBar = ({
  items,
  activeId,
  onClick,
  showLabels = "always",
  safeArea = true,
}: NavBarProps) => {
  const { theme } = useTheme();
  const insets = useInsets();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View
      style={[
        styles.container,
        safeArea && { paddingBottom: 12 + insets.bottom },
      ]}
      accessibilityRole="tablist"
    >
      {items.map((item) => {
        const active = item.id === activeId;
        const iconName = activeGlyph(item.icon, active);
        const showLabel = showLabels === "always" || active;

        return (
          <Pressable
            key={item.id}
            onPress={() => onClick(item.id)}
            disabled={item.disabled}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            {...a11yState("tab", { selected: active, disabled: item.disabled })}
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

export default NavBar;

const makeStyles = (theme: Theme) =>
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
