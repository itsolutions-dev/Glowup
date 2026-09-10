import React, { createContext, useContext, useState } from "react";
import { useColorScheme, Platform, TextStyle } from "react-native";

import { mix } from "polished";
import themeConfig from "./theme.json";

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
export interface ThemeColorTokens {
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
  colors: ThemeColorTokens & {
    accent: string;
    text: string;
    onAccent: string;
    onSurfaceContainer: string;
  };
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
}

const ThemeContext = createContext<ThemeContextType>({
  theme: {
    colors: {
      ...themeConfig.colors.dark,
      accent: themeConfig.colors.dark.primary,
      text: themeConfig.colors.dark.onSurface,
      onAccent: themeConfig.colors.dark.onPrimary,
      onSurfaceContainer: themeConfig.colors.dark.onSurface,
    },
    typography: themeConfig.typography as any,

    spacing: themeConfig.spacing,
    shape: themeConfig.shape,
    isDark: true,
  },
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemScheme = useColorScheme(); // Hook to listen to system changes
  // null = follow the OS color scheme; "light"/"dark" = manual override
  const [override, setOverride] = useState<"light" | "dark" | null>(null);
  const mode = override ?? systemScheme ?? "light";

  const toggleTheme = () => {
    setOverride(mode === "light" ? "dark" : "light");
  };

  const currentColors =
    mode === "dark" ? themeConfig.colors.dark : themeConfig.colors.light;

  const theme: Theme = {
    colors: {
      ...currentColors,
      accent: currentColors.primary,
      text: currentColors.onSurface,
      onAccent: currentColors.onPrimary,
      onSurfaceContainer: currentColors.onSurface,
    },
    typography: themeConfig.typography as any,

    spacing: themeConfig.spacing,
    shape: themeConfig.shape,
    isDark: mode === "dark",
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: theme,
        toggleTheme,
      }}
    >
      {children}
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
  return mix(weight, stateColor, baseColor);
};

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
    borderWidth: 1.5,
    ...Platform.select({
      web: {
        boxShadow: `0 0 0 4px ${glowColor}33`,
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
    }),
  };
};
