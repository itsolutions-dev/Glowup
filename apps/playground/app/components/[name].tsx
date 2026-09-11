import { useCallback, useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Link, router, useLocalSearchParams } from "expo-router";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import {
  Divider,
  EmptyState,
  ToggleButtonGroup,
  Typography,
  useTheme,
  type PressableState,
  type Theme,
} from "@its/glowup-ui";

import ComponentPreview from "../../catalogue/ComponentPreview";
import { ComponentRegistry } from "../../catalogue/registry";
import {
  CATEGORY_OF,
  FLAT_ORDER,
  TOTAL_COUNT,
} from "../../catalogue/categories";
import { buildSnippet } from "../../catalogue/snippet";
import { VARIANTS_BY_COMPONENT } from "../../catalogue/variants";
import { CodeBlock } from "../../site/CodeBlock";
import { DemoErrorBoundary } from "../../site/ErrorBoundary";
import { PageHead, Section } from "../../site/Page";
import { PropControls } from "../../site/PropControls";
import { PropsTable } from "../../site/PropsTable";
import { docFor, requiredPropsOf } from "../../site/propsData";
import { useLayout } from "../../site/breakpoints";
import { GITHUB_URL } from "../../site/siteNav";

/** Widths the stage can be pinned to, so a reader can see the mobile case. */
const STAGE_WIDTHS = {
  phone: 360,
  tablet: 720,
  full: undefined,
} as const;

type StageWidth = keyof typeof STAGE_WIDTHS;

const defaultsOf = (name: string) => {
  const meta = ComponentRegistry[name];
  const values: Record<string, any> = {};
  if (!meta) return values;
  for (const [key, definition] of Object.entries(meta.props)) {
    values[key] = definition.default;
  }
  return values;
};

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
  const layout = useLayout();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const meta = name ? ComponentRegistry[name] : undefined;
  const [stageWidth, setStageWidth] = useState<StageWidth>("full");

  // The layout keeps this page mounted across catalogue navigation, so the
  // props of the component being left behind must not leak onto the next one.
  // The component name is stored alongside the values and the pair is reset
  // during render — React's own way to adjust state when a prop changes, and
  // one frame earlier than an effect would manage.
  const [edited, setEdited] = useState(() => ({
    name: name ?? "",
    values: defaultsOf(name ?? ""),
  }));
  if (edited.name !== (name ?? "")) {
    setEdited({ name: name ?? "", values: defaultsOf(name ?? "") });
  }
  const props = edited.values;

  const updateProp = useCallback((key: string, value: any) => {
    setEdited((previous) => ({
      ...previous,
      values: { ...previous.values, [key]: value },
    }));
  }, []);

  const reset = useCallback(
    () => setEdited({ name: name ?? "", values: defaultsOf(name ?? "") }),
    [name],
  );

  if (!name || !meta) {
    return (
      <ScrollView contentContainerStyle={styles.missing}>
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
      </ScrollView>
    );
  }

  const doc = docFor(name);
  const category = CATEGORY_OF[name];
  const index = FLAT_ORDER.indexOf(name);
  const previous = index > 0 ? FLAT_ORDER[index - 1] : undefined;
  const next =
    index < FLAT_ORDER.length - 1 ? FLAT_ORDER[index + 1] : undefined;
  const variants = VARIANTS_BY_COMPONENT[name] ?? [];
  const snippet = buildSnippet(name, meta, props, requiredPropsOf(name));
  const description =
    doc?.description ??
    `${name} — a Material You ${category?.toLowerCase() ?? "UI"} component for React Native and web.`;

  return (
    <ScrollView
      contentContainerStyle={styles.page}
      showsVerticalScrollIndicator={false}
    >
      <PageHead title={name} description={description} />

      <View style={[styles.column, { maxWidth: layout.contentMaxWidth }]}>
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

        <View style={styles.stageBlock}>
          <View style={styles.stageToolbar}>
            <Typography
              variant="labelSmall"
              style={[styles.eyebrow, { color: theme.colors.onSurfaceVariant }]}
            >
              Live demo
            </Typography>
            <ToggleButtonGroup
              accessibilityLabel="Stage width"
              value={stageWidth}
              onValueChange={(value) => setStageWidth(value as StageWidth)}
              options={[
                { value: "phone", icon: "cellphone", label: "360" },
                { value: "tablet", icon: "tablet", label: "720" },
                { value: "full", icon: "monitor", label: "Full" },
              ]}
            />
          </View>

          {/* The cap goes on the stage, not on a wrapper inside it. Capping an
              inner box that is already wider than its content changes nothing
              anyone can see: the frame stayed 912px and the demo never
              reflowed. Narrowing the frame itself is both the feedback that
              the viewport changed and the constraint the demo lays out in. */}
          <View
            style={[
              styles.stage,
              STAGE_WIDTHS[stageWidth] !== undefined && {
                // A fixed width, not a cap: `alignSelf` takes the stage out of
                // the column's stretch, so a maxWidth alone let it shrink-wrap
                // its content and 360 and 720 rendered identically. maxWidth
                // "100%" keeps it inside the column on a narrow screen.
                width: STAGE_WIDTHS[stageWidth],
                maxWidth: "100%",
                alignSelf: "center",
              },
            ]}
          >
            <View style={styles.stageInner}>
              <DemoErrorBoundary label={name}>
                <ComponentPreview
                  selectedComponentName={name}
                  activeMeta={meta}
                  componentProps={props}
                  updateProp={updateProp}
                />
              </DemoErrorBoundary>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.controlsAndCode,
            layout.hasSidebar && styles.controlsAndCodeWide,
          ]}
        >
          <View style={styles.controlsColumn}>
            <PropControls
              meta={meta}
              values={props}
              onChange={updateProp}
              onReset={reset}
            />
          </View>
          <View style={styles.codeColumn}>
            <Typography
              variant="labelSmall"
              style={[styles.eyebrow, { color: theme.colors.onSurfaceVariant }]}
            >
              Usage
            </Typography>
            <CodeBlock code={snippet} title={`${name}.tsx`} />
          </View>
        </View>

        {variants.length > 0 && (
          <Section
            title="Variants"
            description="The states and shapes this component is meant to be used in."
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
                    <variant.render />
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
          >
            <PropsTable doc={doc} />
          </Section>
        ) : null}

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
    </ScrollView>
  );
}

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
      paddingHorizontal: theme.spacing.l,
      paddingTop: theme.spacing.l,
      paddingBottom: theme.spacing.xl * 2,
    },
    missing: {
      flexGrow: 1,
      justifyContent: "center",
      padding: theme.spacing.l,
    },
    column: { width: "100%", gap: theme.spacing.xl },
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
    stageBlock: { gap: theme.spacing.s },
    stageToolbar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: theme.spacing.s,
    },
    stage: {
      minHeight: 260,
      alignItems: "center",
      justifyContent: "center",
      padding: theme.spacing.l,
      borderRadius: theme.shape.large,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceContainerLow,
    },
    stageInner: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
    },
    controlsAndCode: { gap: theme.spacing.l },
    controlsAndCodeWide: { flexDirection: "row", alignItems: "flex-start" },
    controlsColumn: { flex: 1, minWidth: 0 },
    codeColumn: { flex: 1, minWidth: 0, gap: theme.spacing.s },
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
