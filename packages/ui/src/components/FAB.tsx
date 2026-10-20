import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  LayoutChangeEvent,
  Platform,
  Pressable,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";
import Icons from "./Glyph";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, getGlowStyles } from "../providers/ThemeProvider";
import { useInteractionFeedback } from "../providers/InteractionFeedback";
import { useStateLayer } from "./TouchableRipple";
import { cornerStyle, type Corner } from "./internal/cornerPlacement";
import { MaterialCommunityIconsGlyphs, PressableState } from "./types";

export type FABSize = "small" | "medium" | "large";

/**
 * `icon` is the round, icon-only button. `extended` adds the label beside the
 * icon. `animated` is `extended` that collapses to the icon and back, driven
 * by `extended`.
 */
export type FABVariant = "icon" | "extended" | "animated";

type FABPosition = Corner;

/**
 * `floating` pins the button to a screen corner (the default). `inline` drops
 * the absolute positioning so the FAB can sit inside a toolbar, an AppBar row
 * or a Card action bar.
 */
type FABPlacement = "floating" | "inline";

export interface FABProps {
  icon: MaterialCommunityIconsGlyphs;
  /**
   * The text of `extended` and `animated`, and the accessible name of every
   * variant. Without it those two variants fall back to the icon alone.
   */
  label?: string;
  onClick: () => void;
  /** Defaults to `"icon"`. */
  variant?: FABVariant;
  /** Defaults to `"medium"`. */
  size?: FABSize;
  position?: FABPosition;
  placement?: FABPlacement;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /**
   * Report the press to `ThemeProvider`'s `onInteractionFeedback` (haptics).
   * Defaults to true.
   */
  feedback?: boolean;
  /**
   * `animated` only. `true` shows the label, `false` collapses to the icon.
   * Drive it from a scroll offset to get the M3 "shrink on scroll" behaviour.
   * Defaults to `true`.
   */
  extended?: boolean;
  /** `animated` only: edge the label grows from. Match it to the FAB's corner. */
  animateFrom?: "left" | "right";
  /**
   * `animated` only. `static` keeps the icon put and slides the label out
   * beside it; `dynamic` lets the icon travel with the label as the pill grows.
   */
  iconMode?: "static" | "dynamic";
  /** `animated` only: animation duration (ms). Defaults to 150. */
  duration?: number;
}

const METRICS = {
  small: { box: 40, radius: 12, icon: 24, padding: 16, labelGap: 8 },
  medium: { box: 56, radius: 16, icon: 24, padding: 20, labelGap: 12 },
  large: { box: 96, radius: 28, icon: 36, padding: 28, labelGap: 16 },
} as const;

const EXPANDED_PADDING = 16;

/**
 * The floating action button, in three variants: icon-only, with a label
 * (`extended`), or a label that folds into the icon while the user scrolls
 * (`animated`).
 *
 * ```tsx
 * const [extended, setExtended] = useState(true);
 *
 * <ScrollView
 *   onScroll={(e) => setExtended(e.nativeEvent.contentOffset.y <= 0)}
 *   scrollEventThrottle={16}
 * >
 *   …
 * </ScrollView>
 * <FAB variant="animated" icon="plus" label="New ticket" extended={extended} onClick={create} />
 * ```
 */
const FAB = (props: FABProps) =>
  props.variant === "animated" ? (
    <AnimatedFab {...props} />
  ) : (
    <StaticFab {...props} />
  );

export default FAB;

const StaticFab = ({
  icon,
  label,
  onClick,
  variant = "icon",
  size = "medium",
  position = "bottom-right",
  placement = "floating",
  disabled,
  style: customStyle,
  testID,
  feedback = true,
}: FABProps) => {
  const { theme } = useTheme();
  const emitFeedback = useInteractionFeedback(feedback);
  const insets = useSafeAreaInsets();
  const stateLayer = useStateLayer(
    theme.colors.primaryContainer,
    theme.colors.onPrimaryContainer,
  );

  const m = METRICS[size];
  const isExtended = variant === "extended" && !!label;

  return (
    <Pressable
      testID={testID}
      accessibilityLabel={label || `${icon} FAB`}
      accessibilityRole="button"
      disabled={disabled}
      accessibilityState={{ disabled }}
      onPress={() => {
        emitFeedback("press");
        onClick();
      }}
      style={(state: PressableState) => [
        styles.fabBase,
        placement === "floating" && styles.floating,
        isExtended
          ? {
              height: m.box,
              paddingHorizontal: m.padding,
              borderRadius: m.radius,
              flexDirection: "row",
            }
          : { width: m.box, height: m.box, borderRadius: m.radius },
        placement === "inline" ? null : cornerStyle(position, insets),
        // The M3 state layer, not a hex string with an alpha suffix glued on:
        // that only worked for 6-digit hex and skipped the press state.
        { backgroundColor: stateLayer(state, disabled) },
        (state.hovered || state.pressed) &&
          !disabled &&
          getGlowStyles(theme, true),
        disabled && styles.disabled,
        customStyle,
      ]}
    >
      <Icons
        name={icon}
        size={m.icon}
        color={theme.colors.onPrimaryContainer}
      />
      {isExtended && (
        <Text
          style={[
            size === "large"
              ? theme.typography.titleLarge
              : theme.typography.labelLarge,
            { color: theme.colors.onPrimaryContainer, marginLeft: m.labelGap },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
};

const AnimatedFab = ({
  icon,
  label,
  onClick,
  size = "medium",
  extended = true,
  animateFrom = "right",
  iconMode = "static",
  placement = "floating",
  position = "bottom-right",
  disabled = false,
  duration = 150,
  style,
  testID,
  feedback = true,
}: FABProps) => {
  const { theme } = useTheme();
  const emitFeedback = useInteractionFeedback(feedback);
  const insets = useSafeAreaInsets();
  const stateLayer = useStateLayer(
    theme.colors.primaryContainer,
    theme.colors.onPrimaryContainer,
  );
  const m = METRICS[size];
  const labelStyle =
    size === "large"
      ? theme.typography.titleLarge
      : theme.typography.labelLarge;

  // Lazy state, not a ref: the value is read during render to build the
  // interpolations, which is the repo's convention for Animated values.
  const [progress] = useState(() => new Animated.Value(extended ? 1 : 0));
  const [labelWidth, setLabelWidth] = useState(0);

  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      // `progress` was initialised from `extended`, so the first pass has
      // nothing to travel to; animating anyway just schedules a dead frame.
      isFirstRender.current = false;
      return;
    }
    Animated.timing(progress, {
      toValue: extended ? 1 : 0,
      duration,
      // Width is a layout property, so it cannot run on the native driver.
      useNativeDriver: false,
    }).start();
  }, [extended, duration, progress]);

  const onLabelLayout = useCallback((event: LayoutChangeEvent) => {
    setLabelWidth(event.nativeEvent.layout.width);
  }, []);

  const expandedWidth = m.box + labelWidth + EXPANDED_PADDING;

  // Until the label has been measured the pill would animate to a bogus width,
  // so hold it at the collapsed size for that first frame.
  const width = labelWidth
    ? progress.interpolate({
        inputRange: [0, 1],
        outputRange: [m.box, expandedWidth],
      })
    : m.box;

  const labelOpacity = progress.interpolate({
    // Fade in over the back half so the label does not smear across the growth.
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const growsFromRight = animateFrom === "right";

  const labelNode = !!label && (
    <Animated.Text
      numberOfLines={1}
      style={[
        labelStyle,
        styles.label,
        { color: theme.colors.onPrimaryContainer, opacity: labelOpacity },
      ]}
    >
      {label}
    </Animated.Text>
  );

  return (
    <Animated.View
      style={[
        styles.animatedWrapper,
        { height: m.box, borderRadius: m.radius },
        placement === "floating" && styles.floating,
        placement === "inline" ? null : cornerStyle(position, insets),
        { width },
        style,
      ]}
    >
      {/*
        Off-layout probe. The visible label lives inside a container whose
        width animates and clips, so measuring *it* would report a width that
        changes on every frame and feed back into the animation. This copy is
        absolutely positioned, so it lays out at the label's natural width
        regardless of the container, and is never painted or announced.
      */}
      {!!label && (
        <Text
          numberOfLines={1}
          onLayout={onLabelLayout}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[labelStyle, styles.probe]}
        >
          {label}
        </Text>
      )}

      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label || `${icon} FAB`}
        accessibilityState={{ disabled, expanded: extended }}
        disabled={disabled}
        onPress={() => {
          emitFeedback("press");
          onClick();
        }}
        style={(state: PressableState) => [
          styles.pressable,
          {
            backgroundColor: stateLayer(state, disabled),
            // The pill grows from one edge, so the content has to hug the
            // opposite one or the icon drifts as the width changes.
            justifyContent:
              iconMode === "dynamic"
                ? "center"
                : growsFromRight
                  ? "flex-start"
                  : "flex-end",
          },
          (state.hovered || state.pressed) &&
            !disabled &&
            getGlowStyles(theme, true),
          disabled && styles.disabled,
        ]}
      >
        {!growsFromRight && labelNode}

        <Icons
          name={icon}
          size={m.icon}
          color={theme.colors.onPrimaryContainer}
          // Centres the glyph in the collapsed circle.
          style={{ marginHorizontal: (m.box - m.icon) / 2 }}
        />

        {growsFromRight && labelNode}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fabBase: {
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
  },
  floating: {
    position: "absolute",
    zIndex: 99,
  },
  animatedWrapper: {
    overflow: "hidden",
    elevation: 6,
  },
  pressable: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    ...Platform.select({
      web: { cursor: "pointer" },
    }),
  },
  label: {
    // Never let the shrinking container squeeze the label: it should slide out
    // of the clip, not reflow.
    flexShrink: 0,
  },
  probe: {
    position: "absolute",
    top: 0,
    left: 0,
    opacity: 0,
  },
  disabled: {
    opacity: 0.38,
    elevation: 0,
  },
});
