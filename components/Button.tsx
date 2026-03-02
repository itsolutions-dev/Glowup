import { useMemo } from "react";
import {
  useTheme,
  Theme,
  getStateColor,
  getGlowStyles,
} from "../providers/ThemeProvider";

import { Pressable, Text, View, StyleSheet, Platform } from "react-native";
import Icons from "expo-vector-icons/MaterialCommunityIcons";
import CircularProgress from "./Progress/CircularProgress";

interface ButtonProps {
  onPress: () => void;
  iconName?: string;
  size?: number;
  mode?: "filled" | "tonal" | "outlined";
  style?: object;
  iconStyle?: object;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  children: React.ReactNode;
}

const Button = ({
  onPress,
  iconName,
  size,
  mode = "filled",
  disabled = false,
  style = {},
  iconStyle = {},
  loading = false,
  accessibilityLabel = "",
  children,
}: ButtonProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const { bg, on, border } = useMemo(() => {
    switch (mode) {
      case "filled":
        return { bg: theme.colors.primary, on: theme.colors.onPrimary };
      case "tonal":
        return {
          bg: theme.colors.secondaryContainer,
          on: theme.colors.onSecondaryContainer,
        };
      case "outlined":
        return {
          bg: "transparent",
          on: theme.colors.primary,
          border: theme.colors.outline,
        };
      default:
        return { bg: theme.colors.primary, on: theme.colors.onPrimary };
    }
  }, [mode, theme.colors]);

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={!disabled && !loading && onPress ? onPress : null}
      disabled={disabled}
      style={({ hovered, pressed }) => {
        let currentBg = bg;

        if (pressed) {
          currentBg = getStateColor(
            bg === "transparent" ? theme.colors.surface : bg,
            on,
            "press",
          );
        } else if (hovered) {
          currentBg = getStateColor(
            bg === "transparent" ? theme.colors.surface : bg,
            on,
            "hover",
          );
        }

        const glow =
          (hovered || pressed) && !disabled
            ? getGlowStyles(theme, true)
            : {
                borderWidth: mode === "outlined" ? 1 : 0,
                borderColor: border || "transparent",
              };

        return [
          styles.buttonContainer,
          {
            backgroundColor: currentBg,
            ...glow,
          },
          style,
        ];
      }}
      {...(Platform.OS === "android" && {
        android_ripple: { color: theme.colors.onPrimary },
      })}
    >
      <View style={styles.itemsContainer}>
        {loading ? (
          // We use a smaller size to fit inside the button height
          <CircularProgress
            size={20}
            strokeWidth={2.5}
            color={theme.colors.onPrimary}
          />
        ) : (
          <>
            {iconName && (
              <Icons
                name={iconName}
                size={size || theme.shape.medium}
                style={[styles.icon, { color: on }, iconStyle]}
              />
            )}
            {children && (
              <Text style={[styles.buttonText, { color: on }]}>{children}</Text>
            )}
          </>
        )}
      </View>
    </Pressable>
  );
};

export default Button;

const makeStyles: (theme: Theme) => StyleSheet.NamedStyles<any> = (
  theme: Theme,
) =>
  StyleSheet.create({
    buttonContainer: {
      marginTop: theme.spacing.xs,
      marginBottom: theme.spacing.xs,
      marginLeft: theme.spacing.xs,
      marginRight: theme.spacing.xs,
      padding: theme.spacing.m,
      borderRadius: theme.shape.medium,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primary,
    },
    buttonText: {
      color: theme.colors.onPrimary,
      ...theme.typography.labelMedium,
      marginLeft: theme.spacing.xs,
      marginRight: theme.spacing.xs,
    },
    itemsContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    icon: {},
  });
