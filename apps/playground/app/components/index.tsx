import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Link } from "expo-router";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import {
  SearchBar,
  Typography,
  useTheme,
  type PressableState,
  type Theme,
} from "@its/glowup-ui";

import { CATEGORIES, TOTAL_COUNT } from "../../catalogue/categories";
import { Page } from "../../site/Page";
import { useLayout } from "../../site/breakpoints";
import { docFor } from "../../site/propsData";
import { usePersistentState } from "../../site/usePersistentState";

const ALL = "All";

/**
 * The catalogue as a browsable grid — the entry point to the reference, and the
 * only catalogue view below `expanded`, where the sidebar is hidden.
 *
 * The category filter lives here rather than in two places: the previous
 * gallery had chips in its narrow layout and a grouped list in its wide one,
 * which meant filtering by category simply did not exist on a desktop.
 */
export default function ComponentsIndex() {
  const { theme } = useTheme();
  const layout = useLayout();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = usePersistentState("catalogue.category", ALL);

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
      description={`${TOTAL_COUNT} Material You components, every one of them live on its own page with a generated API reference.`}
    >
      <View style={styles.filters}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search components…"
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          <CategoryChip
            label={ALL}
            active={category === ALL}
            onPress={() => setCategory(ALL)}
          />
          {CATEGORIES.map((c) => (
            <CategoryChip
              key={c.label}
              label={c.label}
              icon={c.icon}
              active={category === c.label}
              onPress={() => setCategory(c.label)}
            />
          ))}
        </ScrollView>
        <Typography
          variant="labelMedium"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {shown} of {TOTAL_COUNT} shown
        </Typography>
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
                size={16}
                color={theme.colors.primary}
              />
              <Typography
                variant="titleSmall"
                style={{ color: theme.colors.onSurface }}
              >
                {group.label}
              </Typography>
              <Typography
                variant="labelSmall"
                style={{ color: theme.colors.outline }}
              >
                {group.items.length}
              </Typography>
            </View>
            <View style={styles.grid}>
              {group.items.map((name) => (
                <ComponentCard key={name} name={name} columns={columns} />
              ))}
            </View>
          </View>
        ))
      )}
    </Page>
  );
}

const CategoryChip = ({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon?: string;
  active: boolean;
  onPress: () => void;
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ hovered, focused }: PressableState) => [
        styles.chip,
        {
          backgroundColor: active
            ? theme.colors.primary
            : hovered || focused
              ? theme.colors.surfaceContainerHigh
              : theme.colors.surfaceContainer,
        },
        focused && { borderColor: theme.colors.primary },
      ]}
    >
      {icon ? (
        <Icons
          name={icon as never}
          size={14}
          color={
            active ? theme.colors.onPrimary : theme.colors.onSurfaceVariant
          }
        />
      ) : null}
      <Typography
        variant="labelMedium"
        style={{
          color: active
            ? theme.colors.onPrimary
            : theme.colors.onSurfaceVariant,
        }}
      >
        {label}
      </Typography>
    </Pressable>
  );
};

const ComponentCard = ({
  name,
  columns,
}: {
  name: string;
  columns: number;
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const doc = docFor(name);
  const gap = theme.spacing.m;

  return (
    <Link href={`/components/${name}` as never} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${name} documentation`}
        style={({ hovered, focused }: PressableState) => [
          styles.card,
          // Percentage basis minus the gutters keeps the grid fluid without a
          // measured layout pass — it reflows at every width, not at two.
          { flexBasis: `${100 / columns}%`, maxWidth: `${100 / columns}%` },
          { paddingRight: gap, paddingBottom: gap },
          (hovered || focused) && { opacity: 0.92 },
        ]}
      >
        <View style={styles.cardInner}>
          <Typography
            variant="titleSmall"
            style={{ color: theme.colors.onSurface }}
          >
            {name}
          </Typography>
          <Typography
            variant="labelSmall"
            style={{ color: theme.colors.onSurfaceVariant }}
          >
            {doc ? `${doc.props.length} props` : "—"}
          </Typography>
        </View>
      </Pressable>
    </Link>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    filters: { gap: theme.spacing.s },
    chipRow: { gap: theme.spacing.s, paddingVertical: theme.spacing.xs },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: "transparent",
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
    },
    group: { gap: theme.spacing.s },
    groupHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.s,
    },
    grid: { flexDirection: "row", flexWrap: "wrap" },
    card: {},
    cardInner: {
      gap: 2,
      padding: theme.spacing.m,
      borderRadius: theme.shape.medium,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceContainerLow,
      minHeight: 76,
      justifyContent: "center",
    },
  });
