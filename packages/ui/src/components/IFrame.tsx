import React, { useMemo } from "react";
import {
  DimensionValue,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import Icons from "./Glyph";
import { Theme, useTheme } from "../providers/ThemeProvider";

export interface IFrameProps {
  /** The address of the page to embed. */
  src: string;
  /** The frame's accessible name: what the embedded page is. Required, as a frame without one is announced as nothing. */
  title: string;
  /** Defaults to the full width of the parent. */
  width?: DimensionValue;
  /** Defaults to 300. */
  height?: DimensionValue;
  /** Style of the box the frame fills: radius, border, margin, flex. */
  style?: StyleProp<ViewStyle>;
  /** The `allow` attribute: the features the page may use (`"fullscreen; clipboard-write"`). */
  allow?: string;
  /**
   * The `sandbox` attribute. `""` applies every restriction; a list of tokens
   * (`"allow-scripts allow-same-origin"`) lifts the ones named. Left out, the
   * page is not sandboxed.
   */
  sandbox?: string;
  /** The `referrerpolicy` attribute. */
  referrerPolicy?: React.IframeHTMLAttributes<HTMLIFrameElement>["referrerPolicy"];
  /** `"lazy"` loads the page when the frame comes near the viewport. Defaults to `"lazy"`. */
  loading?: "lazy" | "eager";
  /** Called when the page has loaded. */
  onLoad?: () => void;
  /** Called when the frame reports an error loading. Browsers rarely do for a page that fails to load. */
  onError?: () => void;
  /** Drawn on iOS and Android instead of the page. Defaults to an icon and a short notice. */
  fallback?: React.ReactNode;
  testID?: string;
}

/**
 * A page embedded in the screen. On web it is a real `<iframe>`. iOS and
 * Android have no equivalent in React Native itself (that is `react-native-webview`,
 * which this library does not depend on), so there it draws `fallback`: a
 * notice that embedded pages are not available, instead of crashing or leaving
 * a hole.
 *
 * ```tsx
 * <IFrame src="https://example.com/report" title="Quarterly report" height={480} />
 * ```
 */
const IFrame = ({
  src,
  title,
  width = "100%",
  height = 300,
  style,
  allow,
  sandbox,
  referrerPolicy,
  loading = "lazy",
  onLoad,
  onError,
  fallback,
  testID,
}: IFrameProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  if (Platform.OS !== "web") {
    return (
      <View
        testID={testID}
        accessibilityLabel={title}
        style={[styles.box, styles.unsupported, { width, height }, style]}
      >
        {fallback ?? (
          <>
            <Icons
              name="web-off"
              size={32}
              color={theme.colors.onSurfaceVariant}
            />
            <Text
              style={[
                theme.typography.bodyMedium,
                styles.notice,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Embedded pages are not available here
            </Text>
          </>
        )}
      </View>
    );
  }

  // The box is a View, so `style` means what it does everywhere else, and the
  // frame fills it. Nothing here reads `document` or `window`: rendered on a
  // server it is the same element.
  return (
    <View testID={testID} style={[styles.box, { width, height }, style]}>
      {React.createElement("iframe", {
        src,
        title,
        allow,
        sandbox,
        referrerPolicy,
        loading,
        onLoad: () => onLoad?.(),
        onError: () => onError?.(),
        style: { width: "100%", height: "100%", border: 0 },
      })}
    </View>
  );
};

export default IFrame;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    box: { overflow: "hidden" },
    unsupported: {
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.s,
      padding: theme.spacing.m,
      borderRadius: theme.shape.medium,
      borderWidth: 1,
      borderStyle: "dashed",
      borderColor: theme.colors.outlineVariant,
      backgroundColor: theme.colors.surfaceContainerLow,
    },
    notice: { textAlign: "center" },
  });
