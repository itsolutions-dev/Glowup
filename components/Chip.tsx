import { useMemo, useState } from "react";
import { Pressable, Text, StyleSheet, View, Platform } from "react-native";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";

import {
  useTheme,
  Theme,
  getStateColor,
  getGlowStyles,
} from "../providers/ThemeProvider";
import { MaterialCommunityIconsGlyphs, PressableState } from "./types";

interface ChipProps {
  label: string;
  onPress?: () => void;
  onClose?: () => void;
  icon?: MaterialCommunityIconsGlyphs;
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

  const [bodyHovered, setBodyHovered] = useState(false);
  const [bodyPressed, setBodyPressed] = useState(false);

  let currentBg = bg;
  if (bodyPressed) {
    currentBg = getStateColor(
      bg === "transparent" ? theme.colors.surface : bg,
      on,
      "press",
    );
  } else if (bodyHovered) {
    currentBg = getStateColor(
      bg === "transparent" ? theme.colors.surface : bg,
      on,
      "hover",
    );
  }

  const glow =
    (bodyHovered || bodyPressed) && !disabled
      ? getGlowStyles(theme, true)
      : {
          borderWidth: mode === "outlined" ? 1 : 0,
          borderColor: border || theme.colors.outlineVariant,
        };

  return (
    // Plain container: keeps the close icon a SIBLING of the body press target
    // instead of a descendant, so react-native-web never nests <button> in <button>.
    <View
      style={[
        styles.container,
        style,
        {
          backgroundColor: currentBg,
          ...glow,
          opacity: disabled ? 0.38 : 1,
        },
      ]}
    >
      <Pressable
        onPress={() => !disabled && onPress && onPress()}
        onHoverIn={() => setBodyHovered(true)}
        onHoverOut={() => setBodyHovered(false)}
        onPressIn={() => setBodyPressed(true)}
        onPressOut={() => setBodyPressed(false)}
        disabled={disabled}
        accessibilityRole={onPress ? "button" : undefined}
        accessibilityLabel={label}
        accessibilityState={{ disabled, selected }}
        style={styles.content}
        {...(Platform.OS === "android" && {
          android_ripple: { color: rippleColor },
        })}
      >
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
      </Pressable>
      {onClose && (
        <Pressable
          onPress={() => (!disabled && onClose ? onClose() : null)}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={`Close ${label}`}
          style={({ hovered, pressed }: PressableState) => [
            styles.closeButton,
            { opacity: disabled ? 0.38 : pressed ? 0.7 : hovered ? 0.5 : 1 },
          ]}
        >
          <Icons
            name="close"
            size={theme.shape.large}
            color={on}
            style={[styles.closeIcon, disabled && styles.disabledText]}
          />
        </Pressable>
      )}
    </View>
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
