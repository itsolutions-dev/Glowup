import React, { useMemo, useState } from "react";
import {
  View,
  Image as RNImage,
  ImageSourcePropType,
  ImageResizeMode,
  StyleSheet,
  StyleProp,
  ViewStyle,
  DimensionValue,
} from "react-native";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import { Theme, useTheme } from "../providers/ThemeProvider";
import Skeleton from "./Skeleton";
import { MaterialCommunityIconsGlyphs } from "./types";
import { RadiusValue } from "./Layout/tokens";

export interface ImageProps {
  source: ImageSourcePropType;
  /**
   * Alternative text. Required — an image with no accessible name is invisible
   * to screen readers.
   */
  alt: string;
  /** Swapped in when `source` fails to load. */
  fallbackSource?: ImageSourcePropType;
  /** Shown when loading fails and there is no `fallbackSource`. */
  fallbackIcon?: MaterialCommunityIconsGlyphs;
  width?: DimensionValue;
  height?: DimensionValue;
  /** Width divided by height. Use instead of `height` for fluid layouts. */
  ratio?: number;
  /** Corner radius — a shape token name or a raw radius. */
  radius?: RadiusValue;
  resizeMode?: ImageResizeMode;
  /** Renders a pulsing skeleton until the image resolves. Defaults to `true`. */
  showLoader?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * `react-native`'s Image plus the three things every app ends up writing
 * around it: a loading placeholder, a fallback for broken sources, and
 * token-driven corner radius.
 */
const Image = ({
  source,
  alt,
  fallbackSource,
  fallbackIcon = "image-broken-variant",
  width,
  height,
  ratio,
  radius,
  resizeMode = "cover",
  showLoader = true,
  onLoad,
  onError,
  style,
  testID,
}: ImageProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  // Identity of the source, not the object: callers routinely build
  // `{ uri }` inline, which would otherwise look like a new source on every
  // render and reset the loading state forever.
  const sourceKey = useMemo(() => {
    if (typeof source === "number") return `asset:${source}`;
    if (Array.isArray(source)) {
      return source.map((entry) => entry.uri ?? "").join("|");
    }
    return source.uri ?? "";
  }, [source]);

  // A genuinely new source deserves a fresh attempt, otherwise one broken URL
  // would permanently poison the component instance.
  const [loadedKey, setLoadedKey] = useState(sourceKey);
  if (sourceKey !== loadedKey) {
    setLoadedKey(sourceKey);
    setLoading(true);
    setFailed(false);
  }

  const borderRadius =
    typeof radius === "number" ? radius : radius ? theme.shape[radius] : 0;

  const activeSource = failed && fallbackSource ? fallbackSource : source;
  const showBrokenState = failed && !fallbackSource;

  const frameStyle: ViewStyle = {
    width: width ?? "100%",
    height,
    aspectRatio: ratio,
    borderRadius,
  };

  return (
    <View style={[styles.frame, frameStyle, style]} testID={testID}>
      {showBrokenState ? (
        <View style={styles.broken} accessibilityLabel={alt}>
          <Icons
            name={fallbackIcon}
            size={28}
            color={theme.colors.onSurfaceVariant}
          />
        </View>
      ) : (
        <RNImage
          source={activeSource}
          accessible
          accessibilityRole="image"
          accessibilityLabel={alt}
          resizeMode={resizeMode}
          style={styles.image}
          onLoadEnd={() => setLoading(false)}
          onLoad={onLoad}
          onError={() => {
            setLoading(false);
            setFailed(true);
            onError?.();
          }}
        />
      )}

      {showLoader && loading && !showBrokenState && (
        <View style={styles.loader} pointerEvents="none">
          <Skeleton width="100%" height="100%" borderRadius={borderRadius} />
        </View>
      )}
    </View>
  );
};

export default Image;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    frame: {
      overflow: "hidden",
      backgroundColor: theme.colors.surfaceContainerHighest,
    },
    image: { width: "100%", height: "100%" },
    broken: { flex: 1, alignItems: "center", justifyContent: "center" },
    loader: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
  });
