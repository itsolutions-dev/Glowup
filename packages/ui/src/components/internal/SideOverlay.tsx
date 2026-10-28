import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Modal as NativeModal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import type { LayoutChangeEvent, StyleProp, ViewStyle } from "react-native";
import { rgba } from "polished";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, Theme } from "../../providers/ThemeProvider";
import { useReduceMotion } from "./useReduceMotion";
import { useWindowWidth } from "./useWindowWidth";

/** The window edge an overlay panel is attached to. */
export type OverlayPosition = "left" | "right" | "top" | "bottom";

export interface SideOverlayProps {
  visible: boolean;
  /**
   * Scrim press, Android back, Escape and a closing drag. Omitted, the panel
   * only closes via `visible`.
   */
  onClose?: () => void;
  /** The edge the panel slides in from. */
  position: OverlayPosition;
  /** Left and right: the panel width, capped at the window width. */
  width: number;
  /** Top and bottom: the largest height, capped at the window height. */
  height: number;
  /** Accessible name of the scrim, which closes on press. */
  scrimLabel: string;
  /** Whether a drag toward the edge closes the panel. Defaults to `true`. */
  swipeable?: boolean;
  panelStyle?: StyleProp<ViewStyle>;
  testID?: string;
  children: React.ReactNode;
}

const DURATION = 250;
const noop = () => {};
// A drag has to travel this far (px) before it claims the gesture: a tap or a
// scroll that wobbles must still reach the panel's content.
const DRAG_SLOP = 8;
// Past this fraction of the panel, or a flick faster than FLICK (px/ms), the
// release closes it; short of that it springs back.
const CLOSE_FRACTION = 0.3;
const FLICK = 0.5;

/** How far a gesture has moved toward the panel's own edge (negative: away). */
const towardEdge = (position: OverlayPosition, dx: number, dy: number) => {
  switch (position) {
    case "left":
      return -dx;
    case "right":
      return dx;
    case "top":
      return -dy;
    default:
      return dy;
  }
};

/**
 * The part of a swipeable drawer: a panel that slides in from one edge over a
 * scrim, closes on the scrim, the Android back button, Escape on web and a drag
 * toward its edge, and stays mounted until its exit finishes. Internal — Drawer
 * is the public face.
 */
const SideOverlay = ({
  visible,
  onClose,
  position,
  width,
  height,
  scrimLabel,
  swipeable = true,
  panelStyle,
  testID,
  children,
}: SideOverlayProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const windowWidth = useWindowWidth();
  const window = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const insets = useSafeAreaInsets();
  const horizontal = position === "left" || position === "right";
  // Zero is what a prerendered page reports before it hydrates.
  const panelWidth = windowWidth > 0 ? Math.min(width, windowWidth) : width;
  const maxHeight = Math.min(height, window.height);

  // A top or bottom panel is as tall as its content, so how far it travels is
  // measured; until then it travels its largest height.
  const [measured, setMeasured] = useState<number | null>(null);
  const extent = horizontal
    ? panelWidth
    : Math.min(measured ?? maxHeight, maxHeight);

  const [mounted, setMounted] = useState(visible);
  if (visible && !mounted) setMounted(true);

  // Width is not a dependency of the animation, so resizing the window while
  // the panel is open re-lays it out instead of replaying the entrance. A drag
  // scrubs this same value, so the scrim follows the panel.
  const [progress] = useState(() => new Animated.Value(visible ? 1 : 0));
  const dismiss = onClose ?? noop;
  const duration = reduceMotion ? 0 : DURATION;

  useEffect(() => {
    // Mounted closed there is nothing to animate: a drawer that is always
    // rendered must not start a timing run to the value it already holds.
    if (!visible && !mounted) return;
    Animated.timing(progress, {
      toValue: visible ? 1 : 0,
      duration,
      useNativeDriver: Platform.OS !== "web",
    }).start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
    // `mounted` is read, not a trigger: the run starts when `visible` changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, progress, reduceMotion]);

  // What the drag handlers read: they outlive the render that made them.
  const live = useRef({ extent, dismiss, duration });
  useEffect(() => {
    live.current = { extent, dismiss, duration };
  });

  const springBack = () =>
    Animated.timing(progress, {
      toValue: 1,
      duration: live.current.duration,
      useNativeDriver: Platform.OS !== "web",
    }).start();

  // A drag that closed the panel asks the parent to flip `visible`. If the
  // parent does not (it ignores `onClose`), the panel must not stay half open:
  // this effect runs in the commit that carries the parent's answer, so
  // `visible` is already false when it did close.
  const [dragCloses, setDragCloses] = useState(0);
  useEffect(() => {
    if (dragCloses > 0 && visible) springBack();
    // Only a new drag-close is a trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragCloses]);

  const pan = useMemo(() => {
    const travel = (dx: number, dy: number) =>
      Math.max(0, Math.min(live.current.extent, towardEdge(position, dx, dy)));
    // The handlers only read `live` when a touch event fires, never during render.
    // eslint-disable-next-line react-hooks/refs
    return PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => {
        const toward = towardEdge(position, g.dx, g.dy);
        const across = horizontal ? g.dy : g.dx;
        return toward > DRAG_SLOP && toward > 2 * Math.abs(across);
      },
      onPanResponderGrant: () => progress.stopAnimation(),
      onPanResponderMove: (_, g) => {
        const { extent: size } = live.current;
        if (size > 0) progress.setValue(1 - travel(g.dx, g.dy) / size);
      },
      onPanResponderRelease: (_, g) => {
        const { extent: size, dismiss: close } = live.current;
        const moved = travel(g.dx, g.dy);
        const speed = towardEdge(position, g.vx, g.vy);
        if (moved > size * CLOSE_FRACTION || (speed > FLICK && moved > 0)) {
          close();
          setDragCloses((n) => n + 1);
        } else {
          springBack();
        }
      },
      onPanResponderTerminate: () => springBack(),
    });
    // The handlers read the latest values through `live`; `springBack` only
    // touches `progress` and `live`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position, horizontal, progress]);

  const offscreen =
    (position === "left" || position === "top" ? -1 : 1) * extent;
  const translate = useMemo(
    () =>
      progress.interpolate({ inputRange: [0, 1], outputRange: [offscreen, 0] }),
    [progress, offscreen],
  );

  // The edge that faces the content is rounded (M3 modal drawer and sheet).
  const r = theme.shape.large;
  const innerEdge: ViewStyle = {
    left: { borderTopRightRadius: r, borderBottomRightRadius: r },
    right: { borderTopLeftRadius: r, borderBottomLeftRadius: r },
    top: { borderBottomLeftRadius: r, borderBottomRightRadius: r },
    bottom: { borderTopLeftRadius: r, borderTopRightRadius: r },
  }[position];

  const placement: ViewStyle = horizontal
    ? {
        top: 0,
        bottom: 0,
        ...(position === "left" ? { left: 0 } : { right: 0 }),
        width: panelWidth,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }
    : {
        left: 0,
        right: 0,
        maxHeight,
        ...(position === "top"
          ? { top: 0, paddingTop: insets.top }
          : { bottom: 0, paddingBottom: insets.bottom }),
      };

  const onLayout = horizontal
    ? undefined
    : (e: LayoutChangeEvent) => setMeasured(e.nativeEvent.layout.height);

  // Content scrolls and taps, so a top or bottom panel is dragged by a handle on
  // its inner edge; a side panel by its whole body (vertical drags stay the
  // content's).
  const handle = swipeable && !horizontal && (
    <View
      {...pan.panHandlers}
      style={styles.handleArea}
      testID={testID ? `${testID}-handle` : undefined}
    >
      <View style={styles.handle} />
    </View>
  );

  return (
    <NativeModal
      visible={mounted}
      transparent
      animationType="none"
      // Android back and, on the web, Escape: react-native-web's Modal calls it
      // for the topmost modal only, so no key listener of our own.
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
          onLayout={onLayout}
          testID={testID ? `${testID}-panel` : undefined}
          {...(swipeable && horizontal ? pan.panHandlers : null)}
          style={[
            styles.panel,
            horizontal && styles.panelSwipeX,
            innerEdge,
            placement,
            {
              transform: [
                horizontal
                  ? { translateX: translate }
                  : { translateY: translate },
              ],
            },
            panelStyle,
          ]}
        >
          {position === "bottom" && handle}
          {children}
          {position === "top" && handle}
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
      // The M3 scrim role at 32%, as Dialog uses.
      backgroundColor: rgba(theme.colors.scrim, 0.32),
    },
    panel: {
      position: "absolute",
      backgroundColor: theme.colors.surfaceContainerLow,
      overflow: "hidden",
    },
    // Lets the browser keep vertical touch scrolling while a horizontal drag
    // is ours.
    panelSwipeX: {
      ...(Platform.select({ web: { touchAction: "pan-y" } }) as ViewStyle),
    },
    handleArea: {
      alignItems: "center",
      paddingVertical: theme.spacing.s + theme.spacing.xs,
      ...Platform.select({
        web: { cursor: "grab" as never, touchAction: "none" as never },
      }),
    },
    handle: {
      width: 32,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.colors.onSurfaceVariant,
      opacity: 0.4,
    },
  });
