import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Animated,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, router, usePathname } from "expo-router";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import {
  IconButton,
  Typography,
  useTheme,
  type PressableState,
  type Theme,
} from "@its/glowup-ui";
import { FLAT_ORDER } from "../catalogue/categories";
import { useLayout } from "./breakpoints";
import { CommandPalette } from "./CommandPalette";
import { ShortcutsDialog } from "./ShortcutsDialog";
import {
  COMMAND_KEY_LABEL,
  useKeyboardShortcuts,
  type Shortcut,
} from "./useKeyboardShortcuts";
import { activeRouteFor, GITHUB_URL, NPM_URL, SITE_ROUTES } from "./siteNav";
import { usePersistedPalette } from "./usePersistedPalette";
import { LIBRARY_NAME, LIBRARY_VERSION } from "./propsData";

const RAIL_WIDTH = 80;
const DRAWER_WIDTH = 232;

/**
 * The chrome every route renders inside: a top bar, one navigation surface
 * whose form follows the window size class, and the content column.
 *
 * Three forms of the same navigation, not one that shrinks:
 *   compact  — behind a scrim, opened from the top bar;
 *   medium   — a permanent icon rail, the M3 answer for tablet widths;
 *   large    — a permanent drawer with labels, once 232dp of chrome is cheap.
 *
 * The catalogue's own sidebar is NOT here. It belongs to /components, which is
 * the only route that has one, and putting both in the shell is what produced
 * 600dp of navigation next to a 310dp stage in the previous layout.
 */
export const SiteShell = ({ children }: { children: React.ReactNode }) => {
  const { theme, toggleTheme } = useTheme();
  const layout = useLayout();
  const pathname = usePathname();
  const active = activeRouteFor(pathname);
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [drawerRequested, setDrawerRequested] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Derived, not synchronised: growing the window past the compact breakpoint
  // must not leave an overlay drawer floating over a layout that now has a
  // permanent rail, and an effect that resets the flag would render the stale
  // frame first.
  const drawerOpen = drawerRequested && !layout.hasRail;

  const expanded = layout.atLeast("large");

  // `[` and `]` step through the catalogue in its documented order, but only
  // while a component page is what is on screen.
  const currentComponent = pathname.startsWith("/components/")
    ? decodeURIComponent(pathname.slice("/components/".length))
    : undefined;

  const step = useCallback(
    (delta: number) => {
      if (!currentComponent) return;
      const index = FLAT_ORDER.indexOf(currentComponent);
      if (index === -1) return;
      const next = FLAT_ORDER[index + delta];
      if (next) router.navigate(`/components/${next}` as never);
    },
    [currentComponent],
  );

  const shortcuts = useMemo<Shortcut[]>(
    () => [
      {
        key: "k",
        meta: true,
        label: "K",
        description: "Search components and pages",
        run: () => setPaletteOpen(true),
        whileTyping: true,
      },
      {
        key: "/",
        label: "/",
        description: "Search — the same palette, without the modifier",
        run: () => setPaletteOpen(true),
      },
      {
        key: "[",
        label: "[",
        description: "Previous component",
        run: () => step(-1),
      },
      {
        key: "]",
        label: "]",
        description: "Next component",
        run: () => step(1),
      },
      {
        key: "t",
        label: "T",
        description: "Switch between the light and dark scheme",
        run: toggleTheme,
      },
      {
        key: "?",
        label: "?",
        description: "Show this list",
        run: () => setShortcutsOpen(true),
      },
    ],
    [step, toggleTheme],
  );

  useKeyboardShortcuts(shortcuts);
  // Site-wide preferences live with the chrome that owns them: the shell is
  // mounted for every route, so the colour set is restored wherever the reader
  // lands, not only on /theming.
  usePersistedPalette();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.topBar}>
        {!layout.hasRail && (
          <IconButton
            icon="menu"
            accessibilityLabel="Open navigation"
            onPress={() => setDrawerRequested(true)}
          />
        )}
        <Link href="/" asChild>
          <Pressable accessibilityRole="link" accessibilityLabel="Glowup home">
            {/* The looks go on a View inside the Pressable, not on the
                Pressable: `Link asChild` routes the child through a Radix Slot
                that merges `style` by spreading it, which turns a function
                style into `{}` and throws on an array. See expo-router's own
                Slot shim (build/ui/Slot.js). */}
            <View style={styles.brand}>
              <View style={styles.brandMark}>
                {/* The same four-pointed spark the favicon and app icons are
                  drawn from, so the tab and the header carry one mark. */}
                <Icons
                  name="star-four-points"
                  size={18}
                  color={theme.colors.onPrimaryContainer}
                />
              </View>
              <View>
                <Typography
                  variant="titleMedium"
                  style={{ color: theme.colors.onSurface }}
                >
                  Glowup
                </Typography>
                {!layout.isCompact && (
                  <Typography
                    variant="labelSmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    Material You for React Native
                  </Typography>
                )}
              </View>
            </View>
          </Pressable>
        </Link>

        <View style={styles.topBarSpacer} />

        {layout.hasRail ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Search components and pages"
            onPress={() => setPaletteOpen(true)}
            style={({ hovered, focused }: PressableState) => [
              styles.searchButton,
              (hovered || focused) && {
                backgroundColor: theme.colors.surfaceContainerHigh,
              },
            ]}
          >
            <Icons
              name="magnify"
              size={18}
              color={theme.colors.onSurfaceVariant}
            />
            <Typography
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              Search
            </Typography>
            <Text style={styles.searchKey}>{`${COMMAND_KEY_LABEL} K`}</Text>
          </Pressable>
        ) : (
          <IconButton
            icon="magnify"
            accessibilityLabel="Search components and pages"
            onPress={() => setPaletteOpen(true)}
          />
        )}

        <IconButton
          icon={theme.isDark ? "weather-sunny" : "weather-night"}
          accessibilityLabel={
            theme.isDark ? "Switch to light theme" : "Switch to dark theme"
          }
          onPress={toggleTheme}
        />
        <IconButton
          icon="github"
          accessibilityLabel="Open the repository on GitHub"
          onPress={() => Linking.openURL(GITHUB_URL)}
        />
      </View>

      <View style={styles.body}>
        {layout.hasRail && (
          <NavSurface
            width={expanded ? DRAWER_WIDTH : RAIL_WIDTH}
            showLabels={expanded}
            active={active}
            variant="permanent"
          />
        )}

        <View style={styles.content}>{children}</View>
      </View>

      {drawerOpen && (
        <ModalDrawer
          active={active}
          onDismiss={() => setDrawerRequested(false)}
        />
      )}

      {paletteOpen && (
        <CommandPalette onDismiss={() => setPaletteOpen(false)} />
      )}

      <ShortcutsDialog
        shortcuts={shortcuts}
        visible={shortcutsOpen}
        onDismiss={() => setShortcutsOpen(false)}
      />
    </SafeAreaView>
  );
};

/**
 * The navigation itself, in the two shapes Material 3 defines for it.
 *
 * `showLabels` picks between them: a **drawer**, where each destination is a
 * full-width pill with its icon and label on one line, and a **rail**, where
 * the active indicator is a 56×32 pill behind the icon alone with the label
 * under it. They are one component because a change to how a destination looks
 * has to reach all three surfaces — drawer, rail and the compact overlay.
 *
 * The active destination also swaps its icon for the filled glyph. That is the
 * kit's own convention (outline variants append `-outline`), and it gives the
 * selection a second signal besides the container colour.
 */
const NavSurface = ({
  width,
  showLabels,
  active,
  variant,
  onNavigate,
}: {
  width: number;
  showLabels: boolean;
  active: string;
  variant: "permanent" | "modal";
  onNavigate?: () => void;
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View
      style={[
        styles.nav,
        { width },
        variant === "permanent" && styles.navPermanent,
      ]}
      // Landmark role: web-only, and RN spells it on `role` rather than
      // on `accessibilityRole`, whose union is the native set.
      role={Platform.OS === "web" ? "navigation" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.navScroll}
        showsVerticalScrollIndicator={false}
      >
        {showLabels && (
          <Typography
            variant="labelSmall"
            style={[
              styles.navHeading,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            Documentation
          </Typography>
        )}

        {SITE_ROUTES.map((route) => {
          const selected = active === route.href;
          const icon = (
            selected ? route.icon.replace(/-outline$/, "") : route.icon
          ) as typeof route.icon;

          return (
            <Link key={route.href} href={route.href as never} asChild>
              <Pressable
                accessibilityRole="link"
                accessibilityState={{ selected }}
                accessibilityLabel={route.label}
                onPress={onNavigate}
              >
                {({ hovered, focused }: PressableState) =>
                  showLabels ? (
                    <View
                      style={[
                        styles.drawerItem,
                        (hovered || focused) && {
                          backgroundColor: theme.colors.surfaceContainerHigh,
                        },
                        selected && {
                          backgroundColor: theme.colors.secondaryContainer,
                        },
                        focused && { borderColor: theme.colors.primary },
                      ]}
                    >
                      <Icons
                        name={icon}
                        size={22}
                        color={
                          selected
                            ? theme.colors.onSecondaryContainer
                            : theme.colors.onSurfaceVariant
                        }
                      />
                      <Typography
                        variant="labelLarge"
                        style={{
                          color: selected
                            ? theme.colors.onSecondaryContainer
                            : theme.colors.onSurfaceVariant,
                          fontWeight: selected ? "700" : "500",
                        }}
                      >
                        {route.label}
                      </Typography>
                    </View>
                  ) : (
                    <View style={styles.railItem}>
                      {/* The indicator is its own pill behind the icon — on a
                          rail the label stays outside it, unlike the drawer. */}
                      <View
                        style={[
                          styles.railIndicator,
                          (hovered || focused) && {
                            backgroundColor: theme.colors.surfaceContainerHigh,
                          },
                          selected && {
                            backgroundColor: theme.colors.secondaryContainer,
                          },
                        ]}
                      >
                        <Icons
                          name={icon}
                          size={22}
                          color={
                            selected
                              ? theme.colors.onSecondaryContainer
                              : theme.colors.onSurfaceVariant
                          }
                        />
                      </View>
                      <Typography
                        variant="labelSmall"
                        style={{
                          color: selected
                            ? theme.colors.onSurface
                            : theme.colors.onSurfaceVariant,
                          fontWeight: selected ? "700" : "500",
                          textAlign: "center",
                        }}
                      >
                        {route.label}
                      </Typography>
                    </View>
                  )
                }
              </Pressable>
            </Link>
          );
        })}
      </ScrollView>

      <NavFooter showLabels={showLabels} />
    </View>
  );
};

/**
 * What the drawer's empty lower half is for: which version these docs were
 * generated from, and the two places a reader goes next. On the rail it
 * collapses to the two icons — there is no room for a version string at 80dp.
 */
const NavFooter = ({ showLabels }: { showLabels: boolean }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={[styles.navFooter, !showLabels && styles.navFooterRail]}>
      {showLabels && (
        <Typography
          variant="labelSmall"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {LIBRARY_NAME} v{LIBRARY_VERSION}
        </Typography>
      )}
      <View
        style={[styles.navFooterLinks, !showLabels && styles.navFooterRail]}
      >
        <IconButton
          icon="npm"
          size="small"
          accessibilityLabel="Open the package on npm"
          onPress={() => Linking.openURL(NPM_URL)}
        />
        <IconButton
          icon="github"
          size="small"
          accessibilityLabel="Open the repository on GitHub"
          onPress={() => Linking.openURL(GITHUB_URL)}
        />
      </View>
    </View>
  );
};

/** The compact form: a scrim plus a sliding panel, dismissed by either. */
const ModalDrawer = ({
  active,
  onDismiss,
}: {
  active: string;
  onDismiss: () => void;
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  // Lazy initial state rather than a ref: the value is read during render to
  // build the transform, which is exactly what a ref must not be used for.
  const [slide] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(slide, {
      toValue: 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [slide]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close navigation"
        onPress={onDismiss}
        style={[styles.scrim, { backgroundColor: theme.colors.scrim }]}
      />
      <Animated.View
        style={[
          styles.drawerPanel,
          {
            transform: [
              {
                translateX: slide.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-DRAWER_WIDTH - 24, 0],
                }),
              },
            ],
          },
        ]}
      >
        <NavSurface
          width={DRAWER_WIDTH}
          showLabels
          active={active}
          variant="modal"
          onNavigate={onDismiss}
        />
      </Animated.View>
    </View>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.background },
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.s,
      paddingVertical: theme.spacing.s,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
    },
    brand: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.s,
      paddingHorizontal: theme.spacing.s,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.shape.medium,
    },
    brandMark: {
      width: 32,
      height: 32,
      borderRadius: theme.shape.small,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primaryContainer,
    },
    topBarSpacer: { flex: 1 },
    searchButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.s,
      paddingLeft: theme.spacing.m,
      paddingRight: theme.spacing.s,
      paddingVertical: theme.spacing.s,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    searchKey: {
      fontSize: 11,
      color: theme.colors.onSurfaceVariant,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      overflow: "hidden",
    },
    body: { flex: 1, flexDirection: "row" },
    nav: { backgroundColor: theme.colors.surface, flexDirection: "column" },
    navPermanent: {
      borderRightWidth: 1,
      borderRightColor: theme.colors.outlineVariant,
    },
    navScroll: { paddingVertical: theme.spacing.m, gap: theme.spacing.xs },
    navHeading: {
      textTransform: "uppercase",
      letterSpacing: 1.4,
      fontWeight: "700",
      paddingHorizontal: theme.spacing.l,
      paddingBottom: theme.spacing.s,
    },
    // Material 3 drawer destination: a 56dp fully rounded container.
    drawerItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.m,
      height: 56,
      paddingHorizontal: theme.spacing.l,
      marginHorizontal: theme.spacing.s,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: "transparent",
    },
    railItem: {
      alignItems: "center",
      gap: 4,
      paddingVertical: theme.spacing.xs,
    },
    // Material 3 rail indicator: 56×32 behind the icon, label outside it.
    railIndicator: {
      width: 56,
      height: 32,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    navFooter: {
      gap: theme.spacing.xs,
      paddingHorizontal: theme.spacing.l,
      paddingVertical: theme.spacing.m,
      borderTopWidth: 1,
      borderTopColor: theme.colors.outlineVariant,
    },
    navFooterRail: {
      alignItems: "center",
      paddingHorizontal: theme.spacing.xs,
    },
    navFooterLinks: { flexDirection: "row", gap: theme.spacing.xs },
    content: { flex: 1 },
    scrim: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: 0.45,
    },
    drawerPanel: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 0,
      width: DRAWER_WIDTH,
      backgroundColor: theme.colors.surface,
      borderTopRightRadius: theme.shape.large,
      borderBottomRightRadius: theme.shape.large,
      overflow: "hidden",
    },
  });

export default SiteShell;
