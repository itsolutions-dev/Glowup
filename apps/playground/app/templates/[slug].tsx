import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  Button,
  Chip,
  Divider,
  EmptyState,
  ToggleButtonGroup,
  Typography,
  useTheme,
  type Theme,
} from "@its/glowup-ui";

import { FLAT_ORDER } from "../../catalogue/categories";
import { TEMPLATES, templateFor } from "../../templates";
import { CodeBlock } from "../../site/CodeBlock";
import { DemoErrorBoundary } from "../../site/ErrorBoundary";
import { Page, PageHead, Section } from "../../site/Page";

/** Widths the stage can be pinned to, as on a component's page. */
const STAGE_WIDTHS = {
  phone: 360,
  tablet: 720,
  full: undefined,
} as const;

type StageWidth = keyof typeof STAGE_WIDTHS;

/** One HTML file per template at export time, so each has a real URL. */
export function generateStaticParams(): { slug: string }[] {
  return TEMPLATES.map((template) => ({ slug: template.slug }));
}

/**
 * A template's page: the screen running live, the components it is made of
 * (each a link to its reference) and the complete file that builds it — the
 * same source the stage renders, embedded at build time, so the two cannot
 * disagree.
 */
export default function TemplatePage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [stageWidth, setStageWidth] = useState<StageWidth>("full");

  const template = templateFor(slug);
  if (!template) {
    return (
      <View style={styles.missing}>
        <PageHead
          title="Template not found"
          description="This template is not in the Glowup gallery."
        />
        <EmptyState
          icon="magnify-close"
          title="No such template"
          description={`“${slug}” is not in the gallery.`}
          action={{
            label: "Browse all templates",
            iconName: "page-layout-body",
            onPress: () => router.replace("/templates"),
          }}
        />
      </View>
    );
  }

  const index = TEMPLATES.indexOf(template);
  const previous = TEMPLATES[index - 1];
  const next = TEMPLATES[index + 1];
  const { Component } = template;

  return (
    <Page
      eyebrow="Template"
      title={template.title}
      description={template.description}
    >
      <View style={styles.stageBlock}>
        <View style={styles.toolbar}>
          <Typography
            variant="labelSmall"
            style={[styles.eyebrow, { color: theme.colors.onSurfaceVariant }]}
          >
            Live preview
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
        {/* The width goes on the stage itself, not on a wrapper inside it:
            the template measures its own container to pick a layout. */}
        <View
          style={[
            styles.stage,
            STAGE_WIDTHS[stageWidth] !== undefined && {
              width: STAGE_WIDTHS[stageWidth],
              maxWidth: "100%",
              alignSelf: "center",
            },
          ]}
        >
          <DemoErrorBoundary label={template.title}>
            <Component />
          </DemoErrorBoundary>
        </View>
      </View>

      <Section
        title="Built with"
        description={`${template.components.length} Glowup components and the theme's tokens — no hex values, no hand-rolled controls. Each chip opens that component's reference.`}
      >
        <View style={styles.chips}>
          {template.components.map((name) =>
            FLAT_ORDER.includes(name) ? (
              <Chip
                key={name}
                label={name}
                icon="cube-outline"
                mode="outlined"
                onPress={() => router.push(`/components/${name}` as never)}
              />
            ) : (
              <Chip key={name} label={name} mode="outlined" />
            ),
          )}
        </View>
      </Section>

      <Section
        title="The code"
        description={`The whole of ${template.file}. It imports only React, React Native and @its/glowup-ui, so it can be pasted into an app as is.`}
      >
        <CodeBlock code={template.source} title={template.file} />
      </Section>

      <Divider />

      <View style={styles.pager}>
        {previous ? (
          <Button
            mode="text"
            iconName="chevron-left"
            onPress={() => router.push(`/templates/${previous.slug}` as never)}
          >
            {previous.title}
          </Button>
        ) : (
          <View />
        )}
        {next ? (
          <Button
            mode="text"
            iconName="chevron-right"
            iconPosition="right"
            onPress={() => router.push(`/templates/${next.slug}` as never)}
          >
            {next.title}
          </Button>
        ) : null}
      </View>
    </Page>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    missing: {
      flexGrow: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: theme.spacing.l,
    },
    stageBlock: { gap: theme.spacing.s },
    toolbar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: theme.spacing.s,
    },
    eyebrow: {
      textTransform: "uppercase",
      letterSpacing: 1.6,
      fontWeight: "700",
    },
    stage: {
      padding: theme.spacing.l,
      borderRadius: theme.shape.large,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceContainerLow,
    },
    chips: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.s,
    },
    pager: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
  });
