import React from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  Platform,
  View,
  ViewStyle,
  StyleProp,
} from "react-native";
import Icons, {
  MaterialCommunityIconsGlyphs,
} from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme } from "../../providers/ThemeProvider";

interface ToggleButtonProps {
  icon?: MaterialCommunityIconsGlyphs;
  label?: string;
  active: boolean;
  onPress: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  style?: StyleProp<ViewStyle>;
}

const ToggleButton = ({
  icon,
  label,
  active,
  onPress,
  isFirst,
  isLast,
  style,
}: ToggleButtonProps) => {
  const { theme } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={
        label || (icon ? `${icon} toggle button` : "Toggle Button")
      }
      accessibilityRole="button"
      style={({ hovered, pressed }) => [
        styles.button,
        style,
        {
          backgroundColor: active
            ? theme.colors.secondaryContainer
            : hovered
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
      ]}
      {...(Platform.OS === "android" && {
        android_ripple: { color: theme.colors.onPrimary },
      })}
    >
      {icon && (
        <Icons
          name={icon}
          size={18}
          color={
            active
              ? theme.colors.onSecondaryContainer
              : theme.colors.onSurfaceVariant
          }
        />
      )}
      {label && (
        <Text
          style={[
            theme.typography.labelLarge,
            {
              color: active
                ? theme.colors.onSecondaryContainer
                : theme.colors.onSurface,
              marginLeft: icon ? 8 : 0,
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
});
