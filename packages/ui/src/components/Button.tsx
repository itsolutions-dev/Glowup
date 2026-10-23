import { useMemo } from "react";
import {
  useTheme,
  Theme,
  getStateColor,
  getFocusRing,
} from "../providers/ThemeProvider";

import {
  Pressable,
  Text,
  View,
  StyleSheet,
  Platform,
  type StyleProp,
  type TextStyle,
} from "react-native";
import Icons from "./Glyph";
import CircularProgress from "./Progress/CircularProgress";
import { useInteractionFeedback } from "../providers/InteractionFeedback";
import { MaterialCommunityIconsGlyphs, PressableState } from "./types";
import { useDensity, type Density } from "../providers/Density";
import Badge from "./Badge";
import { colorRoleTokens, type ColorRole } from "./internal/colorRole";
import { useFormDisabled, useFormSubmit, useFormSubmitting } from "./Form";

export type ButtonVariant = "filled" | "tonal" | "outlined" | "text";
export type ButtonColor = ColorRole;

/** The colours a button resolves to for a variant and a colour. */
export interface ButtonColors {
  /** Surface fill; `"transparent"` for outlined and text. */
  bg: string;
  /** Label and icon colour. */
  on: string;
  /** Outline colour, outlined variant only. */
  border?: string;
  /** What a state layer is drawn over: `bg`, or `surface` for the transparent variants. */
  underlay: string;
}

/**
 * Resolves a variant and a colour to colours, exactly as `Button` paints them.
 * Exported for components built on `Button` that draw inside its surface.
 */
export const getButtonColors = (
  theme: Theme,
  variant: ButtonVariant,
  color: ButtonColor,
): ButtonColors => {
  const { colors } = theme;
  const role = colorRoleTokens(theme, color);
  // The primary tonal button sits on the secondary container, as in M3.
  const [accent, onAccent, container, onContainer] =
    color === "primary"
      ? [
          colors.primary,
          colors.onPrimary,
          colors.secondaryContainer,
          colors.onSecondaryContainer,
        ]
      : [role.main, role.onMain, role.container, role.onContainer];

  const surface = theme.colors.surface;
  switch (variant) {
    case "tonal":
      return { bg: container, on: onContainer, underlay: container };
    case "outlined":
      return {
        bg: "transparent",
        on: accent,
        border: color === "primary" ? theme.colors.outline : accent,
        underlay: surface,
      };
    case "text":
      return { bg: "transparent", on: accent, underlay: surface };
    case "filled":
    default:
      return { bg: accent, on: onAccent, underlay: accent };
  }
};

export interface ButtonProps {
  onClick?: () => void;
  iconName?: MaterialCommunityIconsGlyphs;
  size?: number;
  variant?: ButtonVariant;
  /**
   * Colour role. `error` is the destructive treatment (delete, discard);
   * `success`, `warning`, `info` and `neutral` come from fixed hues kept off
   * the seed.
   */
  color?: ButtonColor;
  style?: object;
  iconStyle?: object;
  disabled?: boolean;
  loading?: boolean;
  /**
   * Blocks presses and announces the button as busy, but — unlike `loading` —
   * keeps the label, the icon and the full-strength colours on screen.
   */
  busy?: boolean;
  /**
   * Drawn behind the label across the whole surface, clipped to its shape:
   * a progress fill, a state animation. It receives no touches.
   */
  underlay?: React.ReactNode;
  /** Applied to the label text, after the theme's type style. */
  labelStyle?: StyleProp<TextStyle>;
  /**
   * Control height. `"dense"` is for desktop forms and tables: about 36 px
   * instead of 48.
   */
  density?: Density;
  /**
   * A count shown after the label (a `Badge`): active filters, unread items.
   * Hidden at 0 or when left out.
   */
  badge?: number;
  /** Stretch to fill the parent width. */
  fullWidth?: boolean;
  /** Icon side relative to the label. */
  iconPosition?: "start" | "end";
  /**
   * `"submit"` submits the enclosing `Form` when pressed, after `onClick`, on
   * every platform. While the form submits (an async `onSubmit` or validator
   * is running) it shows `loading`, and it is `disabled` with the form. A
   * button outside a `Form` ignores it. Defaults to `"button"`.
   */
  type?: "button" | "submit";
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  /**
   * Report the press to `ThemeProvider`'s `onInteractionFeedback` (haptics).
   * Defaults to true.
   */
  feedback?: boolean;
  children?: React.ReactNode;
}

const noop = () => {};

const Button = ({
  onClick,
  iconName,
  size,
  variant = "filled",
  color = "primary",
  disabled = false,
  style = {},
  iconStyle = {},
  loading = false,
  busy = false,
  underlay,
  labelStyle,
  fullWidth = false,
  density,
  badge,
  iconPosition = "start",
  type = "button",
  accessibilityLabel,
  accessibilityHint,
  testID,
  feedback = true,
  children,
}: ButtonProps) => {
  const { theme } = useTheme();
  const formSubmit = useFormSubmit();
  const submit = type === "submit" ? formSubmit : undefined;
  // A submit button follows its Form: spinning and unresponsive while a
  // submission runs, disabled with the form.
  const submitting = useFormSubmitting();
  const formDisabled = useFormDisabled();
  const isLoading = loading || (type === "submit" && submitting);
  const isDisabled = disabled || (type === "submit" && formDisabled);
  const dense = useDensity(density) === "dense";
  const emitFeedback = useInteractionFeedback(feedback);
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const {
    bg,
    on,
    border,
    underlay: stateBase,
  } = useMemo(
    () => getButtonColors(theme, variant, color),
    [theme, variant, color],
  );

  const isInteractive = !isDisabled && !isLoading && !busy;

  return (
    <Pressable
      accessibilityLabel={
        accessibilityLabel ||
        (typeof children === "string" ? children : undefined)
      }
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: isLoading || busy }}
      accessibilityValue={badge ? { text: String(badge) } : undefined}
      // react-native-web does not map accessibilityState.busy to the DOM.
      aria-busy={isLoading || busy}
      testID={testID}
      // A no-op rather than undefined while busy: the Pressable stays enabled,
      // and an undefined handler leaves the press free to be answered by
      // whatever is listening further up.
      onPress={
        isInteractive
          ? (onClick || submit) &&
            (() => {
              emitFeedback("press");
              onClick?.();
              submit?.();
            })
          : noop
      }
      // A busy button stays focusable — `disabled` would drop it from the tab
      // order and announce it as unavailable, when it is working — so it only
      // stops answering presses.
      disabled={isDisabled || isLoading}
      style={({ hovered, pressed }: PressableState) => {
        let currentBg = bg;

        if (isInteractive && pressed) {
          currentBg = getStateColor(stateBase, on, "press");
        } else if (isInteractive && hovered) {
          currentBg = getStateColor(stateBase, on, "hover");
        }

        // Feedback never changes the box: the border is the same idle and
        // hovered, and the ring is a shadow.
        const ring =
          (hovered || pressed) && isInteractive
            ? getFocusRing(theme)
            : undefined;

        return [
          styles.buttonContainer,
          {
            backgroundColor: currentBg,
            borderWidth: variant === "outlined" ? 1 : 0,
            borderColor: border || "transparent",
            ...ring,
            opacity: isDisabled ? 0.38 : 1,
          },
          dense && styles.dense,
          fullWidth && styles.fullWidth,
          underlay != null && styles.clipped,
          style,
        ];
      }}
      {...(Platform.OS === "android" && {
        android_ripple: { color: getStateColor(bg, on, "press") },
      })}
    >
      {underlay != null && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {underlay}
        </View>
      )}
      <View style={styles.itemsContainer}>
        {isLoading ? (
          // We use a smaller size to fit inside the button height
          <CircularProgress size={20} strokeWidth={2.5} color={on} />
        ) : (
          <>
            {!!iconName && iconPosition === "start" && (
              <Icons
                name={iconName}
                size={size || theme.shape.medium}
                style={[styles.icon, { color: on }, iconStyle]}
              />
            )}
            {children != null && children !== "" && (
              <Text style={[styles.buttonText, { color: on }, labelStyle]}>
                {children}
              </Text>
            )}
            {!!badge && badge > 0 && (
              <View style={styles.badgeSlot}>
                <Badge count={badge} />
              </View>
            )}
            {!!iconName && iconPosition === "end" && (
              <Icons
                name={iconName}
                size={size || theme.shape.medium}
                style={[styles.icon, { color: on }, iconStyle]}
              />
            )}
          </>
        )}
      </View>
    </Pressable>
  );
};

export default Button;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    buttonContainer: {
      marginTop: theme.spacing.xs,
      marginBottom: theme.spacing.xs,
      marginLeft: theme.spacing.xs,
      marginRight: theme.spacing.xs,
      padding: theme.spacing.m,
      borderRadius: theme.shape.medium,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primary,
      ...Platform.select({
        web: { cursor: "pointer" },
      }),
    },
    buttonText: {
      color: theme.colors.onPrimary,
      ...theme.typography.labelMedium,
      marginLeft: theme.spacing.xs,
      marginRight: theme.spacing.xs,
    },
    itemsContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    clipped: {
      overflow: "hidden",
    },
    // The badge is absolutely placed, so it needs a box of its own to sit in.
    badgeSlot: {
      minWidth: 16,
      height: 16,
      marginLeft: theme.spacing.s,
    },
    dense: {
      paddingVertical: 10,
      paddingHorizontal: theme.spacing.m,
    },
    fullWidth: {
      alignSelf: "stretch",
      width: "auto",
    },
    icon: {},
  });
