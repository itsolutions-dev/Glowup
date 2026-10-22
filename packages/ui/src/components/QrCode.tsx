import React, { useEffect, useMemo } from "react";
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import Icons from "./Glyph";
import { useTheme } from "../providers/ThemeProvider";
import { MaterialCommunityIconsGlyphs } from "./types";
import { encodeQr, qrPath, type QrLevel } from "./internal/qr";
import { resolveColor, type ThemeColor } from "./internal/themeColor";

export type { QrLevel };

export interface QrCodeProps {
  /**
   * What the code says: a URL, a Wi-Fi string, a vCard, any text. Encoded as
   * UTF-8, in the narrowest of the numeric, alphanumeric and byte modes. The
   * most a code holds is 2953 bytes at level `"L"`; past that nothing is
   * drawn and `onError` is called.
   */
  value: string;
  /** Side of the whole code, quiet zone included, in px. Defaults to 160. */
  size?: number;
  /**
   * How much damage the code survives, and so how big it grows: `"L"` about 7%
   * of it can be lost, `"M"` 15%, `"Q"` 25%, `"H"` 30%. A `logo` raises it to
   * `"H"` whatever this says. Defaults to `"M"`.
   */
  level?: QrLevel;
  /**
   * The empty margin around the modules, in modules. Scanners need it to find
   * the code; the standard asks for 4. Defaults to 4.
   */
  quietZone?: number;
  /**
   * The modules: a theme colour token or any colour string. Scanners read dark
   * modules on a light background, so the default does not follow the theme's
   * mode: `onSurface` on `surface` in a light theme, `inverseOnSurface` on
   * `inverseSurface` (still dark on light) in a dark one.
   */
  color?: ThemeColor;
  /** The background, a theme colour token or any colour string. See `color` for the default. */
  backgroundColor?: ThemeColor;
  /**
   * A mark drawn over the middle of the code: a glyph name, or any node (an
   * `Image`), centred in a box a fifth of the code wide. The modules under it
   * are lost, so the level is raised to `"H"`.
   */
  logo?: MaterialCommunityIconsGlyphs | Exclude<React.ReactNode, string>;
  /**
   * What a screen reader says about the code. The value is not read out by
   * default (it may be a secret). Defaults to `"QR code"`.
   */
  accessibilityLabel?: string;
  /** Called with the error when `value` does not fit in a code, which is then drawn empty. */
  onError?: (error: Error) => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Draws `value` as a QR code. The encoder is the library's own (ISO/IEC 18004,
 * versions 1-40): no native module, no network, the same code on iOS, Android
 * and the web.
 *
 * ```tsx
 * <QrCode value="https://example.com/invite/9f3a" size={200} />
 * <QrCode value={wifi} level="Q" logo="wifi" />
 * ```
 */
const QrCode = ({
  value,
  size = 160,
  level = "M",
  quietZone = 4,
  color,
  backgroundColor,
  logo,
  accessibilityLabel = "QR code",
  onError,
  style,
  testID,
}: QrCodeProps) => {
  const { theme } = useTheme();
  const hasLogo = logo !== undefined && logo !== null && logo !== false;
  const effectiveLevel: QrLevel = hasLogo ? "H" : level;
  const margin = Math.max(0, quietZone);

  const drawn = useMemo(() => {
    try {
      const symbol = encodeQr(value, { level: effectiveLevel });
      return { symbol, path: qrPath(symbol.modules, margin), error: null };
    } catch (error) {
      return { symbol: null, path: "", error: error as Error };
    }
  }, [value, effectiveLevel, margin]);

  const { error } = drawn;
  useEffect(() => {
    if (error) onError?.(error);
    // Reported once per failing value, not once per render of an inline handler.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  const modules = resolveColor(
    theme,
    color ?? (theme.isDark ? "inverseOnSurface" : "onSurface"),
  );
  const background = resolveColor(
    theme,
    backgroundColor ?? (theme.isDark ? "inverseSurface" : "surface"),
  );
  const box = { width: size, height: size, backgroundColor: background };

  if (!drawn.symbol) {
    return (
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={`${accessibilityLabel} unavailable`}
        style={[styles.box, box, style]}
        testID={testID}
      >
        <Icons
          name="qrcode-remove"
          size={Math.round(size / 3)}
          color={theme.colors.onSurfaceVariant}
        />
      </View>
    );
  }

  const { symbol } = drawn;
  const span = symbol.size + 2 * margin;
  // A whole number of modules, of the symbol's parity, so the logo's box sits
  // on the module grid and its centre is the symbol's.
  let logoModules = Math.max(1, Math.floor(symbol.size / 5));
  if (logoModules % 2 !== symbol.size % 2) logoModules++;
  // Modules on whole pixels where the size allows: a fractional module leaves
  // hairline seams between neighbours on native. The slack is margin.
  const unit = size >= span ? Math.floor(size / span) : size / span;
  const logoSide = logoModules * unit;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={[styles.box, box, style]}
      testID={testID}
    >
      <Svg
        width={unit * span}
        height={unit * span}
        viewBox={`0 0 ${span} ${span}`}
      >
        <Path
          d={drawn.path}
          fill={modules}
          // react-native-svg does not know the prop; the web's DOM `<path>` does.
          {...(Platform.OS === "web"
            ? ({ shapeRendering: "crispEdges" } as object)
            : null)}
        />
      </Svg>
      {hasLogo && (
        <View
          pointerEvents="none"
          style={[
            styles.logo,
            {
              top: (size - logoSide) / 2,
              left: (size - logoSide) / 2,
              width: logoSide,
              height: logoSide,
              padding: logoSide / 10,
              backgroundColor: background,
              borderRadius: theme.shape.small / 2,
            },
          ]}
          testID={testID ? `${testID}-logo` : undefined}
        >
          {typeof logo === "string" ? (
            <Icons
              name={logo as MaterialCommunityIconsGlyphs}
              size={Math.round(logoSide * 0.8)}
              color={modules}
            />
          ) : (
            logo
          )}
        </View>
      )}
    </View>
  );
};

export default QrCode;

const styles = StyleSheet.create({
  box: { alignItems: "center", justifyContent: "center", overflow: "hidden" },
  logo: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
});
