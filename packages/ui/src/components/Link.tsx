import React, { useMemo } from "react";
import {
  Text,
  Pressable,
  Linking,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import { Theme, useTheme } from "../providers/ThemeProvider";
import { MaterialCommunityIconsGlyphs, PressableState } from "./types";

export interface LinkProps {
  children: string;
  /** Opened with `Linking.openURL`. Ignored when `onPress` is given. */
  href?: string;
  onPress?: () => void;
  /** M3 typography variant for the label. Defaults to `"bodyMedium"`. */
  variant?: keyof Theme["typography"];
  /** Underline behaviour. Defaults to `"hover"`. */
  underline?: "always" | "hover" | "none";
  /** Appends an external-link icon. Defaults to `true` when `href` is remote. */
  showExternalIcon?: boolean;
  externalIcon?: MaterialCommunityIconsGlyphs;
  color?: string;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
}

const isRemote = (href?: string) => !!href && /^[a-z][a-z0-9+.-]*:/i.test(href);

/** Inline navigational text. Falls back to `Linking.openURL` for `href`. */
const Link = ({
  children,
  href,
  onPress,
  variant = "bodyMedium",
  underline = "hover",
  showExternalIcon,
  externalIcon = "open-in-new",
  color,
  disabled,
  accessibilityLabel,
  style,
  textStyle,
  testID,
}: LinkProps) => {
  const { theme } = useTheme();
  const labelColor = color ?? theme.colors.primary;
  const withIcon = showExternalIcon ?? isRemote(href);

  const handlePress = useMemo(() => {
    if (onPress) return onPress;
    if (!href) return undefined;
    // Swallow the rejection: an unsupported scheme should not crash the screen.
    return () => {
      Linking.openURL(href).catch(() => {});
    };
  }, [onPress, href]);

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel ?? children}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled || !handlePress}
      onPress={handlePress}
      testID={testID}
      style={({ hovered }: PressableState) => [
        styles.container,
        disabled && styles.disabled,
        hovered && !disabled && styles.hovered,
        style,
      ]}
    >
      {({ hovered }: PressableState) => (
        <>
          <Text
            style={[
              theme.typography[variant],
              { color: labelColor },
              underline === "always" && styles.underlined,
              underline === "hover" && hovered && styles.underlined,
              textStyle,
            ]}
          >
            {children}
          </Text>
          {withIcon && (
            <Icons
              name={externalIcon}
              size={14}
              color={labelColor}
              style={styles.icon}
            />
          )}
        </>
      )}
    </Pressable>
  );
};

export default Link;

const styles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", gap: 4 },
  underlined: { textDecorationLine: "underline" },
  hovered: { opacity: 0.9 },
  disabled: { opacity: 0.38 },
  icon: { marginTop: 1 },
});
