import { useMemo } from "react";
import {
  useTheme,
  Theme,
  getStateColor,
  getGlowStyles,
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
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import CircularProgress from "./Progress/CircularProgress";
import { getSuccessRoles } from "../providers/successRoles";
import { MaterialCommunityIconsGlyphs, PressableState } from "./types";

export type ButtonMode = "filled" | "tonal" | "outlined" | "text";
export type ButtonTone = "primary" | "error" | "success";

/** The colours a button resolves to for a mode and a tone. */
export interface ButtonColors {
  /** Surface fill; `"transparent"` for outlined and text. */
  bg: string;
  /** Label and icon colour. */
  on: string;
  /** Outline colour, outlined mode only. */
  border?: string;
}

/**
 * Resolves a mode and a tone to colours, exactly as `Button` paints them.
 * Exported for components built on `Button` that draw inside its surface.
 */
export const getButtonColors = (
  theme: Theme,
  mode: ButtonMode,
  tone: ButtonTone,
): ButtonColors => {
  const success = tone === "success" ? getSuccessRoles(theme.isDark) : null;
  const isError = tone === "error";
  const accent = success
    ? success.success
    : isError
      ? theme.colors.error
      : theme.colors.primary;
  const onAccent = success
    ? success.onSuccess
    : isError
      ? theme.colors.onError
      : theme.colors.onPrimary;
  const container = success
    ? success.successContainer
    : isError
      ? theme.colors.errorContainer
      : theme.colors.secondaryContainer;
  const onContainer = success
    ? success.onSuccessContainer
    : isError
      ? theme.colors.onErrorContainer
      : theme.colors.onSecondaryContainer;

  switch (mode) {
    case "tonal":
      return { bg: container, on: onContainer, border: undefined };
    case "outlined":
      return {
        bg: "transparent",
        on: accent,
        border: tone === "primary" ? theme.colors.outline : accent,
      };
    case "text":
      return { bg: "transparent", on: accent, border: undefined };
    case "filled":
    default:
      return { bg: accent, on: onAccent, border: undefined };
  }
};

interface ButtonProps {
  onPress?: () => void;
  iconName?: MaterialCommunityIconsGlyphs;
  size?: number;
  mode?: ButtonMode;
  /**
   * Colour role. `error` is the destructive treatment (delete, discard);
   * `success` is confirmation feedback, from a fixed green kept off the seed.
   */
  tone?: ButtonTone;
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
  /** Stretch to fill the parent width. */
  fullWidth?: boolean;
  /** Icon side relative to the label. */
  iconPosition?: "left" | "right";
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
  children?: React.ReactNode;
}

const noop = () => {};

const Button = ({
  onPress,
  iconName,
  size,
  mode = "filled",
  tone = "primary",
  disabled = false,
  style = {},
  iconStyle = {},
  loading = false,
  busy = false,
  underlay,
  labelStyle,
  fullWidth = false,
  iconPosition = "left",
  accessibilityLabel,
  accessibilityHint,
  testID,
  children,
}: ButtonProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const { bg, on, border } = useMemo(
    () => getButtonColors(theme, mode, tone),
    [theme, mode, tone],
  );

  const isInteractive = !disabled && !loading && !busy;

  return (
    <Pressable
      accessibilityLabel={
        accessibilityLabel ||
        (typeof children === "string" ? children : undefined)
      }
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      accessibilityState={{ disabled, busy: loading || busy }}
      // react-native-web does not map accessibilityState.busy to the DOM.
      aria-busy={loading || busy}
      testID={testID}
      // A no-op rather than undefined while busy: the Pressable stays enabled,
      // and an undefined handler leaves the press free to be answered by
      // whatever is listening further up.
      onPress={isInteractive ? onPress : noop}
      // A busy button stays focusable — `disabled` would drop it from the tab
      // order and announce it as unavailable, when it is working — so it only
      // stops answering presses.
      disabled={disabled || loading}
      style={({ hovered, pressed }: PressableState) => {
        let currentBg = bg;

        if (isInteractive && pressed) {
          currentBg = getStateColor(
            bg === "transparent" ? theme.colors.surface : bg,
            on,
            "press",
          );
        } else if (isInteractive && hovered) {
          currentBg = getStateColor(
            bg === "transparent" ? theme.colors.surface : bg,
            on,
            "hover",
          );
        }

        const glow =
          (hovered || pressed) && isInteractive
            ? getGlowStyles(theme, true)
            : {
                borderWidth: mode === "outlined" ? 1 : 0,
                borderColor: border || "transparent",
              };

        return [
          styles.buttonContainer,
          {
            backgroundColor: currentBg,
            ...glow,
            opacity: disabled ? 0.38 : 1,
          },
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
        {loading ? (
          // We use a smaller size to fit inside the button height
          <CircularProgress size={20} strokeWidth={2.5} color={on} />
        ) : (
          <>
            {!!iconName && iconPosition === "left" && (
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
            {!!iconName && iconPosition === "right" && (
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

const makeStyles: (theme: Theme) => StyleSheet.NamedStyles<any> = (
  theme: Theme,
) =>
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
    fullWidth: {
      alignSelf: "stretch",
      width: "auto",
    },
    icon: {},
  });
