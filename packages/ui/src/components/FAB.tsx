import React from "react";
import {
  Pressable,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";
import Icons from "./Glyph";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, getGlowStyles } from "../providers/ThemeProvider";
import { useInteractionFeedback } from "../providers/InteractionFeedback";
import { useStateLayer } from "./TouchableRipple";
import { cornerStyle, type Corner } from "./internal/cornerPlacement";
import { MaterialCommunityIconsGlyphs, PressableState } from "./types";

type FABSize = "small" | "regular" | "large" | "extended";

type FABPosition = Corner;

/**
 * `floating` pins the button to a screen corner (the default). `inline` drops
 * the absolute positioning so the FAB can sit inside a toolbar, an AppBar row
 * or a Card action bar.
 */
type FABPlacement = "floating" | "inline";

export interface FABProps {
  icon: MaterialCommunityIconsGlyphs;
  label?: string;
  onPress: () => void;
  size?: FABSize;
  position?: FABPosition;
  placement?: FABPlacement;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /**
   * Report the press to `ThemeProvider`'s `onInteractionFeedback` (haptics).
   * Defaults to true.
   */
  feedback?: boolean;
}

const FAB = ({
  icon,
  label,
  onPress,
  size = "regular",
  position = "bottom-right",
  placement = "floating",
  disabled,
  style: customStyle,
  feedback = true,
}: FABProps) => {
  const { theme } = useTheme();
  const emitFeedback = useInteractionFeedback(feedback);
  const insets = useSafeAreaInsets();
  const stateLayer = useStateLayer(
    theme.colors.primaryContainer,
    theme.colors.onPrimaryContainer,
  );

  const isExtended = size === "extended";

  return (
    <Pressable
      accessibilityLabel={label || `${icon} FAB`}
      accessibilityRole="button"
      disabled={disabled}
      accessibilityState={{ disabled }}
      onPress={() => {
        emitFeedback("press");
        onPress();
      }}
      style={(state: PressableState) => [
        styles.fabBase,
        placement === "floating" && styles.floating,
        styles[size],
        placement === "inline" ? null : cornerStyle(position, insets),
        // The M3 state layer, not a hex string with an alpha suffix glued on:
        // that only worked for 6-digit hex and skipped the press state.
        { backgroundColor: stateLayer(state, disabled) },
        (state.hovered || state.pressed) &&
          !disabled &&
          getGlowStyles(theme, true),
        disabled && styles.disabled,
        customStyle,
      ]}
    >
      <Icons
        name={icon}
        size={size === "large" ? 36 : 24}
        color={theme.colors.onPrimaryContainer}
      />
      {isExtended && label && (
        <Text
          style={[
            theme.typography.labelLarge,
            { color: theme.colors.onPrimaryContainer, marginLeft: 12 },
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
};

export default FAB;

const styles = StyleSheet.create({
  fabBase: {
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
  },
  floating: {
    position: "absolute",
    zIndex: 99,
  },
  small: {
    width: 40,
    height: 40,
    borderRadius: 12,
  },
  regular: {
    width: 56,
    height: 56,
    borderRadius: 16,
  },
  large: {
    width: 96,
    height: 96,
    borderRadius: 28,
  },
  extended: {
    height: 56,
    paddingHorizontal: 20,
    borderRadius: 16,
    flexDirection: "row",
  },
  disabled: {
    opacity: 0.38,
    elevation: 0,
  },
});
