import themeConfig from "./theme.json";
import type {
  Theme,
  ThemeColorTokens,
  TypographyVariant,
} from "./ThemeProvider";

/** A scheme as authored here: every token but `boxShadow`, which palettes.ts adds. */
type BrandScheme = Omit<ThemeColorTokens, "boxShadow">;

interface BrandPalette {
  id: "databeasy" | "inxpire";
  name: string;
  seed: string;
  light: BrandScheme;
  dark: BrandScheme;
  typography: Theme["typography"];
  iconSet: "material" | "eva";
}

type Weight = "400" | "500" | "600" | "700";

/** One variant's changes to the default scale; `tracking` is in em. */
interface TypeSpec {
  fontSize?: number;
  lineHeight?: number;
  fontWeight?: Weight;
  tracking?: number;
}

/**
 * A full type scale in one font. `faces` names the font file for each weight
 * (expo-google-fonts style, e.g. "Roboto_500Medium"): custom fonts are loaded
 * one face per weight, so the weight is chosen by family and `fontWeight` stays
 * "400" — otherwise web and Android add a synthetic bold on top. Variants a
 * design file does not specify keep the default size, line height and tracking.
 */
const typeScale = (
  faces: Partial<Record<Weight, string>>,
  specs: Partial<Record<TypographyVariant, TypeSpec>>,
): Theme["typography"] => {
  const scale = {} as Theme["typography"];
  (Object.keys(themeConfig.typography) as TypographyVariant[]).forEach((v) => {
    const base = themeConfig.typography[v];
    const spec = specs[v] ?? {};
    const fontSize = spec.fontSize ?? base.fontSize;
    scale[v] = {
      fontFamily: faces[spec.fontWeight ?? (base.fontWeight as Weight)],
      fontWeight: "400",
      fontSize,
      lineHeight: spec.lineHeight ?? base.lineHeight,
      letterSpacing:
        spec.tracking === undefined
          ? base.letterSpacing
          : +(spec.tracking * fontSize).toFixed(2),
    };
  });
  return scale;
};

// Solaris UI, proposal A: Roboto, Material 3 scale with the CRM's weights.
const CRM_TYPE = typeScale(
  {
    "400": "Roboto_400Regular",
    "500": "Roboto_500Medium",
    "700": "Roboto_700Bold",
  },
  {
    headlineLarge: { fontSize: 32, lineHeight: 40, fontWeight: "700" },
    headlineSmall: { fontSize: 24, lineHeight: 32, fontWeight: "700" },
    titleLarge: { fontSize: 22, lineHeight: 28, fontWeight: "500" },
    titleMedium: { fontSize: 16, lineHeight: 24, fontWeight: "500" },
    bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: "400" },
    bodyMedium: { fontSize: 14, lineHeight: 20, fontWeight: "400" },
    labelLarge: { fontSize: 14, lineHeight: 20, fontWeight: "500" },
    labelSmall: { fontSize: 11, lineHeight: 16, fontWeight: "500" },
  },
);

// Solaris UI, proposal B: Geist, titles at 500–600 with -2% tracking. The
// design file's H1/H2/H3 are marketing-page sizes; they land on display and
// title roles and the app roles in between keep their default size.
const INXPIRE_TYPE = typeScale(
  {
    "400": "Geist_400Regular",
    "500": "Geist_500Medium",
    "600": "Geist_600SemiBold",
  },
  {
    displayLarge: {
      fontSize: 56,
      lineHeight: 67,
      fontWeight: "500",
      tracking: -0.02,
    },
    displayMedium: {
      fontSize: 40,
      lineHeight: 48,
      fontWeight: "500",
      tracking: -0.02,
    },
    displaySmall: { fontWeight: "500", tracking: -0.02 },
    headlineLarge: { fontWeight: "500", tracking: -0.02 },
    headlineMedium: { fontWeight: "500", tracking: -0.02 },
    headlineSmall: { fontWeight: "500", tracking: -0.02 },
    titleLarge: {
      fontSize: 20,
      lineHeight: 28,
      fontWeight: "600",
      tracking: -0.02,
    },
    bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: "400" },
    bodyMedium: { fontSize: 14, lineHeight: 20, fontWeight: "400" },
    bodySmall: { fontSize: 12, lineHeight: 16, fontWeight: "400" },
    labelLarge: { fontSize: 14, lineHeight: 20, fontWeight: "500" },
  },
);

/**
 * Hand-authored brand colour sets, not derived from a seed: every value is
 * written out as given, and `seed` only records the brand's main colour. Do
 * not run them through `createPalette` or adjust them to "fix" a tone — the
 * on-colour pairs were checked at ≥ 4.5:1 as authored. They also carry the
 * brand's type scale and icon set (see `ThemePalette`): the app loads the
 * fonts, `Roboto` for Databeasy and `Geist` for inXpire, under the names used here.
 */
export const BRAND_PALETTES: readonly BrandPalette[] = [
  {
    id: "databeasy",
    name: "Databeasy",
    seed: "#1D5B9D",
    typography: CRM_TYPE,
    iconSet: "material",
    light: {
      primary: "#1D5B9D",
      onPrimary: "#FFFFFF",
      primaryContainer: "#E8F0FA",
      onPrimaryContainer: "#1D5B9D",
      inversePrimary: "#5893D4",
      secondary: "#556579",
      onSecondary: "#FFFFFF",
      secondaryContainer: "#E1E7EF",
      onSecondaryContainer: "#1B2430",
      tertiary: "#61B340",
      onTertiary: "#1A1A1A",
      tertiaryContainer: "#DDF0D4",
      onTertiaryContainer: "#17400B",
      error: "#B00020",
      onError: "#FFFFFF",
      errorContainer: "#F9DEDC",
      onErrorContainer: "#410E0B",
      background: "#F0F2F5",
      onBackground: "#15181D",
      surface: "#FFFFFF",
      onSurface: "#15181D",
      surfaceVariant: "#E4E8EE",
      onSurfaceVariant: "#556579",
      surfaceContainerLow: "#F7F9FB",
      surfaceContainer: "#F0F2F5",
      surfaceContainerHigh: "#E8EBF0",
      surfaceContainerHighest: "#E0E4EA",
      surfaceDim: "#D5D9DF",
      inverseSurface: "#15181D",
      inverseOnSurface: "#FFFFFF",
      surfaceTint: "#1D5B9D",
      outline: "#7C8696",
      outlineVariant: "#DDE1E7",
      scrim: "#000000",
      shadow: "#000000",
    },
    dark: {
      primary: "#5893D4",
      onPrimary: "#0A2540",
      primaryContainer: "#253241",
      onPrimaryContainer: "#8DB8EA",
      inversePrimary: "#1D5B9D",
      secondary: "#94A3B8",
      onSecondary: "#1B2430",
      secondaryContainer: "#2A3441",
      onSecondaryContainer: "#D7DFEA",
      tertiary: "#61B340",
      onTertiary: "#1A1A1A",
      tertiaryContainer: "#234F13",
      onTertiaryContainer: "#CFEBC4",
      error: "#F2B8B5",
      onError: "#601410",
      errorContainer: "#8C1D18",
      onErrorContainer: "#F9DEDC",
      background: "#111111",
      onBackground: "#EDEDED",
      surface: "#171717",
      onSurface: "#EDEDED",
      surfaceVariant: "#262626",
      onSurfaceVariant: "#94A3B8",
      surfaceContainerLow: "#1B1B1B",
      surfaceContainer: "#1E1E1E",
      surfaceContainerHigh: "#222222",
      surfaceContainerHighest: "#262626",
      surfaceDim: "#0D0D0D",
      inverseSurface: "#EDEDED",
      inverseOnSurface: "#171717",
      surfaceTint: "#5893D4",
      outline: "#6B7684",
      outlineVariant: "#2E2E2E",
      scrim: "#000000",
      shadow: "#000000",
    },
  },
  {
    id: "inxpire",
    name: "inXpire",
    seed: "#171717",
    typography: INXPIRE_TYPE,
    iconSet: "eva",
    light: {
      primary: "#171717",
      onPrimary: "#FFFFFF",
      primaryContainer: "#EBEBEB",
      onPrimaryContainer: "#171717",
      inversePrimary: "#EDEDED",
      secondary: "#1D5B9C",
      onSecondary: "#FFFFFF",
      secondaryContainer: "#CBDEF2",
      onSecondaryContainer: "#0A2540",
      tertiary: "#62B241",
      onTertiary: "#171717",
      tertiaryContainer: "#CADEC5",
      onTertiaryContainer: "#171717",
      error: "#E5484D",
      onError: "#000000",
      errorContainer: "#FBE5E6",
      onErrorContainer: "#892B2E",
      background: "#FAFAFA",
      onBackground: "#171717",
      surface: "#FFFFFF",
      onSurface: "#171717",
      surfaceVariant: "#F2F2F2",
      onSurfaceVariant: "#666666",
      surfaceContainerLow: "#FAFAFA",
      surfaceContainer: "#F2F2F2",
      surfaceContainerHigh: "#EBEBEB",
      surfaceContainerHighest: "#E6E6E6",
      surfaceDim: "#DBDBDB",
      inverseSurface: "#171717",
      inverseOnSurface: "#FFFFFF",
      surfaceTint: "#171717",
      outline: "#8F8F8F",
      outlineVariant: "#EBEBEB",
      scrim: "#000000",
      shadow: "#000000",
    },
    dark: {
      primary: "#EDEDED",
      onPrimary: "#000000",
      primaryContainer: "#1F1F1F",
      onPrimaryContainer: "#EDEDED",
      inversePrimary: "#171717",
      secondary: "#1D5B9C",
      onSecondary: "#FFFFFF",
      secondaryContainer: "#11263D",
      onSecondaryContainer: "#CBDEF2",
      tertiary: "#62B241",
      onTertiary: "#171717",
      tertiaryContainer: "#233919",
      onTertiaryContainer: "#CADEC5",
      error: "#E5484D",
      onError: "#000000",
      errorContainer: "#471B1D",
      onErrorContainer: "#F6BFC1",
      background: "#000000",
      onBackground: "#EDEDED",
      surface: "#0A0A0A",
      onSurface: "#EDEDED",
      surfaceVariant: "#1A1A1A",
      onSurfaceVariant: "#A1A1A1",
      surfaceContainerLow: "#121212",
      surfaceContainer: "#1A1A1A",
      surfaceContainerHigh: "#1F1F1F",
      surfaceContainerHighest: "#292929",
      surfaceDim: "#000000",
      inverseSurface: "#EDEDED",
      inverseOnSurface: "#0A0A0A",
      surfaceTint: "#EDEDED",
      outline: "#8F8F8F",
      outlineVariant: "#2E2E2E",
      scrim: "#000000",
      shadow: "#000000",
    },
  },
];
