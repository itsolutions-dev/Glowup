import React, { useMemo } from "react";
import {
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  ViewStyle,
  Platform,
} from "react-native";
import { getStateColor, useTheme } from "../providers/ThemeProvider";
import { PressableState } from "./types";

export interface TouchableRippleProps extends Omit<
  PressableProps,
  "style" | "children"
> {
  children: React.ReactNode;
  /** Surface the state layer is drawn over. Defaults to `surface`. */
  underlayColor?: string;
  /**
   * Colour of the state layer itself — the M3 "on" role of the surface.
   * Defaults to `onSurface`.
   */
  rippleColor?: string;
  /** Skip the container background so the layer only tints the child. */
  borderless?: boolean;
  /** Matches the parent's corner radius so the layer doesn't bleed out. */
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * A `Pressable` that paints the Material 3 state layer — 8% on hover, 10% on
 * focus, 12% on press — on top of `underlayColor`, and falls back to the
 * platform ripple on Android.
 *
 * Every interactive surface in the kit hand-rolled this triple before; use this
 * instead of re-deriving hover/press colours in each component.
 */
const TouchableRipple = ({
  children,
  underlayColor,
  rippleColor,
  borderless = false,
  borderRadius,
  style,
  disabled,
  ...rest
}: TouchableRippleProps) => {
  const { theme } = useTheme();

  const base = underlayColor ?? theme.colors.surface;
  const on = rippleColor ?? theme.colors.onSurface;
  const layer = useStateLayer(base, on);

  const resolveBackground = (state: PressableState) =>
    disabled || !(state.pressed || state.hovered || state.focused)
      ? borderless
        ? "transparent"
        : base
      : layer(state);

  return (
    <Pressable
      disabled={disabled}
      android_ripple={
        Platform.OS === "android" && !disabled
          ? { color: layer({ pressed: true }), borderless }
          : undefined
      }
      style={(state: PressableState) => [
        styles.container,
        borderRadius !== undefined && {
          borderRadius,
          // Android draws its ripple outside the radius without this.
          overflow: "hidden" as const,
        },
        { backgroundColor: resolveBackground(state) },
        !disabled && styles.interactive,
        style,
      ]}
      {...rest}
    >
      {children}
    </Pressable>
  );
};

export default TouchableRipple;

/**
 * The same state layer as a plain colour, for components that already own their
 * `Pressable` and only need the M3 tint (`Button`, `Chip`, `FAB`).
 */
export const useStateLayer = (
  baseColor: string,
  onColor: string,
): ((state: PressableState, disabled?: boolean) => string) => {
  const layers = useMemo(
    () => ({
      hover: getStateColor(baseColor, onColor, "hover"),
      focus: getStateColor(baseColor, onColor, "focus"),
      press: getStateColor(baseColor, onColor, "press"),
    }),
    [baseColor, onColor],
  );

  return (
    { hovered, pressed, focused }: PressableState,
    disabled?: boolean,
  ) => {
    if (disabled) return baseColor;
    if (pressed) return layers.press;
    if (hovered) return layers.hover;
    if (focused) return layers.focus;
    return baseColor;
  };
};

// `transition` is a react-native-web CSS property with no slot in RN's
// ViewStyle, so it has to be cast in rather than declared inline.
const webTransition = Platform.select({
  web: { transition: "background-color 150ms ease-in-out" },
}) as ViewStyle | undefined;

const styles = StyleSheet.create({
  container: {
    ...webTransition,
  },
  interactive: {
    ...Platform.select({
      web: { cursor: "pointer" as const },
    }),
  },
});
