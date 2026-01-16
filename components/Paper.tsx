import React, { useMemo } from "react";
import { View, StyleSheet, Platform, StyleProp, ViewStyle } from "react-native";
import { useTheme, Theme } from "providers/ThemeProvider";

interface PaperProps {
  children: React.ReactNode;
  elevation?: number;
  style?: StyleProp<ViewStyle>;
  outline?: boolean;
}

const Paper = ({
  children,
  elevation = 1, // 0 to 5 (M3 standards)
  style,
  outline = false,
}: PaperProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const elev = elevation < 0 ? 0 : elevation > 5 ? 5 : elevation;

  const backgroundColor = useMemo(() => {
    const levels = {
      0: theme.colors.surface,
      1: theme.colors.surfaceContainerLow,
      2: theme.colors.surfaceContainer,
      3: theme.colors.surfaceContainerHigh,
      4: theme.colors.surfaceContainerHighest,
      5: theme.colors.surfaceDim,
    };
    return levels[elev] || levels[0];
  }, [elev, theme.colors]);

  return (
    <View
      style={[
        styles.paper,
        { backgroundColor: backgroundColor },
        outline && styles.outlined,
        elev > 0 && styles[`elevation${elev}`],
        style,
      ]}
    >
      {children}
    </View>
  );
};

const makeStyles: (theme: Theme) => StyleSheet.NamedStyles<any> = (
  theme: Theme,
) =>
  StyleSheet.create({
    paper: {
      borderRadius: theme.shape.large,
      backgroundColor: theme.colors.surface,
      padding: theme.spacing.m,
    },
    outlined: {
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    // Traditional shadow fallback for iOS/Android
    elevation1: {
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 1,
        },
        android: { elevation: 1 },
      }),
    },
    elevation2: {
      // Add this
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.12,
          shadowRadius: 3,
        },
        android: { elevation: 2 },
      }),
    },
    elevation3: {
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 6,
        },
        android: { elevation: 6 },
      }),
    },
    elevation4: {
      // Add this
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
        },
        android: { elevation: 8 },
      }),
    },
    elevation5: {
      // Add this
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.25,
          shadowRadius: 10,
        },
        android: { elevation: 12 },
      }),
    },
  });

export default Paper;
