import React, { useMemo } from "react";
import { View, ViewProps, ViewStyle } from "react-native";
import { useTheme } from "../../providers/ThemeProvider";
import {
  ColorValue,
  RadiusValue,
  SpacingValue,
  resolveColor,
  resolveRadius,
  resolveSpacing,
} from "./tokens";

export interface BoxProps extends ViewProps {
  /** Padding on every edge. */
  p?: SpacingValue;
  /** Horizontal padding. */
  px?: SpacingValue;
  /** Vertical padding. */
  py?: SpacingValue;
  pt?: SpacingValue;
  pr?: SpacingValue;
  pb?: SpacingValue;
  pl?: SpacingValue;
  /** Margin on every edge. */
  m?: SpacingValue;
  mx?: SpacingValue;
  my?: SpacingValue;
  mt?: SpacingValue;
  mr?: SpacingValue;
  mb?: SpacingValue;
  ml?: SpacingValue;
  /** Background — an M3 color role name or a raw color. */
  bg?: ColorValue;
  /** Corner radius — a shape token name or a raw radius. */
  radius?: RadiusValue;
  borderWidth?: number;
  borderColor?: ColorValue;
  flex?: number;
  gap?: SpacingValue;
  align?: ViewStyle["alignItems"];
  justify?: ViewStyle["justifyContent"];
  width?: ViewStyle["width"];
  height?: ViewStyle["height"];
  /** Lays children out horizontally instead of vertically. */
  row?: boolean;
  wrap?: boolean;
}

/**
 * The layout primitive the rest of the kit composes from: a `View` that reads
 * spacing, shape and color straight off the theme, so screens stop hardcoding
 * magic numbers. Anything not covered by a prop still goes through `style`.
 */
const Box = ({
  p,
  px,
  py,
  pt,
  pr,
  pb,
  pl,
  m,
  mx,
  my,
  mt,
  mr,
  mb,
  ml,
  bg,
  radius,
  borderWidth,
  borderColor,
  flex,
  gap,
  align,
  justify,
  width,
  height,
  row,
  wrap,
  style,
  children,
  ...viewProps
}: BoxProps) => {
  const { theme } = useTheme();

  const boxStyle = useMemo<ViewStyle>(() => {
    const space = (value: SpacingValue | undefined) =>
      resolveSpacing(theme, value);
    // Specific edges are applied after the axis shorthands, which are applied
    // after the all-edges shorthand — narrowest wins, as in CSS.
    return {
      padding: space(p),
      paddingHorizontal: space(px),
      paddingVertical: space(py),
      paddingTop: space(pt),
      paddingRight: space(pr),
      paddingBottom: space(pb),
      paddingLeft: space(pl),
      margin: space(m),
      marginHorizontal: space(mx),
      marginVertical: space(my),
      marginTop: space(mt),
      marginRight: space(mr),
      marginBottom: space(mb),
      marginLeft: space(ml),
      backgroundColor: resolveColor(theme, bg),
      borderRadius: resolveRadius(theme, radius),
      borderWidth,
      borderColor: resolveColor(theme, borderColor),
      flex,
      gap: space(gap),
      alignItems: align,
      justifyContent: justify,
      width,
      height,
      flexDirection: row ? "row" : undefined,
      flexWrap: wrap ? "wrap" : undefined,
    };
  }, [
    theme,
    p,
    px,
    py,
    pt,
    pr,
    pb,
    pl,
    m,
    mx,
    my,
    mt,
    mr,
    mb,
    ml,
    bg,
    radius,
    borderWidth,
    borderColor,
    flex,
    gap,
    align,
    justify,
    width,
    height,
    row,
    wrap,
  ]);

  return (
    <View {...viewProps} style={[boxStyle, style]}>
      {children}
    </View>
  );
};

export default Box;
