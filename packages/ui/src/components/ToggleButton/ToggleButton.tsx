import React from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  Platform,
  ViewStyle,
  StyleProp,
} from "react-native";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme, getGlowStyles } from "../../providers/ThemeProvider";
import { MaterialCommunityIconsGlyphs, PressableState } from "../types";

interface ToggleButtonProps {
  icon?: MaterialCommunityIconsGlyphs;
  label?: string;
  active: boolean;
  onPress: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  disabled?: boolean;
  /** Stretch to an equal share of the group's width. */
  grow?: boolean;
  /**
   * Swap the leading glyph for a check mark while selected — the M3 segmented
   * button affordance that tells "selected" apart from "just highlighted".
   */
  showSelectedCheck?: boolean;
  /** Accessibility role. The group sets this per its selection mode. */
  accessibilityRole?: "radio" | "checkbox" | "button";
  style?: StyleProp<ViewStyle>;
}

const ToggleButton = ({
  icon,
  label,
  active,
  onPress,
  isFirst,
  isLast,
  disabled = false,
  grow = false,
  showSelectedCheck = false,
  accessibilityRole = "button",
  style,
}: ToggleButtonProps) => {
  const { theme } = useTheme();

  const glyph = showSelectedCheck && active ? "check" : icon;
  const contentColor = active
    ? theme.colors.onSecondaryContainer
    : theme.colors.onSurfaceVariant;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={
        label || (icon ? `${icon} toggle button` : "Toggle Button")
      }
      accessibilityRole={accessibilityRole}
      accessibilityState={{ selected: active, checked: active, disabled }}
      style={({ hovered, pressed }: PressableState) => [
        styles.button,
        grow && styles.grow,
        disabled && styles.disabled,
        style,
        {
          backgroundColor: active
            ? theme.colors.secondaryContainer
            : hovered && !disabled
              ? theme.colors.surfaceContainerHigh
              : "transparent",
          borderColor: theme.colors.outline,
          borderLeftWidth: isFirst ? 1 : 0.5,
          borderRightWidth: isLast ? 1 : 0.5,
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderTopLeftRadius: isFirst ? 20 : 0,
          borderBottomLeftRadius: isFirst ? 20 : 0,
          borderTopRightRadius: isLast ? 20 : 0,
          borderBottomRightRadius: isLast ? 20 : 0,
        },
        (hovered || pressed) && !disabled && getGlowStyles(theme, true),
      ]}
      {...(Platform.OS === "android" &&
        !disabled && {
          android_ripple: { color: theme.colors.onPrimary },
        })}
    >
      {!!glyph && <Icons name={glyph} size={18} color={contentColor} />}
      {!!label && (
        <Text
          numberOfLines={1}
          style={[
            theme.typography.labelLarge,
            {
              color: active
                ? theme.colors.onSecondaryContainer
                : theme.colors.onSurface,
              marginLeft: glyph ? 8 : 0,
            },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
};

export default ToggleButton;

const styles = StyleSheet.create({
  button: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    ...Platform.select({
      web: { cursor: "pointer", transition: "all 0.2s" },
    }),
  },
  grow: {
    flex: 1,
  },
  disabled: {
    opacity: 0.38,
  },
});
