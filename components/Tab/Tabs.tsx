import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Platform,
} from "react-native";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme, getGlowStyles } from "../../providers/ThemeProvider";

interface BaseTabItem {
  label: string;
}
interface IconTabItem extends BaseTabItem {
  icon: string;
}
interface StringTabItem extends BaseTabItem {}

interface TabProps {
  tabs: IconTabItem[] | string[];
  activeTab: number;
  onChange: (index: number) => void;
}

const Tabs = ({ tabs, activeTab, onChange }: TabProps) => {
  const { theme } = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);
  const indicatorAnim = useRef(new Animated.Value(0)).current;

  const hasIcons =
    Array.isArray(tabs) &&
    tabs.length > 0 &&
    typeof tabs[0] !== "string" &&
    "icon" in tabs[0];

  const tabWidth = containerWidth > 0 ? containerWidth / tabs.length : 0;

  useEffect(() => {
    if (tabWidth > 0) {
      Animated.spring(indicatorAnim, {
        toValue: activeTab * tabWidth,
        useNativeDriver: true,
        friction: 8,
        tension: 50,
      }).start();
    }
  }, [activeTab, tabWidth, indicatorAnim]);

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
        const isActive = activeTab === index;
        const label = typeof tab === "string" ? tab : tab.label;
        const iconName =
          hasIcons && typeof tab !== "string"
            ? isActive
              ? tab.icon
              : `${tab.icon}-outline`
            : undefined;

        return (
          <Pressable
            key={index}
            onPress={() => onChange(index)}
            style={({ hovered, pressed }) => [
              styles.tabItem,
              (hovered || pressed) && getGlowStyles(theme, true),
              // Use theme-defined state layer colors for consistency
              hovered && {
                backgroundColor: `${theme.colors.primary}08`,
              },
              pressed && {
                backgroundColor: `${theme.colors.primary}12`,
              },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            aria-selected={isActive}
            accessibilityLabel={label}
          >
            {hasIcons && iconName && (
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
                  name={iconName}
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
