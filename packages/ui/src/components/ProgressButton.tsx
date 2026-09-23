import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { getLuminance, mix, rgba } from "polished";

import { useTheme } from "../providers/ThemeProvider";
import Button, {
  getButtonColors,
  type ButtonColors,
  type ButtonMode,
} from "./Button";
import LinearProgress from "./Progress/LinearProgress";
import { MaterialCommunityIconsGlyphs } from "./types";

/** The moment of a task the button is showing. */
export type ProgressButtonStatus = "idle" | "loading" | "success" | "error";

export interface ProgressButtonProps {
  /**
   * Which moment of the task to show. Controlled: the button never moves
   * itself from one status to the next — the caller does, as the task reports.
   */
  status?: ProgressButtonStatus;
  /**
   * Completion while `status` is `"loading"`, from 0 to 1. Leave it undefined
   * when the task cannot say how far along it is, for an indeterminate sweep.
   */
  progress?: number;
  /** The idle label. Also the loading label unless `loadingLabel` is set. */
  children?: string;
  /** Label while loading, e.g. "Calculating route…". */
  loadingLabel?: string;
  /** Label once the task succeeded. */
  successLabel?: string;
  /** Label once the task failed. The button stays pressable, to retry. */
  errorLabel?: string;
  /** Leading icon while idle and loading. */
  iconName?: MaterialCommunityIconsGlyphs;
  successIconName?: MaterialCommunityIconsGlyphs;
  errorIconName?: MaterialCommunityIconsGlyphs;
  /**
   * How progress is drawn inside the surface: `fill` sweeps a darker (or, in
   * the dark scheme, lighter) tone of the button across it; `bar` runs a 4dp
   * line along its bottom edge.
   */
  indicator?: "fill" | "bar";
  mode?: ButtonMode;
  /** Fires in every status but `loading`, where the button is busy. */
  onPress?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  /**
   * How long the success status holds before `onSuccessEnd` fires, in ms.
   * `0` keeps it until the caller changes `status`.
   */
  successDuration?: number;
  /** Called `successDuration` ms after the button turned to success. */
  onSuccessEnd?: () => void;
  /** Colour of the fill or the bar. Derived from the button's colours if unset. */
  progressColor?: string;
  /** Colour behind the bar, and behind the fill on outlined and text. */
  trackColor?: string;
  /** Duration of each progress step's transition, in ms. */
  duration?: number;
  /** Applied to the surface: corner radius, padding, width. */
  style?: StyleProp<ViewStyle>;
  /** Applied to the label: font family, size, weight. */
  labelStyle?: StyleProp<TextStyle>;
  /** Accessible name while idle. Falls back to the label. */
  accessibilityLabel?: string;
  testID?: string;
}

/** What the surface looked like before a status change, to animate away from. */
interface Transition {
  from: ButtonColors;
  fromFill?: { color: string; fraction: number };
  /** Whether the new status grows in from the centre (success, error). */
  reveal: boolean;
  to: ButtonColors;
}

const toneOf = (status: ProgressButtonStatus) =>
  status === "success" ? "success" : status === "error" ? "error" : "primary";

/**
 * The fill's default colour: a tone of the surface that moves away from the
 * label on a filled button, so the label keeps its contrast as the fill passes
 * under it, and towards it on tonal and transparent ones, whose label contrast
 * has room to spare and whose container would otherwise barely change.
 */
const fillColorOf = (mode: ButtonMode, { bg, on }: ButtonColors) => {
  if (bg === "transparent") return rgba(on, 0.16);
  if (mode === "filled") {
    return mix(0.28, getLuminance(on) > 0.5 ? "#000000" : "#FFFFFF", bg);
  }
  return mix(0.16, on, bg);
};

const useReduceMotion = () => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => alive && setReduced(value))
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced,
    );
    return () => {
      alive = false;
      subscription.remove();
    };
  }, []);
  return reduced;
};

/**
 * A button that carries the progress of the task it started, inside its own
 * surface: idle → loading (with a fill or a bar) → success or error. Built on
 * `Button` — same modes, shape and state layers — and `LinearProgress`.
 */
const ProgressButton = ({
  status = "idle",
  progress,
  children,
  loadingLabel,
  successLabel = "Done",
  errorLabel = "Try again",
  iconName,
  successIconName = "check",
  errorIconName = "alert-circle-outline",
  indicator = "fill",
  mode = "filled",
  onPress,
  disabled = false,
  fullWidth = false,
  successDuration = 2000,
  onSuccessEnd,
  progressColor,
  trackColor,
  duration = 300,
  style,
  labelStyle,
  accessibilityLabel,
  testID,
}: ProgressButtonProps) => {
  const { theme } = useTheme();
  const reduceMotion = useReduceMotion();

  const loading = status === "loading";
  const determinate = loading && progress != null;
  const fraction = Math.min(1, Math.max(0, progress ?? 0));

  const colors = useMemo(
    () => getButtonColors(theme, mode, toneOf(status)),
    [theme, mode, status],
  );
  const fillColor = progressColor ?? fillColorOf(mode, colors);

  const label =
    status === "loading"
      ? (loadingLabel ?? children)
      : status === "success"
        ? successLabel
        : status === "error"
          ? errorLabel
          : children;
  const icon =
    status === "success"
      ? successIconName
      : status === "error"
        ? errorIconName
        : iconName;

  // The name a screen reader reads on focus. It carries the percentage, so
  // landing on the button mid-task says how far along it is; the live region
  // below announces only the status changes, never each step.
  const a11yLabel =
    status === "idle"
      ? (accessibilityLabel ?? label)
      : determinate
        ? `${label ?? ""}, ${Math.round(fraction * 100)}%`
        : label;

  /* ---------------- status transitions ---------------- */

  const [transition, setTransition] = useState<Transition | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [anim] = useState(() => new Animated.Value(0));
  // The last committed render's surface. Refreshed by the effect after this
  // one, so when a status change lands here it still holds what was on screen
  // just before — the colours and the progress to animate away from.
  const previous = useRef({ status, colors, fillColor, fraction });

  useEffect(() => {
    const before = previous.current;
    if (before.status === status || reduceMotion) return;

    setTransition({
      from: before.colors,
      fromFill:
        before.status === "loading" && indicator === "fill"
          ? { color: before.fillColor, fraction: before.fraction }
          : undefined,
      reveal: status === "success" || status === "error",
      to: colors,
    });
    // Only a status change starts a transition; colours and progress are read
    // at that moment and must not restart it on their own.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    previous.current = { status, colors, fillColor, fraction };
  });

  useEffect(() => {
    if (!transition) return;
    anim.setValue(0);
    const animation = Animated.timing(anim, {
      toValue: 1,
      duration: transition.reveal ? 450 : 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start(({ finished }) => finished && setTransition(null));
    return () => animation.stop();
  }, [transition, anim]);

  /* ---------------- announcements ---------------- */

  const announcement = status === "idle" ? "" : (label ?? "");
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    // Web announces through the aria-live region rendered below; native has
    // no live region on iOS, so it is told directly.
    if (Platform.OS !== "web" && announcement) {
      AccessibilityInfo.announceForAccessibility(announcement);
    }
  }, [announcement]);

  /* ---------------- success timeout ---------------- */

  const onSuccessEndRef = useRef(onSuccessEnd);
  useEffect(() => {
    onSuccessEndRef.current = onSuccessEnd;
  });
  useEffect(() => {
    if (status !== "success" || !successDuration) return;
    const timer = setTimeout(
      () => onSuccessEndRef.current?.(),
      successDuration,
    );
    return () => clearTimeout(timer);
  }, [status, successDuration]);

  /* ---------------- drawing ---------------- */

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (width !== size.width || height !== size.height) {
      setSize({ width, height });
    }
  };

  const underlay = (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout}>
      {loading && indicator === "fill" && (
        <LinearProgress
          decorative
          progress={fraction}
          indeterminate={!determinate}
          height="100%"
          color={fillColor}
          // A transparent button has no surface to fill across: a faint track
          // shows where it ends, or a half-way fill reads as a cut-off button.
          trackColor={
            colors.bg === "transparent"
              ? (trackColor ?? rgba(colors.on, 0.06))
              : "transparent"
          }
          duration={duration}
        />
      )}
      {loading && indicator === "bar" && (
        <View style={styles.bar}>
          <LinearProgress
            decorative
            progress={fraction}
            indeterminate={!determinate}
            height={4}
            color={progressColor ?? colors.on}
            trackColor={trackColor ?? rgba(colors.on, 0.2)}
            duration={duration}
          />
        </View>
      )}
      {transition && (
        <TransitionLayer transition={transition} size={size} anim={anim} />
      )}
    </View>
  );

  return (
    <>
      <Button
        mode={mode}
        tone={toneOf(status)}
        iconName={icon}
        busy={loading}
        disabled={disabled}
        fullWidth={fullWidth}
        onPress={onPress}
        underlay={underlay}
        style={StyleSheet.flatten(style)}
        labelStyle={labelStyle}
        accessibilityLabel={a11yLabel}
        testID={testID}
      >
        {label}
      </Button>
      {Platform.OS === "web" && (
        <View aria-live="polite" style={styles.visuallyHidden}>
          <Text>{announcement}</Text>
        </View>
      )}
    </>
  );
};

/**
 * The previous status's surface, drawn over the new one and taken away: on
 * success and error the new colour grows out of the centre across it, the
 * Material reveal; otherwise it fades.
 */
const TransitionLayer = ({
  transition,
  size,
  anim,
}: {
  transition: Transition;
  size: { width: number; height: number };
  anim: Animated.Value;
}) => {
  const { from, fromFill, reveal, to } = transition;
  const diameter = Math.hypot(size.width, size.height);
  const revealColor = to.bg === "transparent" ? rgba(to.on, 0.16) : to.bg;

  // A reveal keeps the old surface fully opaque until the circle has covered
  // it, then drops it in the last fifth; a plain transition fades throughout.
  const opacity = anim.interpolate({
    inputRange: reveal ? [0, 0.8, 1] : [0, 1],
    outputRange: reveal ? [1, 1, 0] : [1, 0],
  });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: from.bg === "transparent" ? undefined : from.bg },
        ]}
      />
      {fromFill && (
        <View
          style={[
            styles.fillSnapshot,
            {
              width: `${fromFill.fraction * 100}%`,
              backgroundColor: fromFill.color,
            },
          ]}
        />
      )}
      {reveal && diameter > 0 && (
        <Animated.View
          style={{
            position: "absolute",
            width: diameter,
            height: diameter,
            left: (size.width - diameter) / 2,
            top: (size.height - diameter) / 2,
            borderRadius: diameter / 2,
            backgroundColor: revealColor,
            transform: [{ scale: anim }],
          }}
        />
      )}
    </Animated.View>
  );
};

export default ProgressButton;

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  fillSnapshot: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
  },
  // Out of sight but still in the accessibility tree, which `display: none`
  // would take the live region out of. Opacity does not; screen readers read
  // what is transparent.
  visuallyHidden: {
    position: "absolute",
    width: 1,
    height: 1,
    overflow: "hidden",
    opacity: 0,
  },
});
