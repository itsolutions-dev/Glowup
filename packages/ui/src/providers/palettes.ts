import themeConfig from "./theme.json";
import type { ThemeColorTokens } from "./ThemeProvider";

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

/* ------------------------------------------------------------------ *
 * sRGB <-> CIELAB, and tone -> hex.
 *
 * Material's own tones are HCT, which needs CAM16; L* is what HCT's tone
 * actually measures, so a tone here is a CIELAB lightness and the hue and
 * chroma ride along in LCh. Close enough that the derived baseline matches
 * the hand-authored one to a couple of units per channel, with no dependency.
 * ------------------------------------------------------------------ */

const linearize = (c: number) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const delinearize = (c: number) =>
  c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;

const WHITE_X = 95.047;
const WHITE_Y = 100;
const WHITE_Z = 108.883;
const EPSILON = 216 / 24389;
const KAPPA = 24389 / 27;

const labF = (t: number) =>
  t > EPSILON ? Math.cbrt(t) : (t * KAPPA + 16) / 116;
const labFInv = (t: number) =>
  t ** 3 > EPSILON ? t ** 3 : (116 * t - 16) / KAPPA;

interface Lch {
  l: number;
  c: number;
  h: number;
}

const hexToLch = (hex: string): Lch => {
  const value = parseInt(hex.replace("#", ""), 16);
  const r = linearize(((value >> 16) & 255) / 255);
  const g = linearize(((value >> 8) & 255) / 255);
  const b = linearize((value & 255) / 255);
  const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) * 100;
  const y = (0.2126729 * r + 0.7151522 * g + 0.072175 * b) * 100;
  const z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) * 100;
  const fx = labF(x / WHITE_X);
  const fy = labF(y / WHITE_Y);
  const fz = labF(z / WHITE_Z);
  const a = 500 * (fx - fy);
  const bb = 200 * (fy - fz);
  return {
    l: 116 * fy - 16,
    c: Math.hypot(a, bb),
    h: ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360,
  };
};

/** Linear-light RGB, deliberately unclamped so the caller can test the gamut. */
const lchToRgb = (
  l: number,
  c: number,
  h: number,
): [number, number, number] => {
  const rad = (h * Math.PI) / 180;
  const a = c * Math.cos(rad);
  const b = c * Math.sin(rad);
  const fy = (l + 16) / 116;
  const x = (labFInv(fy + a / 500) * WHITE_X) / 100;
  const y = (labFInv(fy) * WHITE_Y) / 100;
  const z = (labFInv(fy - b / 200) * WHITE_Z) / 100;
  return [
    3.2404542 * x - 1.5371385 * y - 0.4985314 * z,
    -0.969266 * x + 1.8760108 * y + 0.041556 * z,
    0.0556434 * x - 0.2040259 * y + 1.0572252 * z,
  ];
};

const inGamut = (l: number, c: number, h: number) =>
  lchToRgb(l, c, h).every((v) => v >= -0.0001 && v <= 1.0001);

/**
 * One step of a tonal palette: the given tone at the most chroma the sRGB
 * gamut will hold. Tones near 0 and 100 have almost no room, which is exactly
 * why Material's own near-white and near-black tones look grey.
 */
const tone = (hue: number, chroma: number, t: number): string => {
  let usable = chroma;
  if (!inGamut(t, chroma, hue)) {
    let low = 0;
    let high = chroma;
    for (let i = 0; i < 24; i += 1) {
      const mid = (low + high) / 2;
      if (inGamut(t, mid, hue)) low = mid;
      else high = mid;
    }
    usable = low;
  }
  return `#${lchToRgb(t, usable, hue)
    .map((v) =>
      Math.round(Math.min(1, Math.max(0, delinearize(v))) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")
    .toUpperCase()}`;
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

/** The ids of the palettes this library ships. */
export type PaletteId =
  "baseline" | "cobalt" | "teal" | "forest" | "amber" | "rose";

/**
 * The colour sets shipped with the library. `baseline` is the hand-authored
 * Material 3 baseline scheme — the one the library has always rendered; the
 * rest are derived from their seed with `createPalette`.
 */
export const palettes: Record<PaletteId, ThemePalette> = {
  baseline: {
    id: "baseline",
    name: "Baseline purple",
    seed: BASELINE_SEED,
    light: themeConfig.colors.light,
    dark: themeConfig.colors.dark,
  },
  cobalt: createPalette("#2196F3", { id: "cobalt", name: "Cobalt blue" }),
  teal: createPalette("#009688", { id: "teal", name: "Teal" }),
  forest: createPalette("#4CAF50", { id: "forest", name: "Forest green" }),
  amber: createPalette("#FF9800", { id: "amber", name: "Amber" }),
  rose: createPalette("#E91E63", { id: "rose", name: "Rose" }),
};
