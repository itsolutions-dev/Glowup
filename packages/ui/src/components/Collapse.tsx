import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Animated,
  Easing,
  LayoutChangeEvent,
  Platform,
  StyleProp,
  ViewStyle,
} from "react-native";

export interface CollapseProps {
  children: React.ReactNode;
  /** Whether the content is expanded. */
  open: boolean;
  /** Transition length in ms. Defaults to 200. */
  duration?: number;
  /** Height kept visible while collapsed — a peek/teaser. Defaults to 0. */
  collapsedHeight?: number;
  /** Fades the content along with the height change. Defaults to `true`. */
  animateOpacity?: boolean;
  /** Skips unmounting the children while collapsed. Defaults to `false`. */
  keepMounted?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Animates its children between `collapsedHeight` and their natural height.
 * The content is measured once per layout pass, so it adapts to text reflow
 * instead of needing a hardcoded height.
 */
const Collapse = ({
  children,
  open,
  duration = 200,
  collapsedHeight = 0,
  animateOpacity = true,
  keepMounted = false,
  style,
  testID,
}: CollapseProps) => {
  const [contentHeight, setContentHeight] = useState<number | null>(null);
  // Held in state rather than a ref: the value is read during render to build
  // the interpolation, which refs are not meant for.
  const [progress] = useState(() => new Animated.Value(open ? 1 : 0));
  // Skips the opening animation on first render, so an initially-open Collapse
  // does not slide in on mount.
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!hasAnimated.current) {
      hasAnimated.current = true;
      progress.setValue(open ? 1 : 0);
      return;
    }
    Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration,
      easing: Easing.out(Easing.cubic),
      // Height is not a transform, so it cannot run on the UI thread.
      useNativeDriver: false,
    }).start();
  }, [open, duration, progress]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const measured = event.nativeEvent.layout.height;
    setContentHeight((current) => (current === measured ? current : measured));
  };

  const height =
    contentHeight === null
      ? undefined
      : progress.interpolate({
          inputRange: [0, 1],
          outputRange: [
            collapsedHeight,
            Math.max(collapsedHeight, contentHeight),
          ],
        });

  const shouldRenderChildren = open || keepMounted || collapsedHeight > 0;

  return (
    <Animated.View
      testID={testID}
      style={[
        // Until the first measurement lands, keep a collapsed box on native so
        // the content cannot flash at full height.
        contentHeight === null
          ? { height: open ? undefined : collapsedHeight }
          : { height },
        { overflow: "hidden" },
        animateOpacity && { opacity: progress },
        style,
      ]}
      // Hide collapsed content from assistive tech and from tab order on web.
      accessibilityElementsHidden={!open}
      importantForAccessibility={open ? "auto" : "no-hide-descendants"}
      {...(Platform.OS === "web" ? { "aria-hidden": !open } : null)}
    >
      <View onLayout={handleLayout}>
        {shouldRenderChildren ? children : null}
      </View>
    </Animated.View>
  );
};

export default Collapse;
