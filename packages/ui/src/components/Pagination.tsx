import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Modal,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from "react-native";
import Icons from "./Glyph";
import { useTheme, Theme } from "../providers/ThemeProvider";
import { colorRoleTokens, type ColorRole } from "./internal/colorRole";
import { PressableState } from "./types";

export type PaginationSize = "sm" | "md" | "lg";
export type PaginationVariant = "rounded" | "circular";

export interface PaginationProps {
  /** Current page, 1-based. */
  activePage: number;
  totalPages: number;
  /** Called with the page the user picked: a page button, an arrow or `pageSelect`. */
  onChange: (page: number) => void;
  /** Pages shown on each side of the current page. */
  siblingCount?: number;
  /** Show jump-to-first / jump-to-last arrows. */
  showFirstLast?: boolean;
  /**
   * Adds a small select after the pager that jumps to any page: it shows the
   * active page, and opens a list of pages under a search field. Typing digits
   * narrows the list to the pages that contain them, which keeps it usable with
   * thousands of pages; Enter picks the first match.
   */
  pageSelect?: boolean;
  /** Colour role of the selected page. Defaults to `"primary"`. */
  color?: ColorRole;
  /** `"rounded"` draws the buttons as rounded squares, `"circular"` as circles. Defaults to `"rounded"`. */
  variant?: PaginationVariant;
  /** Size of the buttons and their type: 32, 40 or 48 px. Defaults to `"md"`. */
  size?: PaginationSize;
  disabled?: boolean;
}

const ELLIPSIS = "…";

const SIZES = {
  sm: { box: 32, icon: 16, type: "labelMedium" },
  md: { box: 40, icon: 20, type: "labelLarge" },
  lg: { box: 48, icon: 24, type: "titleSmall" },
} as const;

const ARROW_LABELS = {
  "chevron-left": "Previous page",
  "chevron-right": "Next page",
  "page-first": "First page",
  "page-last": "Last page",
} as const;

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
  activePage,
  totalPages,
  onChange,
  siblingCount = 1,
  showFirstLast = false,
  pageSelect = false,
  color = "primary",
  variant = "rounded",
  size = "md",
  disabled,
}: PaginationProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const metrics = SIZES[size];
  const accent = colorRoleTokens(theme, color);
  // The shape of every button: rounded squares, or circles.
  const shape = {
    width: metrics.box,
    height: metrics.box,
    borderRadius: variant === "circular" ? metrics.box / 2 : theme.shape.small,
  };

  const range = useMemo(
    () => getPageRange(activePage, totalPages, siblingCount),
    [activePage, totalPages, siblingCount],
  );

  const renderArrow = (
    icon: keyof typeof ARROW_LABELS,
    target: number,
    arrowDisabled: boolean,
  ) => (
    <Pressable
      onPress={() => onChange(target)}
      disabled={disabled || arrowDisabled}
      accessibilityRole="button"
      accessibilityLabel={ARROW_LABELS[icon]}
      style={[styles.item, (disabled || arrowDisabled) && { opacity: 0.38 }]}
    >
      {({ hovered, pressed }: PressableState) => (
        <View
          style={[
            styles.itemInner,
            shape,
            (hovered || pressed) &&
              !arrowDisabled && {
                backgroundColor: theme.colors.surfaceContainerHigh,
              },
          ]}
        >
          <Icons
            name={icon}
            size={metrics.icon}
            color={theme.colors.onSurfaceVariant}
          />
        </View>
      )}
    </Pressable>
  );

  return (
    <View
      style={[styles.container, disabled && { opacity: 0.38 }]}
      accessibilityRole="menubar"
    >
      {showFirstLast && renderArrow("page-first", 1, activePage <= 1)}
      {renderArrow("chevron-left", activePage - 1, activePage <= 1)}

      {range.map((entry, index) => {
        if (entry === ELLIPSIS) {
          return (
            <View key={`ellipsis-${index}`} style={styles.item}>
              <View style={[styles.itemInner, shape]}>
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

        const active = entry === activePage;
        return (
          <Pressable
            key={entry}
            onPress={() => onChange(entry)}
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
                  shape,
                  active && { backgroundColor: accent.main },
                  !active &&
                    (hovered || pressed) && {
                      backgroundColor: theme.colors.surfaceContainerHigh,
                    },
                ]}
              >
                <Text
                  style={[
                    theme.typography[metrics.type],
                    { color: active ? accent.onMain : theme.colors.onSurface },
                  ]}
                >
                  {entry}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}

      {renderArrow("chevron-right", activePage + 1, activePage >= totalPages)}
      {showFirstLast &&
        renderArrow("page-last", totalPages, activePage >= totalPages)}

      {pageSelect && (
        <PageSelect
          activePage={activePage}
          totalPages={totalPages}
          onChange={onChange}
          disabled={disabled}
          height={metrics.box}
          borderRadius={shape.borderRadius}
          type={metrics.type}
          iconSize={metrics.icon}
        />
      )}
    </View>
  );
};

// More pages than this are not listed at once: the search narrows them.
const MAX_LISTED = 50;
const CARD_WIDTH = 176;
// The tallest the open card gets: the search field and the list.
const CARD_HEIGHT = 300;

interface PageSelectProps {
  activePage: number;
  totalPages: number;
  onChange: (page: number) => void;
  disabled?: boolean;
  height: number;
  borderRadius: number;
  type: (typeof SIZES)[PaginationSize]["type"];
  iconSize: number;
}

/**
 * The jump-to-page control of `pageSelect`: a button that opens a card with a
 * search field over the pages that match it. A `Modal` of its own, so it needs
 * nothing from the screen around it and is never clipped by it.
 */
const PageSelect = ({
  activePage,
  totalPages,
  onChange,
  disabled,
  height,
  borderRadius,
  type,
  iconSize,
}: PageSelectProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const window = useWindowDimensions();
  const trigger = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [anchor, setAnchor] = useState({ x: 0, y: 0, height });

  const matches = useMemo(() => {
    const found: number[] = [];
    for (
      let page = 1;
      page <= totalPages && found.length <= MAX_LISTED;
      page++
    ) {
      if (!query || String(page).includes(query)) found.push(page);
    }
    return found;
  }, [query, totalPages]);
  const listed = matches.slice(0, MAX_LISTED);

  const show = () => {
    trigger.current?.measureInWindow((x, y, _width, height) =>
      setAnchor({ x, y, height }),
    );
    setQuery("");
    setOpen(true);
  };
  const close = () => setOpen(false);
  const pick = (page: number) => {
    close();
    if (page !== activePage) onChange(page);
  };

  // Below the button, or above it when the card would run off the screen.
  const below = anchor.y + anchor.height + 4;
  const flipAbove =
    window.height - below < CARD_HEIGHT && anchor.y > window.height - below;
  const placement = {
    left: Math.max(8, Math.min(anchor.x, window.width - CARD_WIDTH - 8)),
    ...(flipAbove ? { bottom: window.height - anchor.y + 4 } : { top: below }),
  };

  return (
    <>
      <Pressable
        ref={trigger}
        onPress={show}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="Select page"
        accessibilityState={{ expanded: open, disabled: !!disabled }}
        style={({ hovered, pressed }: PressableState) => [
          styles.select,
          { height, borderRadius },
          { borderColor: theme.colors.outlineVariant },
          (hovered || pressed) && {
            backgroundColor: theme.colors.surfaceContainerHigh,
          },
        ]}
      >
        <Text
          style={[theme.typography[type], { color: theme.colors.onSurface }]}
        >
          {activePage} / {totalPages}
        </Text>
        <Icons
          name="chevron-down"
          size={iconSize}
          color={theme.colors.onSurfaceVariant}
        />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        <View style={styles.modal}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={close}
            accessible={false}
            focusable={false}
          />
          <View
            style={[
              styles.card,
              placement,
              {
                backgroundColor: theme.colors.surfaceContainerLow,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            <TextInput
              autoFocus
              value={query}
              onChangeText={(text) => setQuery(text.replace(/\D/g, ""))}
              onSubmitEditing={() => listed[0] !== undefined && pick(listed[0])}
              keyboardType="number-pad"
              returnKeyType="go"
              placeholder="Search page"
              placeholderTextColor={theme.colors.onSurfaceVariant}
              accessibilityLabel="Search page"
              style={[
                styles.search,
                theme.typography.bodyMedium,
                {
                  color: theme.colors.onSurface,
                  borderBottomColor: theme.colors.outlineVariant,
                },
              ]}
            />
            <ScrollView
              role="list"
              keyboardShouldPersistTaps="handled"
              style={styles.list}
            >
              {listed.map((page) => (
                <Pressable
                  key={page}
                  accessibilityRole="menuitem"
                  accessibilityLabel={`Page ${page}`}
                  accessibilityState={{ selected: page === activePage }}
                  onPress={() => pick(page)}
                  style={({ hovered, pressed }: PressableState) => [
                    styles.option,
                    (page === activePage || hovered || pressed) && {
                      backgroundColor: theme.colors.surfaceContainerHighest,
                    },
                  ]}
                >
                  <Text
                    style={[
                      theme.typography.bodyMedium,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    {page}
                  </Text>
                  {page === activePage && (
                    <Icons
                      name="check"
                      size={18}
                      color={theme.colors.primary}
                    />
                  )}
                </Pressable>
              ))}
              {listed.length === 0 && (
                <Text
                  style={[
                    theme.typography.bodyMedium,
                    styles.hint,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  No page found
                </Text>
              )}
              {matches.length > MAX_LISTED && (
                <Text
                  style={[
                    theme.typography.bodySmall,
                    styles.hint,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  Type to narrow {totalPages} pages
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default Pagination;

const makeStyles = (theme: Theme) =>
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
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({
        web: {
          transitionProperty: "background-color" as any,
          transitionDuration: "150ms" as any,
        },
      }),
    },
    // The page select's button: as tall as the others, as wide as its text.
    select: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.xs,
      marginLeft: theme.spacing.xs,
      paddingHorizontal: theme.spacing.s,
      borderWidth: 1,
      ...Platform.select({
        web: { cursor: "pointer" },
      }),
    },
    modal: { flex: 1 },
    card: {
      position: "absolute",
      width: CARD_WIDTH,
      borderWidth: 1,
      borderRadius: theme.shape.medium,
      overflow: "hidden",
      elevation: 6,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.16,
      shadowRadius: 12,
    },
    search: {
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
      borderBottomWidth: 1,
      ...Platform.select({ web: { outlineStyle: "none" as any } }),
    },
    list: { maxHeight: 220 },
    option: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
    },
    hint: {
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
    },
  });
