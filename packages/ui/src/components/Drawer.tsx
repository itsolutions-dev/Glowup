import React, { createContext, useContext, useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { getFocusRing, useTheme, Theme } from "../providers/ThemeProvider";
import Collapse from "./Collapse";
import Divider from "./Divider";
import Icon from "./Icon";
import IconButton from "./IconButton";
import Typography from "./Typography";
import SideOverlay from "./internal/SideOverlay";
import { elevationStyle } from "./internal/elevation";
import type { MaterialCommunityIconsGlyphs, PressableState } from "./types";
import { activeGlyph } from "./internal/activeGlyph";

// M3 navigation drawer: up to 360dp wide, 56dp items with a full-width pill
// indicator inset 12dp from the container edges.
const DRAWER_WIDTH = 360;
// Top and bottom drawers: the tallest they grow before their content scrolls.
const DRAWER_HEIGHT = 360;
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
  onClick?: () => void;
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

/** One destination in a `Drawer`. */
export const DrawerItem = ({
  label,
  icon,
  selected = false,
  badge,
  onClick,
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
    onClick?.();
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

export interface DrawerProps {
  /**
   * `"static"` is a permanent panel in the layout, beside the content, with no
   * scrim. `"swipeable"` slides over the content on a scrim, and a drag toward
   * its edge, the scrim, Android back and Escape (web) close it.
   * Defaults to `"static"`.
   */
  variant?: "static" | "swipeable";
  /**
   * The window edge it is attached to: `"left"` and `"right"` are columns of
   * `width`, `"top"` and `"bottom"` span the full width and are as tall as
   * their content, up to `height`. The edges are physical, not mirrored in
   * right-to-left layouts. Defaults to `"left"`.
   */
  position?: "left" | "right" | "top" | "bottom";
  /** Swipeable only: whether the drawer is open. */
  visible?: boolean;
  /**
   * Called by the close button, and by a swipeable drawer's scrim, closing
   * drag, Android back and Escape (web).
   */
  onClose?: () => void;
  /**
   * The level of the surface, 0 to 5: the tone it is painted in and, on iOS
   * and Android, its shadow. Defaults to `0` when static and `1` when
   * swipeable.
   */
  elevation?: number;
  /** Pinned above the scrolling items: a logo, a site picker. */
  header?: React.ReactNode;
  /**
   * Icons only, 72 wide: labels, badges, titles and sub-items are hidden (an
   * item without an icon shows its first letter). Defaults to `false`.
   */
  collapsed?: boolean;
  /**
   * Headline at the top of the drawer. With a close button, a back button or
   * `actions` it is the title of a header row instead, in a larger type.
   */
  title?: string;
  /**
   * `DrawerSection`s and/or `DrawerItem`s, or any content when the drawer is a
   * side sheet (a form, filters, details).
   */
  children: React.ReactNode;
  /** Pinned below the scrolling items. */
  footer?: React.ReactNode;
  /** A row of buttons at the bottom, below a divider. */
  actions?: React.ReactNode;
  /** Adds a close button to the header row, which calls `onClose`. Defaults to `false`. */
  showCloseButton?: boolean;
  /** Shows a back button before the title, for a drawer with sub-pages. */
  onBack?: () => void;
  /** Left and right: defaults to 360 (M3), capped at the window width when swipeable. */
  width?: number;
  /** Top and bottom: the largest height, defaults to 360. */
  height?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * The Material 3 navigation drawer, which doubles as a side sheet: with
 * `position`, any content as `children` and a close button, it holds filters,
 * details or a form on any edge of the window. Presentational and
 * navigator-agnostic: it lays out destinations and reports presses; the app's
 * router owns the rest.
 */
const Drawer = ({
  variant = "static",
  position = "left",
  visible = false,
  onClose,
  elevation: elevationProp,
  header,
  collapsed = false,
  title,
  children,
  footer,
  actions,
  showCloseButton = false,
  onBack,
  width: widthProp = DRAWER_WIDTH,
  height = DRAWER_HEIGHT,
  style,
  testID,
}: DrawerProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const swipeable = variant === "swipeable";
  const vertical = position === "top" || position === "bottom";
  const width = collapsed ? COLLAPSED_WIDTH : widthProp;
  const surface = elevationStyle(theme, elevationProp ?? (swipeable ? 1 : 0));
  // A header row or actions make it a sheet of arbitrary content, not a
  // navigation landmark.
  const sheet = showCloseButton || !!onBack || actions != null;
  const headerRow = sheet && !collapsed;

  const body = (
    <View
      style={vertical ? styles.bodyFit : styles.body}
      role={sheet ? undefined : "navigation"}
    >
      {headerRow && (
        <View style={styles.sheetHeader}>
          {onBack && (
            <IconButton
              icon="arrow-left"
              accessibilityLabel="Back"
              onClick={onBack}
            />
          )}
          <Typography
            variant="titleLarge"
            accessibilityRole="header"
            numberOfLines={1}
            style={[styles.sheetTitle, !onBack && styles.sheetTitleStart]}
          >
            {title ?? ""}
          </Typography>
          {showCloseButton && (
            <IconButton
              icon="close"
              accessibilityLabel="Close"
              onClick={onClose}
              testID={testID ? `${testID}-close` : undefined}
            />
          )}
        </View>
      )}
      {header != null && <View style={styles.header}>{header}</View>}
      <ScrollView
        style={vertical ? styles.scrollFit : undefined}
        contentContainerStyle={[
          sheet ? styles.scrollSheet : styles.scroll,
          collapsed && styles.scrollCollapsed,
        ]}
      >
        {!!title && !collapsed && !headerRow && (
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
      {actions != null && (
        <>
          <Divider />
          <View style={styles.actions}>{actions}</View>
        </>
      )}
    </View>
  );

  const withContext = (node: React.ReactNode) => (
    <CollapsedContext.Provider value={collapsed}>
      {node}
    </CollapsedContext.Provider>
  );

  if (swipeable) {
    return withContext(
      <SideOverlay
        visible={visible}
        onClose={onClose}
        position={position}
        width={width}
        height={height}
        scrimLabel="Close drawer"
        panelStyle={[surface, style]}
        testID={testID}
      >
        {body}
      </SideOverlay>,
    );
  }

  return withContext(
    <View
      style={[
        styles.static,
        surface,
        styles[`edge_${position}` as const],
        vertical ? { maxHeight: height } : { width },
        style,
      ]}
      testID={testID}
    >
      {body}
    </View>,
  );
};

export default Drawer;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    static: { alignSelf: "stretch", maxWidth: "100%" },
    // A hairline on the edge that faces the content.
    edge_left: {
      borderRightWidth: 1,
      borderRightColor: theme.colors.outlineVariant,
    },
    edge_right: {
      borderLeftWidth: 1,
      borderLeftColor: theme.colors.outlineVariant,
    },
    edge_top: {
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    edge_bottom: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
    },
    body: { flex: 1 },
    // Top and bottom: as tall as the content, up to the panel's largest height.
    bodyFit: { flexShrink: 1 },
    scrollFit: { flexGrow: 0, flexShrink: 1 },
    sheetHeader: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 72,
      paddingHorizontal: theme.spacing.s,
      paddingTop: theme.spacing.s,
    },
    sheetTitle: { flex: 1 },
    sheetTitleStart: { paddingStart: theme.spacing.s },
    scrollSheet: {
      paddingHorizontal: theme.spacing.l,
      paddingBottom: theme.spacing.l,
    },
    actions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: theme.spacing.s,
      paddingHorizontal: theme.spacing.l,
      paddingVertical: theme.spacing.m,
    },
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
    focused: getFocusRing(theme),
    disabled: { opacity: 0.38 },
    footer: {
      paddingHorizontal: ITEM_INSET,
      paddingVertical: theme.spacing.s,
    },
  });
