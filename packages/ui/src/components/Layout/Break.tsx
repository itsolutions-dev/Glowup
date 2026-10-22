import React, { useMemo } from "react";
import { View, ViewProps, ViewStyle } from "react-native";
import { useTheme } from "../../providers/ThemeProvider";
import { SpacingValue, resolveSpacing } from "./tokens";

export interface BreakProps extends ViewProps {
  /** Breaks out on both horizontal edges: a spacing token or px. */
  inline?: SpacingValue;
  /** Breaks out on both vertical edges: a spacing token or px. */
  block?: SpacingValue;
  /** Breaks out at the start edge (left in LTR); wins over `inline`. */
  inlineStart?: SpacingValue;
  /** Breaks out at the end edge (right in LTR); wins over `inline`. */
  inlineEnd?: SpacingValue;
  /** Breaks out at the top; wins over `block`. */
  blockStart?: SpacingValue;
  /** Breaks out at the bottom; wins over `block`. */
  blockEnd?: SpacingValue;
  children?: React.ReactNode;
}

/** A negative margin; `0` stays `0` rather than `-0`. */
const out = (px: number | undefined) => (px ? -px : undefined);

/**
 * Lets its child out of the padding of its container: a negative margin of the
 * same size, per edge, so an image or a divider runs edge to edge inside a
 * padded `Box`, `Card` or `Paper`. Give each edge the padding it should cancel.
 *
 * ```tsx
 * <Card padding={16}>
 *   <Break inline="m"><Image … /></Break>
 * </Card>
 * ```
 */
const Break = ({
  inline,
  block,
  inlineStart,
  inlineEnd,
  blockStart,
  blockEnd,
  style,
  children,
  ...viewProps
}: BreakProps) => {
  const { theme } = useTheme();
  const margins = useMemo<ViewStyle>(() => {
    const own: ViewStyle = {
      marginStart: out(resolveSpacing(theme, inlineStart ?? inline)),
      marginEnd: out(resolveSpacing(theme, inlineEnd ?? inline)),
      marginTop: out(resolveSpacing(theme, blockStart ?? block)),
      marginBottom: out(resolveSpacing(theme, blockEnd ?? block)),
    };
    // An unset edge must not blank a margin `style` sets: in a style array a
    // later `undefined` overrides an earlier value.
    return Object.fromEntries(
      Object.entries(own).filter(([, value]) => value !== undefined),
    ) as ViewStyle;
  }, [theme, inline, block, inlineStart, inlineEnd, blockStart, blockEnd]);

  return (
    <View {...viewProps} style={[margins, style]}>
      {children}
    </View>
  );
};

export default Break;
