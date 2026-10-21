import React, { memo, useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { CircularProgress, useTheme } from "@its/glowup-ui";
import { drawWidth } from "./pageGeometry";
import type { PdfNative, PdfPageSize, PdfRect } from "./types";

export type PdfHighlight = { rect: PdfRect; current: boolean };

type Props = {
  uri: string;
  index: number;
  size: PdfPageSize;
  /** The page's width on screen, in layout units. */
  width: number;
  /** The width to draw it at, in pixels. */
  renderWidth: number;
  native: PdfNative;
  highlights: PdfHighlight[];
  highlightColor: string;
  failedLabel: string;
  accessibilityLabel: string;
};

/** One page: its image, drawn by the native side, with the search hits over it. */
const PdfPage = ({
  uri,
  index,
  size,
  width,
  renderWidth,
  native,
  highlights,
  highlightColor,
  failedLabel,
  accessibilityLabel,
}: Props) => {
  const { theme } = useTheme();
  const [image, setImage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const height = (width * size.height) / size.width;
  const pixels = drawWidth(renderWidth, size);

  useEffect(() => {
    let cancelled = false;
    // The previous image stays up (stretched) until the sharper one arrives.
    native
      .renderPage(uri, index, pixels)
      .then((next) => {
        if (cancelled) return;
        setImage(next);
        setFailed(false);
      })
      .catch(() => {
        // The document as a whole opened: this page says so and can be tried again.
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [native, uri, index, pixels, attempt]);

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={{ width, height, backgroundColor: "#ffffff" }}
    >
      {image ? (
        <Image
          source={{ uri: image }}
          style={StyleSheet.absoluteFill}
          resizeMode="stretch"
          accessibilityIgnoresInvertColors
        />
      ) : failed ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={failedLabel}
          onPress={() => {
            setFailed(false);
            setAttempt((a) => a + 1);
          }}
          style={styles.loading}
        >
          <Text
            style={[
              theme.typography.bodyMedium,
              { color: theme.colors.onSurfaceVariant, textAlign: "center" },
            ]}
          >
            {failedLabel}
          </Text>
        </Pressable>
      ) : (
        <View style={styles.loading}>
          <CircularProgress size={24} decorative />
        </View>
      )}
      {highlights.map(({ rect, current }, i) => (
        <View
          key={i}
          pointerEvents="none"
          style={{
            position: "absolute",
            left: rect.x * width,
            top: rect.y * height,
            width: rect.width * width,
            height: rect.height * height,
            backgroundColor: highlightColor,
            opacity: current ? 0.55 : 0.3,
          }}
        />
      ))}
    </View>
  );
};

export default memo(PdfPage);

const styles = StyleSheet.create({
  loading: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
