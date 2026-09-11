import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  ViewStyle,
} from "react-native";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getGlowStyles, useTheme } from "../providers/ThemeProvider";
import { useStateLayer } from "./TouchableRipple";
import { MaterialCommunityIconsGlyphs, PressableState } from "./types";

type AnimatedFABPosition =
  "bottom-right" | "bottom-left" | "top-right" | "top-left";

export interface AnimatedFABProps {
  icon: MaterialCommunityIconsGlyphs;
  /** Always required: it is the label that animates. */
  label: string;
  onPress: () => void;
  /**
   * `true` shows the label, `false` collapses to the icon. Drive it from a
   * scroll offset to get the M3 "shrink on scroll" behaviour.
   */
  extended?: boolean;
  /** Edge the label grows from. Match it to the FAB's own corner. */
  animateFrom?: "left" | "right";
  /**
   * `static` keeps the icon put and slides the label out beside it.
   * `dynamic` lets the icon travel with the label as the pill grows.
   */
  iconMode?: "static" | "dynamic";
  /** `inline` drops the absolute positioning (toolbar, card action row). */
  placement?: "floating" | "inline";
  position?: AnimatedFABPosition;
  disabled?: boolean;
  /** Animation duration (ms). */
  duration?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const COLLAPSED_SIZE = 56;
const ICON_SIZE = 24;
const HORIZONTAL_PADDING = 16;

/**
 * A FAB that animates between an icon-only circle and a labelled pill.
 *
 * The point is the transition: a list screen shows the extended FAB at rest and
 * collapses it while the user scrolls, so the action stays reachable without
 * covering content.
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
 * <AnimatedFAB icon="plus" label="New ticket" extended={extended} onPress={create} />
 * ```
 */
const AnimatedFAB = ({
  icon,
  label,
  onPress,
  extended = true,
  animateFrom = "right",
  iconMode = "static",
  placement = "floating",
  position = "bottom-right",
  disabled = false,
  duration = 150,
  style,
  testID,
}: AnimatedFABProps) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const stateLayer = useStateLayer(
    theme.colors.primaryContainer,
    theme.colors.onPrimaryContainer,
  );

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

  const expandedWidth = COLLAPSED_SIZE + labelWidth + HORIZONTAL_PADDING;

  // Until the label has been measured the pill would animate to a bogus width,
  // so hold it at the collapsed size for that first frame.
  const width = labelWidth
    ? progress.interpolate({
        inputRange: [0, 1],
        outputRange: [COLLAPSED_SIZE, expandedWidth],
      })
    : COLLAPSED_SIZE;

  const labelOpacity = progress.interpolate({
    // Fade in over the back half so the label does not smear across the growth.
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const positionStyle = useCallback((): ViewStyle | null => {
    if (placement === "inline") return null;

    const margin = 16;
    const placed: ViewStyle = { position: "absolute" };

    if (position.startsWith("top")) placed.top = insets.top + margin;
    else placed.bottom = insets.bottom + margin;

    if (position.endsWith("right")) placed.right = insets.right + margin;
    else placed.left = insets.left + margin;

    return placed;
  }, [placement, position, insets]);

  const growsFromRight = animateFrom === "right";

  return (
    <Animated.View
      style={[
        styles.wrapper,
        placement === "floating" && styles.floating,
        positionStyle(),
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
      <Text
        numberOfLines={1}
        onLayout={onLabelLayout}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[theme.typography.labelLarge, styles.probe]}
      >
        {label}
      </Text>

      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled, expanded: extended }}
        disabled={disabled}
        onPress={onPress}
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
        {!growsFromRight && (
          <Animated.Text
            numberOfLines={1}
            style={[
              theme.typography.labelLarge,
              styles.label,
              { color: theme.colors.onPrimaryContainer, opacity: labelOpacity },
            ]}
          >
            {label}
          </Animated.Text>
        )}

        <Icons
          name={icon}
          size={ICON_SIZE}
          color={theme.colors.onPrimaryContainer}
          style={styles.icon}
        />

        {growsFromRight && (
          <Animated.Text
            numberOfLines={1}
            style={[
              theme.typography.labelLarge,
              styles.label,
              { color: theme.colors.onPrimaryContainer, opacity: labelOpacity },
            ]}
          >
            {label}
          </Animated.Text>
        )}
      </Pressable>
    </Animated.View>
  );
};

export default AnimatedFAB;

const styles = StyleSheet.create({
  wrapper: {
    height: COLLAPSED_SIZE,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 6,
  },
  floating: {
    position: "absolute",
    zIndex: 99,
  },
  pressable: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    ...Platform.select({
      web: { cursor: "pointer" },
    }),
  },
  icon: {
    // Centres the glyph in the collapsed circle: (56 - 24) / 2.
    marginHorizontal: (COLLAPSED_SIZE - ICON_SIZE) / 2,
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
  },
});
