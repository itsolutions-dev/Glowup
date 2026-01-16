import React, { useEffect } from "react";
import { Platform } from "react-native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useTheme } from "../providers/ThemeProvider";

interface StatusBarProps {
  backgroundColor?: string;
}

const StatusBar = () => {
  const { theme, isDark } = useTheme();

  useEffect(() => {
    if (Platform.OS === "web") {
      // 1. Find or create the theme-color meta tag
      let metaTag = document.querySelector('meta[name="theme-color"]');

      if (!metaTag) {
        metaTag = document.createElement("meta");
        metaTag.name = "theme-color";
        document.getElementsByTagName("head")[0].appendChild(metaTag);
      }

      metaTag.setAttribute("content", theme.colors.surface);
      document.body.style.backgroundColor = theme.colors.background;
    }
  }, [theme.colors.surface, theme.colors.background]);

  return (
    <ExpoStatusBar
      style={isDark ? "light" : "dark"}
      backgroundColor={theme.colors.surface} // Only works on Android
      translucent={true}
    />
  );
};

export default StatusBar;
