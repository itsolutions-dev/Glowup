import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme, Theme } from "../providers/ThemeProvider";
import { MaterialCommunityIconsGlyphs, PressableState } from "./types";

export interface BreadcrumbItem {
  id: string;
  label: string;
  icon?: MaterialCommunityIconsGlyphs;
  onPress?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  separator?: MaterialCommunityIconsGlyphs;
  /** Collapse middle items behind an ellipsis when exceeding this count. */
  maxItems?: number;
}

const ELLIPSIS_ID = "__ellipsis__";

const Breadcrumbs = ({
  items,
  separator = "chevron-right",
  maxItems,
}: BreadcrumbsProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const visibleItems = useMemo(() => {
    if (!maxItems || items.length <= maxItems || items.length < 3) {
      return items;
    }
    const tailCount = Math.max(1, maxItems - 2);
    return [
      items[0],
      { id: ELLIPSIS_ID, label: "…" } as BreadcrumbItem,
      ...items.slice(items.length - tailCount),
    ];
  }, [items, maxItems]);

  return (
    <View style={styles.container} accessibilityRole="menubar">
      {visibleItems.map((item, index) => {
        const isLast = index === visibleItems.length - 1;
        const isEllipsis = item.id === ELLIPSIS_ID;
        const pressable = !isLast && !isEllipsis && !!item.onPress;

        return (
          <React.Fragment key={item.id}>
            <Pressable
              onPress={pressable ? item.onPress : undefined}
              disabled={!pressable}
              accessibilityRole={pressable ? "link" : "text"}
              accessibilityLabel={item.label}
              accessibilityState={isLast ? { selected: true } : undefined}
              style={[styles.item, pressable && styles.itemPressable]}
            >
              {({ hovered }: PressableState) => (
                <>
                  {item.icon && (
                    <Icons
                      name={item.icon}
                      size={16}
                      color={
                        isLast
                          ? theme.colors.onSurface
                          : theme.colors.onSurfaceVariant
                      }
                      style={styles.itemIcon}
                    />
                  )}
                  <Text
                    style={[
                      theme.typography.bodyMedium,
                      {
                        color: isLast
                          ? theme.colors.onSurface
                          : hovered && pressable
                            ? theme.colors.primary
                            : theme.colors.onSurfaceVariant,
                      },
                      isLast && styles.currentLabel,
                      hovered &&
                        pressable && {
                          textDecorationLine: "underline",
                        },
                    ]}
                    numberOfLines={1}
                  >
                    {item.label}
                  </Text>
                </>
              )}
            </Pressable>

            {!isLast && (
              <Icons
                name={separator}
                size={16}
                color={theme.colors.onSurfaceVariant}
                style={styles.separator}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

export default Breadcrumbs;

const makeStyles: (theme: Theme) => StyleSheet.NamedStyles<any> = (
  theme: Theme,
) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
    },
    item: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 4,
    },
    itemPressable: {
      ...Platform.select({
        web: { cursor: "pointer" },
      }),
    },
    itemIcon: {
      marginRight: 4,
    },
    currentLabel: {
      fontWeight: "600",
    },
    separator: {
      marginHorizontal: 4,
    },
  });
