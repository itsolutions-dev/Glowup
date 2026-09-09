import React, { useCallback } from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, getGlowStyles } from "../providers/ThemeProvider";
import { MaterialCommunityIconsGlyphs, PressableState } from "./types";

type FABSize = "small" | "regular" | "large" | "extended";

type FABPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left";

interface FABProps {
  icon: MaterialCommunityIconsGlyphs;
  label?: string;
  onPress: () => void;
  size?: FABSize;
  position?: FABPosition;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

const FAB = ({
  icon,
  label,
  onPress,
  size = "regular",
  position = "bottom-right",
  disabled,
  style: customStyle,
}: FABProps) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const getSafeStyle = useCallback(() => {
    const baseMargin = 16;
    const style: ViewStyle = { position: "absolute" };

    if (position.startsWith("top")) {
      style.top = insets.top + baseMargin;
    } else {
      style.bottom = insets.bottom + baseMargin;
    }

    if (position.endsWith("right")) {
      style.right = insets.right + baseMargin;
    } else {
      style.left = insets.left + baseMargin;
    }

    return style;
  }, [position, insets]);

  const isExtended = size === "extended";

  return (
    <Pressable
      accessibilityLabel={label || `${icon} FAB`}
      accessibilityRole="button"
      disabled={disabled}
      accessibilityState={{ disabled }}
      onPress={onPress}
      style={({ hovered, pressed }: PressableState) => [
        styles.fabBase,
        styles[size],
        getSafeStyle(),
        {
          backgroundColor:
            hovered && !disabled
              ? theme.colors.primaryContainer + "CC"
              : theme.colors.primaryContainer,
        },
        (hovered || pressed) && !disabled && getGlowStyles(theme, true),
        disabled && styles.disabled,
        customStyle,
      ]}
    >
      <Icons
        name={icon}
        size={size === "large" ? 36 : 24}
        color={theme.colors.onPrimaryContainer}
      />
      {isExtended && label && (
        <Text
          style={[
            theme.typography.labelLarge,
            { color: theme.colors.onPrimaryContainer, marginLeft: 12 },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
};

export default FAB;

const styles = StyleSheet.create({
  fabBase: {
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    zIndex: 99,
    elevation: 6,
  },
  small: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  regular: {
    width: 56,
    height: 56,
    borderRadius: 16,
  },
  large: {
    width: 96,
    height: 96,
    borderRadius: 28,
  },
  extended: {
    height: 56,
    paddingHorizontal: 20,
    borderRadius: 16,
    flexDirection: "row",
  },
  disabled: {
    opacity: 0.38,
    elevation: 0,
  },
});
