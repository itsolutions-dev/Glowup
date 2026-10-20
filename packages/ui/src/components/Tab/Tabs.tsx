import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Animated,
} from "react-native";
import type { DimensionValue, LayoutChangeEvent } from "react-native";
import Icons from "../Glyph";
import { useTheme, getGlowStyles, Theme } from "../../providers/ThemeProvider";
import { colorRoleTokens } from "../internal/colorRole";
import type { ColorRole } from "../internal/colorRole";
import { useReduceMotion } from "../internal/useReduceMotion";
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
  /**
   * `"standard"` is a bar with an underline under the active tab. `"rounded"`
   * is a pill-shaped active tab on a rounded track. Defaults to `"standard"`.
   */
  variant?: "standard" | "rounded";
  /**
   * Draws dividers between the tabs and, in the `"rounded"` variant, an outline
   * around the track. Defaults to `false`.
   */
  showBorders?: boolean;
  /** The height and the type of the tabs. Defaults to `"md"`. */
  size?: "sm" | "md" | "lg";
  /**
   * `true` stretches the bar over the width it has and shares it equally
   * between the tabs. `false` sizes each tab to its label, and the bar scrolls
   * horizontally when they do not fit. Defaults to `true`.
   */
  fullWidth?: boolean;
  /** Overrides the height of the bar: a number of dp, or a percentage. */
  height?: number | string;
  /** Overrides the width of the bar: a number of dp, or a percentage. */
  width?: number | string;
  /** The colour role of the indicator and of the selected tab. Defaults to `"primary"`. */
  color?: ColorRole;
  testID?: string;
}

// Height of a bar of tabs with a label only and with an icon above it, the
// type of each, and the icon and its pill.
const SIZES = {
  sm: {
    height: 40,
    iconHeight: 64,
    label: "labelMedium",
    stacked: "labelSmall",
    glyph: 20,
    pill: { width: 56, height: 28 },
  },
  md: {
    height: 48,
    iconHeight: 80,
    label: "labelLarge",
    stacked: "labelMedium",
    glyph: 24,
    pill: { width: 64, height: 32 },
  },
  lg: {
    height: 56,
    iconHeight: 96,
    label: "titleMedium",
    stacked: "labelLarge",
    glyph: 28,
    pill: { width: 72, height: 36 },
  },
} as const;

// The room the rounded track leaves around its tabs.
const TRACK_PADDING = 4;

interface TabLayout {
  x: number;
  width: number;
}

const Tabs = ({
  tabs,
  activeTab = 0,
  activeKey,
  onChange,
  variant = "standard",
  showBorders = false,
  size = "md",
  fullWidth = true,
  height,
  width,
  color = "primary",
  testID,
}: TabProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const reduceMotion = useReduceMotion();
  const role = colorRoleTokens(theme, color);
  const rounded = variant === "rounded";
  const dims = SIZES[size];
  const list = tabs as (TabItem | string)[];

  // Where each tab sits, measured: the indicator follows the active one whether
  // the tabs share the width or size to their labels.
  const [layouts, setLayouts] = useState<Record<number, TabLayout>>({});
  const [barLeft] = useState(() => new Animated.Value(0));
  const [barWidth] = useState(() => new Animated.Value(0));
  const placed = useRef(false);

  const hasIcons =
    list.length > 0 && typeof list[0] !== "string" && !!list[0].icon;
  // The rounded variant puts the icon before the label instead of above it.
  const stacked = hasIcons && !rounded;

  // A key that matches no tab leaves the bar with no active tab, not the first.
  const activeIndex =
    activeKey === undefined
      ? activeTab
      : list.findIndex(
          (tab) => typeof tab !== "string" && tab.key === activeKey,
        );

  const target = activeIndex >= 0 ? layouts[activeIndex] : undefined;
  const targetX = target?.x;
  const targetWidth = target?.width;
  useEffect(() => {
    if (targetX === undefined || targetWidth === undefined) return;
    // The first placement is not a movement.
    if (!placed.current || reduceMotion) {
      placed.current = true;
      barLeft.setValue(targetX);
      barWidth.setValue(targetWidth);
      return;
    }
    // `left` and `width` are layout properties: the native driver cannot move them.
    const spring = (value: Animated.Value, toValue: number) =>
      Animated.spring(value, {
        toValue,
        useNativeDriver: false,
        friction: 8,
        tension: 50,
      });
    Animated.parallel([
      spring(barLeft, targetX),
      spring(barWidth, targetWidth),
    ]).start();
  }, [targetX, targetWidth, barLeft, barWidth, reduceMotion]);

  const onTabLayout = (index: number) => (e: LayoutChangeEvent) => {
    const { x, width: w } = e.nativeEvent.layout;
    setLayouts((prev) =>
      prev[index]?.x === x && prev[index]?.width === w
        ? prev
        : { ...prev, [index]: { x, width: w } },
    );
  };

  const barHeight = height ?? (stacked ? dims.iconHeight : dims.height);
  const indicator = (
    <Animated.View
      pointerEvents="none"
      testID={testID ? `${testID}-indicator` : undefined}
      style={[
        rounded ? styles.pill : styles.underline,
        {
          left: barLeft,
          width: barWidth,
          opacity: target ? 1 : 0,
          backgroundColor: role.main,
        },
      ]}
    />
  );

  const items = list.map((tab, index) => {
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
    // Beside the pill of the active tab a divider would be cut by it.
    const divider =
      showBorders &&
      index < list.length - 1 &&
      !(rounded && (isActive || activeIndex === index + 1));
    const labelColor = isActive
      ? rounded
        ? role.onMain
        : role.main
      : theme.colors.onSurfaceVariant;

    return (
      <Pressable
        key={tabKey ?? index}
        disabled={disabled}
        onPress={() => onChange(index, tabKey)}
        onLayout={onTabLayout(index)}
        style={({ hovered, pressed }: PressableState) => [
          styles.tabItem,
          fullWidth ? styles.tabFill : styles.tabFit,
          rounded && styles.tabRounded,
          disabled && styles.disabled,
          !disabled && (hovered || pressed) && getGlowStyles(theme, true),
          // Use theme-defined state layer colors for consistency
          !disabled &&
            hovered && {
              backgroundColor: `${role.main}08`,
            },
          !disabled &&
            pressed && {
              backgroundColor: `${role.main}12`,
            },
        ]}
        accessibilityRole="tab"
        accessibilityState={{ selected: isActive, disabled }}
        aria-selected={isActive}
        accessibilityLabel={label}
      >
        {!!iconName && stacked && (
          <View
            style={[
              styles.iconWrapper,
              { width: dims.pill.width, height: dims.pill.height },
            ]}
          >
            {isActive && (
              <View
                style={[styles.activePill, { backgroundColor: role.container }]}
              />
            )}
            <Icons
              name={iconName as MaterialCommunityIconsGlyphs}
              size={dims.glyph}
              color={
                isActive ? role.onContainer : theme.colors.onSurfaceVariant
              }
            />
          </View>
        )}
        {!!iconName && rounded && (
          <Icons
            name={iconName as MaterialCommunityIconsGlyphs}
            size={dims.glyph - 6}
            color={labelColor}
          />
        )}
        <Text
          style={[
            theme.typography[stacked ? dims.stacked : dims.label],
            { color: labelColor },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {divider && (
          <View
            style={styles.divider}
            testID={testID ? `${testID}-divider-${index}` : undefined}
          />
        )}
      </Pressable>
    );
  });

  const row = [styles.row, rounded && styles.rowRounded];
  return (
    <View
      testID={testID}
      accessibilityRole="tablist"
      style={[
        rounded ? styles.track : styles.bar,
        rounded && showBorders && styles.trackBorder,
        // A track hugs its tabs; an underline bar keeps its divider across.
        rounded && !fullWidth && width === undefined && styles.trackFit,
        {
          height: barHeight as DimensionValue,
          width: (width ?? (fullWidth ? "100%" : undefined)) as DimensionValue,
        },
      ]}
    >
      {fullWidth ? (
        <View style={row}>
          {rounded && indicator}
          {items}
          {!rounded && indicator}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={row}
          testID={testID ? `${testID}-scroll` : undefined}
        >
          {rounded && indicator}
          {items}
          {!rounded && indicator}
        </ScrollView>
      )}
    </View>
  );
};

export default Tabs;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    bar: {
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
      maxWidth: "100%",
    },
    track: {
      backgroundColor: theme.colors.surfaceContainerHigh,
      borderRadius: 9999,
      overflow: "hidden",
      maxWidth: "100%",
    },
    trackFit: { alignSelf: "flex-start" },
    trackBorder: {
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    row: { flexDirection: "row", flexGrow: 1 },
    rowRounded: { padding: TRACK_PADDING },
    disabled: { opacity: 0.38 },
    tabItem: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: theme.spacing.s,
    },
    tabFill: { flex: 1, paddingHorizontal: theme.spacing.s },
    tabFit: { paddingHorizontal: theme.spacing.m, minWidth: 72 },
    tabRounded: {
      flexDirection: "row",
      gap: theme.spacing.s,
      borderRadius: 9999,
    },
    divider: {
      position: "absolute",
      end: 0,
      top: "25%",
      bottom: "25%",
      width: 1,
      backgroundColor: theme.colors.outlineVariant,
    },
    iconWrapper: {
      justifyContent: "center",
      alignItems: "center",
      marginBottom: theme.spacing.xs,
    },
    activePill: {
      position: "absolute",
      height: "100%",
      width: "100%",
      borderRadius: 16,
    },
    underline: {
      position: "absolute",
      bottom: 0,
      height: 3,
      borderTopLeftRadius: 3,
      borderTopRightRadius: 3,
    },
    // Behind the labels: the active tab's own pill.
    pill: {
      position: "absolute",
      top: TRACK_PADDING,
      bottom: TRACK_PADDING,
      borderRadius: 9999,
    },
  });
