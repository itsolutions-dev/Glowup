import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  Button,
  Typography,
  palettes,
  useTheme,
  type Theme,
  type ThemePalette,
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

const PICK_PALETTE = `import { ThemeProvider, palettes } from "@its/glowup-ui";

// The colour set the app starts on. Both schemes come with it: the provider
// still follows the OS light/dark setting and \`toggleTheme()\`.
export default function App() {
  return (
    <ThemeProvider initialPalette={palettes.teal}>
      <Root />
    </ThemeProvider>
  );
}`;

const SWITCH_PALETTE = `import { palettes, useTheme } from "@its/glowup-ui";

// Swapping the set at runtime re-renders every component that reads the theme
// — this picker is exactly this call.
const PaletteMenu = () => {
  const { palette, setPalette } = useTheme();
  return Object.values(palettes).map((p) => (
    <Chip key={p.id} selected={p.id === palette.id} onPress={() => setPalette(p)}>
      {p.name}
    </Chip>
  ));
};`;

const CUSTOM_PALETTE = `import { createPalette, ThemeProvider } from "@its/glowup-ui";

// One brand colour in, both complete schemes out: primary, secondary and
// tertiary tonal palettes plus the neutrals, mapped onto the M3 roles. Error
// stays the fixed Material red, as the spec requires.
const brand = createPalette("#00639B", { id: "brand", name: "Brand" });

// Tune how saturated the derived palettes are, if the default reads too calm:
const vivid = createPalette("#00639B", {
  id: "brand-vivid",
  name: "Brand (vivid)",
  chroma: { primary: 64, tertiary: 32, tertiaryHueShift: 120 },
});

<ThemeProvider initialPalette={brand}>…</ThemeProvider>;`;

const HAND_PALETTE = `import { palettes, type ThemePalette } from "@its/glowup-ui";

// Nothing is derived here: a palette is just the token set for both schemes,
// so a hand-authored one — from Material Theme Builder, say — drops straight
// in. Spread a shipped palette to fill in the roles you do not override.
const corporate: ThemePalette = {
  id: "corporate",
  name: "Corporate",
  seed: "#00639B",
  light: { ...palettes.baseline.light, primary: "#00639B", onPrimary: "#FFFFFF" },
  dark: { ...palettes.baseline.dark, primary: "#95CCFF", onPrimary: "#003354" },
};`;

/**
 * `theme.colors` is spelled out token by token in the public `Theme` type — on
 * purpose, so the emitted .d.ts does not import theme.json — which means it has
 * no index signature to read a dynamic token name through.
 */
const colorToken = (theme: Theme, token: string): string | undefined =>
  (theme.colors as unknown as Record<string, string>)[token];

export default function Theming() {
  const { theme, toggleTheme, palette, setPalette } = useTheme();
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

      <Section
        title="Colour sets"
        description="Six Material 3 schemes. Picking one re-themes the whole site — every page, every component demo — because the library resolves its tokens from the selected set."
      >
        <View style={styles.paletteGrid}>
          {Object.values(palettes).map((option) => (
            <PaletteCard
              key={option.id}
              palette={option}
              selected={option.id === palette.id}
              onPress={() => setPalette(option)}
            />
          ))}
        </View>
      </Section>

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

      <Section
        title="Using a colour set in your app"
        description={`Everything the picker above does is public API. The set shown right now is \`palettes.${palette.id}\`, seeded from ${palette.seed}.`}
      >
        <CodeBlock code={PICK_PALETTE} title="App.tsx" />
        <CodeBlock code={SWITCH_PALETTE} title="PaletteMenu.tsx" />
      </Section>

      <Section
        title="Your own colours"
        description="A seed colour is enough — the tonal palettes and the role mapping are Material 3's. A palette authored by hand is the same shape, so either route ends at the same `initialPalette` prop."
      >
        <CodeBlock code={CUSTOM_PALETTE} title="brand.ts" />
        <CodeBlock code={HAND_PALETTE} title="corporate.ts" />
      </Section>
    </Page>
  );
}

const PaletteCard = ({
  palette,
  selected,
  onPress,
}: {
  palette: ThemePalette;
  selected: boolean;
  onPress: () => void;
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const scheme = theme.isDark ? palette.dark : palette.light;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${palette.name} colour set`}
      style={[styles.paletteCard, selected && styles.paletteCardSelected]}
    >
      <View style={styles.paletteStripe}>
        {[
          scheme.primary,
          scheme.secondary,
          scheme.tertiary,
          scheme.surfaceContainerHighest,
        ].map((color, index) => (
          <View
            key={index}
            style={[styles.paletteSwatch, { backgroundColor: color }]}
          />
        ))}
      </View>
      <Typography
        variant="labelLarge"
        style={{ color: theme.colors.onSurface }}
      >
        {palette.name}
      </Typography>
      <Typography
        variant="labelSmall"
        style={{ color: theme.colors.onSurfaceVariant }}
      >
        {selected ? "Selected" : palette.seed}
      </Typography>
    </Pressable>
  );
};

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
    paletteGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: theme.spacing.m,
    },
    paletteCard: {
      minWidth: 152,
      flexGrow: 1,
      flexBasis: 152,
      // A wrapped row must not stretch its one card across the grid.
      maxWidth: 240,
      gap: 2,
      padding: theme.spacing.s,
      borderRadius: theme.shape.large,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceContainerLow,
    },
    paletteCardSelected: {
      borderWidth: 2,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.surfaceContainerHigh,
    },
    paletteStripe: {
      flexDirection: "row",
      height: 40,
      borderRadius: theme.shape.medium,
      overflow: "hidden",
      marginBottom: theme.spacing.xs,
    },
    paletteSwatch: { flex: 1 },
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
