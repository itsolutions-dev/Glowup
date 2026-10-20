import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  Animated,
  Easing,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";
import Icons from "./Glyph";
import { useTheme, Theme, getGlowStyles } from "../providers/ThemeProvider";
import { MaterialCommunityIconsGlyphs, PressableState } from "./types";
import { useReduceMotion } from "./internal/useReduceMotion";
import Collapse from "./Collapse";

export interface AccordionProps {
  title: string;
  children: React.ReactNode;
  /**
   * Whether the panel is open. The accordion keeps its own open state: it
   * starts from this value, a press on the header toggles it, and it follows
   * the prop again whenever the prop changes. So it works as an initial state
   * (`expanded` alone) and as a controlled value (a parent that sets `expanded`
   * from `onClick`). Defaults to `false`.
   */
  expanded?: boolean;
  /** Called on every press of the header with the new state: `true` when it opens, `false` when it closes. */
  onClick?: (expanded: boolean) => void;
  /**
   * The icon at the end of the header: a glyph name, or any node. It is drawn
   * as given; the default, a chevron, turns upside down while the panel is open.
   */
  icon?: MaterialCommunityIconsGlyphs | Exclude<React.ReactNode, string>;
  /**
   * `"outlined"` is a bordered panel on the surface, `"contained"` a filled
   * tonal one without a border. Defaults to `"outlined"`.
   */
  variant?: "outlined" | "contained";
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
}

const Accordion = ({
  title,
  children,
  style = {},
  titleStyle = {},
  expanded: expandedProp = false,
  onClick,
  icon,
  variant = "outlined",
}: AccordionProps) => {
  const [expanded, setExpanded] = useState(expandedProp);
  const [prevExpanded, setPrevExpanded] = useState(expandedProp);
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const reduceMotion = useReduceMotion();
  const [turn] = useState(() => new Animated.Value(expandedProp ? 1 : 0));
  const turned = useRef(expandedProp);

  // Sync with the prop when it changes (render-time adjustment)
  if (prevExpanded !== expandedProp) {
    setPrevExpanded(expandedProp);
    setExpanded(expandedProp);
  }

  // The default chevron turns with the panel, on the same clock as Collapse.
  useEffect(() => {
    // Only a change turns it: a panel that mounts open starts upside down.
    if (turned.current === expanded) return;
    turned.current = expanded;
    Animated.timing(turn, {
      toValue: expanded ? 1 : 0,
      duration: reduceMotion ? 0 : 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [expanded, reduceMotion, turn]);

  const rotate = turn.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const toggleExpand = () => {
    setExpanded(!expanded);
    onClick?.(!expanded);
  };

  return (
    <View
      style={[
        styles.container,
        variant === "outlined"
          ? {
              backgroundColor: theme.colors.surface,
              borderWidth: 1,
              borderColor: theme.colors.outlineVariant,
            }
          : { backgroundColor: theme.colors.surfaceContainerLow },
        style,
      ]}
    >
      <Pressable
        onPress={toggleExpand}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ expanded: expanded }} // For native platforms
        aria-expanded={expanded} // For web platforms
        style={({ hovered }: PressableState) => [
          styles.header,
          hovered && getGlowStyles(theme, true),
        ]}
      >
        <Text
          style={[styles.title, { color: theme.colors.onSurface }, titleStyle]}
        >
          {title}
        </Text>
        {icon === undefined || icon === null || icon === false ? (
          <Animated.View style={{ transform: [{ rotate }] }}>
            <Icons
              name="chevron-down"
              size={24}
              color={theme.colors.onSurfaceVariant}
            />
          </Animated.View>
        ) : typeof icon === "string" ? (
          <Icons
            name={icon as MaterialCommunityIconsGlyphs}
            size={24}
            color={theme.colors.onSurfaceVariant}
          />
        ) : (
          icon
        )}
      </Pressable>

      {/* Collapse animates this panel alone; LayoutAnimation, used before,
          animated the next layout pass of the whole app. */}
      <Collapse open={expanded} duration={300}>
        <View style={styles.content}>
          {typeof children === "string" ? (
            <Text
              style={[
                theme.typography.bodyMedium, // Apply a default body text style from theme
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {children}
            </Text>
          ) : (
            children
          )}
        </View>
      </Collapse>
    </View>
  );
};

export default Accordion;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      marginVertical: 4,
      borderRadius: 12,
      overflow: "hidden",
      width: "100%",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 16,
      minHeight: 56,
    },
    title: {
      ...theme.typography.titleMedium,
    },
    content: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
  });
