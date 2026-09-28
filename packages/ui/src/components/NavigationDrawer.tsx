import React, { useMemo } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { getGlowStyles, useTheme, Theme } from "../providers/ThemeProvider";
import Divider from "./Divider";
import Icon from "./Icon";
import Typography from "./Typography";
import SideOverlay from "./internal/SideOverlay";
import type { MaterialCommunityIconsGlyphs, PressableState } from "./types";

// M3 navigation drawer: up to 360dp wide, 56dp items with a full-width pill
// indicator inset 12dp from the container edges.
const DRAWER_WIDTH = 360;
const ITEM_HEIGHT = 56;
const ITEM_INSET = 12;

export interface DrawerItemProps {
  label: string;
  /** Leading glyph. The active state strips an "-outline" suffix. */
  icon?: MaterialCommunityIconsGlyphs;
  /** Whether this is the current destination. */
  selected?: boolean;
  /** Trailing text, e.g. an unread count: `24`, `"100+"`. */
  badge?: string | number;
  onPress: () => void;
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
  disabled = false,
  testID,
}: DrawerItemProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const content = selected
    ? theme.colors.onSecondaryContainer
    : theme.colors.onSurfaceVariant;
  const glyph =
    icon && selected && icon.endsWith("-outline")
      ? (icon.replace(/-outline$/, "") as MaterialCommunityIconsGlyphs)
      : icon;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="link"
      accessibilityLabel={label}
      accessibilityState={{ selected, disabled }}
      aria-current={selected ? "page" : undefined}
      testID={testID}
      style={({ hovered, pressed, focused }: PressableState) => [
        styles.item,
        selected && { backgroundColor: theme.colors.secondaryContainer },
        !selected &&
          (hovered || pressed) && {
            backgroundColor: theme.colors.surfaceContainerHigh,
          },
        focused && Platform.OS === "web" && styles.focused,
        disabled && styles.disabled,
      ]}
    >
      {glyph && <Icon source={glyph} size={24} color={content} />}
      <Typography
        variant="labelLarge"
        numberOfLines={1}
        style={[styles.itemLabel, { color: content }]}
      >
        {label}
      </Typography>
      {badge != null && badge !== "" && (
        <Typography variant="labelLarge" style={{ color: content }}>
          {String(badge)}
        </Typography>
      )}
    </Pressable>
  );
};

export interface DrawerSectionProps {
  /** Section headline. */
  title?: string;
  children: React.ReactNode;
  /** Draws a divider above the section — between it and the one before. */
  showDivider?: boolean;
}

/** A titled group of `DrawerItem`s. */
export const DrawerSection = ({
  title,
  children,
  showDivider = false,
}: DrawerSectionProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={styles.section}>
      {showDivider && <Divider style={styles.divider} />}
      {!!title && (
        <Typography
          variant="titleSmall"
          accessibilityRole="header"
          style={styles.sectionTitle}
        >
          {title}
        </Typography>
      )}
      {children}
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
  title,
  children,
  footer,
  width = DRAWER_WIDTH,
  style,
  testID,
}: NavigationDrawerProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const body = (
    <View style={styles.body} role="navigation">
      <ScrollView contentContainerStyle={styles.scroll}>
        {!!title && (
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

  if (variant === "modal") {
    return (
      <SideOverlay
        visible={visible}
        onDismiss={onDismiss ?? (() => {})}
        side="start"
        width={width}
        scrimLabel="Close navigation drawer"
        panelStyle={[styles.modalPanel, style]}
        testID={testID}
      >
        {body}
      </SideOverlay>
    );
  }

  return (
    <View style={[styles.standard, { width }, style]} testID={testID}>
      {body}
    </View>
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
    modalPanel: {
      backgroundColor: theme.colors.surfaceContainerLow,
      // M3: the modal drawer's trailing corners are extra-large.
      borderTopEndRadius: theme.shape.large,
      borderBottomEndRadius: theme.shape.large,
      overflow: "hidden",
    },
    body: { flex: 1 },
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
    focused: getGlowStyles(theme, true),
    disabled: { opacity: 0.38 },
    footer: {
      paddingHorizontal: ITEM_INSET,
      paddingVertical: theme.spacing.s,
    },
  });
