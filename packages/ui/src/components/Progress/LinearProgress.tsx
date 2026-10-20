import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Animated,
  Easing,
  StyleSheet,
  Dimensions,
  I18nManager,
  type DimensionValue,
} from "react-native";
import { getLuminance } from "polished";
import { useTheme } from "../../providers/ThemeProvider";

/** Where a `LinearProgress` draws its `label`, relative to the bar. */
export type LinearProgressLabelPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "left"
  | "right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"
  | "inside";

export interface LinearProgressProps {
  progress?: number;
  indeterminate?: boolean;
  /**
   * Bar thickness. A percentage fills the parent — a progress surface. Defaults
   * to 4, and to 20 when the label is `"inside"`, which has to fit on the bar.
   */
  height?: DimensionValue;
  /** Width of the whole component, label included. Defaults to the full width of the parent. */
  width?: DimensionValue;
  color?: string;
  trackColor?: string;
  /**
   * Text, a number or any node drawn with the bar, at `labelPosition`. Text is
   * drawn in the theme's type; a node as given.
   */
  label?: React.ReactNode;
  /**
   * Where `label` goes: above (`"top-left"`, `"top-center"`, `"top-right"`) or
   * below (`"bottom-*"`) the bar, aligned as named, beside it (`"left"`,
   * `"right"`), or `"inside"`, centred on the bar. Inside, text is drawn in two
   * colours, over the filled part and over the track, so it reads on both; that
   * suits a bar with a `progress`, on an indeterminate one the text is only
   * legible over the track. Defaults to `"right"`.
   */
  labelPosition?: LinearProgressLabelPosition;
  duration?: number;
  indeterminateDuration?: number;
  /**
   * Hide the bar from assistive technology, for when the component around it
   * already announces the progress — a bar inside a button is not a second
   * control to land on.
   */
  decorative?: boolean;
}

const INSIDE_HEIGHT = 20;

const isText = (node: React.ReactNode): node is string | number =>
  typeof node === "string" || typeof node === "number";

const isEmpty = (node: React.ReactNode) =>
  node === undefined || node === null || node === false || node === "";

/** Black or white, whichever reads on `background`; `fallback` when it is not a colour polished can parse. */
const readableOn = (background: string, fallback: string) => {
  try {
    return getLuminance(background) > 0.5 ? "#000000" : "#FFFFFF";
  } catch {
    return fallback;
  }
};

const LinearProgress = ({
  progress = 0,
  indeterminate = false,
  height: heightProp,
  width = "100%",
  color,
  trackColor,
  label,
  labelPosition = "right",
  duration = 500,
  indeterminateDuration = 1500,
  decorative = false,
}: LinearProgressProps) => {
  const { theme } = useTheme();
  const [animatedValue] = useState(() => new Animated.Value(0));
  // The same progress on a clock the layout can follow: a width cannot run on
  // the native driver, so the label's fill-coloured copy has a value of its own.
  const [clip] = useState(() => new Animated.Value(0));
  const [trackWidth, setTrackWidth] = useState(Dimensions.get("window").width);

  const clampedProgress = Math.min(1, Math.max(0, progress));
  const hasLabel = !isEmpty(label);
  const inside = hasLabel && labelPosition === "inside";
  const outside = hasLabel && !inside;
  // Two copies of the text, one per background, need a text to copy.
  const layered = inside && isText(label) && !indeterminate;
  const height = heightProp ?? (inside ? INSIDE_HEIGHT : 4);

  useEffect(() => {
    if (indeterminate) {
      animatedValue.setValue(0);
      const animation = Animated.loop(
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: indeterminateDuration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      animation.start();
      return () => animation.stop();
    }

    // A determinate bar grows with `scaleX` from its leading edge rather than
    // by animating `width`: a transform runs on the native driver and never
    // relayouts the tree, where a width tween re-runs layout every frame.
    const animations = [
      Animated.timing(animatedValue, {
        toValue: clampedProgress,
        duration,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ];
    if (layered) {
      animations.push(
        Animated.timing(clip, {
          toValue: clampedProgress,
          duration,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      );
    }
    animations.forEach((animation) => animation.start());
    return () => animations.forEach((animation) => animation.stop());
  }, [
    clampedProgress,
    indeterminate,
    layered,
    duration,
    indeterminateDuration,
    animatedValue,
    clip,
  ]);

  const barColor = color || theme.colors.primary;
  const actualTrackColor = trackColor || theme.colors.surfaceContainerHighest;

  const indeterminateBarWidthRatio = 0.4;
  const translateXIndeterminate = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-trackWidth * indeterminateBarWidthRatio, trackWidth],
  });

  const a11y = decorative
    ? {
        accessible: false,
        importantForAccessibility: "no-hide-descendants" as const,
        accessibilityElementsHidden: true,
        "aria-hidden": true,
      }
    : {
        accessibilityRole: "progressbar" as const,
        accessible: true,
        accessibilityLabel: indeterminate
          ? "Loading"
          : `Progress: ${Math.round(clampedProgress * 100)}%`,
        "aria-valuemin": 0,
        "aria-valuemax": 1,
        // Undefined for indeterminate: there is no value to report.
        "aria-valuenow": indeterminate ? undefined : clampedProgress,
      };

  const side = labelPosition === "left" || labelPosition === "right";
  const rtl = I18nManager.isRTL;

  // The label drawn on the bar: over the track in the text colour of the
  // surface, and again, clipped to the filled part, in the one of the bar.
  const insideLabel = () => {
    const onTrack = trackColor
      ? readableOn(trackColor, theme.colors.onSurface)
      : theme.colors.onSurface;
    const onBar = color
      ? readableOn(color, theme.colors.onPrimary)
      : theme.colors.onPrimary;
    const text = (textColor: string) => (
      <Text
        numberOfLines={1}
        style={[theme.typography.labelSmall, { color: textColor }]}
      >
        {label}
      </Text>
    );
    if (!layered) {
      return (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.centre]}
        >
          {isText(label) ? text(onTrack) : label}
        </View>
      );
    }
    return (
      <>
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.centre]}
        >
          {text(onTrack)}
        </View>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.clip,
            rtl ? styles.fromRight : styles.fromLeft,
            {
              width: clip.interpolate({
                inputRange: [0, 1],
                outputRange: [0, trackWidth],
              }),
            },
          ]}
        >
          <View
            style={[
              styles.centre,
              styles.clipped,
              rtl ? styles.fromRight : styles.fromLeft,
              { width: trackWidth },
            ]}
          >
            {text(onBar)}
          </View>
        </Animated.View>
      </>
    );
  };

  const track = (
    <View
      style={[
        styles.linearTrack,
        outside && side ? styles.fill : { width: outside ? "100%" : width },
        { height, backgroundColor: actualTrackColor },
      ]}
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
      {...a11y}
    >
      <Animated.View
        style={[
          styles.linearBar,
          indeterminate
            ? {
                backgroundColor: barColor,
                width: `${indeterminateBarWidthRatio * 100}%`,
                transform: [{ translateX: translateXIndeterminate }],
              }
            : {
                backgroundColor: barColor,
                width: "100%",
                transformOrigin: rtl ? "right" : "left",
                transform: [{ scaleX: animatedValue }],
              },
        ]}
      />
      {inside && insideLabel()}
    </View>
  );

  if (!outside) return track;

  const labelNode = isText(label) ? (
    <Text
      style={[
        theme.typography.labelMedium,
        { color: theme.colors.onSurfaceVariant },
        labelPosition.endsWith("center")
          ? styles.alignCentre
          : labelPosition.endsWith("right") && !side
            ? styles.alignEnd
            : null,
      ]}
    >
      {label}
    </Text>
  ) : (
    label
  );
  const before = labelPosition === "left" || labelPosition.startsWith("top");

  return (
    <View style={[side ? styles.sideBySide : styles.stacked, { width }]}>
      {before && labelNode}
      {track}
      {!before && labelNode}
    </View>
  );
};

export default LinearProgress;

const styles = StyleSheet.create({
  linearTrack: {
    borderRadius: 2,
    overflow: "hidden",
  },
  linearBar: {
    borderRadius: 2,
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
  },
  fill: { flex: 1 },
  // A label above or below the bar, aligned along it.
  stacked: { gap: 4 },
  alignCentre: { alignSelf: "center" },
  alignEnd: { alignSelf: "flex-end" },
  // A label beside the bar.
  sideBySide: { flexDirection: "row", alignItems: "center", gap: 8 },
  centre: { alignItems: "center", justifyContent: "center" },
  // The part of the label that sits on the filled bar: a window as wide as the
  // fill onto a copy of the text laid out over the whole bar.
  clip: { position: "absolute", top: 0, bottom: 0, overflow: "hidden" },
  clipped: { position: "absolute", top: 0, bottom: 0 },
  fromLeft: { left: 0 },
  fromRight: { right: 0 },
});
