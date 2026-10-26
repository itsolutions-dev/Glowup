import { useMemo, useRef } from "react";
import {
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type ScrollView,
} from "react-native";
import { Link, router, useLocalSearchParams } from "expo-router";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import {
  Divider,
  EmptyState,
  FAB,
  ScrollArea,
  Typography,
  useTheme,
  type PressableState,
  type Theme,
} from "@its/glowup-ui";

import { ComponentRegistry } from "../../catalogue/registry";
import {
  CATEGORY_OF,
  FLAT_ORDER,
  TOTAL_COUNT,
} from "../../catalogue/categories";
import { descriptionOf } from "../../catalogue/descriptions";
import { exampleFor } from "../../catalogue/examples";
import type { ComponentMetadata } from "../../catalogue/types";
import { VARIANTS_BY_COMPONENT } from "../../catalogue/variants";
import { DemoErrorBoundary } from "../../site/ErrorBoundary";
import { LiveExample } from "../../site/LiveExample";
import {
  OnThisPage,
  useScrollSpy,
  type PageSection,
} from "../../site/OnThisPage";
import { PageHead, Section } from "../../site/Page";
import { PropsTable } from "../../site/PropsTable";
import { docFor } from "../../site/propsData";
import { useLayout } from "../../site/breakpoints";
import { useHydrated } from "../../site/useHydrated";
import { GITHUB_URL } from "../../site/siteNav";

// The name comes from the URL, so only the registry's own keys count:
// /components/constructor must be a 404, not Object.prototype.constructor.
const entryFor = (name?: string) =>
  name && Object.hasOwn(ComponentRegistry, name)
    ? ComponentRegistry[name]
    : undefined;

/**
 * Every route this page can be rendered at. `expo export` calls it to
 * prerender one HTML file per component, which is what makes
 * /components/Button a real URL a search engine and a shared link can both
 * reach — the previous gallery kept the selection in React state alone.
 */
export function generateStaticParams(): { name: string }[] {
  return FLAT_ORDER.map((name) => ({ name }));
}

export default function ComponentPage() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const meta = entryFor(name);

  if (!name || !meta) {
    return (
      <ScrollArea
        style={styles.fill}
        contentContainerStyle={styles.missing}
        testID="page-scroller"
      >
        <PageHead
          title="Component not found"
          description="This component is not in the Glowup catalogue."
        />
        <EmptyState
          icon="magnify-close"
          title="No such component"
          description={`“${name}” is not in the catalogue.`}
          action={{
            label: "Browse all components",
            iconName: "view-grid-outline",
            onPress: () => router.replace("/components"),
          }}
        />
      </ScrollArea>
    );
  }

  // Keyed: the layout keeps this route mounted across catalogue navigation, and
  // the scroll position, the section being read and the typed code must not
  // follow the reader to the next component.
  return <ComponentView key={name} name={name} meta={meta} />;
}

const ComponentView = ({
  name,
  meta,
}: {
  name: string;
  meta: ComponentMetadata;
}) => {
  const { theme } = useTheme();
  const layout = useLayout();
  const hydrated = useHydrated();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const doc = docFor(name);
  const category = CATEGORY_OF[name];
  const index = FLAT_ORDER.indexOf(name);
  const previous = index > 0 ? FLAT_ORDER[index - 1] : undefined;
  const next =
    index < FLAT_ORDER.length - 1 ? FLAT_ORDER[index + 1] : undefined;
  const variants = VARIANTS_BY_COMPONENT[name] ?? [];
  const example = exampleFor(name);
  const description = descriptionOf(name, category);

  // The sections that exist on this page, in order: the links of "On this page"
  // and what the scroll spy follows.
  const sections: PageSection[] = [
    ...(example ? [{ id: "example", label: "Example" }] : []),
    ...(variants.length > 0 ? [{ id: "variants", label: "Variants" }] : []),
    ...(doc ? [{ id: "api", label: "API reference" }] : []),
  ];
  const scrollRef = useRef<ScrollView>(null);
  const spy = useScrollSpy(
    sections.map((section) => section.id),
    scrollRef,
  );
  // The window's size is the server's while hydrating, so the first client
  // render has no column, like the HTML.
  const showLinks =
    Platform.OS === "web" && layout.hasThirdColumn && sections.length > 1;

  return (
    <View style={styles.screen}>
      <ScrollArea
        ref={scrollRef}
        onScroll={spy.onScroll}
        style={styles.fill}
        contentContainerStyle={styles.page}
        testID="page-scroller"
      >
        <PageHead title={name} description={description} />

        <View
          onLayout={spy.track("column")}
          style={[styles.column, { maxWidth: layout.contentMaxWidth }]}
        >
          <View style={styles.header}>
            <Typography
              variant="labelSmall"
              style={[styles.eyebrow, { color: theme.colors.primary }]}
            >
              {(category ?? "").toUpperCase()} ·{" "}
              {String(index + 1).padStart(2, "0")} / {TOTAL_COUNT}
            </Typography>
            <Typography
              variant={layout.isCompact ? "headlineSmall" : "headlineMedium"}
              style={{ color: theme.colors.onSurface }}
            >
              {name}
            </Typography>
            <Typography
              variant="bodyLarge"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {description}
            </Typography>
            {doc ? (
              <Pressable
                accessibilityRole="link"
                accessibilityLabel={`View ${name} source on GitHub`}
                onPress={() =>
                  Linking.openURL(`${GITHUB_URL}/blob/master/${doc.source}`)
                }
                style={({ hovered }: PressableState) => [
                  styles.sourceLink,
                  hovered && { opacity: 0.7 },
                ]}
              >
                <Icons
                  name="file-code-outline"
                  size={14}
                  color={theme.colors.primary}
                />
                <Typography
                  variant="labelMedium"
                  style={{ color: theme.colors.primary }}
                >
                  {doc.source}
                </Typography>
              </Pressable>
            ) : null}
          </View>

          {/* The main column and, on a wide window, "On this page" beside it. The
            row is always there so the example is not remounted (and its typed
            code lost) when the window crosses the breakpoint. */}
          <View onLayout={spy.track("row")} style={styles.row}>
            <View style={styles.main}>
              {/* The page is its one example: the stage, the code and the controls. */}
              {example ? (
                <View onLayout={spy.track("example")}>
                  <LiveExample name={name} example={example} meta={meta} />
                </View>
              ) : null}

              {variants.length > 0 && (
                <Section
                  title="Variants"
                  description="The states and shapes this component is meant to be used in."
                  onLayout={spy.track("variants")}
                >
                  {variants.map((variant) => (
                    <View key={variant.name} style={styles.variant}>
                      <Typography
                        variant="titleSmall"
                        style={{ color: theme.colors.onSurface }}
                      >
                        {variant.title}
                      </Typography>
                      {variant.description ? (
                        <Typography
                          variant="bodySmall"
                          style={{ color: theme.colors.onSurfaceVariant }}
                        >
                          {variant.description}
                        </Typography>
                      ) : null}
                      <View style={styles.variantStage}>
                        <DemoErrorBoundary label={`${name} — ${variant.title}`}>
                          {/* The same rule as the stage: see `clientOnly`. */}
                          {(hydrated || !meta.clientOnly) && <variant.render />}
                        </DemoErrorBoundary>
                      </View>
                    </View>
                  ))}
                </Section>
              )}

              {doc ? (
                <Section
                  title="API reference"
                  description="Generated from the library's TypeScript, so it cannot drift from the implementation."
                  onLayout={spy.track("api")}
                >
                  <PropsTable doc={doc} />
                </Section>
              ) : null}
            </View>

            {showLinks ? (
              <View style={styles.links}>
                <OnThisPage
                  sections={sections}
                  active={spy.active}
                  onSelect={spy.scrollToSection}
                />
              </View>
            ) : null}
          </View>

          <Divider />

          <View style={styles.pager}>
            {previous ? (
              <PagerLink name={previous} direction="previous" />
            ) : (
              <View style={styles.pagerSpacer} />
            )}
            {next ? <PagerLink name={next} direction="next" /> : null}
          </View>
        </View>
      </ScrollArea>

      {spy.scrolled ? (
        <FAB icon="arrow-up" label="Back to top" onClick={spy.scrollToTop} />
      ) : null}
    </View>
  );
};

const PagerLink = ({
  name,
  direction,
}: {
  name: string;
  direction: "previous" | "next";
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const isNext = direction === "next";

  return (
    <Link href={`/components/${name}` as never} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${isNext ? "Next" : "Previous"} component: ${name}`}
      >
        {/* Painted one level in: `Link asChild` drops a function or array style
            on the Slot's direct child. */}
        {({ hovered, focused }: PressableState) => (
          <View
            style={[
              styles.pagerItem,
              (hovered || focused) && {
                backgroundColor: theme.colors.surfaceContainerHigh,
              },
            ]}
          >
            {!isNext && (
              <Icons
                name="chevron-left"
                size={20}
                color={theme.colors.primary}
              />
            )}
            <View style={isNext ? styles.pagerTextRight : undefined}>
              <Typography
                variant="labelSmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {isNext ? "Next" : "Previous"}
              </Typography>
              <Typography
                variant="bodyMedium"
                style={{ color: theme.colors.onSurface }}
              >
                {name}
              </Typography>
            </View>
            {isNext && (
              <Icons
                name="chevron-right"
                size={20}
                color={theme.colors.primary}
              />
            )}
          </View>
        )}
      </Pressable>
    </Link>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    page: {
      flexGrow: 1,
      alignItems: "center",
      paddingHorizontal: theme.spacing.m,
      paddingTop: theme.spacing.l,
      paddingBottom: theme.spacing.xl * 2,
    },
    missing: {
      flexGrow: 1,
      justifyContent: "center",
      padding: theme.spacing.l,
    },
    screen: { flex: 1 },
    // What a ScrollView does by itself, for the `ScrollArea` view around it.
    fill: { flexGrow: 1, flexShrink: 1 },
    column: { width: "100%", gap: theme.spacing.xl },
    // The content and, on a wide window, the links; both inside the column's
    // `contentMaxWidth`, so the links take their room from the content.
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: theme.spacing.l,
    },
    main: { flex: 1, minWidth: 0, gap: theme.spacing.xl },
    // Stays in view while the page scrolls (web only: this column is not drawn
    // anywhere else).
    links: {
      width: 160,
      ...(Platform.OS === "web"
        ? ({ position: "sticky", top: theme.spacing.l } as object)
        : null),
    },
    header: { gap: theme.spacing.xs },
    eyebrow: {
      textTransform: "uppercase",
      letterSpacing: 1.6,
      fontWeight: "700",
    },
    sourceLink: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
      marginTop: theme.spacing.xs,
    },
    variant: { gap: theme.spacing.xs },
    variantStage: {
      padding: theme.spacing.l,
      borderRadius: theme.shape.medium,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceContainerLow,
    },
    pager: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: theme.spacing.m,
      flexWrap: "wrap",
    },
    pagerSpacer: { flex: 1 },
    pagerItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.s,
      paddingVertical: theme.spacing.s,
      paddingHorizontal: theme.spacing.m,
      borderRadius: theme.shape.medium,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    pagerTextRight: { alignItems: "flex-end" },
  });
