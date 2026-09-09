import React, { useMemo } from "react";
import {
  Pressable,
  StyleProp,
  ViewStyle,
  StyleSheet,
  View,
  Platform,
} from "react-native";
import { useTheme, Theme, getGlowStyles } from "../providers/ThemeProvider";
import { PressableState } from "./types";
import CardActions from "./CardParts/CardActions";
import CardContent from "./CardParts/CardContent";
import CardCover from "./CardParts/CardCover";
import CardTitle from "./CardParts/CardTitle";

interface CardProps {
  children: React.ReactNode;
  variant?: "elevated" | "filled" | "outlined" | "glow";
  onPress?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

const CardBase = ({
  children,
  variant = "filled",
  onPress,
  style,
  accessibilityLabel,
}: CardProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={accessibilityLabel}
      style={({ hovered, pressed }: PressableState) => [
        styles.base,
        styles[variant],
        (hovered || pressed) &&
          !(styles[variant] as any).boxShadow &&
          getGlowStyles(theme, true),

        hovered && styles.hovered,
        pressed && styles.pressed,
        onPress && Platform.OS === "web" && { cursor: "pointer" },
        style,
      ]}
    >
      <View style={styles.content}>{children}</View>
    </Pressable>
  );
};

const makeStyles: (theme: Theme) => StyleSheet.NamedStyles<any> = (
  theme: Theme,
) =>
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
 * <Card variant="elevated" onPress={open}>
 *   <Card.Cover source={photo} alt="Impianto 4" />
 *   <Card.Title title="Impianto 4" subtitle="Manutenzione programmata" />
 *   <Card.Content>
 *     <Typography variant="bodyMedium">Prossimo intervento: 12 marzo</Typography>
 *   </Card.Content>
 *   <Card.Actions>
 *     <Button mode="text" onPress={postpone}>Rinvia</Button>
 *     <Button onPress={confirm}>Conferma</Button>
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
