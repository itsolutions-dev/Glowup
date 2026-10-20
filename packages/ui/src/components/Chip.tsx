import { useMemo, useState } from "react";
import { Pressable, Text, StyleSheet, View, Platform } from "react-native";
import Icons from "./Glyph";

import {
  useTheme,
  Theme,
  getStateColor,
  getGlowStyles,
} from "../providers/ThemeProvider";
import { useInteractionFeedback } from "../providers/InteractionFeedback";
import { toneFrom as resolveTone } from "../providers/toneFrom";
import { colorRoleTokens, type ColorRole } from "./internal/colorRole";
import { MaterialCommunityIconsGlyphs, PressableState } from "./types";

const HEIGHTS = { small: 24, medium: 32, large: 40 } as const;

export interface ChipProps {
  label: string;
  onClick?: () => void;
  onClose?: () => void;
  icon?: MaterialCommunityIconsGlyphs;
  disabled?: boolean;
  selected?: boolean;
  variant?: "filled" | "tonal" | "outlined";
  /**
   * Colour role. `filled` takes the role's accent, `tonal` its container,
   * `outlined` draws the label and the outline in it. Left out, the chip keeps
   * the neutral secondary look. `toneFrom` wins over it.
   */
  color?: ColorRole;
  /** "small" renders a compact 24px chip, "large" a 40px one. */
  size?: "small" | "medium" | "large";
  /**
   * Corner shape: `"rounded"` (the default), `"squared"` for square corners,
   * `"circular"` for a pill.
   */
  border?: "rounded" | "squared" | "circular";
  /**
   * Tints a `"filled"` or `"tonal"` chip from a `#RRGGBB` colour or from any
   * text (the same text always gives the same colour), readable in light and dark.
   */
  toneFrom?: string;
  /**
   * Overrides the role of a pressable chip (`"button"`). A chip that toggles
   * inside a group is a `"radio"` or a `"checkbox"`, and then reports
   * `selected` as checked.
   */
  accessibilityRole?: "button" | "radio" | "checkbox";
  style?: object;
  /**
   * Report presses: a `"checkbox"` chip toggles, a `"radio"` one selects to `ThemeProvider`'s `onInteractionFeedback` (haptics).
   * Defaults to true.
   */
  feedback?: boolean;
}

const Chip = ({
  label,
  onClick,
  onClose,
  icon,
  selected = false,
  disabled = false,
  variant = "filled",
  color,
  size = "medium",
  border: borderShape = "rounded",
  toneFrom,
  accessibilityRole,
  style = {},
  feedback = true,
}: ChipProps) => {
  const { theme } = useTheme();
  const emitFeedback = useInteractionFeedback(feedback);
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const { bg, on, border, rippleColor } = useMemo(() => {
    let backgroundColor, onColor, borderColor, androidRippleColor;
    const role = color ? colorRoleTokens(theme, color) : undefined;
    switch (variant) {
      case "filled":
        backgroundColor = role
          ? role.main
          : selected
            ? theme.colors.tertiaryContainer
            : theme.colors.secondaryContainer;
        onColor = role
          ? role.onMain
          : selected
            ? theme.colors.onTertiaryContainer
            : theme.colors.onSecondaryContainer;
        androidRippleColor = role ? role.onMain : theme.colors.onPrimary; // A common ripple for filled
        break;
      case "tonal":
        backgroundColor = role
          ? role.container
          : theme.colors.secondaryContainer;
        onColor = role ? role.onContainer : theme.colors.onSecondaryContainer;
        androidRippleColor = onColor;
        break;
      case "outlined":
        backgroundColor = "transparent";
        onColor = role ? role.main : theme.colors.secondary;
        borderColor = role ? role.main : theme.colors.outlineVariant;
        androidRippleColor = role ? role.main : theme.colors.primary;
        break;
      default: // Fallback for any unexpected variant, though TypeScript should prevent this
        backgroundColor = theme.colors.surface;
        onColor = theme.colors.onSurface;
        androidRippleColor = theme.colors.primary;
    }
    if (toneFrom && (variant === "filled" || variant === "tonal")) {
      const tint = resolveTone(toneFrom, theme.isDark ? "dark" : "light");
      backgroundColor = tint.background;
      onColor = tint.foreground;
      androidRippleColor = tint.foreground;
    }
    return {
      bg: backgroundColor,
      on: onColor,
      border: borderColor,
      rippleColor: androidRippleColor,
    };
  }, [variant, color, selected, theme, toneFrom]);

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
          borderWidth: variant === "outlined" ? 1 : 0,
          borderColor: border || theme.colors.outlineVariant,
        };

  const iconSize =
    size === "small"
      ? theme.shape.medium
      : size === "large"
        ? theme.shape.large + theme.spacing.xs
        : theme.shape.large;
  const height = HEIGHTS[size];
  const borderRadius =
    borderShape === "circular"
      ? height / 2
      : borderShape === "squared"
        ? 0
        : theme.shape.medium;

  return (
    // Plain container: keeps the close icon a SIBLING of the body press target
    // instead of a descendant, so react-native-web never nests <button> in <button>.
    <View
      style={[
        styles.container,
        size === "small" && styles.containerSmall,
        size === "large" && styles.containerLarge,
        style,
        {
          height,
          borderRadius,
          backgroundColor: currentBg,
          ...glow,
          opacity: disabled ? 0.38 : 1,
        },
      ]}
    >
      <Pressable
        onPress={() => {
          if (disabled || !onClick) return;
          emitFeedback(
            accessibilityRole === "checkbox"
              ? "toggle"
              : accessibilityRole === "radio"
                ? "selection"
                : "press",
          );
          onClick();
        }}
        onHoverIn={() => setBodyHovered(true)}
        onHoverOut={() => setBodyHovered(false)}
        onPressIn={() => setBodyPressed(true)}
        onPressOut={() => setBodyPressed(false)}
        disabled={disabled}
        accessibilityRole={
          onClick ? (accessibilityRole ?? "button") : undefined
        }
        accessibilityLabel={label}
        accessibilityState={
          accessibilityRole === "radio" || accessibilityRole === "checkbox"
            ? { disabled, checked: selected }
            : { disabled, selected }
        }
        style={styles.content}
        {...(Platform.OS === "android" && {
          android_ripple: { color: rippleColor },
        })}
      >
        {!!icon && (
          <Icons
            name={icon}
            size={iconSize}
            color={on}
            style={[styles.icon, disabled && styles.disabledText]}
          />
        )}
        <Text
          style={[
            styles.label,
            size === "small" && styles.labelSmall,
            disabled && styles.disabledText,
          ]}
        >
          {label}
        </Text>
        {selected && (
          <Icons
            name="check"
            size={iconSize}
            color={on}
            style={[styles.checkIcon, disabled && styles.disabledText]}
          />
        )}
      </Pressable>
      {onClose && (
        <Pressable
          onPress={() => {
            if (disabled || !onClose) return;
            emitFeedback("press");
            onClose();
          }}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel={`Close ${label}`}
          style={({ hovered, pressed }: PressableState) => [
            { opacity: disabled ? 0.38 : pressed ? 0.7 : hovered ? 0.5 : 1 },
          ]}
        >
          <Icons
            name="close"
            size={iconSize}
            color={on}
            style={[styles.closeIcon, disabled && styles.disabledText]}
          />
        </Pressable>
      )}
    </View>
  );
};

export default Chip;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      marginTop: theme.spacing.xs,
      marginBottom: theme.spacing.xs,
      marginLeft: theme.spacing.xs,
      marginRight: theme.spacing.xs,
      flexDirection: "row",
      paddingHorizontal: 12,
      justifyContent: "center",
      alignItems: "center",
      alignSelf: "flex-start",
      ...Platform.select({
        web: { transition: "all 200ms ease-in-out" },
      }),
    },
    containerSmall: {
      paddingHorizontal: theme.spacing.s,
    },
    containerLarge: {
      paddingHorizontal: theme.spacing.m,
    },
    content: {
      flexDirection: "row",
      alignItems: "center",
    },
    label: {
      ...theme.typography.labelLarge,
      color: theme.colors.primary,
    },
    labelSmall: {
      ...theme.typography.labelMedium,
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
