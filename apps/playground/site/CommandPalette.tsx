import { useEffect, useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import {
  Input,
  Typography,
  useTheme,
  type MaterialCommunityIconsGlyphs,
  type PressableState,
  type Theme,
} from "@its/glowup-ui";
import { CATEGORY_OF, FLAT_ORDER } from "../catalogue/categories";
import { SITE_ROUTES } from "./siteNav";
import { useLayout } from "./breakpoints";

interface Entry {
  id: string;
  label: string;
  hint: string;
  icon: MaterialCommunityIconsGlyphs;
  run: () => void;
}

const MAX_RESULTS = 40;

/**
 * Everything the palette can reach: the site's sections and every component.
 * Built once — the catalogue does not change at runtime.
 */
const ENTRIES: Entry[] = [
  ...SITE_ROUTES.map((route) => ({
    id: `route:${route.href}`,
    label: route.label,
    hint: route.summary,
    icon: route.icon,
    run: () => router.navigate(route.href as never),
  })),
  ...FLAT_ORDER.map((name) => ({
    id: `component:${name}`,
    label: name,
    hint: CATEGORY_OF[name] ?? "Component",
    icon: "cube-outline" as MaterialCommunityIconsGlyphs,
    run: () => router.navigate(`/components/${name}` as never),
  })),
];

/**
 * Ranks a prefix match above a match in the middle, so typing "but" puts
 * Button first rather than wherever the catalogue order happens to put it.
 */
const score = (label: string, needle: string): number => {
  const lower = label.toLowerCase();
  if (lower === needle) return 0;
  if (lower.startsWith(needle)) return 1;
  const index = lower.indexOf(needle);
  return index === -1 ? Number.POSITIVE_INFINITY : 2 + index;
};

/**
 * The ⌘K overlay: type to filter, arrows to move, Enter to go.
 *
 * It exists because the catalogue is 85 entries long and the sidebar only
 * appears from `expanded` up — on a laptop the fastest route to a component
 * should not be scrolling a list.
 */
export const CommandPalette = ({ onDismiss }: { onDismiss: () => void }) => {
  const { theme } = useTheme();
  const layout = useLayout();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return ENTRIES.slice(0, MAX_RESULTS);
    return ENTRIES.map((entry) => ({ entry, rank: score(entry.label, needle) }))
      .filter(({ rank }) => Number.isFinite(rank))
      .sort((a, b) => a.rank - b.rank)
      .slice(0, MAX_RESULTS)
      .map(({ entry }) => entry);
  }, [query]);

  // A new query invalidates the old highlight position.
  const activeIndex = Math.min(highlighted, Math.max(results.length - 1, 0));

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onDismiss();
        return;
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        setHighlighted((current) => {
          const next = event.key === "ArrowDown" ? current + 1 : current - 1;
          if (results.length === 0) return 0;
          return (next + results.length) % results.length;
        });
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        const entry = results[activeIndex];
        if (entry) {
          entry.run();
          onDismiss();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [results, activeIndex, onDismiss]);

  return (
    <View style={styles.overlay}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close search"
        onPress={onDismiss}
        style={styles.scrim}
      />
      <View
        style={[
          styles.panel,
          layout.isCompact ? styles.panelCompact : styles.panelWide,
        ]}
      >
        <View style={styles.field}>
          <Input
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              setHighlighted(0);
            }}
            label="Search"
            placeholder="Jump to a component or a page…"
            leadingIcon="magnify"
          />
        </View>

        {results.length === 0 ? (
          <Typography variant="bodyMedium" style={styles.empty}>
            Nothing matches “{query}”.
          </Typography>
        ) : (
          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {results.map((entry, index) => {
              const active = index === activeIndex;
              return (
                <Pressable
                  key={entry.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    entry.run();
                    onDismiss();
                  }}
                  onHoverIn={() => setHighlighted(index)}
                  style={({ hovered }: PressableState) => [
                    styles.row,
                    (active || hovered) && {
                      backgroundColor: theme.colors.secondaryContainer,
                    },
                  ]}
                >
                  <Icons
                    name={entry.icon}
                    size={18}
                    color={
                      active
                        ? theme.colors.onSecondaryContainer
                        : theme.colors.onSurfaceVariant
                    }
                  />
                  <Typography
                    variant="bodyMedium"
                    style={{
                      color: active
                        ? theme.colors.onSecondaryContainer
                        : theme.colors.onSurface,
                      flex: 1,
                    }}
                  >
                    {entry.label}
                  </Typography>
                  <Typography
                    variant="labelSmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {entry.hint}
                  </Typography>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        <View style={styles.footer}>
          <Hint keys="↑ ↓" label="Move" />
          <Hint keys="↵" label="Open" />
          <Hint keys="Esc" label="Close" />
        </View>
      </View>
    </View>
  );
};

const Hint = ({ keys, label }: { keys: string; label: string }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.hint}>
      <Text style={styles.key}>{keys}</Text>
      <Typography
        variant="labelSmall"
        style={{ color: theme.colors.onSurfaceVariant }}
      >
        {label}
      </Typography>
    </View>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    overlay: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: "center",
      zIndex: 100,
    },
    scrim: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: theme.colors.scrim,
      opacity: 0.45,
    },
    panel: {
      backgroundColor: theme.colors.surfaceContainerHigh,
      borderRadius: theme.shape.large,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      overflow: "hidden",
      width: "100%",
    },
    panelWide: { maxWidth: 560, marginTop: 96 },
    panelCompact: { maxWidth: 560, marginTop: 24 },
    field: { padding: theme.spacing.m, paddingBottom: theme.spacing.s },
    list: { maxHeight: 360 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.m,
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
    },
    empty: {
      color: theme.colors.onSurfaceVariant,
      paddingHorizontal: theme.spacing.m,
      paddingBottom: theme.spacing.m,
    },
    footer: {
      flexDirection: "row",
      gap: theme.spacing.m,
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
    },
    hint: { flexDirection: "row", alignItems: "center", gap: theme.spacing.xs },
    key: {
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      overflow: "hidden",
    },
  });

export default CommandPalette;
