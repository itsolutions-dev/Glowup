import React, { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Animated } from "react-native";
import Icons from "../Glyph";
import { useTheme, getGlowStyles } from "../../providers/ThemeProvider";
import { MaterialCommunityIconsGlyphs, PressableState } from "../types";

export interface TabItem {
  label: string;
  /** Shows the icon variant of the bar. Give it to every tab or to none. */
  icon?: string;
  /** Identifies the tab for `activeKey` and `onChange`, whatever its position. */
  key?: string;
  /** Greys the tab out and ignores presses. */
  disabled?: boolean;
}

export interface TabProps {
  tabs: TabItem[] | string[];
  /** The active tab by position. Ignored when `activeKey` is given. Defaults to 0. */
  activeTab?: number;
  /** The active tab by its `key`, for tabs that come and go (by role, by flag). */
  activeKey?: string;
  /** Called with the pressed tab's position and, when it has one, its `key`. */
  onChange: (index: number, key?: string) => void;
}

const Tabs = ({ tabs, activeTab = 0, activeKey, onChange }: TabProps) => {
  const { theme } = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);
  const [indicatorAnim] = useState(() => new Animated.Value(0));

  const hasIcons =
    Array.isArray(tabs) &&
    tabs.length > 0 &&
    typeof tabs[0] !== "string" &&
    !!tabs[0].icon;

  const tabWidth = containerWidth > 0 ? containerWidth / tabs.length : 0;

  // A key that matches no tab leaves the bar with no active tab, not the first.
  const activeIndex =
    activeKey === undefined
      ? activeTab
      : (tabs as (TabItem | string)[]).findIndex(
          (tab) => typeof tab !== "string" && tab.key === activeKey,
        );

  useEffect(() => {
    if (tabWidth > 0 && activeIndex >= 0) {
      Animated.spring(indicatorAnim, {
        toValue: activeIndex * tabWidth,
        useNativeDriver: true,
        friction: 8,
        tension: 50,
      }).start();
    }
  }, [activeIndex, tabWidth, indicatorAnim]);

  return (
    <View
      style={[
        hasIcons ? styles.containerWithIcons : styles.containerNoIcons,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.outlineVariant,
          ...(hasIcons ? styles.borderTop : styles.borderBottom),
        },
      ]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      accessibilityRole="tablist"
    >
      {tabs.map((tab, index) => {
        const isActive = activeIndex === index;
        const label = typeof tab === "string" ? tab : tab.label;
        const tabKey = typeof tab === "string" ? undefined : tab.key;
        const disabled = typeof tab !== "string" && !!tab.disabled;
        const iconName =
          hasIcons && typeof tab !== "string"
            ? isActive
              ? tab.icon
              : `${tab.icon}-outline`
            : undefined;

        return (
          <Pressable
            key={tabKey ?? index}
            disabled={disabled}
            onPress={() => onChange(index, tabKey)}
            style={({ hovered, pressed }: PressableState) => [
              styles.tabItem,
              disabled && styles.disabled,
              !disabled && (hovered || pressed) && getGlowStyles(theme, true),
              // Use theme-defined state layer colors for consistency
              !disabled &&
                hovered && {
                  backgroundColor: `${theme.colors.primary}08`,
                },
              !disabled &&
                pressed && {
                  backgroundColor: `${theme.colors.primary}12`,
                },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive, disabled }}
            aria-selected={isActive}
            accessibilityLabel={label}
          >
            {hasIcons && !!iconName && (
              <View style={styles.iconWrapper}>
                {isActive && (
                  <View
                    style={[
                      styles.activePill,
                      { backgroundColor: theme.colors.secondaryContainer },
                    ]}
                  />
                )}
                <Icons
                  name={iconName as MaterialCommunityIconsGlyphs}
                  size={24}
                  color={
                    isActive
                      ? theme.colors.onSecondaryContainer
                      : theme.colors.onSurfaceVariant
                  }
                />
              </View>
            )}
            <Text
              style={[
                styles.label,
                hasIcons
                  ? theme.typography.labelMedium
                  : theme.typography.labelLarge,
                {
                  color: isActive
                    ? theme.colors.primary
                    : theme.colors.onSurfaceVariant,
                },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}

      {/* Animated Active Indicator */}
      <Animated.View
        style={[
          styles.indicator,
          {
            width: tabWidth,
            opacity: activeIndex < 0 ? 0 : 1,
            backgroundColor: theme.colors.primary,
            transform: [{ translateX: indicatorAnim }],
          },
        ]}
      />
    </View>
  );
};

export default Tabs;

const styles = StyleSheet.create({
  containerNoIcons: {
    flexDirection: "row",
    height: 48,
    width: "100%",
  },
  containerWithIcons: {
    flexDirection: "row",
    height: 80,
    width: "100%",
    paddingBottom: 12,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  disabled: { opacity: 0.38 },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  iconWrapper: {
    height: 32,
    width: 64,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  activePill: {
    position: "absolute",
    height: "100%",
    width: "100%",
    borderRadius: 16,
  },
  label: {},
  indicator: {
    position: "absolute",
    bottom: 0,
    height: 3,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
});
