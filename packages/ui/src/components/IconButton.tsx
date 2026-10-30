import React, { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  StyleProp,
  View,
  ViewStyle,
} from "react-native";
import Icons from "./Glyph";
import {
  useTheme,
  getStateColor,
  getFocusRing,
} from "../providers/ThemeProvider";
import { useInteractionFeedback } from "../providers/InteractionFeedback";
import CircularProgress from "./Progress/CircularProgress";
import Badge from "./Badge";
import Tooltip from "./Tooltip";
import { colorRoleTokens, type ColorRole } from "./internal/colorRole";
import { MaterialCommunityIconsGlyphs, PressableState } from "./types";
import { a11yState } from "./internal/a11yState";

export type IconButtonVariant = "standard" | "filled" | "tonal" | "outlined";
export type IconButtonSize = "small" | "medium" | "large";

const SIZES: Record<IconButtonSize, { box: number; icon: number }> = {
  small: { box: 32, icon: 18 },
  medium: { box: 40, icon: 22 },
  large: { box: 48, icon: 26 },
};

export interface IconButtonProps {
  icon: MaterialCommunityIconsGlyphs;
  onClick?: () => void;
  /** M3 icon-button container styles. Defaults to `"standard"`. */
  variant?: IconButtonVariant;
  /**
   * Colour role of the button. Left out, it keeps the neutral M3 look
   * (`onSurfaceVariant`, `primary` once selected).
   */
  color?: ColorRole;
  /**
   * A tooltip with this text: on hover or focus on the web, on long press on
   * native. It is a label for sighted users; `accessibilityLabel` stays the
   * accessible name.
   */
  title?: string;
  size?: IconButtonSize;
  /** Renders the M3 "selected" container of a toggle icon button. */
  selected?: boolean;
  /** A count on the top-right corner (a `Badge`). Hidden at 0 or when left out. */
  badge?: number;
  disabled?: boolean;
  loading?: boolean;
  /** Required: an icon alone carries no accessible name. */
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /**
   * Report the press (a toggle when `selected` is set) to `ThemeProvider`'s `onInteractionFeedback` (haptics).
   * Defaults to true.
   */
  feedback?: boolean;
}

/**
 * A square, icon-only action. `Button` with only an icon ends up pill-shaped
 * and label-padded, which is why this is its own component.
 */
const IconButton = ({
  icon,
  onClick,
  variant = "standard",
  color,
  title,
  size = "medium",
  selected,
  badge,
  disabled,
  loading,
  accessibilityLabel,
  style,
  testID,
  feedback = true,
}: IconButtonProps) => {
  const { theme } = useTheme();
  const emitFeedback = useInteractionFeedback(feedback);
  const { box, icon: iconSize } = SIZES[size];

  const { background, foreground, borderColor } = useMemo(() => {
    const role = color ? colorRoleTokens(theme, color) : undefined;
    switch (variant) {
      case "filled":
        if (role && selected !== false) {
          return {
            background: role.main,
            foreground: role.onMain,
            borderColor: undefined,
          };
        }
        return selected === false
          ? {
              background: theme.colors.surfaceContainerHighest,
              foreground: theme.colors.primary,
              borderColor: undefined,
            }
          : {
              background: theme.colors.primary,
              foreground: theme.colors.onPrimary,
              borderColor: undefined,
            };
      case "tonal":
        if (role && selected !== false) {
          return {
            background: role.container,
            foreground: role.onContainer,
            borderColor: undefined,
          };
        }
        return selected === false
          ? {
              background: theme.colors.surfaceContainerHighest,
              foreground: theme.colors.onSurfaceVariant,
              borderColor: undefined,
            }
          : {
              background: theme.colors.secondaryContainer,
              foreground: theme.colors.onSecondaryContainer,
              borderColor: undefined,
            };
      case "outlined":
        if (role) {
          return selected
            ? {
                background: role.main,
                foreground: role.onMain,
                borderColor: undefined,
              }
            : {
                background: "transparent",
                foreground: role.main,
                borderColor: role.main,
              };
        }
        return selected
          ? {
              background: theme.colors.onSurfaceVariant,
              foreground: theme.colors.surface,
              borderColor: undefined,
            }
          : {
              background: "transparent",
              foreground: theme.colors.onSurfaceVariant,
              borderColor: theme.colors.outline,
            };
      case "standard":
      default:
        return {
          background: "transparent",
          foreground: role
            ? role.main
            : selected
              ? theme.colors.primary
              : theme.colors.onSurfaceVariant,
          borderColor: undefined,
        };
    }
  }, [variant, color, selected, theme]);

  const isInteractive = !disabled && !loading;

  const button = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      {...a11yState(
        "button",
        { disabled: !!disabled, busy: !!loading, selected },
        badge ? { text: String(badge) } : undefined,
      )}
      disabled={!isInteractive}
      onPress={
        isInteractive && onClick
          ? () => {
              emitFeedback(selected === undefined ? "press" : "toggle");
              onClick();
            }
          : undefined
      }
      testID={testID}
      style={({ hovered, pressed, focused }: PressableState) => [
        styles.container,
        {
          width: box,
          height: box,
          borderRadius: box / 2,
          backgroundColor: pressed
            ? getStateColor(background, foreground, "press")
            : hovered
              ? getStateColor(background, foreground, "hover")
              : background,
        },
        borderColor && { borderWidth: 1, borderColor },
        focused && getFocusRing(theme),
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <CircularProgress size={iconSize} color={foreground} />
      ) : (
        <Icons name={icon} size={iconSize} color={foreground} />
      )}
      {!!badge && badge > 0 && (
        <View pointerEvents="none" style={styles.badge}>
          <Badge count={badge} style={{ right: 0 }} />
        </View>
      )}
    </Pressable>
  );

  return title ? (
    <Tooltip content={title} anchorAccessible={false}>
      {button}
    </Tooltip>
  ) : (
    button
  );
};

export default IconButton;

// No theme lookups here, so the sheet is created once instead of per theme.
const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  disabled: { opacity: 0.38 },
  // Inside the circle (the container clips what overflows it) and with a size
  // of its own, because the Badge is absolutely placed. A wide count grows to
  // the left from the corner.
  badge: { position: "absolute", top: 2, right: 2, width: 16, height: 16 },
});
