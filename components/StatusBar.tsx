import React, { useEffect } from "react";
import { Platform } from "react-native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useTheme } from "../providers/ThemeProvider";

interface StatusBarProps {
  backgroundColor?: string;
}

const StatusBar: StatusBarProps = () => {
  const { theme } = useTheme();
  const isDark = theme.isDark;

  useEffect(() => {
    if (Platform.OS === "web") {
      // Store the original styles to restore them on cleanup
      const originalBodyBg = document.body.style.backgroundColor;

      // 1. Find or create the theme-color meta tag
      let metaTag = document.querySelector(
        'meta[name="theme-color"]',
      ) as HTMLMetaElement | null;

      if (!metaTag) {
        metaTag = document.createElement("meta") as HTMLMetaElement;
        metaTag.name = "theme-color";
        document.getElementsByTagName("head")[0].appendChild(metaTag);
      }

      metaTag.setAttribute("content", theme.colors.surface);
      document.body.style.backgroundColor = theme.colors.background;

      return () => {
        document.body.style.backgroundColor = originalBodyBg;
      };
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
