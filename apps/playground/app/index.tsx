import { useMemo, useState } from "react";
import { Linking, Pressable, StyleSheet, View } from "react-native";
import { Link } from "expo-router";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import {
  Button,
  Stat,
  Typography,
  useTheme,
  type PressableState,
  type Theme,
} from "@its/glowup-ui";

import { TOTAL_COUNT } from "../catalogue/categories";
import { VARIANT_COUNT } from "../catalogue/variants";
import { CodeBlock } from "../site/CodeBlock";
import { Page, Section } from "../site/Page";
import { Showcase } from "../site/Showcase";
import { useLayout } from "../site/breakpoints";
import { TOTAL_PROP_COUNT } from "../site/propsData";
import { GITHUB_URL, NPM_URL, SITE_ROUTES } from "../site/siteNav";

const INSTALL = `npm install @its/glowup-ui`;

const DESCRIPTION =
  "A Material Design 3 component library for Expo apps that ship to iOS, Android and the browser from one codebase — and the live reference for every component in it.";

/**
 * Below this the hero is one column: the copy, then the sampler under it. The
 * sampler needs about 660 px for its two columns and takes 60% of the row.
 */
const SIDE_BY_SIDE_FROM = 1200;

export default function Home() {
  const { theme } = useTheme();
  const layout = useLayout();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  // Measured from the hero's own box, not the window: beside the navigation
  // the column is a good deal narrower than the window that holds it.
  const [width, setWidth] = useState(0);
  const sideBySide = width >= SIDE_BY_SIDE_FROM;

  return (
    <Page
      eyebrow="Material You · React Native · Web"
      title="Glowup"
      description={DESCRIPTION}
      hero={
        <View
          onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
          style={[styles.hero, sideBySide && styles.heroRow]}
        >
          <View style={[styles.copy, sideBySide && styles.copyWide]}>
            <Typography
              variant="labelSmall"
              style={[styles.eyebrow, { color: theme.colors.primary }]}
            >
              Glowup · Material You · React Native · Web
            </Typography>
            <View accessibilityRole="header">
              <Typography
                variant={layout.isCompact ? "displaySmall" : "displayMedium"}
                style={[styles.headline, { color: theme.colors.primary }]}
              >
                Build once
              </Typography>
              <Typography
                variant={layout.isCompact ? "displaySmall" : "displayMedium"}
                style={[styles.headline, { color: theme.colors.onSurface }]}
              >
                with Material You
              </Typography>
              <Typography
                variant={layout.isCompact ? "displaySmall" : "displayMedium"}
                style={[styles.headline, { color: theme.colors.onSurface }]}
              >
                for every screen
              </Typography>
            </View>
            <Typography
              variant="bodyLarge"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {DESCRIPTION}
            </Typography>

            <View style={styles.actions}>
              <Link href="/components" asChild>
                <Button
                  variant="filled"
                  iconName="view-grid-outline"
                  onClick={() => {}}
                >
                  Browse components
                </Button>
              </Link>
              <Link href="/getting-started" asChild>
                <Button
                  variant="tonal"
                  iconName="rocket-launch-outline"
                  onClick={() => {}}
                >
                  Get started
                </Button>
              </Link>
              <Button
                variant="outlined"
                iconName="npm"
                onClick={() => Linking.openURL(NPM_URL)}
              >
                View on npm
              </Button>
            </View>

            <CodeBlock code={INSTALL} language="bash" title="Install" />
          </View>

          <View style={[styles.showcase, sideBySide && styles.showcaseWide]}>
            <Showcase />
          </View>
        </View>
      }
    >
      <View style={[styles.stats, layout.isCompact && styles.statsStacked]}>
        <View style={styles.statItem}>
          <Stat
            label="Components"
            value={String(TOTAL_COUNT)}
            icon="shape-outline"
          />
        </View>
        <View style={styles.statItem}>
          <Stat
            label="Documented props"
            value={String(TOTAL_PROP_COUNT)}
            icon="format-list-bulleted-type"
            helpText="Generated from the source"
          />
        </View>
        <View style={styles.statItem}>
          <Stat
            label="Variant demos"
            value={String(VARIANT_COUNT)}
            icon="view-carousel-outline"
          />
        </View>
        <View style={styles.statItem}>
          <Stat
            label="Platforms"
            value="3"
            icon="cellphone-link"
            helpText="iOS · Android · Web"
          />
        </View>
      </View>

      <Section
        title="Where to go"
        description="The reference is the point of this site; the rest is what you need around it."
      >
        <View style={styles.cards}>
          {SITE_ROUTES.filter((route) => route.href !== "/").map((route) => (
            <View
              key={route.href}
              style={[
                styles.cardSlot,
                !layout.isCompact && styles.cardSlotWide,
              ]}
            >
              <Link href={route.href as never} asChild>
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel={route.label}
                >
                  {/* Painted one level in: `Link asChild` drops a function or
                    array style on the Slot's direct child. */}
                  {({ hovered, focused }: PressableState) => (
                    <View
                      style={[
                        styles.card,
                        (hovered || focused) && {
                          borderColor: theme.colors.primary,
                        },
                      ]}
                    >
                      <Icons
                        name={route.icon}
                        size={22}
                        color={theme.colors.primary}
                      />
                      <Typography
                        variant="titleSmall"
                        style={{ color: theme.colors.onSurface }}
                      >
                        {route.label}
                      </Typography>
                      <Typography
                        variant="bodySmall"
                        style={{ color: theme.colors.onSurfaceVariant }}
                      >
                        {route.summary}
                      </Typography>
                    </View>
                  )}
                </Pressable>
              </Link>
            </View>
          ))}
        </View>
      </Section>

      <Section
        title="What it is not"
        description="The boundaries are deliberate and enforced by lint rules, not by convention."
      >
        <View style={styles.bullets}>
          <Bullet icon="navigation-outline">
            Navigation-agnostic: it ships AppBar, NavigationBar, Tabs,
            Breadcrumbs, Pagination and Stepper, but no navigator. Picking a
            router stays your call.
          </Bullet>
          <Bullet icon="palette-swatch-outline">
            Token-driven: every colour, type ramp, spacing step and corner
            radius comes from one theme file, in light and dark.
          </Bullet>
          <Bullet icon="package-variant-closed">
            Peer-dependency native modules: the library adds only date-fns and
            polished to your dependency tree.
          </Bullet>
        </View>
        <Button
          variant="text"
          iconName="github"
          onClick={() => Linking.openURL(GITHUB_URL)}
        >
          Source on GitHub
        </Button>
      </Section>
    </Page>
  );
}

const Bullet = ({
  icon,
  children,
}: {
  icon: string;
  children: React.ReactNode;
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.bullet}>
      <Icons name={icon as never} size={18} color={theme.colors.primary} />
      <Typography
        variant="bodyMedium"
        style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}
      >
        {children}
      </Typography>
    </View>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    hero: { gap: theme.spacing.xl },
    heroRow: { flexDirection: "row", alignItems: "center" },
    // A line of the description stays readable when the copy has the row.
    copy: { gap: theme.spacing.l, maxWidth: 720 },
    copyWide: { flex: 1, minWidth: 0 },
    showcase: { width: "100%" },
    showcaseWide: { flex: 1.5, minWidth: 0 },
    eyebrow: {
      textTransform: "uppercase",
      letterSpacing: 1.6,
      fontWeight: "700",
    },
    headline: { fontWeight: "700" },
    actions: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.s,
    },
    stats: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.m },
    statsStacked: { flexDirection: "column" },
    statItem: { flexGrow: 1, flexBasis: 180 },
    cards: { flexDirection: "row", flexWrap: "wrap", gap: theme.spacing.m },
    cardSlot: { flexGrow: 1, flexBasis: "100%" },
    cardSlotWide: { flexBasis: 240, maxWidth: 320 },
    // Purely visual. The sizing lives on the slot: a Pressable under a
    // `Link asChild` never receives a style, and flex properties on the card
    // would read as height once it is a column child rather than a row item.
    card: {
      flex: 1,
      gap: theme.spacing.xs,
      padding: theme.spacing.l,
      borderRadius: theme.shape.large,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceContainerLow,
    },
    bullets: { gap: theme.spacing.m },
    bullet: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: theme.spacing.s,
    },
  });
