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
import Button from "./Button";
import { useEscapeKey } from "./internal/useEscapeKey";

export interface TooltipProps {
  /** The tip's text; the body text of a rich tooltip. */
  content: string;
  /**
   * `"plain"` is the one-line label for an icon-only control. `"rich"` adds a
   * `title` and an `action`, for context a label cannot carry. Defaults to
   * `"plain"`.
   */
  variant?: "plain" | "rich";
  /** Rich only: the subhead. */
  title?: string;
  /**
   * Rich only: a text button. A rich tooltip with an action stays open while
   * the pointer is over it (web) and until the action is taken or the anchor
   * is long-pressed again (native).
   */
  action?: { label: string; onPress: () => void };
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
  variant = "plain",
  title,
  action,
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
  const rich = variant === "rich";
  // A tip with something to press has to stay long enough to be pressed.
  const persistent = rich && !!action;
  // A persistent tip renders inline, right after its anchor, so Tab moves from
  // the anchor into the action; a portalled tip sits at the end of the page.
  const portalled = hasPortalHost && !persistent;
  const tipRef = useRef<View>(null);
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
    if (!portalled || !anchorRef.current) return;
    anchorRef.current.measureInWindow((x, y) => setAnchorOrigin({ x, y }));
  }, [portalled]);

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
    const close = () => {
      // Focus moved from the anchor into the tip's action: keep it open.
      const tip = tipRef.current as unknown as HTMLElement | null;
      if (
        persistent &&
        Platform.OS === "web" &&
        tip?.contains(document.activeElement)
      ) {
        return;
      }
      setVisible(false);
    };
    if (leaveDelay <= 0) {
      close();
      return;
    }
    hideTimer.current = setTimeout(close, leaveDelay);
  }, [leaveDelay, clearTimers, persistent]);

  // A persistent tip is dismissed with Escape as well as by leaving it.
  useEscapeKey(visible && persistent, () => setVisible(false));

  // Native: show on long press, then auto-hide — or toggle, when persistent.
  const handleLongPress = useCallback(() => {
    if (disabled) return;
    clearTimers();
    measureAnchor();
    if (persistent) {
      setVisible((open) => !open);
      return;
    }
    setVisible(true);
    hideTimer.current = setTimeout(() => setVisible(false), hideDelay);
  }, [disabled, hideDelay, clearTimers, measureAnchor, persistent]);

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

    if (!portalled) return { left, top };

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
    portalled,
    anchorOrigin,
    window.width,
    window.height,
  ]);

  // Web listens on a plain View, not a Pressable: react-native-web does not
  // deliver hover or focus to a Pressable whose child is itself pressable (a
  // Button, an IconButton — the usual anchor), so the tip never opened on hover
  // and opened on focus only when the wrapper itself, an extra tab stop, took
  // it. Pointer enter/leave fire once per boundary crossing, and focus/blur
  // bubble up from the child.
  const webAnchorProps = {
    onPointerEnter: show,
    onPointerLeave: hide,
    onFocus: show,
    onBlur: hide,
  };

  const tip = rich ? (
    <View
      ref={tipRef}
      onLayout={onTipLayout}
      role="tooltip"
      // Over the tip counts as over the anchor, or the pointer could never
      // reach the action; focus leaving the action closes it like the pointer.
      onPointerEnter={clearTimers}
      onPointerLeave={hide}
      onBlur={hide}
      pointerEvents={persistent ? "auto" : "none"}
      style={[
        styles.tooltip,
        styles.rich,
        tipStyle,
        { opacity: tipSize.width > 0 ? 1 : 0 },
      ]}
    >
      {!!title && (
        <Text style={[theme.typography.titleSmall, styles.richText]}>
          {title}
        </Text>
      )}
      <Text style={[theme.typography.bodyMedium, styles.richText]}>
        {content}
      </Text>
      {action && (
        <View style={styles.richActions}>
          <Button
            mode="text"
            onPress={() => {
              setVisible(false);
              action.onPress();
            }}
          >
            {action.label}
          </Button>
        </View>
      )}
    </View>
  ) : (
    <View
      onLayout={onTipLayout}
      role="tooltip"
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
      {Platform.OS === "web" ? (
        <View ref={anchorRef} onLayout={onAnchorLayout} {...webAnchorProps}>
          {children}
        </View>
      ) : (
        <Pressable
          ref={anchorRef}
          onLayout={onAnchorLayout}
          accessibilityLabel={title ? `${title}. ${content}` : content}
          onLongPress={handleLongPress}
        >
          {children}
        </Pressable>
      )}

      {/*
        A tooltip cannot use the native Modal the kit's other overlays use: it
        must never take touches. Portalled, it escapes an `overflow: hidden`
        parent and any sibling stacking context; with no host mounted it stays
        where it always was, positioned against the anchor.
      */}
      {visible && (portalled ? <Portal>{tip}</Portal> : tip)}
    </View>
  );
};

export default Tooltip;

const makeStyles = (theme: Theme) =>
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
    // M3 rich tooltip: surfaceContainer, medium corners, up to 312dp wide.
    rich: {
      backgroundColor: theme.colors.surfaceContainer,
      borderRadius: theme.shape.medium,
      paddingHorizontal: theme.spacing.m,
      paddingTop: theme.spacing.s + theme.spacing.xs,
      paddingBottom: theme.spacing.s,
      maxWidth: 312,
      gap: theme.spacing.xs,
    },
    richText: { color: theme.colors.onSurfaceVariant },
    richActions: {
      flexDirection: "row",
      marginStart: -theme.spacing.s - theme.spacing.xs,
    },
  });
