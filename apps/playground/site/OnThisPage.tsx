import { useCallback, useMemo, useRef, useState, type RefObject } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ScrollView,
} from "react-native";
import {
  Typography,
  useTheme,
  type PressableState,
  type Theme,
} from "@its/glowup-ui";

/** The page has scrolled enough for the "Back to top" button to appear. */
export const SHOW_TOP_AFTER = 400;

/** A section is the current one once its top is this close to the top edge. */
const SPY_OFFSET = 48;

/** Where a link leaves a section's top: a little below the edge. */
const SCROLL_MARGIN = 16;

/**
 * The containers between a section and the scroll content, whose own offsets
 * are added to a section's (a layout event gives the position in its parent).
 */
const BASES = ["column", "row"] as const;

/** A section's top in the scroll content, or undefined until it has been laid out. */
const topOf = (offsets: Record<string, number>, id: string) =>
  offsets[id] === undefined
    ? undefined
    : BASES.reduce((sum, base) => sum + (offsets[base] ?? 0), offsets[id]);

export interface PageSection {
  id: string;
  label: string;
}

/**
 * Scroll spy for a page of sections. Hand `onScroll` to the page's `ScrollArea`
 * (or ScrollView), its `ref` as `scrollRef`, and `track(id)` to each section (and
 * to the "column" and "row" wrappers around them); it answers which section is
 * current and whether the page has left the top.
 *
 * The scroll offset itself is never state: a re-render of the whole page on every
 * scroll event would redraw the live example. Only the two values derived from
 * it are, and setting them to what they already are does nothing.
 */
export const useScrollSpy = (
  ids: readonly string[],
  scrollRef: RefObject<ScrollView | null>,
) => {
  const offsets = useRef<Record<string, number>>({});
  const [active, setActive] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  // A stable copy: callers build `ids` on every render.
  const key = ids.join("|");
  const list = useMemo(() => (key ? key.split("|") : []), [key]);

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement, contentSize } =
        event.nativeEvent;
      const y = contentOffset.y;
      setScrolled(y > SHOW_TOP_AFTER);

      let current = list[0];
      for (const id of list) {
        const top = topOf(offsets.current, id);
        if (top !== undefined && top - SPY_OFFSET <= y) current = id;
      }
      // The last section is often too short to reach the top edge.
      const atEnd =
        y > 0 && y + layoutMeasurement.height >= contentSize.height - 4;
      setActive(atEnd ? list[list.length - 1] : current);
    },
    [list],
  );

  const track = useCallback(
    (id: string) => (event: LayoutChangeEvent) => {
      offsets.current[id] = event.nativeEvent.layout.y;
    },
    [],
  );

  const scrollToSection = useCallback(
    (id: string) => {
      const top = topOf(offsets.current, id);
      if (top === undefined) return;
      setActive(id);
      scrollRef.current?.scrollTo({
        y: Math.max(0, top - SCROLL_MARGIN),
        animated: true,
      });
    },
    [scrollRef],
  );

  const scrollToTop = useCallback(
    () => scrollRef.current?.scrollTo({ y: 0, animated: true }),
    [scrollRef],
  );

  return {
    onScroll,
    track,
    active: active && list.includes(active) ? active : (list[0] ?? null),
    scrolled,
    scrollToSection,
    scrollToTop,
  };
};

/**
 * The "On this page" column: one link per section, the current one marked. The
 * page puts it beside the content on a wide window and leaves it out below that.
 */
export const OnThisPage = ({
  sections,
  active,
  onSelect,
}: {
  sections: readonly PageSection[];
  active: string | null;
  onSelect: (id: string) => void;
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View role="navigation" aria-label="On this page" style={styles.root}>
      <Typography
        variant="labelSmall"
        style={[styles.title, { color: theme.colors.onSurfaceVariant }]}
      >
        On this page
      </Typography>
      {sections.map((section) => {
        const current = section.id === active;
        return (
          <Pressable
            key={section.id}
            accessibilityRole="link"
            accessibilityLabel={section.label}
            accessibilityState={{ selected: current }}
            onPress={() => onSelect(section.id)}
            style={({ hovered, focused }: PressableState) => [
              styles.link,
              {
                borderLeftColor: current
                  ? theme.colors.primary
                  : theme.colors.outlineVariant,
                backgroundColor:
                  hovered || focused
                    ? theme.colors.surfaceContainerHigh
                    : "transparent",
              },
            ]}
          >
            <Typography
              variant="labelLarge"
              style={{
                color: current
                  ? theme.colors.primary
                  : theme.colors.onSurfaceVariant,
                fontWeight: current ? "700" : "400",
              }}
            >
              {section.label}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    root: { gap: theme.spacing.xs },
    title: {
      textTransform: "uppercase",
      letterSpacing: 1.6,
      fontWeight: "700",
      marginBottom: theme.spacing.xs,
    },
    link: {
      borderLeftWidth: 2,
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.m,
      borderTopRightRadius: theme.shape.small,
      borderBottomRightRadius: theme.shape.small,
    },
  });
