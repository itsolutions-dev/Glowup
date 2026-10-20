import React, { useEffect, useState } from "react";
import { Animated, Easing, StyleProp, ViewStyle } from "react-native";
import { useReduceMotion } from "./internal/useReduceMotion";

export interface BlinkProps {
  /** What blinks: a dot, a badge, a line of text. */
  children?: React.ReactNode;
  /** Milliseconds one half of a blink takes: the fade down to `minOpacity`, and again the fade back up. Defaults to 600. */
  interval?: number;
  /** Blinks while true; stays at full opacity while false. Defaults to `true`. */
  active?: boolean;
  /** The opacity at the dimmest point of a blink, from 0 to 1. Defaults to 0.2. */
  minOpacity?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Fades its children between full opacity and `minOpacity`, over and over: a
 * live indicator, a pending status, a field that wants attention. It is a plain
 * wrapper, so it takes no space of its own beyond its children. When the OS
 * asks for reduced motion nothing blinks: the children stay at full opacity.
 *
 * ```tsx
 * <Blink><StatusBadge status="error" label="Offline" /></Blink>
 * ```
 */
const Blink = ({
  children,
  interval = 600,
  active = true,
  minOpacity = 0.2,
  style,
  testID,
}: BlinkProps) => {
  const reduceMotion = useReduceMotion();
  const [opacity] = useState(() => new Animated.Value(1));
  const animate = active && !reduceMotion;

  useEffect(() => {
    opacity.setValue(1);
    if (!animate) return;
    const fade = (toValue: number) =>
      Animated.timing(opacity, {
        toValue,
        duration: Math.max(1, interval),
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      });
    const loop = Animated.loop(
      Animated.sequence([fade(Math.min(1, Math.max(0, minOpacity))), fade(1)]),
    );
    loop.start();
    return () => {
      loop.stop();
      opacity.setValue(1);
    };
  }, [animate, interval, minOpacity, opacity]);

  return (
    <Animated.View testID={testID} style={[{ opacity }, style]}>
      {children}
    </Animated.View>
  );
};

export default Blink;
