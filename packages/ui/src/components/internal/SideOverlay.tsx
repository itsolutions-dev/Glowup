import React, { useEffect, useMemo, useState } from "react";
import {
  Animated,
  I18nManager,
  Modal as NativeModal,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { rgba } from "polished";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, Theme } from "../../providers/ThemeProvider";
import { useReduceMotion } from "./useReduceMotion";
import { useEscapeKey } from "./useEscapeKey";

export interface SideOverlayProps {
  visible: boolean;
  /** Scrim press, Android back and Escape. Omitted, the panel only closes via `visible`. */
  onDismiss?: () => void;
  /** The edge the panel slides in from, in reading direction. */
  side: "start" | "end";
  /** Panel width; capped at the window width. */
  width: number;
  /** Accessible name of the scrim, which dismisses on press. */
  scrimLabel: string;
  panelStyle?: StyleProp<ViewStyle>;
  testID?: string;
  children: React.ReactNode;
}

const DURATION = 250;
const noop = () => {};

/**
 * The part a modal navigation drawer and a modal side sheet share: a panel
 * that slides in from one edge over a scrim, closes on the scrim, the Android
 * back button and Escape on web, and stays mounted until its exit finishes.
 * Internal — NavigationDrawer and SideSheet are the public faces.
 */
const SideOverlay = ({
  visible,
  onDismiss,
  side,
  width,
  scrimLabel,
  panelStyle,
  testID,
  children,
}: SideOverlayProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const window = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const insets = useSafeAreaInsets();
  const panelWidth = Math.min(width, window.width);

  const [mounted, setMounted] = useState(visible);
  if (visible && !mounted) setMounted(true);

  // Width is not a dependency of the animation, so resizing the window while
  // the panel is open re-lays it out instead of replaying the entrance.
  const [progress] = useState(() => new Animated.Value(visible ? 1 : 0));
  const dismiss = onDismiss ?? noop;

  useEffect(() => {
    // Mounted closed there is nothing to animate: a drawer that is always
    // rendered must not start a timing run to the value it already holds.
    if (!visible && !mounted) return;
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration: reduceMotion ? 0 : DURATION,
      useNativeDriver: Platform.OS !== "web",
    }).start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
    // `mounted` is read, not a trigger: the run starts when `visible` changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, progress, reduceMotion]);

  // react-native's onRequestClose covers Android back, not Escape on web.
  useEscapeKey(visible, dismiss);

  // "start" is the left edge in LTR and the right edge in RTL.
  // react-native-web leaves `isRTL` undefined, hence the strict comparison.
  const fromLeft = (side === "start") !== (I18nManager.isRTL === true);
  const offscreen = (fromLeft ? -1 : 1) * panelWidth;
  const translateX = useMemo(
    () =>
      progress.interpolate({ inputRange: [0, 1], outputRange: [offscreen, 0] }),
    [progress, offscreen],
  );
  // The edge that faces the content is rounded (M3 modal drawer and sheet).
  const innerEdge = fromLeft
    ? {
        borderTopRightRadius: theme.shape.large,
        borderBottomRightRadius: theme.shape.large,
      }
    : {
        borderTopLeftRadius: theme.shape.large,
        borderBottomLeftRadius: theme.shape.large,
      };

  return (
    <NativeModal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={dismiss}
    >
      <View style={styles.root} testID={testID}>
        <Animated.View style={[styles.scrim, { opacity: progress }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={dismiss}
            accessibilityRole="button"
            accessibilityLabel={scrimLabel}
            testID={testID ? `${testID}-scrim` : undefined}
          />
        </Animated.View>
        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.panel,
            fromLeft ? { left: 0 } : { right: 0 },
            innerEdge,
            {
              width: panelWidth,
              paddingTop: insets.top,
              paddingBottom: insets.bottom,
              transform: [{ translateX }],
            },
            panelStyle,
          ]}
        >
          {children}
        </Animated.View>
      </View>
    </NativeModal>
  );
};

export default SideOverlay;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    root: { flex: 1 },
    scrim: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      // The M3 scrim role at 32%, as Modal uses.
      backgroundColor: rgba(theme.colors.scrim, 0.32),
    },
    panel: {
      position: "absolute",
      top: 0,
      bottom: 0,
      backgroundColor: theme.colors.surfaceContainerLow,
      overflow: "hidden",
    },
  });
