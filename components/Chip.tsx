import { useMemo } from "react";
import { Pressable, Text, StyleSheet, View, Platform } from "react-native";
import Icons from "expo-vector-icons/MaterialCommunityIcons";

import {
  useTheme,
  Theme,
  getStateColor,
  getGlowStyles,
} from "../providers/ThemeProvider";

interface ChipProps {
  label: string;
  onPress?: () => void;
  onClose?: () => void;
  icon?: string;
  disabled?: boolean;
  selected?: boolean;
  mode?: "filled" | "tonal" | "outlined";
  style?: object;
}

const Chip = ({
  label,
  onPress,
  onClose,
  icon,
  selected = false,
  disabled = false,
  mode = "filled",
  style = {},
}: ChipProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const { bg, on, border, rippleColor } = useMemo(() => {
    let backgroundColor, onColor, borderColor, androidRippleColor;
    switch (mode) {
      case "filled":
        backgroundColor = selected
          ? theme.colors.tertiaryContainer
          : theme.colors.secondaryContainer;
        onColor = selected
          ? theme.colors.onTertiaryContainer
          : theme.colors.onSecondaryContainer;
        androidRippleColor = theme.colors.onPrimary; // A common ripple for filled
        break;
      case "tonal":
        backgroundColor = theme.colors.secondaryContainer;
        onColor = theme.colors.onSecondaryContainer;
        androidRippleColor = theme.colors.onSecondaryContainer; // Or theme.colors.secondary
        break;
      case "outlined":
        backgroundColor = "transparent";
        onColor = theme.colors.secondary;
        borderColor = theme.colors.outlineVariant;
        androidRippleColor = theme.colors.primary; // Or theme.colors.onSurface
        break;
      default: // Fallback for any unexpected mode, though TypeScript should prevent this
        backgroundColor = theme.colors.surface;
        onColor = theme.colors.onSurface;
        androidRippleColor = theme.colors.primary;
    }
    return {
      bg: backgroundColor,
      on: onColor,
      border: borderColor,
      rippleColor: androidRippleColor,
    };
  }, [mode, selected, theme.colors]);

  return (
    <Pressable
      onPress={() => !disabled && onPress && onPress()}
      disabled={disabled}
      accessibilityRole="button" // Clarify role for accessibility
      accessibilityLabel={label} // Provide label for screen readers
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
                borderColor: border || theme.colors.outlineVariant,
              };

        return [
          styles.container,
          style, // Apply root style prop
          {
            backgroundColor: currentBg,
            ...glow,
            opacity: disabled ? 0.38 : 1, // Standard Material disabled opacity
          },
        ];
      }}
      {...(Platform.OS === "android" && {
        android_ripple: { color: rippleColor },
      })}
    >
      <View style={styles.content}>
        {icon && (
          <Icons
            name={icon}
            size={theme.shape.large}
            color={on}
            style={[styles.icon, disabled && styles.disabledText]}
          />
        )}
        <Text style={[styles.label, disabled && styles.disabledText]}>
          {label}
        </Text>
        {selected && (
          <Icons
            name="check"
            size={theme.shape.large}
            color={on}
            style={[styles.checkIcon, disabled && styles.disabledText]}
          />
        )}
        {onClose && (
          <Pressable
            onPress={() => (!disabled && onClose ? onClose() : null)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={`Close ${label}`}
            style={({ hovered, pressed }) => [
              styles.closeButton, // Add a style for the close button
              { opacity: disabled ? 0.38 : pressed ? 0.7 : hovered ? 0.5 : 1 }, // Visual feedback for close button
            ]}
          >
            <Icons
              name="close"
              size={theme.shape.large}
              color={on} // Use 'on' color for close icon
              style={[styles.closeIcon, disabled && styles.disabledText]}
            />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
};

export default Chip;

const makeStyles: (theme: Theme) => StyleSheet.NamedStyles<any> = (
  theme: Theme,
) =>
  StyleSheet.create({
    container: {
      marginTop: theme.spacing.xs,
      marginBottom: theme.spacing.xs,
      marginLeft: theme.spacing.xs,
      marginRight: theme.spacing.xs,
      flexDirection: "row",
      height: 32,
      borderRadius: theme.shape.medium,
      paddingHorizontal: 12,
      justifyContent: "center",
      alignItems: "center",
      alignSelf: "flex-start",
      ...Platform.select({
        web: { transition: "all 200ms ease-in-out" },
      }),
    },
    content: {
      flexDirection: "row",
      alignItems: "center",
    },
    label: {
      ...theme.typography.labelLarge,
      color: theme.colors.primary,
    },
    icon: {
      marginRight: theme.spacing.s,
      color: theme.colors.primary,
    },
    checkIcon: {
      marginLeft: theme.spacing.xs,
      color: theme.colors.primary,
    },
    closeIcon: {
      marginLeft: theme.spacing.xs,
      color: theme.colors.primary,
    },
    disabledText: {
      color: theme.colors.onSurfaceVariant, // "#79747E",
    },
  });
