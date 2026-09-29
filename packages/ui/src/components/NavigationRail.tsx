import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { getGlowStyles, useTheme, Theme } from "../providers/ThemeProvider";
import Badge from "./Badge";
import Icon from "./Icon";
import Typography from "./Typography";
import type { NavigationBarItem } from "./NavigationBar";
import type { PressableState } from "./types";
import { activeGlyph } from "./internal/activeGlyph";

// M3 navigation rail: 80dp container, 56x32 active indicator, 56dp per item.
const RAIL_WIDTH = 80;
const INDICATOR_WIDTH = 56;
const INDICATOR_HEIGHT = 32;

export interface NavigationRailProps {
  /** Destinations, same shape as `NavigationBar`'s. Three to seven per M3. */
  items: NavigationBarItem[];
  /** `id` of the current destination. */
  activeId: string;
  onItemPress: (id: string) => void;
  /**
   * `"always"` labels every destination, `"selected"` only the active one,
   * `"none"` none (the label is still the accessible name). Defaults to `"always"`.
   */
  showLabels?: "always" | "selected" | "none";
  /** Above the destinations: typically a menu `IconButton` and/or a `FAB`. */
  header?: React.ReactNode;
  /** Pinned to the bottom of the rail. */
  footer?: React.ReactNode;
  /** Where the destinations sit vertically. Defaults to `"top"`. */
  alignment?: "top" | "center";
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * The Material 3 navigation rail: the side-mounted counterpart of
 * `NavigationBar` for medium and expanded windows. Presentational only — it
 * reports presses, and the app's router decides what they mean.
 */
const NavigationRail = ({
  items,
  activeId,
  onItemPress,
  showLabels = "always",
  header,
  footer,
  alignment = "top",
  style,
  testID,
}: NavigationRailProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View
      style={[styles.container, style]}
      accessibilityRole="tablist"
      aria-orientation="vertical"
      testID={testID}
    >
      {header != null && <View style={styles.header}>{header}</View>}
      <View
        style={[
          styles.items,
          alignment === "center" && { justifyContent: "center" },
        ]}
      >
        {items.map((item) => {
          const active = item.id === activeId;
          const icon = activeGlyph(item.icon, active);
          const showLabel =
            showLabels === "always" || (showLabels === "selected" && active);

          return (
            <Pressable
              key={item.id}
              onPress={() => onItemPress(item.id)}
              disabled={item.disabled}
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: active, disabled: item.disabled }}
              style={[styles.item, item.disabled && styles.disabled]}
            >
              {({ hovered, pressed, focused }: PressableState) => (
                <>
                  <View
                    style={[
                      styles.indicator,
                      active && {
                        backgroundColor: theme.colors.secondaryContainer,
                      },
                      !active &&
                        (hovered || pressed) && {
                          backgroundColor: theme.colors.surfaceContainerHigh,
                        },
                      focused && Platform.OS === "web" && styles.focused,
                    ]}
                  >
                    <Icon
                      source={icon}
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
                    <Typography
                      variant="labelMedium"
                      numberOfLines={1}
                      style={{
                        color: active
                          ? theme.colors.onSurface
                          : theme.colors.onSurfaceVariant,
                      }}
                    >
                      {item.label}
                    </Typography>
                  )}
                </>
              )}
            </Pressable>
          );
        })}
      </View>
      {footer != null && <View style={styles.footer}>{footer}</View>}
    </View>
  );
};

export default NavigationRail;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      width: RAIL_WIDTH,
      alignSelf: "stretch",
      alignItems: "center",
      paddingVertical: theme.spacing.m,
      gap: theme.spacing.m,
      backgroundColor: theme.colors.surface,
    },
    header: {
      alignItems: "center",
      gap: theme.spacing.s,
    },
    items: {
      flex: 1,
      alignSelf: "stretch",
      alignItems: "center",
      gap: theme.spacing.s,
    },
    item: {
      alignSelf: "stretch",
      alignItems: "center",
      gap: theme.spacing.xs,
      minHeight: 56,
      paddingVertical: theme.spacing.xs,
      ...Platform.select({ web: { cursor: "pointer" } }),
    },
    indicator: {
      width: INDICATOR_WIDTH,
      height: INDICATOR_HEIGHT,
      borderRadius: INDICATOR_HEIGHT / 2,
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({
        web: {
          transitionProperty: "background-color" as any,
          transitionDuration: "150ms" as any,
        },
      }),
    },
    focused: getGlowStyles(theme, true),
    disabled: { opacity: 0.38 },
    badge: {
      position: "absolute",
      top: -4,
      right: 4,
    },
    footer: {
      alignItems: "center",
      gap: theme.spacing.s,
    },
  });
