import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  LayoutChangeEvent,
  useWindowDimensions,
} from "react-native";
import { useTheme, Theme } from "../providers/ThemeProvider";
import Portal, { usePortalHost } from "./Portal";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  disabled?: boolean;
  /** Auto-hide delay (ms) after long-press on native. */
  hideDelay?: number;
  /**
   * Hover dwell (ms) before the tip appears on web. Without it, sweeping the
   * pointer across a toolbar flashes every tooltip in the row.
   */
  enterDelay?: number;
  /** Grace period (ms) before the tip leaves on hover-out. */
  leaveDelay?: number;
}

const GAP = 8;

const Tooltip = ({
  content,
  children,
  position = "top",
  disabled,
  hideDelay = 1500,
  enterDelay = 500,
  leaveDelay = 100,
}: TooltipProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [visible, setVisible] = useState(false);
  const [anchorSize, setAnchorSize] = useState({ width: 0, height: 0 });
  const [tipSize, setTipSize] = useState({ width: 0, height: 0 });
  // Window coordinates of the anchor, only needed on the portalled path.
  const [anchorOrigin, setAnchorOrigin] = useState({ x: 0, y: 0 });
  const anchorRef = useRef<View>(null);
  const window = useWindowDimensions();
  const hasPortalHost = usePortalHost();
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (showTimer.current) clearTimeout(showTimer.current);
  }, []);

  // Timers outlive the component if the anchor unmounts mid-hover.
  useEffect(() => clearTimers, [clearTimers]);

  // Portalled, the tip is no longer a child of the anchor, so it has to be
  // placed in window coordinates rather than offsets from the wrapper.
  const measureAnchor = useCallback(() => {
    if (!hasPortalHost || !anchorRef.current) return;
    anchorRef.current.measureInWindow((x, y) => setAnchorOrigin({ x, y }));
  }, [hasPortalHost]);

  const show = useCallback(() => {
    if (disabled) return;
    clearTimers();
    measureAnchor();
    if (enterDelay <= 0) {
      setVisible(true);
      return;
    }
    showTimer.current = setTimeout(() => {
      // Re-measure at fire time: the page may have scrolled during the dwell.
      measureAnchor();
      setVisible(true);
    }, enterDelay);
  }, [disabled, enterDelay, clearTimers, measureAnchor]);

  const hide = useCallback(() => {
    clearTimers();
    if (leaveDelay <= 0) {
      setVisible(false);
      return;
    }
    hideTimer.current = setTimeout(() => setVisible(false), leaveDelay);
  }, [leaveDelay, clearTimers]);

  // Native: show on long press, then auto-hide
  const handleLongPress = useCallback(() => {
    if (disabled) return;
    clearTimers();
    measureAnchor();
    setVisible(true);
    hideTimer.current = setTimeout(() => setVisible(false), hideDelay);
  }, [disabled, hideDelay, clearTimers, measureAnchor]);

  const onAnchorLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setAnchorSize({ width, height });
  }, []);

  const onTipLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setTipSize({ width, height });
  }, []);

  const tipStyle = useMemo(() => {
    const centeredLeft = (anchorSize.width - tipSize.width) / 2;
    const centeredTop = (anchorSize.height - tipSize.height) / 2;

    let left: number;
    let top: number;
    switch (position) {
      case "bottom":
        left = centeredLeft;
        top = anchorSize.height + GAP;
        break;
      case "left":
        left = -(tipSize.width + GAP);
        top = centeredTop;
        break;
      case "right":
        left = anchorSize.width + GAP;
        top = centeredTop;
        break;
      case "top":
      default:
        left = centeredLeft;
        top = -(tipSize.height + GAP);
        break;
    }

    if (!hasPortalHost) return { left, top };

    // In the portal the offsets are absolute on the screen, so they also have
    // to be kept inside it — a tip on a screen-edge anchor would otherwise
    // hang off, which the anchor-relative path never had to handle.
    const margin = 8;
    const maxLeft = Math.max(margin, window.width - tipSize.width - margin);
    const maxTop = Math.max(margin, window.height - tipSize.height - margin);

    return {
      left: Math.min(Math.max(margin, anchorOrigin.x + left), maxLeft),
      top: Math.min(Math.max(margin, anchorOrigin.y + top), maxTop),
    };
  }, [
    position,
    anchorSize,
    tipSize,
    hasPortalHost,
    anchorOrigin,
    window.width,
    window.height,
  ]);

  const webHoverProps =
    Platform.OS === "web"
      ? { onHoverIn: show, onHoverOut: hide, onFocus: show, onBlur: hide }
      : { onLongPress: handleLongPress };

  const tip = (
    <View
      onLayout={onTipLayout}
      pointerEvents="none"
      style={[styles.tooltip, tipStyle, { opacity: tipSize.width > 0 ? 1 : 0 }]}
    >
      <Text
        style={[theme.typography.bodySmall, styles.tooltipText]}
        numberOfLines={2}
      >
        {content}
      </Text>
    </View>
  );

  return (
    <View style={styles.wrapper}>
      <Pressable
        ref={anchorRef}
        onLayout={onAnchorLayout}
        accessibilityLabel={content}
        {...webHoverProps}
      >
        {children}
      </Pressable>

      {/*
        A tooltip cannot use the native Modal the kit's other overlays use: it
        must never take touches. Portalled, it escapes an `overflow: hidden`
        parent and any sibling stacking context; with no host mounted it stays
        where it always was, positioned against the anchor.
      */}
      {visible && (hasPortalHost ? <Portal>{tip}</Portal> : tip)}
    </View>
  );
};

export default Tooltip;

const makeStyles: (theme: Theme) => StyleSheet.NamedStyles<any> = (
  theme: Theme,
) =>
  StyleSheet.create({
    wrapper: {
      alignSelf: "flex-start",
      position: "relative",
    },
    tooltip: {
      position: "absolute",
      backgroundColor: theme.colors.inverseSurface,
      borderRadius: 4,
      paddingHorizontal: 8,
      paddingVertical: 4,
      maxWidth: 220,
      zIndex: 1000,
      ...Platform.select({
        web: {
          boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
          // The tip is absolutely positioned inside a wrapper that is only as
          // wide as the anchor, so shrink-to-fit would collapse it to
          // min-content (one word per line). max-content sizes it to the text
          // and lets maxWidth above do the wrapping.
          width: "max-content" as any,
        },
        ios: {
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 6,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    tooltipText: {
      color: theme.colors.inverseOnSurface,
    },
  });
