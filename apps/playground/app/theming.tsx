import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  Button,
  Typography,
  useTheme,
  type Theme,
  type TypographyVariant,
} from "@its/glowup-ui";

import { CodeBlock } from "../site/CodeBlock";
import { Page, Section } from "../site/Page";
import { useLayout } from "../site/breakpoints";

/**
 * The colour roles, grouped the way M3 groups them. Tokens the theme has but
 * this list does not are collected into "Other" rather than dropped, so adding
 * one to theme.json makes it appear here without an edit.
 */
const COLOR_GROUPS: { label: string; tokens: string[] }[] = [
  {
    label: "Primary",
    tokens: [
      "primary",
      "onPrimary",
      "primaryContainer",
      "onPrimaryContainer",
      "inversePrimary",
    ],
  },
  {
    label: "Secondary",
    tokens: [
      "secondary",
      "onSecondary",
      "secondaryContainer",
      "onSecondaryContainer",
    ],
  },
  {
    label: "Tertiary",
    tokens: [
      "tertiary",
      "onTertiary",
      "tertiaryContainer",
      "onTertiaryContainer",
    ],
  },
  {
    label: "Error",
    tokens: ["error", "onError", "errorContainer", "onErrorContainer"],
  },
  {
    label: "Surfaces",
    tokens: [
      "background",
      "onBackground",
      "surface",
      "onSurface",
      "surfaceVariant",
      "onSurfaceVariant",
      "surfaceContainerLow",
      "surfaceContainer",
      "surfaceContainerHigh",
      "surfaceContainerHighest",
      "surfaceDim",
      "inverseSurface",
      "inverseOnSurface",
      "surfaceTint",
    ],
  },
  {
    label: "Lines & shadows",
    tokens: ["outline", "outlineVariant", "scrim", "shadow"],
  },
];

const TYPE_SCALE: TypographyVariant[] = [
  "displayLarge",
  "displayMedium",
  "displaySmall",
  "headlineLarge",
  "headlineMedium",
  "headlineSmall",
  "titleLarge",
  "titleMedium",
  "titleSmall",
  "bodyLarge",
  "bodyMedium",
  "bodySmall",
  "labelLarge",
  "labelMedium",
  "labelSmall",
];

const USAGE = `import { useTheme } from "@its/glowup-ui";
import { StyleSheet } from "react-native";

const Card = () => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return <View style={styles.card} />;
};

// Styles are rebuilt when the theme changes — never read a token at module scope.
const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      padding: theme.spacing.m,
      borderRadius: theme.shape.large,
      backgroundColor: theme.colors.surfaceContainerLow,
    },
  });`;

/**
 * `theme.colors` is spelled out token by token in the public `Theme` type — on
 * purpose, so the emitted .d.ts does not import theme.json — which means it has
 * no index signature to read a dynamic token name through.
 */
const colorToken = (theme: Theme, token: string): string | undefined =>
  (theme.colors as unknown as Record<string, string>)[token];

export default function Theming() {
  const { theme, toggleTheme } = useTheme();
  const layout = useLayout();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const known = new Set(COLOR_GROUPS.flatMap((group) => group.tokens));
  const extras = Object.keys(theme.colors).filter(
    (token) =>
      !known.has(token) && typeof colorToken(theme, token) === "string",
  );
  const groups = extras.length
    ? [...COLOR_GROUPS, { label: "Other", tokens: extras }]
    : COLOR_GROUPS;

  return (
    <Page
      eyebrow="Design tokens"
      title="Theming"
      description="Every colour, type step, spacing unit and corner radius in the library comes from one token set, resolved for the light and dark schemes. These swatches are the live values of the theme this page is rendered with."
    >
      <View style={styles.toggleRow}>
        <Typography
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          Showing the{" "}
          <Text style={styles.strong}>{theme.isDark ? "dark" : "light"}</Text>{" "}
          scheme.
        </Typography>
        <Button
          mode="tonal"
          iconName={theme.isDark ? "weather-sunny" : "weather-night"}
          onPress={toggleTheme}
        >
          Switch scheme
        </Button>
      </View>

      {groups.map((group) => (
        <Section key={group.label} title={group.label}>
          <View style={styles.swatchGrid}>
            {group.tokens.map((token) => {
              const value = colorToken(theme, token);
              if (!value) return null;
              return (
                <Swatch
                  key={token}
                  token={token}
                  value={value}
                  columns={
                    layout.atLeast("large")
                      ? 4
                      : layout.atLeast("medium")
                        ? 3
                        : 2
                  }
                />
              );
            })}
          </View>
        </Section>
      ))}

      <Section
        title="Type scale"
        description="Fifteen steps, all on the system font family. `Typography` takes the step name as its variant."
      >
        <View style={styles.typeList}>
          {TYPE_SCALE.map((variant) => {
            const spec = theme.typography[variant];
            return (
              <View key={variant} style={styles.typeRow}>
                <Typography
                  variant={variant}
                  style={{ color: theme.colors.onSurface }}
                >
                  {variant}
                </Typography>
                <Typography
                  variant="labelSmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {spec.fontSize} / {spec.lineHeight} ·{" "}
                  {String(spec.fontWeight)}
                </Typography>
              </View>
            );
          })}
        </View>
      </Section>

      <Section
        title="Spacing"
        description="Five steps. Layout primitives take the token name, StyleSheets take the value."
      >
        <View style={styles.tokenRow}>
          {Object.entries(theme.spacing).map(([name, value]) => (
            <View key={name} style={styles.tokenChip}>
              <View
                style={[
                  styles.spacingBar,
                  { width: value as number, height: value as number },
                ]}
              />
              <Typography
                variant="labelMedium"
                style={{ color: theme.colors.onSurface }}
              >
                {name}
              </Typography>
              <Typography
                variant="labelSmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {String(value)}dp
              </Typography>
            </View>
          ))}
        </View>
      </Section>

      <Section
        title="Shape"
        description="Corner radii, by role rather than by number."
      >
        <View style={styles.tokenRow}>
          {Object.entries(theme.shape).map(([name, value]) => (
            <View key={name} style={styles.tokenChip}>
              <View
                style={[styles.shapeSample, { borderRadius: value as number }]}
              />
              <Typography
                variant="labelMedium"
                style={{ color: theme.colors.onSurface }}
              >
                {name}
              </Typography>
              <Typography
                variant="labelSmall"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {String(value)}dp
              </Typography>
            </View>
          ))}
        </View>
      </Section>

      <Section
        title="Reading tokens in your own code"
        description="The pattern every component in the library follows."
      >
        <CodeBlock code={USAGE} title="Card.tsx" />
      </Section>
    </Page>
  );
}

const Swatch = ({
  token,
  value,
  columns,
}: {
  token: string;
  value: string;
  columns: number;
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View
      style={[
        styles.swatch,
        { flexBasis: `${100 / columns}%`, maxWidth: `${100 / columns}%` },
      ]}
    >
      <View style={[styles.swatchChip, { backgroundColor: value }]} />
      <Typography
        variant="labelMedium"
        style={{ color: theme.colors.onSurface }}
      >
        {token}
      </Typography>
      <Typography
        variant="labelSmall"
        style={{ color: theme.colors.onSurfaceVariant }}
      >
        {value}
      </Typography>
    </View>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    toggleRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: theme.spacing.m,
    },
    strong: { fontWeight: "700", color: theme.colors.onSurface },
    swatchGrid: { flexDirection: "row", flexWrap: "wrap" },
    swatch: {
      gap: 2,
      paddingRight: theme.spacing.m,
      paddingBottom: theme.spacing.m,
    },
    swatchChip: {
      height: 56,
      borderRadius: theme.shape.medium,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      marginBottom: theme.spacing.xs,
    },
    typeList: { gap: theme.spacing.m },
    typeRow: { gap: 2 },
    tokenRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.m,
      alignItems: "flex-end",
    },
    tokenChip: { alignItems: "center", gap: 2, minWidth: 72 },
    spacingBar: {
      backgroundColor: theme.colors.primary,
      borderRadius: 2,
      marginBottom: theme.spacing.xs,
    },
    shapeSample: {
      width: 56,
      height: 56,
      backgroundColor: theme.colors.primaryContainer,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      marginBottom: theme.spacing.xs,
    },
  });
