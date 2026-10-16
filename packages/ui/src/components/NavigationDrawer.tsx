import React, { createContext, useContext, useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { getGlowStyles, useTheme, Theme } from "../providers/ThemeProvider";
import Collapse from "./Collapse";
import Divider from "./Divider";
import Icon from "./Icon";
import Typography from "./Typography";
import SideOverlay from "./internal/SideOverlay";
import type { MaterialCommunityIconsGlyphs, PressableState } from "./types";
import { activeGlyph } from "./internal/activeGlyph";

// M3 navigation drawer: up to 360dp wide, 56dp items with a full-width pill
// indicator inset 12dp from the container edges.
const DRAWER_WIDTH = 360;
const ITEM_HEIGHT = 56;
const ITEM_INSET = 12;
// Icons only: the width of a navigation rail.
const COLLAPSED_WIDTH = 72;
const LEVEL_INDENT = 16;

// Internal: how deep an item sits, and whether the drawer shows icons only.
const LevelContext = createContext(0);
const CollapsedContext = createContext(false);

export interface DrawerItemProps {
  label: string;
  /** Leading glyph. The active state strips an "-outline" suffix. */
  icon?: MaterialCommunityIconsGlyphs;
  /** Whether this is the current destination. */
  selected?: boolean;
  /** Trailing text, e.g. an unread count: `24`, `"100+"`. */
  badge?: string | number;
  /** Optional for an item with `children`, whose press opens and closes them. */
  onPress?: () => void;
  /**
   * Sub-items (`DrawerItem`s): makes this a group. Pressing it toggles them,
   * and they are indented one level. Hidden while the drawer is `collapsed`.
   */
  children?: React.ReactNode;
  /** For a group: start open. Defaults to `false`. */
  defaultExpanded?: boolean;
  /** For a group: called with the new state after the user toggles it. */
  onToggle?: (expanded: boolean) => void;
  disabled?: boolean;
  testID?: string;
}

/** One destination in a `NavigationDrawer`. */
export const DrawerItem = ({
  label,
  icon,
  selected = false,
  badge,
  onPress,
  children,
  defaultExpanded = false,
  onToggle,
  disabled = false,
  testID,
}: DrawerItemProps) => {
  const { theme } = useTheme();
  const level = useContext(LevelContext);
  const collapsed = useContext(CollapsedContext);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const isGroup = React.Children.toArray(children).length > 0;
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const content = selected
    ? theme.colors.onSecondaryContainer
    : theme.colors.onSurfaceVariant;
  const glyph = icon && activeGlyph(icon, selected);

  const press = () => {
    if (isGroup) {
      const next = !expanded;
      setExpanded(next);
      onToggle?.(next);
    }
    onPress?.();
  };

  const row = (
    <Pressable
      onPress={press}
      disabled={disabled}
      accessibilityRole={isGroup ? "button" : "link"}
      accessibilityLabel={label}
      accessibilityState={{
        selected,
        disabled,
        expanded: isGroup ? expanded : undefined,
      }}
      aria-current={selected ? "page" : undefined}
      testID={testID}
      style={({ hovered, pressed, focused }: PressableState) => [
        styles.item,
        !collapsed &&
          level > 0 && { paddingStart: theme.spacing.m + level * LEVEL_INDENT },
        collapsed && styles.itemCollapsed,
        selected && { backgroundColor: theme.colors.secondaryContainer },
        !selected &&
          (hovered || pressed) && {
            backgroundColor: theme.colors.surfaceContainerHigh,
          },
        focused && Platform.OS === "web" && styles.focused,
        disabled && styles.disabled,
      ]}
    >
      {glyph ? (
        <Icon source={glyph} size={24} color={content} />
      ) : (
        // Icons only and no icon given: the first letter of the label stands in.
        collapsed && (
          <Typography variant="titleMedium" style={{ color: content }}>
            {label.charAt(0).toUpperCase()}
          </Typography>
        )
      )}
      {!collapsed && (
        <Typography
          variant="labelLarge"
          numberOfLines={1}
          style={[styles.itemLabel, { color: content }]}
        >
          {label}
        </Typography>
      )}
      {!collapsed && badge != null && badge !== "" && (
        <Typography variant="labelLarge" style={{ color: content }}>
          {String(badge)}
        </Typography>
      )}
      {!collapsed && isGroup && (
        <Icon
          source={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={content}
        />
      )}
    </Pressable>
  );

  if (!isGroup) return row;
  return (
    <>
      {row}
      {!collapsed && (
        <LevelContext.Provider value={level + 1}>
          <Collapse open={expanded}>{children}</Collapse>
        </LevelContext.Provider>
      )}
    </>
  );
};

export interface DrawerSectionProps {
  /** Section headline. */
  title?: string;
  children: React.ReactNode;
  /** Draws a divider above the section — between it and the one before. */
  showDivider?: boolean;
  /** Makes the title a button that opens and closes the items. Needs a `title`. */
  collapsible?: boolean;
  /** For a collapsible section: start open. Defaults to `true`. */
  defaultExpanded?: boolean;
  /** For a collapsible section: called with the new state after the user toggles it. */
  onToggle?: (expanded: boolean) => void;
}

/** A titled group of `DrawerItem`s. */
export const DrawerSection = ({
  title,
  children,
  showDivider = false,
  collapsible = false,
  defaultExpanded = true,
  onToggle,
}: DrawerSectionProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const collapsed = useContext(CollapsedContext);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const canCollapse = collapsible && !!title && !collapsed;

  let heading: React.ReactNode = null;
  if (!!title && !collapsed) {
    heading = canCollapse ? (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded }}
        onPress={() => {
          setExpanded(!expanded);
          onToggle?.(!expanded);
        }}
        style={[
          styles.sectionTitleRow,
          Platform.select({ web: { cursor: "pointer" } }),
        ]}
      >
        <Typography
          variant="titleSmall"
          accessibilityRole="header"
          style={styles.sectionTitleText}
        >
          {title}
        </Typography>
        <Icon
          source={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={theme.colors.onSurfaceVariant}
        />
      </Pressable>
    ) : (
      <Typography
        variant="titleSmall"
        accessibilityRole="header"
        style={styles.sectionTitle}
      >
        {title}
      </Typography>
    );
  }

  return (
    <View style={styles.section}>
      {showDivider && <Divider style={styles.divider} />}
      {heading}
      {canCollapse ? <Collapse open={expanded}>{children}</Collapse> : children}
    </View>
  );
};

export interface NavigationDrawerProps {
  /**
   * `"standard"` is an inline panel to place beside the content (expanded
   * windows and up). `"modal"` slides over the content with a scrim.
   * Defaults to `"standard"`.
   */
  variant?: "standard" | "modal";
  /** Modal only: whether the drawer is open. */
  visible?: boolean;
  /** Modal only: called on scrim press, Android back and Escape (web). */
  onDismiss?: () => void;
  /** Pinned above the scrolling items: a logo, a site picker. */
  header?: React.ReactNode;
  /**
   * Icons only, 72 wide: labels, badges, titles and sub-items are hidden (an
   * item without an icon shows its first letter). Defaults to `false`.
   */
  collapsed?: boolean;
  /** Headline at the top of the drawer. */
  title?: string;
  /** `DrawerSection`s and/or `DrawerItem`s. */
  children: React.ReactNode;
  /** Pinned below the scrolling items. */
  footer?: React.ReactNode;
  /** Defaults to 360 (M3), capped at the window width when modal. */
  width?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * The Material 3 navigation drawer. Presentational and navigator-agnostic: it
 * lays out destinations and reports presses; the app's router owns the rest.
 */
const NavigationDrawer = ({
  variant = "standard",
  visible = false,
  onDismiss,
  header,
  collapsed = false,
  title,
  children,
  footer,
  width: widthProp = DRAWER_WIDTH,
  style,
  testID,
}: NavigationDrawerProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const width = collapsed ? COLLAPSED_WIDTH : widthProp;

  const body = (
    <View style={styles.body} role="navigation">
      {header != null && <View style={styles.header}>{header}</View>}
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          collapsed && styles.scrollCollapsed,
        ]}
      >
        {!!title && !collapsed && (
          <Typography
            variant="titleSmall"
            accessibilityRole="header"
            style={styles.headline}
          >
            {title}
          </Typography>
        )}
        {children}
      </ScrollView>
      {footer != null && <View style={styles.footer}>{footer}</View>}
    </View>
  );

  const withContext = (node: React.ReactNode) => (
    <CollapsedContext.Provider value={collapsed}>
      {node}
    </CollapsedContext.Provider>
  );

  if (variant === "modal") {
    return withContext(
      <SideOverlay
        visible={visible}
        onDismiss={onDismiss}
        side="start"
        width={width}
        scrimLabel="Close navigation drawer"
        panelStyle={style}
        testID={testID}
      >
        {body}
      </SideOverlay>,
    );
  }

  return withContext(
    <View style={[styles.standard, { width }, style]} testID={testID}>
      {body}
    </View>,
  );
};

export default NavigationDrawer;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    standard: {
      alignSelf: "stretch",
      maxWidth: "100%",
      backgroundColor: theme.colors.surface,
    },
    body: { flex: 1 },
    header: { paddingHorizontal: ITEM_INSET, paddingTop: ITEM_INSET },
    scrollCollapsed: { paddingHorizontal: theme.spacing.s },
    scroll: {
      paddingHorizontal: ITEM_INSET,
      paddingVertical: ITEM_INSET,
    },
    headline: {
      color: theme.colors.onSurfaceVariant,
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.m,
    },
    section: { paddingBottom: theme.spacing.s },
    sectionTitle: {
      color: theme.colors.onSurfaceVariant,
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.m,
    },
    sectionTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.m,
    },
    sectionTitleText: { color: theme.colors.onSurfaceVariant },
    divider: {
      marginHorizontal: theme.spacing.m,
      marginBottom: theme.spacing.s,
    },
    item: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.s + theme.spacing.xs,
      minHeight: ITEM_HEIGHT,
      paddingStart: theme.spacing.m,
      paddingEnd: theme.spacing.l,
      borderRadius: ITEM_HEIGHT / 2,
      ...Platform.select({ web: { cursor: "pointer" } }),
    },
    itemLabel: { flex: 1 },
    itemCollapsed: {
      justifyContent: "center",
      paddingStart: 0,
      paddingEnd: 0,
      gap: 0,
    },
    focused: getGlowStyles(theme, true),
    disabled: { opacity: 0.38 },
    footer: {
      paddingHorizontal: ITEM_INSET,
      paddingVertical: theme.spacing.s,
    },
  });
