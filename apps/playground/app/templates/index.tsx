import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Link, router } from "expo-router";
import {
  Button,
  Grid,
  Icon,
  Typography,
  useTheme,
  type PressableState,
  type Theme,
} from "@its/glowup-ui";

import { TEMPLATES, type Template } from "../../templates";
import { CodeBlock } from "../../site/CodeBlock";
import { DemoErrorBoundary } from "../../site/ErrorBoundary";
import { Page, Section } from "../../site/Page";

/** Height of a gallery card's preview well. */
const THUMBNAIL_HEIGHT = 240;

const NAVIGATION = `import { createDrawerNavigator } from "@react-navigation/drawer";
import { AppBar, useTheme } from "@its/glowup-ui";

const Nav = createDrawerNavigator();

export const AppNavigator = ({ routes }) => {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isPinned = width >= 840;

  return (
    <Nav.Navigator
      screenOptions={{
        // AppBar renders the navigator's header: it reads navigation, route
        // and options straight from the header contract.
        header: (props) => <AppBar {...props} isPinned={isPinned} />,
        drawerType: isPinned ? "permanent" : "front",
        headerStyle: { backgroundColor: theme.colors.surface },
        headerShadowVisible: false,
      }}
    >
      {routes.map((route) => (
        <Nav.Screen key={route.name} {...route} />
      ))}
    </Nav.Navigator>
  );
};`;

/**
 * The template gallery. Every card draws its screen live, scaled down from the
 * width it was designed at, so the thumbnail cannot go stale; the screen itself,
 * its source and the components it uses are one click away.
 */
export default function Templates() {
  return (
    <Page
      eyebrow="Composition"
      title="Templates"
      description="Whole screens built only from Glowup components and theme tokens. Each one is a single file you can read, copy and paste: open a template to see it live beside the JSX that builds it."
    >
      {/* `Button` listens to `onClick`, which a `Link asChild` never sets. */}
      <Button
        variant="tonal"
        iconName="view-grid-plus-outline"
        style={{ alignSelf: "flex-start" }}
        onClick={() => router.push("/templates/editor" as never)}
      >
        New layout
      </Button>

      <Grid container autoSize={{ xs: 12, sm: 6, lg: 3 }} spacing="l">
        {TEMPLATES.map((template) => (
          <TemplateCard key={template.slug} template={template} />
        ))}
      </Grid>

      <Section
        title="Navigation"
        description="The library ships navigation widgets but no navigator — picking a router is the app's call. AppBar takes react-navigation's header contract, so wiring it up looks like this."
      >
        <CodeBlock code={NAVIGATION} title="AppNavigator.tsx" />
      </Section>
    </Page>
  );
}

const TemplateCard = ({ template }: { template: Template }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    // Painted one level below the Pressable: `Link asChild` passes its child
    // through a Slot that drops a function or array style on web.
    <Link href={`/templates/${template.slug}` as never} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${template.title} template`}
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
            <Thumbnail template={template} />
            <View style={styles.body}>
              <View style={styles.titleRow}>
                <Typography
                  variant="titleMedium"
                  style={{ color: theme.colors.onSurface, flex: 1 }}
                >
                  {template.title}
                </Typography>
                <Icon
                  source="arrow-right"
                  size={20}
                  color={theme.colors.primary}
                />
              </View>
              <Typography
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {template.summary}
              </Typography>
              <Typography
                variant="labelSmall"
                style={{ color: theme.colors.primary }}
              >
                {template.components.length} components · {template.file}
              </Typography>
            </View>
          </View>
        )}
      </Pressable>
    </Link>
  );
};

/**
 * The template at its design width, scaled to the well. The scale needs the
 * well's own width, so nothing renders until the first layout pass — which is
 * also what the prerendered HTML has, so hydration matches.
 */
const Thumbnail = ({ template }: { template: Template }) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [width, setWidth] = useState(0);
  const inset = theme.spacing.m;
  const scale = width > 0 ? (width - inset * 2) / template.width : 0;

  return (
    // Inert and hidden: the card is one link, and the miniature is a picture
    // of the screen, not a second copy of its controls.
    <View
      style={styles.well}
      pointerEvents="none"
      aria-hidden
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      {scale > 0 && (
        <View
          style={{
            width: template.width,
            position: "absolute",
            top: inset,
            left: inset,
            transformOrigin: "top left",
            transform: [{ scale }],
          }}
        >
          <DemoErrorBoundary label={template.title}>
            <template.Component />
          </DemoErrorBoundary>
        </View>
      )}
    </View>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      borderRadius: theme.shape.large,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surface,
      overflow: "hidden",
    },
    well: {
      height: THUMBNAIL_HEIGHT,
      overflow: "hidden",
      backgroundColor: theme.colors.surfaceContainerLow,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    body: { padding: theme.spacing.m, gap: theme.spacing.xs },
    titleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.s,
    },
  });
