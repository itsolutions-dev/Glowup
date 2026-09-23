import React, { useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme, Theme } from "../providers/ThemeProvider";

import Popover from "./Popover";
import Divider from "./Divider";
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
  onPress: () => void;
}

interface MenuProps {
  anchor: React.ReactElement;
  items: MenuItem[];
  visible: boolean;
  onDismiss: () => void;
  /** Close the menu automatically after an item is pressed. Default true. */
  closeOnSelect?: boolean;
}

const Menu = ({
  anchor,
  items,
  visible,
  onDismiss,
  closeOnSelect = true,
}: MenuProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const handleItemPress = (item: MenuItem) => {
    if (closeOnSelect) onDismiss();
    item.onPress();
  };

  return (
    <Popover visible={visible} onDismiss={onDismiss} anchor={anchor}>
      <View style={styles.menuContent}>
        <ScrollView bounces={false} style={{ maxHeight: 320 }}>
          {items.map((item) => {
            const contentColor = item.destructive
              ? theme.colors.error
              : theme.colors.onSurface;
            const iconColor = item.destructive
              ? theme.colors.error
              : theme.colors.onSurfaceVariant;

            return (
              <React.Fragment key={item.id}>
                {item.dividerAbove && <Divider contentSpacing={0} />}
                <Pressable
                  onPress={() => handleItemPress(item)}
                  disabled={item.disabled}
                  accessibilityLabel={item.label}
                  accessibilityRole={
                    (Platform.OS === "web" ? "menuitem" : "button") as any
                  }
                  accessibilityState={{ disabled: item.disabled }}
                  style={({ hovered, pressed }: PressableState) => [
                    styles.item,
                    item.disabled && { opacity: 0.38 },
                    {
                      backgroundColor: pressed
                        ? theme.colors.primaryContainer
                        : hovered
                          ? theme.colors.surfaceContainerHigh
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

const makeStyles: (theme: Theme) => StyleSheet.NamedStyles<any> = (
  theme: Theme,
) =>
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
    // Not `flex: 1`: its zero basis lets the shrink-wrapped popover size
    // itself without the labels, which then truncate.
    label: {
      flexGrow: 1,
      flexShrink: 1,
      marginRight: 12,
    },
  });
