import React, { useContext, useEffect, useRef, useMemo, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Pressable,
  StyleSheet,
  View,
  Text,
  Platform,
} from "react-native";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { useTheme, Theme, getStateColor } from "../providers/ThemeProvider";
import Button from "./Button";
import Icons from "./Glyph";
import { colorRoleTokens } from "./internal/colorRole";
import {
  ALIGN,
  EDGE_GAP,
  NO_INSETS,
  SIDE_GAP,
  useInSnackbarStack,
} from "./internal/SnackbarStack";
import { MaterialCommunityIconsGlyphs, PressableState } from "./types";

/** What the message is about: it drives the colours and the default icon. */
export type SnackbarSeverity = "success" | "info" | "warning" | "error";
/** `"contained"` fills the snackbar; `"outlined"` draws it on the surface with an outline. */
export type SnackbarVariant = "contained" | "outlined";
export type SnackbarPosition =
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

const SEVERITY_ICONS: Record<SnackbarSeverity, MaterialCommunityIconsGlyphs> = {
  success: "check-circle",
  error: "alert-circle",
  warning: "alert",
  info: "information",
};

const HIDDEN_OFFSET = 100;

export interface SnackbarProps {
  /** Whether the snackbar is on screen. */
  visible: boolean;
  message: string;
  /**
   * Called when the snackbar times out (after `duration`) or its `action` is
   * clicked. Not called when `onClose` is set: the snackbar then stays up
   * until the user closes it.
   */
  onDismiss?: () => void;
  /**
   * Auto-hide delay in ms; `0` keeps it up. Defaults to 4000. Not used when
   * `onClose` is set.
   */
  duration?: number;
  /** A text button after the message. Clicking it runs `onClick`, then dismisses the snackbar. */
  action?: {
    label: string;
    onClick: () => void;
  };
  /**
   * Shows a close icon button and keeps the snackbar up until the user
   * closes it: `duration` is not used, and the timeout never calls
   * `onDismiss`.
   */
  onClose?: () => void;
  /**
   * What the message is about: `"success"` is green, `"info"` blue,
   * `"warning"` amber and `"error"` red, with a matching icon. Left out, the
   * snackbar is the neutral inverse surface, with no icon.
   */
  severity?: SnackbarSeverity;
  /** `"contained"` fills it with the severity's colours; `"outlined"` draws it on the surface with a severity-coloured outline, label and icon. Defaults to `"contained"`. */
  variant?: SnackbarVariant;
  /** Which edge and corner it sits in, clear of the safe-area insets. Defaults to `"bottom-center"`. */
  position?: SnackbarPosition;
  /** Overrides the icon implied by `severity`. */
  icon?: MaterialCommunityIconsGlyphs;
}

interface SnackbarColors {
  background: string;
  /** The message. */
  text: string;
  /** The icon. */
  icon: string;
  /** The action label. */
  action: string;
  border?: string;
}

const getColors = (
  theme: Theme,
  severity: SnackbarSeverity | undefined,
  variant: SnackbarVariant,
): SnackbarColors => {
  const c = theme.colors;
  if (severity) {
    const role = colorRoleTokens(theme, severity);
    return variant === "outlined"
      ? {
          background: c.surface,
          text: role.main,
          icon: role.main,
          action: role.main,
          border: role.main,
        }
      : {
          background: role.main,
          text: role.onMain,
          icon: role.onMain,
          action: role.onMain,
        };
  }
  return variant === "outlined"
    ? {
        background: c.surface,
        text: c.onSurface,
        icon: c.onSurfaceVariant,
        action: c.primary,
        border: c.outline,
      }
    : {
        background: c.inverseSurface,
        text: c.inverseOnSurface,
        icon: c.inverseOnSurface,
        action: c.inversePrimary,
      };
};

const Snackbar = ({
  visible,
  message,
  onDismiss,
  duration = 4000,
  action,
  onClose,
  severity,
  variant = "contained",
  position = "bottom-center",
  icon,
}: SnackbarProps) => {
  const { theme } = useTheme();
  const insets = useContext(SafeAreaInsetsContext) ?? NO_INSETS;
  // Under a ToastProvider's stack the stack owns the edge; this one is a row in it.
  const stacked = useInSnackbarStack();
  const [shouldRender, setShouldRender] = React.useState(visible);
  const [vertical, horizontal] = position.split("-") as [
    "top" | "bottom",
    "left" | "center" | "right",
  ];
  // It slides in from the edge it sits at.
  const hiddenOffset = vertical === "top" ? -HIDDEN_OFFSET : HIDDEN_OFFSET;
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [translateYAnim] = useState(() => new Animated.Value(hiddenOffset));
  const persistent = !!onClose;

  // Keep latest onDismiss without restarting the auto-hide timer on re-renders
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  // Mount the snackbar as soon as it becomes visible (render-time adjustment)
  if (visible && !shouldRender) {
    setShouldRender(true);
  }

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 40,
          friction: 8,
        }),
      ]).start();
    } else {
      // Hide animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: hiddenOffset,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShouldRender(false);
      });
    }
  }, [visible, hiddenOffset, fadeAnim, translateYAnim]);

  // iOS has no live region: VoiceOver hears the message only when told.
  useEffect(() => {
    if (visible && message && Platform.OS === "ios") {
      AccessibilityInfo.announceForAccessibility(message);
    }
  }, [visible, message]);

  // A snackbar with a close button waits for it; the others time out.
  useEffect(() => {
    if (!visible || persistent || duration <= 0) return;
    const timer = setTimeout(() => onDismissRef.current?.(), duration);
    return () => clearTimeout(timer);
  }, [visible, persistent, duration]);

  const colors = useMemo(
    () => getColors(theme, severity, variant),
    [theme, severity, variant],
  );
  const styles = useMemo(() => makeStyles(theme, colors), [theme, colors]);

  if (!shouldRender) return null;

  const iconName = icon ?? (severity ? SEVERITY_ICONS[severity] : undefined);
  const edge =
    vertical === "top"
      ? { top: EDGE_GAP + insets.top }
      : { bottom: EDGE_GAP + insets.bottom };

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      // The row spans the window so the snackbar can sit at either side; only
      // the snackbar itself takes touches.
      pointerEvents="box-none"
      style={[
        styles.container,
        stacked
          ? styles.stacked
          : {
              ...edge,
              left: SIDE_GAP + insets.left,
              right: SIDE_GAP + insets.right,
            },
        {
          alignItems: ALIGN[horizontal],
          opacity: fadeAnim,
          transform: [{ translateY: translateYAnim }],
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.messageRow}>
          {!!iconName && (
            <Icons
              name={iconName}
              size={20}
              color={colors.icon}
              style={styles.leadingIcon}
            />
          )}
          <Text
            style={[theme.typography.bodyMedium, styles.messageText]}
            numberOfLines={2}
          >
            {message}
          </Text>
        </View>

        {action && (
          <Button
            variant="text"
            onClick={() => {
              action.onClick();
              (onClose ?? onDismiss)?.();
            }}
            style={styles.actionButton}
            labelStyle={{ color: colors.action }}
          >
            {action.label}
          </Button>
        )}

        {onClose && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            style={({ hovered, pressed }: PressableState) => [
              styles.closeButton,
              (pressed || hovered) && {
                backgroundColor: getStateColor(
                  colors.background,
                  colors.text,
                  pressed ? "press" : "hover",
                ),
              },
            ]}
          >
            <Icons name="close" size={18} color={colors.icon} />
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
};

const makeStyles = (theme: Theme, colors: SnackbarColors) =>
  StyleSheet.create({
    container: {
      position: "absolute",
      zIndex: 1000,
      justifyContent: "center",
    },
    stacked: {
      position: "relative",
      alignSelf: "stretch",
    },
    content: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.background,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: theme.shape.medium,
      minHeight: 48,
      width: "100%",
      maxWidth: 600, // For tablet/web
      ...(colors.border
        ? { borderWidth: 1.5, borderColor: colors.border }
        : null),
      ...Platform.select({
        web: {
          userSelect: "none",
          boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        },
        ios: {
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 12,
        },
        android: { elevation: 6 },
      }),
    } as any,
    messageRow: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    messageText: {
      color: colors.text,
      flex: 1,
    },
    leadingIcon: {
      marginRight: 12,
    },
    actionButton: {
      marginLeft: 8,
      paddingVertical: 6,
      paddingHorizontal: 12,
      minHeight: 32,
    },
    closeButton: {
      width: 32,
      height: 32,
      marginLeft: 4,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      ...Platform.select({ web: { cursor: "pointer" } }),
    } as any,
  });

export default Snackbar;
