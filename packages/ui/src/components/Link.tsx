import React, { useMemo } from "react";
import {
  Text,
  Pressable,
  Linking,
  Platform,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";
import Icons from "./Glyph";
import { Theme, useTheme } from "../providers/ThemeProvider";
import { MaterialCommunityIconsGlyphs, PressableState } from "./types";
import { a11yState } from "./internal/a11yState";

export interface LinkProps {
  children: string;
  /**
   * Opened with `Linking.openURL` on iOS and Android. On the web the link is an
   * `<a href>` the browser follows (a web address in a new tab), so a middle
   * click, a modified click and a screen reader treat it as a link. With
   * `onPress` a plain click calls it instead. Ignored when its scheme is not in
   * `allowedSchemes` — then the link does nothing and has no `href`.
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
  /** Appends an external-link icon. Defaults to `true` when `href` is an `http` or `https` address. */
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

// A web address opens a page elsewhere; mailto: and tel: open the mail or
// phone app, and an app's own scheme stays in the app.
const isRemote = (href?: string) =>
  !!href && /^https?$/i.test(SCHEME.exec(href)?.[1] ?? "");

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

// A browser click that is the browser's own: a new tab, a new window.
type Click = {
  button?: number;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  preventDefault?: () => void;
};
const browsersOwn = (click?: Click) =>
  !!click &&
  (click.metaKey ||
    click.ctrlKey ||
    click.shiftKey ||
    click.altKey ||
    (click.button ?? 0) !== 0);

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

  const allowedHref =
    href && isAllowed(href, allowedSchemes) ? href : undefined;
  const web = Platform.OS === "web";

  const handlePress = useMemo(() => {
    if (web && allowedHref)
      // The anchor follows its href; an onPress replaces a plain click only.
      return (e?: unknown) => {
        const click = e as Click | undefined;
        if (!onPress || browsersOwn(click)) return;
        click?.preventDefault?.();
        onPress();
      };
    if (onPress) return onPress;
    if (!allowedHref) return undefined;
    // Swallow the rejection: an unsupported scheme should not crash the screen.
    return () => {
      Linking.openURL(allowedHref).catch(() => {});
    };
  }, [web, onPress, allowedHref]);

  // react-native-web draws a View with `href` as an anchor.
  const anchor =
    web && allowedHref && !disabled
      ? {
          href: allowedHref,
          ...(isRemote(allowedHref) && {
            hrefAttrs: { target: "_blank", rel: "noopener noreferrer" },
          }),
        }
      : null;

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel ?? children}
      {...a11yState("link", { disabled: !!disabled })}
      disabled={disabled || !handlePress}
      onPress={handlePress}
      {...(anchor as object)}
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
