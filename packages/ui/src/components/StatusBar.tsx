import React, { useEffect } from "react";
import { Platform } from "react-native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useTheme } from "../providers/ThemeProvider";

interface StatusBarProps {
  backgroundColor?: string;
}

const StatusBar = ({ backgroundColor }: StatusBarProps) => {
  const { theme } = useTheme();
  const isDark = theme.isDark;
  const barColor = backgroundColor || theme.colors.surface;

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

      metaTag.setAttribute("content", barColor);
      document.body.style.backgroundColor = theme.colors.background;

      return () => {
        document.body.style.backgroundColor = originalBodyBg;
      };
    }
  }, [barColor, theme.colors.background]);

  // backgroundColor/translucent props were removed in expo-status-bar (SDK 54+):
  // Android is always edge-to-edge, bar color comes from the app background.
  return <ExpoStatusBar style={isDark ? "light" : "dark"} />;
};

export default StatusBar;
