import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Link } from "expo-router";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import {
  SearchBar,
  ToggleButtonGroup,
  Typography,
  useTheme,
  type PressableState,
  type Theme,
} from "@its/glowup-ui";

import ComponentPreview from "../../catalogue/ComponentPreview";
import { ComponentRegistry } from "../../catalogue/registry";
import {
  CATEGORIES,
  CATEGORY_OF,
  TOTAL_COUNT,
} from "../../catalogue/categories";
import { VARIANTS_BY_COMPONENT } from "../../catalogue/variants";
import { DemoErrorBoundary } from "../../site/ErrorBoundary";
import { Page } from "../../site/Page";
import { useLayout } from "../../site/breakpoints";
import { docFor } from "../../site/propsData";
import { usePersistentState } from "../../site/usePersistentState";

const ALL = "All";

/** Height of a card's preview well. Tall enough for a Card, short enough to scan. */
const PREVIEW_HEIGHT = 132;

/**
 * Demos are drawn at their real size; shrinking them lets a whole component fit
 * the well instead of being cropped to its top-left corner.
 */
const PREVIEW_SCALE = 0.78;

type LayoutMode = "gallery" | "list";

const defaultsOf = (name: string) => {
  const meta = ComponentRegistry[name];
  const values: Record<string, any> = {};
  for (const [key, definition] of Object.entries(meta.props)) {
    values[key] = definition.default;
  }
  return values;
};

/**
 * The catalogue, as a gallery of live components.
 *
 * A list of 84 names tells a reader nothing they did not already know from the
 * sidebar — you pick a component by recognising it, so each card renders the
 * real thing at its default props rather than describing it. The previews are
 * inert (`pointerEvents="none"`): the card is a link, and a Toggle inside it
 * that swallowed the press would be a trap.
 *
 * The list mode is kept for the case the gallery is bad at — knowing the name
 * already and wanting the shortest path to it.
 */
export default function ComponentsIndex() {
  const { theme } = useTheme();
  const layout = useLayout();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = usePersistentState("catalogue.category", ALL);
  const [mode, setMode] = usePersistentState<LayoutMode>(
    "catalogue.mode",
    "gallery",
  );

  const needle = query.trim().toLowerCase();
  const groups = useMemo(
    () =>
      CATEGORIES.filter((c) => category === ALL || c.label === category)
        .map((c) => ({
          ...c,
          items: needle
            ? c.items.filter((item) => item.toLowerCase().includes(needle))
            : c.items,
        }))
        .filter((c) => c.items.length > 0),
    [category, needle],
  );

  const shown = groups.reduce((total, group) => total + group.items.length, 0);
  const columns = layout.atLeast("large")
    ? 4
    : layout.atLeast("medium")
      ? 3
      : 2;

  return (
    <Page
      eyebrow="Reference"
      title="Components"
      description={`${TOTAL_COUNT} Material You components. Every card is the real component at its default props — open one for the live demo, the variants and the generated API reference.`}
    >
      <View style={styles.toolbar}>
        <View style={styles.searchRow}>
          <View style={styles.searchField}>
            <SearchBar
              value={query}
              onChangeText={setQuery}
              placeholder="Search components…"
            />
          </View>
          <ToggleButtonGroup
            accessibilityLabel="Catalogue layout"
            value={mode}
            onValueChange={(value) => setMode(value as LayoutMode)}
            options={[
              { value: "gallery", icon: "view-grid-outline", label: "Gallery" },
              { value: "list", icon: "view-list-outline", label: "List" },
            ]}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          <CategoryChip
            label={ALL}
            count={TOTAL_COUNT}
            active={category === ALL}
            onPress={() => setCategory(ALL)}
          />
          {CATEGORIES.map((c) => (
            <CategoryChip
              key={c.label}
              label={c.label}
              icon={c.icon}
              count={c.items.length}
              active={category === c.label}
              onPress={() => setCategory(c.label)}
            />
          ))}
        </ScrollView>

        {needle ? (
          <Typography
            variant="labelMedium"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {shown} of {TOTAL_COUNT} match “{query}”
          </Typography>
        ) : null}
      </View>

      {groups.length === 0 ? (
        <Typography
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          Nothing matches “{query}”{category !== ALL ? ` in ${category}` : ""}.
        </Typography>
      ) : (
        groups.map((group) => (
          <View key={group.label} style={styles.group}>
            <View style={styles.groupHeader}>
              <Icons
                name={group.icon as never}
                size={18}
                color={theme.colors.primary}
              />
              <Typography
                variant="titleMedium"
                style={{ color: theme.colors.onSurface }}
              >
                {group.label}
              </Typography>
              <View style={styles.groupRule} />
              <Typography
                variant="labelMedium"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {group.items.length}
              </Typography>
            </View>

            {mode === "gallery" ? (
              <View style={styles.grid}>
                {group.items.map((name) => (
                  <GalleryCard key={name} name={name} columns={columns} />
                ))}
              </View>
            ) : (
              <View style={styles.list}>
                {group.items.map((name) => (
                  <ListRow key={name} name={name} />
                ))}
              </View>
            )}
          </View>
        ))
      )}
    </Page>
  );
}

const CategoryChip = ({
  label,
  icon,
  count,
  active,
  onPress,
}: {
  label: string;
  icon?: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${label}, ${count} components`}
      onPress={onPress}
      style={({ hovered, focused }: PressableState) => [
        styles.chip,
        {
          backgroundColor: active
            ? theme.colors.secondaryContainer
            : hovered || focused
              ? theme.colors.surfaceContainerHigh
              : "transparent",
          borderColor: active
            ? theme.colors.secondaryContainer
            : theme.colors.outlineVariant,
        },
      ]}
    >
      {icon ? (
        <Icons
          name={icon as never}
          size={14}
          color={
            active
              ? theme.colors.onSecondaryContainer
              : theme.colors.onSurfaceVariant
          }
        />
      ) : null}
      <Typography
        variant="labelLarge"
        style={{
          color: active
            ? theme.colors.onSecondaryContainer
            : theme.colors.onSurfaceVariant,
        }}
      >
        {label}
      </Typography>
      <Typography
        variant="labelSmall"
        style={{
          color: active
            ? theme.colors.onSecondaryContainer
            : theme.colors.outline,
        }}
      >
        {count}
      </Typography>
    </Pressable>
  );
};

const GalleryCard = ({ name, columns }: { name: string; columns: number }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const meta = ComponentRegistry[name];
  const doc = docFor(name);
  const variants = VARIANTS_BY_COMPONENT[name]?.length ?? 0;
  const props = useMemo(() => defaultsOf(name), [name]);

  return (
    // The width lives on a wrapper, and the card's looks live on a View one
    // level below the Pressable. `Link asChild` passes the child through a
    // Radix Slot, which merges `style` by spreading it — a Pressable's function
    // style becomes `{}` and an array throws. Anything painted on the Slot's
    // direct child is silently lost on web.
    <View style={[styles.cardSlot, { width: `${100 / columns}%` }]}>
      <Link href={`/components/${name}` as never} asChild>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`${name} — ${doc ? `${doc.props.length} props, ` : ""}${variants} variants`}
        >
          {({ hovered, focused }: PressableState) => (
            <View
              style={[
                styles.card,
                (hovered || focused) && {
                  borderColor: theme.colors.primary,
                  backgroundColor: theme.colors.surfaceContainer,
                },
              ]}
            >
              {/* Inert: the whole card is one link, so a control inside the
                  preview must not eat the press or take a tab stop of its own. */}
              <View style={styles.well} pointerEvents="none">
                <View style={styles.wellInner}>
                  <DemoErrorBoundary label={name}>
                    <ComponentPreview
                      selectedComponentName={name}
                      activeMeta={meta}
                      componentProps={props}
                      updateProp={() => {}}
                    />
                  </DemoErrorBoundary>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Typography
                  variant="titleSmall"
                  style={{ color: theme.colors.onSurface, flex: 1 }}
                >
                  {name}
                </Typography>
                <Typography
                  variant="labelSmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {doc ? `${doc.props.length} props` : `${variants} demos`}
                </Typography>
              </View>
            </View>
          )}
        </Pressable>
      </Link>
    </View>
  );
};

const ListRow = ({ name }: { name: string }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const doc = docFor(name);
  const variants = VARIANTS_BY_COMPONENT[name]?.length ?? 0;

  return (
    <Link href={`/components/${name}` as never} asChild>
      <Pressable accessibilityRole="link" accessibilityLabel={name}>
        {({ hovered, focused }: PressableState) => (
          <View
            style={[
              styles.row,
              (hovered || focused) && {
                backgroundColor: theme.colors.surfaceContainerHigh,
              },
            ]}
          >
            <Typography
              variant="bodyLarge"
              style={{ color: theme.colors.onSurface, flex: 1 }}
            >
              {name}
            </Typography>
            <Typography
              variant="labelSmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {CATEGORY_OF[name]}
            </Typography>
            <Typography
              variant="labelSmall"
              style={[styles.rowMeta, { color: theme.colors.outline }]}
            >
              {doc ? `${doc.props.length} props` : "—"} · {variants} demos
            </Typography>
            <Icons
              name="chevron-right"
              size={18}
              color={theme.colors.onSurfaceVariant}
            />
          </View>
        )}
      </Pressable>
    </Link>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    toolbar: { gap: theme.spacing.s },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.m,
      flexWrap: "wrap",
    },
    searchField: { flexGrow: 1, flexBasis: 260 },
    chipRow: { gap: theme.spacing.s, paddingVertical: theme.spacing.xs },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
    },

    group: { gap: theme.spacing.m },
    groupHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.s,
    },
    // A rule that fills the space between the group's name and its count, so
    // the sections read as bands rather than as a stack of loose headings.
    groupRule: {
      flex: 1,
      height: 1,
      backgroundColor: theme.colors.outlineVariant,
    },

    grid: { flexDirection: "row", flexWrap: "wrap" },
    // The gutter lives on the slot, not between slots: percentage widths plus a
    // row gap would overflow at every column count.
    cardSlot: { paddingRight: theme.spacing.m, paddingBottom: theme.spacing.m },
    card: {
      borderRadius: theme.shape.large,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      overflow: "hidden",
    },
    well: {
      height: PREVIEW_HEIGHT,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      backgroundColor: theme.colors.surfaceContainerLow,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
      padding: theme.spacing.s,
    },
    wellInner: {
      alignItems: "center",
      justifyContent: "center",
      transform: [{ scale: PREVIEW_SCALE }],
    },
    cardFooter: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.s,
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
    },

    list: {
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: theme.shape.medium,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.m,
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
    },
    rowMeta: { minWidth: 120, textAlign: "right" },
  });
