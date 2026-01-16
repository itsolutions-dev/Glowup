import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import { mix } from "polished";
import themeConfig from "./theme.json";

export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    surfaceContainer: string;
    text: string;
    onPrimary: string;
    onSecondary: string;
    onAccent: string;
    onBackground: string;
    onSurface: string;
    onSurfaceContainer: string;
    shadow: string;
  };
  typography: typeof themeConfig.typography;
  spacing: typeof themeConfig.spacing;
  shape: typeof themeConfig.shape;
  isDark: boolean;
}

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext({
  theme: {
    colors: themeConfig.colors.dark,
    typography: themeConfig.typography,
    spacing: themeConfig.spacing,
    shape: themeConfig.shape,
    isDark: true,
  },
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme(); // Hook to listen to system changes
  const [mode, setMode] = useState(systemScheme || "light");

  useEffect(() => {
    setMode(systemScheme || "light");
  }, [systemScheme]);

  const toggleTheme = () => {
    setMode((prev) => (prev === "light" ? "dark" : "light"));
  };

  const theme = {
    colors:
      mode === "dark" ? themeConfig.colors.dark : themeConfig.colors.light,
    typography: themeConfig.typography,
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
export const getStateColor = (baseColor, stateColor, state) => {
  const opacities = {
    hover: 0.08,
    focus: 0.1,
    press: 0.12,
  };
  const weight = opacities[state] || 0;
  return mix(weight, stateColor, baseColor);
};
