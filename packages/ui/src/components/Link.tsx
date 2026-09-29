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
  /**
   * Opened with `Linking.openURL`. Ignored when `onPress` is given, and when
   * its scheme is not in `allowedSchemes` — then the link does nothing.
   */
  href?: string;
  /**
   * URL schemes `href` may use. A link whose `href` came from data (a user's
   * website, a CMS field) must not be able to open `javascript:`, `intent:` or
   * another app's deep link. Add your own app's scheme here to deep-link.
   * Defaults to `["http", "https", "mailto", "tel"]`.
   */
  allowedSchemes?: string[];
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

const SCHEME = /^([a-z][a-z0-9+.-]*):/i;
const DEFAULT_SCHEMES = ["http", "https", "mailto", "tel"];

const isRemote = (href?: string) => !!href && SCHEME.test(href);

/**
 * The scheme a URL parser would read, or `undefined` for a relative href.
 * Anything before the first ":" counts, as long as no "/", "?" or "#" comes
 * first — broader than RFC 3986's scheme characters on purpose, because
 * Android's Uri.parse accepts "my_app:" too. URL parsers drop whitespace and
 * control characters before reading the scheme, so "java\nscript:" is
 * javascript: — read it the same way.
 */
const schemeOf = (href: string) =>
  /^([^/?#]*?):/
    .exec(href.replace(/[\u0000-\u0020\u007f]/g, ""))?.[1]
    ?.toLowerCase();

/** A relative href stays inside the app; anything with a scheme must be allowed. */
const isAllowed = (href: string, allowed: string[]) => {
  const scheme = schemeOf(href);
  return (
    scheme === undefined || allowed.some((a) => a.toLowerCase() === scheme)
  );
};

/** Inline navigational text. Falls back to `Linking.openURL` for `href`. */
const Link = ({
  children,
  href,
  allowedSchemes = DEFAULT_SCHEMES,
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
    if (!href || !isAllowed(href, allowedSchemes)) return undefined;
    // Swallow the rejection: an unsupported scheme should not crash the screen.
    return () => {
      Linking.openURL(href).catch(() => {});
    };
  }, [onPress, href, allowedSchemes]);

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
