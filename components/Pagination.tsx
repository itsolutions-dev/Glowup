import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme, Theme } from "../providers/ThemeProvider";
import { PressableState } from "./types";

interface PaginationProps {
  /** Current page, 1-based. */
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Pages shown on each side of the current page. */
  siblingCount?: number;
  /** Show jump-to-first / jump-to-last arrows. */
  showFirstLast?: boolean;
  disabled?: boolean;
}

const ELLIPSIS = "…";

const getPageRange = (
  page: number,
  totalPages: number,
  siblingCount: number,
): (number | typeof ELLIPSIS)[] => {
  // First page, last page, current +/- siblings, ellipsis in the gaps
  const maxVisible = siblingCount * 2 + 5;
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const start = Math.max(2, page - siblingCount);
  const end = Math.min(totalPages - 1, page + siblingCount);

  const range: (number | typeof ELLIPSIS)[] = [1];
  if (start > 2) range.push(ELLIPSIS);
  for (let i = start; i <= end; i++) range.push(i);
  if (end < totalPages - 1) range.push(ELLIPSIS);
  range.push(totalPages);
  return range;
};

const Pagination = ({
  page,
  totalPages,
  onPageChange,
  siblingCount = 1,
  showFirstLast = false,
  disabled,
}: PaginationProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const range = useMemo(
    () => getPageRange(page, totalPages, siblingCount),
    [page, totalPages, siblingCount],
  );

  const ARROW_LABELS = {
    "chevron-left": "Previous page",
    "chevron-right": "Next page",
    "page-first": "First page",
    "page-last": "Last page",
  } as const;

  const renderArrow = (
    icon: keyof typeof ARROW_LABELS,
    target: number,
    arrowDisabled: boolean,
  ) => (
    <Pressable
      onPress={() => onPageChange(target)}
      disabled={disabled || arrowDisabled}
      accessibilityRole="button"
      accessibilityLabel={ARROW_LABELS[icon]}
      style={[styles.item, (disabled || arrowDisabled) && { opacity: 0.38 }]}
    >
      {({ hovered, pressed }: PressableState) => (
        <View
          style={[
            styles.itemInner,
            (hovered || pressed) &&
              !arrowDisabled && {
                backgroundColor: theme.colors.surfaceContainerHigh,
              },
          ]}
        >
          <Icons name={icon} size={20} color={theme.colors.onSurfaceVariant} />
        </View>
      )}
    </Pressable>
  );

  return (
    <View
      style={[styles.container, disabled && { opacity: 0.38 }]}
      accessibilityRole="menubar"
    >
      {showFirstLast && renderArrow("page-first", 1, page <= 1)}
      {renderArrow("chevron-left", page - 1, page <= 1)}

      {range.map((entry, index) => {
        if (entry === ELLIPSIS) {
          return (
            <View key={`ellipsis-${index}`} style={styles.item}>
              <View style={styles.itemInner}>
                <Text
                  style={[
                    theme.typography.bodyMedium,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {ELLIPSIS}
                </Text>
              </View>
            </View>
          );
        }

        const active = entry === page;
        return (
          <Pressable
            key={entry}
            onPress={() => onPageChange(entry)}
            disabled={disabled || active}
            accessibilityRole="button"
            accessibilityLabel={`Page ${entry}`}
            accessibilityState={{ selected: active }}
            style={styles.item}
          >
            {({ hovered, pressed }: PressableState) => (
              <View
                style={[
                  styles.itemInner,
                  active && { backgroundColor: theme.colors.primary },
                  !active &&
                    (hovered || pressed) && {
                      backgroundColor: theme.colors.surfaceContainerHigh,
                    },
                ]}
              >
                <Text
                  style={[
                    theme.typography.labelLarge,
                    {
                      color: active
                        ? theme.colors.onPrimary
                        : theme.colors.onSurface,
                    },
                  ]}
                >
                  {entry}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}

      {renderArrow("chevron-right", page + 1, page >= totalPages)}
      {showFirstLast &&
        renderArrow("page-last", totalPages, page >= totalPages)}
    </View>
  );
};

export default Pagination;

const makeStyles: (theme: Theme) => StyleSheet.NamedStyles<any> = (
  theme: Theme,
) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 4,
    },
    item: {
      ...Platform.select({
        web: { cursor: "pointer" },
      }),
    },
    itemInner: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({
        web: {
          transitionProperty: "background-color" as any,
          transitionDuration: "150ms" as any,
        },
      }),
    },
  });
