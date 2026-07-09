import React, { createContext, useContext, useState } from "react";
import { useColorScheme, Platform, TextStyle } from "react-native";

import { mix } from "polished";
import themeConfig from "./theme.json";

export interface Theme {
  colors: typeof themeConfig.colors.light & {
    accent: string;
    text: string;
    onAccent: string;
    onSurfaceContainer: string;
  };
  typography: {
    [key in keyof typeof themeConfig.typography]: TextStyle;
  };
  spacing: typeof themeConfig.spacing;
  shape: typeof themeConfig.shape;
  isDark: boolean;
}

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
