import React, { useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import Icons from "./Glyph";
import { useTheme, Theme } from "../providers/ThemeProvider";

import Popover from "./Popover";
import Divider from "./Divider";
import type { AnchorPosition } from "./internal/anchorPlacement";
import { MaterialCommunityIconsGlyphs, PressableState } from "./types";

export interface MenuItem {
  id: string;
  label: string;
  icon?: MaterialCommunityIconsGlyphs;
  /** Trailing hint, e.g. a keyboard shortcut. */
  trailing?: string;
  disabled?: boolean;
  /** Renders label and icon in error color (e.g. "Delete"). */
  destructive?: boolean;
  /** Draws a divider above this item. */
  dividerAbove?: boolean;
  /** Called when the item is clicked, before the menu's own `onClick`. */
  onClick?: () => void;
}

export interface MenuProps {
  /** The element the menu opens from. */
  anchor: React.ReactElement;
  items: MenuItem[];
  /** Whether the menu is open. */
  visible: boolean;
  /** Called on a press outside the menu, on Android back, and after an item is clicked when `closeOnSelect` is on. */
  onClose: () => void;
  /** Close the menu automatically after an item is clicked. Default true. */
  closeOnSelect?: boolean;
  /**
   * Where the menu sits against its anchor: `vertical` is `"bottom"` (below
   * it), `"top"` (above it) or `"center"` (centred on it); `horizontal` lines
   * up the `"left"` edges, the `"right"` edges or the `"center"`s. It flips or
   * slides to stay on screen. Defaults to `{ vertical: "bottom", horizontal: "left" }`.
   */
  anchorPosition?: AnchorPosition;
  /** Draws a divider between every pair of items, on top of any `dividerAbove`. Defaults to `false`. */
  dividers?: boolean;
  /**
   * The `id`s of the items to draw as selected: a tinted row with a check
   * mark, and `accessibilityState.selected` set on it. Items are not marked
   * until you pass it, even as `[]`.
   */
  selected?: string[];
  /** Called with the clicked item, after the item's own `onClick`. */
  onClick?: (item: MenuItem) => void;
}

const Menu = ({
  anchor,
  items,
  visible,
  onClose,
  closeOnSelect = true,
  anchorPosition,
  dividers = false,
  selected,
  onClick,
}: MenuProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const handleItemPress = (item: MenuItem) => {
    if (closeOnSelect) onClose();
    item.onClick?.();
    onClick?.(item);
  };

  return (
    <Popover
      visible={visible}
      onDismiss={onClose}
      anchor={anchor}
      anchorPosition={anchorPosition}
    >
      <View style={styles.menuContent}>
        <ScrollView bounces={false} style={{ maxHeight: 320 }}>
          {items.map((item, index) => {
            const isSelected = !!selected?.includes(item.id);
            const contentColor = item.destructive
              ? theme.colors.error
              : isSelected
                ? theme.colors.onSecondaryContainer
                : theme.colors.onSurface;
            const iconColor = item.destructive
              ? theme.colors.error
              : isSelected
                ? theme.colors.onSecondaryContainer
                : theme.colors.onSurfaceVariant;

            return (
              <React.Fragment key={item.id}>
                {(item.dividerAbove || (dividers && index > 0)) && (
                  <Divider contentSpacing={0} />
                )}
                <Pressable
                  // Not `disabled`: a disabled Pressable lets the touch through
                  // to the popover's backdrop, which would close the menu.
                  onPress={() => !item.disabled && handleItemPress(item)}
                  aria-disabled={item.disabled}
                  accessibilityLabel={item.label}
                  accessibilityRole={
                    (Platform.OS === "web" ? "menuitem" : "button") as any
                  }
                  accessibilityState={{
                    disabled: item.disabled,
                    selected: selected ? isSelected : undefined,
                  }}
                  style={({ hovered, pressed }: PressableState) => [
                    styles.item,
                    item.disabled && { opacity: 0.38 },
                    {
                      backgroundColor:
                        !item.disabled && pressed
                          ? theme.colors.primaryContainer
                          : !item.disabled && hovered
                            ? theme.colors.surfaceContainerHigh
                            : isSelected
                              ? theme.colors.secondaryContainer
                              : "transparent",
                    },
                  ]}
                  {...(Platform.OS === "android" && {
                    android_ripple: { color: theme.colors.onPrimary },
                  })}
                >
                  <View style={styles.itemRow}>
                    {!!item.icon && (
                      <Icons
                        name={item.icon}
                        size={20}
                        color={iconColor}
                        style={styles.leadingIcon}
                      />
                    )}
                    <Text
                      style={[
                        theme.typography.bodyLarge,
                        styles.label,
                        { color: contentColor },
                      ]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                    {item.trailing && (
                      <Text
                        style={[
                          theme.typography.labelSmall,
                          { color: theme.colors.onSurfaceVariant },
                        ]}
                      >
                        {item.trailing}
                      </Text>
                    )}
                    {isSelected && (
                      <Icons
                        name="check"
                        size={18}
                        color={iconColor}
                        style={styles.check}
                      />
                    )}
                  </View>
                </Pressable>
              </React.Fragment>
            );
          })}
        </ScrollView>
      </View>
    </Popover>
  );
};

export default Menu;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    menuContent: {
      minWidth: 180,
      paddingVertical: 4,
    },
    item: {
      paddingHorizontal: 12,
      paddingVertical: 12,
      marginHorizontal: 4,
      borderRadius: 8,
      ...Platform.select({
        web: {
          cursor: "pointer",
          transitionProperty: "background-color" as any,
          transitionDuration: "150ms" as any,
        },
      }),
    },
    itemRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    leadingIcon: {
      marginRight: 12,
    },
    check: {
      marginLeft: 12,
    },
    // Not `flex: 1`: its zero basis lets the shrink-wrapped popover size
    // itself without the labels, which then truncate.
    label: {
      flexGrow: 1,
      flexShrink: 1,
      marginRight: 12,
    },
  });
