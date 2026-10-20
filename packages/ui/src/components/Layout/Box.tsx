import React, { useMemo } from "react";
import { StyleProp, View, ViewProps, ViewStyle } from "react-native";
import { useTheme } from "../../providers/ThemeProvider";
import { ColorValue, RadiusValue, resolveColor, resolveRadius } from "./tokens";

/** One of the layout presets of `BoxProps["variant"]`. */
export type BoxVariant = NonNullable<BoxProps["variant"]>;

const ROW: ViewStyle = { flexDirection: "row" };
const COLUMN: ViewStyle = { flexDirection: "column" };
const CENTERED: ViewStyle = { alignItems: "center", justifyContent: "center" };
const FULL_PAGE: ViewStyle = { flex: 1, minHeight: "100%" };
const FULL_SIZE: ViewStyle = { width: "100%", height: "100%" };

/** The style of each `BoxVariant`, in one place. */
const BOX_VARIANTS: Record<BoxVariant, ViewStyle> = {
  standard: {},
  flex: ROW,
  "column-flex": COLUMN,
  "centered-flex": { ...ROW, ...CENTERED },
  "centered-column-flex": { ...COLUMN, ...CENTERED },
  "full-page-flex": { ...ROW, ...FULL_PAGE },
  "full-page-column-flex": { ...COLUMN, ...FULL_PAGE },
  "full-size-flex": { ...ROW, ...FULL_SIZE },
  "full-size-column": { ...COLUMN, ...FULL_SIZE },
  "full-size-centered-flex": { ...ROW, ...CENTERED, ...FULL_SIZE },
  "full-size-centered-column-flex": { ...COLUMN, ...CENTERED, ...FULL_SIZE },
};

export interface BoxProps extends ViewProps {
  /**
   * Layout preset: direction, centring and filling the parent. The other props
   * and `style` are applied on top of it.
   * - `standard`: a plain column (default).
   * - `flex`: a row.
   * - `column-flex`: a column.
   * - `centered-flex`: a row, centred on both axes.
   * - `centered-column-flex`: a column, centred on both axes.
   * - `full-page-flex`: a row that fills the screen (`flex: 1`, minimum height 100%).
   * - `full-page-column-flex`: the same, as a column.
   * - `full-size-flex`: a row, 100% wide and 100% high.
   * - `full-size-column`: a column, 100% wide and 100% high.
   * - `full-size-centered-flex`: a row, 100% x 100%, centred on both axes.
   * - `full-size-centered-column-flex`: a column, 100% x 100%, centred on both axes.
   */
  variant?:
    | "standard"
    | "flex"
    | "column-flex"
    | "centered-flex"
    | "centered-column-flex"
    | "full-page-flex"
    | "full-page-column-flex"
    | "full-size-flex"
    | "full-size-column"
    | "full-size-centered-flex"
    | "full-size-centered-column-flex";
  /** Padding on every edge, in px. One edge or one axis goes through `style`. */
  padding?: number;
  /** Margin on every edge, in px. One edge or one axis goes through `style`. */
  margin?: number;
  /**
   * Background — a theme colour token (`"surfaceContainer"`) or any colour
   * string.
   */
  background?: ColorValue;
  /** Corner radius — a shape token name or a raw radius. */
  radius?: RadiusValue;
  borderWidth?: number;
  /** Border colour — a theme colour token or any colour string. */
  borderColor?: ColorValue;
  /** Gap between children, in px. */
  gap?: number;
  align?: ViewStyle["alignItems"];
  justify?: ViewStyle["justifyContent"];
  width?: ViewStyle["width"];
  height?: ViewStyle["height"];
  /** Lets children flow onto the next line (or column) instead of overflowing. */
  wrap?: boolean;
  /** Merged last, over the variant and every other prop. */
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * The layout primitive the rest of the kit composes from: a `View` with a few
 * theme-aware props and a `variant` for the usual layouts, so screens stop
 * hardcoding magic numbers. Anything not covered by a prop goes through `style`.
 */
const Box = ({
  variant = "standard",
  padding,
  margin,
  background,
  radius,
  borderWidth,
  borderColor,
  gap,
  align,
  justify,
  width,
  height,
  wrap,
  style,
  children,
  ...viewProps
}: BoxProps) => {
  const { theme } = useTheme();

  const boxStyle = useMemo<ViewStyle>(() => {
    const own: ViewStyle = {
      padding,
      margin,
      backgroundColor: resolveColor(theme, background),
      borderRadius: resolveRadius(theme, radius),
      borderWidth,
      borderColor: resolveColor(theme, borderColor),
      gap,
      alignItems: align,
      justifyContent: justify,
      width,
      height,
      flexWrap: wrap ? "wrap" : undefined,
    };
    // An unset prop must not blank what the variant says: in a style array a
    // later `undefined` overrides an earlier value.
    const set = Object.fromEntries(
      Object.entries(own).filter(([, value]) => value !== undefined),
    ) as ViewStyle;
    return { ...BOX_VARIANTS[variant], ...set };
  }, [
    theme,
    variant,
    padding,
    margin,
    background,
    radius,
    borderWidth,
    borderColor,
    gap,
    align,
    justify,
    width,
    height,
    wrap,
  ]);

  return (
    <View {...viewProps} style={[boxStyle, style]}>
      {children}
    </View>
  );
};

export default Box;
