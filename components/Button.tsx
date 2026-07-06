import { useMemo } from "react";
import {
  useTheme,
  Theme,
  getStateColor,
  getGlowStyles,
} from "../providers/ThemeProvider";

import { Pressable, Text, View, StyleSheet, Platform } from "react-native";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import CircularProgress from "./Progress/CircularProgress";
import { MaterialCommunityIconsGlyphs, PressableState } from "./types";

interface ButtonProps {
  onPress?: () => void;
  iconName?: MaterialCommunityIconsGlyphs;
  size?: number;
  mode?: "filled" | "tonal" | "outlined" | "text";
  style?: object;
  iconStyle?: object;
  disabled?: boolean;
  loading?: boolean;
  /** Stretch to fill the parent width. */
  fullWidth?: boolean;
  /** Icon side relative to the label. */
  iconPosition?: "left" | "right";
  accessibilityLabel?: string;
  children?: React.ReactNode;
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
  fullWidth = false,
  iconPosition = "left",
  accessibilityLabel,
  children,
}: ButtonProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const { bg, on, border } = useMemo(() => {
    switch (mode) {
      case "tonal":
        return {
          bg: theme.colors.secondaryContainer,
          on: theme.colors.onSecondaryContainer,
          border: undefined,
        };
      case "outlined":
        return {
          bg: "transparent",
          on: theme.colors.primary,
          border: theme.colors.outline,
        };
      case "text":
        return {
          bg: "transparent",
          on: theme.colors.primary,
          border: undefined,
        };
      case "filled":
      default:
        return {
          bg: theme.colors.primary,
          on: theme.colors.onPrimary,
          border: undefined,
        };
    }
  }, [mode, theme.colors]);

  const isInteractive = !disabled && !loading;

  return (
    <Pressable
      accessibilityLabel={
        accessibilityLabel ||
        (typeof children === "string" ? children : undefined)
      }
      accessibilityRole="button"
      accessibilityState={{ disabled, busy: loading }}
      onPress={isInteractive && onPress ? onPress : undefined}
      disabled={disabled || loading}
      style={({ hovered, pressed }: PressableState) => {
        let currentBg = bg;

        if (isInteractive && pressed) {
          currentBg = getStateColor(
            bg === "transparent" ? theme.colors.surface : bg,
            on,
            "press",
          );
        } else if (isInteractive && hovered) {
          currentBg = getStateColor(
            bg === "transparent" ? theme.colors.surface : bg,
            on,
            "hover",
          );
        }

        const glow =
          (hovered || pressed) && isInteractive
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
            opacity: disabled ? 0.38 : 1,
          },
          fullWidth && styles.fullWidth,
          style,
        ];
      }}
      {...(Platform.OS === "android" && {
        android_ripple: { color: getStateColor(bg, on, "press") },
      })}
    >
      <View style={styles.itemsContainer}>
        {loading ? (
          // We use a smaller size to fit inside the button height
          <CircularProgress size={20} strokeWidth={2.5} color={on} />
        ) : (
          <>
            {iconName && iconPosition === "left" && (
              <Icons
                name={iconName}
                size={size || theme.shape.medium}
                style={[styles.icon, { color: on }, iconStyle]}
              />
            )}
            {children != null && children !== "" && (
              <Text style={[styles.buttonText, { color: on }]}>{children}</Text>
            )}
            {iconName && iconPosition === "right" && (
              <Icons
                name={iconName}
                size={size || theme.shape.medium}
                style={[styles.icon, { color: on }, iconStyle]}
              />
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
      ...Platform.select({
        web: { cursor: "pointer" },
      }),
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
    fullWidth: {
      alignSelf: "stretch",
      width: "auto",
    },
    icon: {},
  });
