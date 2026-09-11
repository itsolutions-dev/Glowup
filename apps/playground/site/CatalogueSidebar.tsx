import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Link, usePathname } from "expo-router";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import {
  SearchBar,
  Typography,
  useTheme,
  type PressableState,
  type Theme,
} from "@its/glowup-ui";
import { CATEGORIES, TOTAL_COUNT } from "../catalogue/categories";

const WIDTH = 248;

/**
 * The catalogue list that sits beside a component page from `expanded` up.
 *
 * It lives in the /components layout rather than in the site shell: it is the
 * navigation for one section, and mounting it globally is what produced a
 * three-pane layout with 600dp of chrome around a 310dp stage. Keeping it in
 * the layout (not in the page) also means it survives navigation between
 * components with its scroll position and filter intact.
 */
export const CatalogueSidebar = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  const needle = query.trim().toLowerCase();
  const groups = useMemo(
    () =>
      CATEGORIES.map((category) => ({
        ...category,
        items: needle
          ? category.items.filter((item) => item.toLowerCase().includes(needle))
          : category.items,
      })).filter((category) => category.items.length > 0),
    [needle],
  );

  const matchCount = groups.reduce((total, g) => total + g.items.length, 0);

  return (
    <View style={styles.wrap}>
      <View style={styles.search}>
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Filter components…"
        />
        <Typography
          variant="labelSmall"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {needle
            ? `${matchCount} of ${TOTAL_COUNT}`
            : `${TOTAL_COUNT} components`}
        </Typography>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {groups.length === 0 ? (
          <Typography
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, padding: 16 }}
          >
            No component matches “{query}”.
          </Typography>
        ) : (
          groups.map((category) => (
            <View key={category.label} style={styles.group}>
              <View style={styles.groupHeader}>
                <Icons
                  name={category.icon as never}
                  size={14}
                  color={theme.colors.primary}
                />
                <Typography
                  variant="labelSmall"
                  style={[
                    styles.groupLabel,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  {category.label.toUpperCase()}
                </Typography>
                <Typography
                  variant="labelSmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {category.items.length}
                </Typography>
              </View>
              {category.items.map((name) => (
                <CatalogueLink
                  key={name}
                  name={name}
                  selected={pathname === `/components/${name}`}
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const CatalogueLink = ({
  name,
  selected,
}: {
  name: string;
  selected: boolean;
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <Link href={`/components/${name}` as never} asChild>
      <Pressable accessibilityRole="link" accessibilityState={{ selected }}>
        {/* Styled one level in: `Link asChild` drops a function or array style
            on the Slot's direct child. */}
        {({ hovered, focused }: PressableState) => (
          <View
            style={[
              styles.item,
              (hovered || focused) && {
                backgroundColor: theme.colors.surfaceContainerHigh,
              },
              focused && { borderColor: theme.colors.primary },
              selected && { backgroundColor: theme.colors.secondaryContainer },
            ]}
          >
            <Typography
              variant="bodyMedium"
              style={{
                color: selected
                  ? theme.colors.onSecondaryContainer
                  : theme.colors.onSurfaceVariant,
                fontWeight: selected ? "700" : "400",
              }}
            >
              {name}
            </Typography>
          </View>
        )}
      </Pressable>
    </Link>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    wrap: {
      width: WIDTH,
      borderRightWidth: 1,
      borderRightColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
    },
    // The filter stays put while the list scrolls under it, which is the whole
    // reason the sidebar lives in the layout rather than in the page.
    search: {
      padding: theme.spacing.s,
      gap: theme.spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: theme.spacing.xl },
    group: { marginTop: theme.spacing.m, paddingHorizontal: theme.spacing.s },
    groupHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.s,
      marginBottom: theme.spacing.xs,
    },
    groupLabel: { flex: 1, letterSpacing: 1.4, fontWeight: "700" },
    // Pills, like the destinations in the site drawer: the two menus sit side
    // by side on a component page and should not look like different products.
    item: {
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 999,
      borderWidth: 1,
      borderColor: "transparent",
      paddingVertical: theme.spacing.s,
      paddingHorizontal: theme.spacing.m,
      marginBottom: 2,
    },
  });

export default CatalogueSidebar;
