import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Appearance, Platform, TextStyle } from "react-native";

import { mix } from "polished";
import themeConfig from "./theme.json";
import {
  InteractionFeedbackContext,
  type InteractionFeedbackHandler,
  type InteractionFeedbackKind,
} from "./InteractionFeedback";
import { palettes, type ThemePalette } from "./palettes";
import { DensityContext, type Density } from "./Density";

/**
 * The design tokens exactly as `theme.json` declares them.
 *
 * Spelled out instead of derived with `typeof themeConfig` on purpose: a public
 * type derived from the JSON import makes the emitted `.d.ts` import
 * `./theme.json`, which is not shipped with the type declarations (bob's
 * typescript target emits `.d.ts` only) and would force every consumer to
 * enable `resolveJsonModule`. The `_ThemeTokensInSync` guard at the bottom of
 * this block fails `tsc` if these types and `theme.json` ever drift apart.
 */
export interface ThemeStatusTokens {
  info: string;
  infoContainer: string;
  neutral: string;
  neutralContainer: string;
  onInfo: string;
  onInfoContainer: string;
  onNeutral: string;
  onNeutralContainer: string;
  onSuccess: string;
  onSuccessContainer: string;
  onWarning: string;
  onWarningContainer: string;
  success: string;
  successContainer: string;
  warning: string;
  warningContainer: string;
}

export interface ThemeColorTokens extends ThemeStatusTokens {
  background: string;
  boxShadow: string;
  error: string;
  errorContainer: string;
  inverseOnSurface: string;
  inversePrimary: string;
  inverseSurface: string;
  onBackground: string;
  onError: string;
  onErrorContainer: string;
  onPrimary: string;
  onPrimaryContainer: string;
  onSecondary: string;
  onSecondaryContainer: string;
  onSurface: string;
  onSurfaceVariant: string;
  onTertiary: string;
  onTertiaryContainer: string;
  outline: string;
  outlineVariant: string;
  primary: string;
  primaryContainer: string;
  scrim: string;
  secondary: string;
  secondaryContainer: string;
  shadow: string;
  surface: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  surfaceContainerLow: string;
  surfaceDim: string;
  surfaceTint: string;
  surfaceVariant: string;
  tertiary: string;
  tertiaryContainer: string;
}

/** Spacing scale, in density-independent pixels. */
export interface ThemeSpacingTokens {
  xs: number;
  s: number;
  m: number;
  l: number;
  xl: number;
}

/** Corner radii, in density-independent pixels. */
export interface ThemeShapeTokens {
  small: number;
  medium: number;
  large: number;
  extraLarge: number;
}

/** Material 3 type scale roles carried by the theme. */
export type TypographyVariant =
  | "displayLarge"
  | "displayMedium"
  | "displaySmall"
  | "headlineLarge"
  | "headlineMedium"
  | "headlineSmall"
  | "titleLarge"
  | "titleMedium"
  | "titleSmall"
  | "labelLarge"
  | "labelMedium"
  | "labelSmall"
  | "bodyLarge"
  | "bodyMedium"
  | "bodySmall";

export interface Theme {
  colors: ThemeColorTokens;
  typography: { [key in TypographyVariant]: TextStyle };
  spacing: ThemeSpacingTokens;
  shape: ThemeShapeTokens;
  isDark: boolean;
}

// Type-level only: emits no JavaScript and, being unexported, no declaration
// either. If a token is added to or removed from theme.json, one of these stops
// being `true` and `npm run type-check` fails here instead of shipping a theme
// whose public type lies about its contents.
type Exact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type AllTrue<T extends true[]> = T;
// The alias IS the assertion: tsc checks it where it is declared, so nothing
// needs to reference it afterwards.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _ThemeTokensInSync = AllTrue<
  [
    Exact<ThemeColorTokens, typeof themeConfig.colors.light>,
    Exact<ThemeColorTokens, typeof themeConfig.colors.dark>,
    Exact<ThemeSpacingTokens, typeof themeConfig.spacing>,
    Exact<ThemeShapeTokens, typeof themeConfig.shape>,
    Exact<TypographyVariant, keyof typeof themeConfig.typography>,
  ]
>;

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  /** The colour set the theme is currently resolved from. */
  palette: ThemePalette;
  /** Swap the colour set at runtime — every `useTheme()` re-renders. */
  setPalette: (palette: ThemePalette) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: {
    colors: themeConfig.colors.dark,
    typography: themeConfig.typography as any,

    spacing: themeConfig.spacing,
    shape: themeConfig.shape,
    isDark: true,
  },
  toggleTheme: () => {},
  palette: palettes.baseline,
  setPalette: () => {},
});

const baseTypography = themeConfig.typography as Theme["typography"];

/** The default scale with a palette's overrides spread over each variant. */
const mergeTypography = (
  overrides: ThemePalette["typography"],
): Theme["typography"] => {
  if (!overrides) return baseTypography;
  const merged = { ...baseTypography };
  (Object.keys(overrides) as TypographyVariant[]).forEach((variant) => {
    merged[variant] = { ...baseTypography[variant], ...overrides[variant] };
  });
  return merged;
};

const subscribeToScheme = (onChange: () => void) => {
  const subscription = Appearance.addChangeListener(onChange);
  return () => subscription.remove();
};
const getScheme = () => Appearance.getColorScheme();
// A server render has no OS to ask. `useColorScheme` answers anyway, with
// whatever the platform module guesses in Node, and a reader on a dark OS then
// hydrates dark components over light HTML: React throws #418 and rebuilds the
// page. "No preference" on the server, the real scheme straight after
// hydration. Native never hydrates, so it never asks for this snapshot.
const getServerScheme = () => null;

export const ThemeProvider = ({
  children,
  initialPalette = palettes.baseline,
  onInteractionFeedback,
  density,
}: {
  children: React.ReactNode;
  /**
   * The colour set to start on — one of `palettes`, or anything
   * `createPalette` returns. Read once, on mount: call `setPalette` from
   * `useTheme()` to change it afterwards.
   */
  initialPalette?: ThemePalette;
  /**
   * Called when the user presses, toggles or selects through one of the
   * library's controls: wire it to haptics (`@its/glowup-device/haptics`'s
   * `hapticFeedback`) or anything else. A control opts out with
   * `feedback={false}`. Without it a nested provider inherits the outer one's.
   */
  onInteractionFeedback?: InteractionFeedbackHandler;
  /**
   * The default `density` of every control inside (`Input`, `Select`, `Button`,
   * `DataGrid`); a control's own `density` prop still wins. A nested provider
   * without one inherits the outer one's. Defaults to `"normal"`.
   */
  density?: Density;
}) => {
  const systemScheme = useSyncExternalStore(
    subscribeToScheme,
    getScheme,
    getServerScheme,
  );
  const [palette, setPalette] = useState<ThemePalette>(initialPalette);
  // null = follow the OS color scheme; "light"/"dark" = manual override
  const [override, setOverride] = useState<"light" | "dark" | null>(null);
  const mode = override ?? systemScheme ?? "light";

  const toggleTheme = useCallback(() => {
    setOverride(mode === "light" ? "dark" : "light");
  }, [mode]);

  // Stable across unrelated re-renders of whatever mounts the provider: some
  // seventy components memoise their styles on `theme`, so a fresh object on
  // every render would rebuild every StyleSheet in the tree each time.
  const theme = useMemo<Theme>(
    () => ({
      colors: mode === "dark" ? palette.dark : palette.light,
      typography: mergeTypography(palette.typography),
      spacing: themeConfig.spacing,
      shape: themeConfig.shape,
      isDark: mode === "dark",
    }),
    [palette, mode],
  );

  const value = useMemo(
    () => ({ theme, toggleTheme, palette, setPalette }),
    [theme, toggleTheme, palette],
  );

  // Its own context, and a stable function reading the latest handler: an
  // inline `onInteractionFeedback` must not re-render every control (nor sit
  // in the theme's value, which some seventy components depend on).
  const handlerRef = useRef(onInteractionFeedback);
  useEffect(() => {
    handlerRef.current = onInteractionFeedback;
  }, [onInteractionFeedback]);
  const emit = useCallback((kind: InteractionFeedbackKind) => {
    try {
      handlerRef.current?.(kind);
    } catch {
      // Feedback decorates an interaction; it must never cancel the press.
    }
  }, []);
  const parentFeedback = useContext(InteractionFeedbackContext);
  const feedback = onInteractionFeedback ? emit : parentFeedback;
  const parentDensity = useContext(DensityContext);

  return (
    <ThemeContext.Provider value={value}>
      <InteractionFeedbackContext.Provider value={feedback}>
        <DensityContext.Provider value={density ?? parentDensity}>
          {children}
        </DensityContext.Provider>
      </InteractionFeedbackContext.Provider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;

/**
 * @param baseColor - The background of the component (e.g., colors.primary)
 * @param stateColor - The text/icon color (e.g., colors.onPrimary)
 * @param state - 'hover' | 'press' | 'focus'
 */
export const getStateColor = (
  baseColor: string,
  stateColor: string,
  state: "hover" | "press" | "focus",
) => {
  const opacities = {
    hover: 0.08,
    focus: 0.1,
    press: 0.12,
  };
  const weight = opacities[state] || 0;
  // `mix` against the keyword `transparent` returns the state colour fully
  // opaque, which paints a solid disc over a standard `IconButton` on hover.
  const base = baseColor === "transparent" ? "rgba(0, 0, 0, 0)" : baseColor;
  return mix(weight, stateColor, base);
};

/** The halo only: shadow on web and iOS, elevation on Android. */
const haloStyles = (glowColor: string, inner: boolean) =>
  Platform.select({
    web: {
      boxShadow: inner
        ? `0 0 0 1px ${glowColor}, 0 0 0 4px ${glowColor}33`
        : `0 0 0 4px ${glowColor}33`,
      transition: "all 0.2s ease-in-out" as any,
    },
    ios: {
      shadowColor: glowColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
    },
    android: {
      elevation: 4,
    },
  }) ?? {};

/**
 * Hover, press and focus feedback that cannot move anything: no border width,
 * no padding, no size. For a control that has no border of its own when idle
 * (a button, a chip, a tab); `getGlowStyles` is for the ones that always do.
 */
export const getFocusRing = (theme: Theme, error?: string) =>
  haloStyles(error ? theme.colors.error : theme.colors.primary, true);

/**
 * Border colour and halo for a control that always draws a 1px border (a
 * field). The width is the same idle and active, so focusing never resizes it;
 * a control without a border uses `getFocusRing` instead.
 */
export const getGlowStyles = (
  theme: Theme,
  isActive: boolean,
  error?: string,
) => {
  if (!isActive && !error) {
    return {
      borderColor: theme.colors.outlineVariant,
      borderWidth: 1,
    };
  }

  const glowColor = error ? theme.colors.error : theme.colors.primary;

  return {
    borderColor: glowColor,
    borderWidth: 1,
    ...haloStyles(glowColor, false),
  };
};
