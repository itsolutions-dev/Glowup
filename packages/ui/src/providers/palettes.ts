import themeConfig from "./theme.json";
import type { ThemeColorTokens } from "./ThemeProvider";
import { hexToLch, tone } from "./tonal";

/**
 * A complete colour set: the same token names as `theme.json`, resolved for
 * both schemes. `ThemeProvider` renders one of these; `createPalette` builds
 * one from a single source colour the way Material 3 does.
 */
export interface ThemePalette {
  /** Stable key — what a picker stores and what `palettes` is indexed by. */
  id: string;
  /** Human label, shown in the theming page's picker. */
  name: string;
  /** The colour the tonal palettes were derived from. */
  seed: string;
  light: ThemeColorTokens;
  dark: ThemeColorTokens;
}

/**
 * How far each tonal palette is pushed from grey. Material 3's TonalSpot
 * scheme fixes these rather than reading them off the seed, which is why two
 * seeds a hue apart produce schemes that feel like the same design system.
 * The numbers are CIE LCh chroma, tuned so `createPalette(BASELINE_SEED)`
 * lands on the baseline purple scheme this library shipped with.
 */
export interface PaletteChroma {
  primary: number;
  secondary: number;
  tertiary: number;
  neutral: number;
  neutralVariant: number;
  /** Degrees the tertiary palette is rotated from the seed's hue. */
  tertiaryHueShift: number;
}

const DEFAULT_CHROMA: PaletteChroma = {
  primary: 48,
  secondary: 14,
  tertiary: 20,
  neutral: 4,
  neutralVariant: 7,
  tertiaryHueShift: 60,
};

/** The seed of the scheme the library ships with, and its baseline id. */
export const BASELINE_SEED = "#6750A4";

/**
 * Build a full light/dark colour set from one source colour, following
 * Material 3's role-to-tone mapping. Error stays the fixed Material red — the
 * spec keeps it off the seed so a green brand cannot produce a green error.
 *
 * ```ts
 * const brand = createPalette("#00639B", { id: "brand", name: "Brand" });
 * <ThemeProvider initialPalette={brand}>…</ThemeProvider>
 * ```
 */
export const createPalette = (
  seed: string,
  options: {
    id?: string;
    name?: string;
    /** Override individual chroma targets; the rest keep their defaults. */
    chroma?: Partial<PaletteChroma>;
  } = {},
): ThemePalette => {
  const chroma = { ...DEFAULT_CHROMA, ...options.chroma };
  const { h } = hexToLch(seed);
  const tertiaryHue = (h + chroma.tertiaryHueShift) % 360;

  const p = (t: number) => tone(h, chroma.primary, t);
  const s = (t: number) => tone(h, chroma.secondary, t);
  const t3 = (t: number) => tone(tertiaryHue, chroma.tertiary, t);
  const n = (t: number) => tone(h, chroma.neutral, t);
  const nv = (t: number) => tone(h, chroma.neutralVariant, t);

  const fixed = themeConfig.colors;

  return {
    id: options.id ?? seed.replace("#", "").toLowerCase(),
    name: options.name ?? seed.toUpperCase(),
    seed,
    light: {
      primary: p(40),
      onPrimary: p(100),
      primaryContainer: p(90),
      onPrimaryContainer: p(10),
      inversePrimary: p(80),
      secondary: s(40),
      onSecondary: s(100),
      secondaryContainer: s(90),
      onSecondaryContainer: s(10),
      tertiary: t3(40),
      onTertiary: t3(100),
      tertiaryContainer: t3(90),
      onTertiaryContainer: t3(10),
      error: fixed.light.error,
      onError: fixed.light.onError,
      errorContainer: fixed.light.errorContainer,
      onErrorContainer: fixed.light.onErrorContainer,
      background: n(98),
      onBackground: n(10),
      surface: n(98),
      onSurface: n(10),
      surfaceVariant: nv(90),
      onSurfaceVariant: nv(30),
      surfaceContainerLow: n(96),
      surfaceContainer: n(94),
      surfaceContainerHigh: n(92),
      surfaceContainerHighest: n(90),
      surfaceDim: n(87),
      inverseSurface: n(20),
      inverseOnSurface: n(95),
      surfaceTint: p(40),
      outline: nv(50),
      outlineVariant: nv(80),
      scrim: "#000000",
      shadow: "#000000",
      boxShadow: fixed.light.boxShadow,
    },
    dark: {
      primary: p(80),
      onPrimary: p(20),
      primaryContainer: p(30),
      onPrimaryContainer: p(90),
      inversePrimary: p(40),
      secondary: s(80),
      onSecondary: s(20),
      secondaryContainer: s(30),
      onSecondaryContainer: s(90),
      tertiary: t3(80),
      onTertiary: t3(20),
      tertiaryContainer: t3(30),
      onTertiaryContainer: t3(90),
      error: fixed.dark.error,
      onError: fixed.dark.onError,
      errorContainer: fixed.dark.errorContainer,
      onErrorContainer: fixed.dark.onErrorContainer,
      background: n(8),
      onBackground: n(90),
      surface: n(8),
      onSurface: n(90),
      surfaceVariant: nv(30),
      onSurfaceVariant: nv(80),
      surfaceContainerLow: n(10),
      surfaceContainer: n(12),
      surfaceContainerHigh: n(17),
      surfaceContainerHighest: n(22),
      surfaceDim: n(5),
      inverseSurface: n(90),
      inverseOnSurface: n(20),
      surfaceTint: p(80),
      outline: nv(60),
      outlineVariant: nv(30),
      scrim: "#000000",
      shadow: "#000000",
      boxShadow: fixed.dark.boxShadow,
    },
  };
};

/**
 * A Material seed: one of the named hues of the Material colour system, at its
 * 500 shade — the swatch the Material palette has always keyed a hue on.
 * Material 3 itself ships no named list (a scheme is generated from whatever
 * source colour you give it), so these are the canonical seeds to generate
 * from, each run through the same M3 role mapping as a custom brand colour.
 */
interface MaterialSeed {
  name: string;
  seed: string;
  /**
   * The hues Material draws as greys. TonalSpot's fixed chroma would push a
   * near-neutral seed to full colour — a grey seed has no reliable hue at all,
   * so it would come out an arbitrary red — which is why these follow the
   * lower-chroma M3 scheme variants instead.
   */
  chroma?: Partial<PaletteChroma>;
}

/** Material 3's Monochrome variant: every tonal palette is pure grey. */
const MONOCHROME: Partial<PaletteChroma> = {
  primary: 0,
  secondary: 0,
  tertiary: 0,
  neutral: 0,
  neutralVariant: 0,
};

/** Close to Material 3's Neutral variant: the hue survives, muted. */
const MUTED: Partial<PaletteChroma> = {
  primary: 16,
  secondary: 8,
  tertiary: 12,
  neutral: 3,
  neutralVariant: 5,
};

const MATERIAL_SEEDS = {
  red: { name: "Red", seed: "#F44336" },
  pink: { name: "Pink", seed: "#E91E63" },
  purple: { name: "Purple", seed: "#9C27B0" },
  deepPurple: { name: "Deep purple", seed: "#673AB7" },
  indigo: { name: "Indigo", seed: "#3F51B5" },
  blue: { name: "Blue", seed: "#2196F3" },
  lightBlue: { name: "Light blue", seed: "#03A9F4" },
  cyan: { name: "Cyan", seed: "#00BCD4" },
  teal: { name: "Teal", seed: "#009688" },
  green: { name: "Green", seed: "#4CAF50" },
  lightGreen: { name: "Light green", seed: "#8BC34A" },
  lime: { name: "Lime", seed: "#CDDC39" },
  yellow: { name: "Yellow", seed: "#FFEB3B" },
  amber: { name: "Amber", seed: "#FFC107" },
  orange: { name: "Orange", seed: "#FF9800" },
  deepOrange: { name: "Deep orange", seed: "#FF5722" },
  brown: { name: "Brown", seed: "#795548", chroma: MUTED },
  grey: { name: "Grey", seed: "#9E9E9E", chroma: MONOCHROME },
  blueGrey: { name: "Blue grey", seed: "#607D8B", chroma: MUTED },
} satisfies Record<string, MaterialSeed>;

/** The named Material hues `palettes` carries, in the Material palette's order. */
export type MaterialPaletteId = keyof typeof MATERIAL_SEEDS;

/** The ids of the palettes this library ships. */
export type PaletteId = "baseline" | MaterialPaletteId;

/**
 * Ids earlier releases shipped, each now the Material hue it was seeded from.
 * Kept readable so stored ids and existing imports keep working; they are not
 * enumerable, so a picker built from `Object.values(palettes)` lists every
 * colour once.
 */
const DEPRECATED_ALIASES = {
  cobalt: "blue",
  forest: "green",
  rose: "pink",
} as const satisfies Record<string, PaletteId>;

type DeprecatedPaletteAliases = {
  /** @deprecated Renamed to `palettes.blue`, the Material hue it was seeded from. */
  readonly cobalt: ThemePalette;
  /** @deprecated Renamed to `palettes.green`, the Material hue it was seeded from. */
  readonly forest: ThemePalette;
  /** @deprecated Renamed to `palettes.pink`, the Material hue it was seeded from. */
  readonly rose: ThemePalette;
};

const shipped = {
  baseline: {
    id: "baseline",
    name: "Baseline purple",
    seed: BASELINE_SEED,
    light: themeConfig.colors.light,
    dark: themeConfig.colors.dark,
  },
} as Record<PaletteId, ThemePalette>;

(Object.keys(MATERIAL_SEEDS) as MaterialPaletteId[]).forEach((id) => {
  const { name, seed, chroma } = MATERIAL_SEEDS[id] as MaterialSeed;
  shipped[id] = createPalette(seed, { id, name, chroma });
});

(
  Object.keys(DEPRECATED_ALIASES) as (keyof typeof DEPRECATED_ALIASES)[]
).forEach((alias) => {
  Object.defineProperty(shipped, alias, {
    get: () => shipped[DEPRECATED_ALIASES[alias]],
    enumerable: false,
  });
});

/**
 * The colour sets shipped with the library. `baseline` is the hand-authored
 * Material 3 baseline scheme — the one the library has always rendered; the
 * other nineteen are the named Material hues, derived from their seed with
 * `createPalette`. Enumerate it for a picker: every entry is listed once.
 */
export const palettes: Record<PaletteId, ThemePalette> &
  DeprecatedPaletteAliases = shipped as Record<PaletteId, ThemePalette> &
  DeprecatedPaletteAliases;
