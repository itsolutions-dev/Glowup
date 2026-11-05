import React, { useMemo, useState } from "react";
import {
  Pressable,
  StyleProp,
  ViewStyle,
  StyleSheet,
  View,
  Platform,
} from "react-native";
import {
  useTheme,
  Theme,
  getGlowStyles,
  getFocusRing,
} from "../providers/ThemeProvider";
import { PressableState } from "./types";
import CardActions from "./CardParts/CardActions";
import CardContent from "./CardParts/CardContent";
import CardCover from "./CardParts/CardCover";
import CardTitle from "./CardParts/CardTitle";

export interface CardProps {
  children: React.ReactNode;
  variant?: "elevated" | "filled" | "outlined" | "glow";
  onClick?: () => void;
  accessibilityLabel?: string;
  /** Draws the card as the chosen one of a set (a primary border) and says so to screen readers. */
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
}

const CardBase = ({
  children,
  variant = "filled",
  onClick,
  style,
  accessibilityLabel,
  selected,
}: CardProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  // The border takes its width from the padding, so selecting moves nothing.
  const selectedStyle = useMemo(() => {
    if (!selected) return undefined;
    const border =
      StyleSheet.flatten<ViewStyle>(styles[variant]).borderWidth ?? 0;
    return {
      borderWidth: 2,
      borderColor: theme.colors.primary,
      padding: theme.spacing.m + border - 2,
    };
  }, [selected, styles, variant, theme]);

  // A pressable card with Card.Actions is an action area plus an actions row,
  // as in M3: the actions are not nested in the card's button (invalid on the
  // web, and merged into one element on iOS, out of VoiceOver's reach).
  const parts = React.Children.toArray(children);
  const actions = onClick
    ? parts.filter((c) => React.isValidElement(c) && c.type === CardActions)
    : [];
  const [state, setState] = useState({ hovered: false, pressed: false });

  const frame = ({ hovered, pressed }: PressableState) => [
    styles.base,
    styles[variant],
    (hovered || pressed) &&
      !(styles[variant] as any).boxShadow &&
      getFocusRing(theme),

    hovered && styles.hovered,
    pressed && styles.pressed,
    onClick && Platform.OS === "web" && { cursor: "pointer" },
    selectedStyle,
    style,
  ];
  const buttonProps = {
    onPress: onClick,
    disabled: !onClick,
    accessibilityRole: onClick ? ("button" as const) : undefined,
    accessibilityLabel,
    // A button that stays chosen: aria-pressed on the web (aria-selected is
    // not valid there), the selected state on iOS and Android.
    ...((selected === undefined
      ? null
      : Platform.OS === "web"
        ? { "aria-pressed": selected }
        : { "aria-selected": selected }) as object),
  };

  if (actions.length === 0) {
    return (
      <Pressable {...buttonProps} style={frame}>
        <View style={styles.content}>{children}</View>
      </Pressable>
    );
  }

  // The frame shows the area's hover and press, as the whole card did.
  const track = (patch: Partial<typeof state>) => () =>
    setState((s) => ({ ...s, ...patch }));
  return (
    <View style={frame(state)}>
      <Pressable
        {...buttonProps}
        onHoverIn={track({ hovered: true })}
        onHoverOut={track({ hovered: false })}
        onPressIn={track({ pressed: true })}
        onPressOut={track({ pressed: false })}
        style={styles.content}
      >
        {parts.filter((c) => !actions.includes(c))}
      </Pressable>
      {actions}
    </View>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    base: {
      borderRadius: theme.shape.medium,
      padding: theme.spacing.m,
      overflow: "hidden",
      ...Platform.select({
        web: { transition: "all 200ms ease-in-out" },
      }),
    },
    // Variants
    elevated: {
      backgroundColor: theme.colors.surfaceContainerLow,
      ...Platform.select({
        ios: {
          shadowColor: theme.colors.shadow,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.2,
          shadowRadius: 2,
        },
        android: { elevation: 2 },
        web: { boxShadow: theme.colors.boxShadow },
      }),
    },
    filled: {
      backgroundColor: theme.colors.surfaceContainerHigh, // "#EDE7F0", // Surface Container Highest
    },
    outlined: {
      backgroundColor: theme.colors.surfaceContainer, //"#FEF7FF", // Surface
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant, //"#CAC4D0", // Outline variant
    },
    glow: {
      ...getGlowStyles(theme, true),
    },

    // Interaction States
    hovered: {
      ...Platform.select({
        web: { filter: "brightness(0.95)" },
        ios: { opacity: 0.95 }, // Example for iOS
        android: { opacity: 0.95 }, // Example for Android
      }),
    },
    pressed: {
      transform: [{ scale: 0.98 }],
      opacity: 0.95,
    },
    content: {
      flex: 1,
    },
  });

/**
 * Compound parts. `Card.Cover` bleeds past the card padding, `Card.Title`
 * carries the M3 header type roles, `Card.Actions` the trailing button row —
 * so a card header is composed rather than hand-built each time.
 *
 * ```tsx
 * <Card variant="elevated" onClick={open}>
 *   <Card.Cover source={photo} alt="Line 4" />
 *   <Card.Title title="Line 4" subtitle="Scheduled maintenance" />
 *   <Card.Content>
 *     <Typography variant="body2">Next service: 12 March</Typography>
 *   </Card.Content>
 *   <Card.Actions>
 *     <Button variant="text" onClick={postpone}>Postpone</Button>
 *     <Button onClick={confirm}>Confirm</Button>
 *   </Card.Actions>
 * </Card>
 * ```
 */
const Card = Object.assign(CardBase, {
  Title: CardTitle,
  Content: CardContent,
  Cover: CardCover,
  Actions: CardActions,
});

export default Card;
