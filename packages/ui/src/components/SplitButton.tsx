import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { useTheme, Theme } from "../providers/ThemeProvider";
import { getButtonColors } from "./Button";
import Icon from "./Icon";
import Menu, { type MenuItem } from "./Menu";
import TouchableRipple from "./TouchableRipple";
import Typography from "./Typography";
import type { MaterialCommunityIconsGlyphs } from "./types";

// M3 Expressive split button (small): 40dp tall, 2dp between the halves,
// 4dp inner corners, a 48dp-wide trailing half.
const HEIGHT = 40;
const GAP = 2;
const INNER_RADIUS = 4;
const TRAILING_WIDTH = 48;

export interface SplitButtonProps {
  /** The primary action's label. */
  children: string;
  /** Leading icon of the primary action. */
  iconName?: MaterialCommunityIconsGlyphs;
  /** The primary action. */
  onPress: () => void;
  /** The related actions the trailing half opens. */
  items: MenuItem[];
  /** Defaults to `"filled"`. */
  mode?: "filled" | "tonal" | "outlined";
  disabled?: boolean;
  /** Accessible name of the trailing half. Defaults to `"More options"`. */
  menuAccessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * A primary action with its related actions one tap away: the leading half
 * runs `onPress`, the trailing half opens a `Menu` of `items`.
 */
const SplitButton = ({
  children,
  iconName,
  onPress,
  items,
  mode = "filled",
  disabled = false,
  menuAccessibilityLabel = "More options",
  style,
  testID,
}: SplitButtonProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const [open, setOpen] = useState(false);
  const colors = getButtonColors(theme, mode, "primary");
  const surface = {
    underlayColor:
      colors.bg === "transparent" ? theme.colors.surface : colors.bg,
    rippleColor: colors.on,
  };
  const outline =
    mode === "outlined"
      ? { borderWidth: 1, borderColor: colors.border ?? theme.colors.outline }
      : null;
  const round = HEIGHT / 2;

  const trailing = (
    <TouchableRipple
      {...surface}
      onPress={() => setOpen(true)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={menuAccessibilityLabel}
      accessibilityState={{ expanded: open, disabled }}
      testID={testID ? `${testID}-menu` : undefined}
      style={[
        styles.half,
        styles.trailing,
        outline,
        // Open, the trailing half turns into a round button of its own.
        open
          ? { borderRadius: round }
          : {
              borderTopStartRadius: INNER_RADIUS,
              borderBottomStartRadius: INNER_RADIUS,
              borderTopEndRadius: round,
              borderBottomEndRadius: round,
            },
      ]}
    >
      <Icon
        source="chevron-down"
        size={20}
        color={colors.on}
        style={open ? styles.flipped : undefined}
      />
    </TouchableRipple>
  );

  return (
    <View
      style={[styles.row, disabled && styles.disabled, style]}
      testID={testID}
    >
      <TouchableRipple
        {...surface}
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={children}
        style={[
          styles.half,
          styles.leading,
          outline,
          {
            borderTopStartRadius: round,
            borderBottomStartRadius: round,
            borderTopEndRadius: INNER_RADIUS,
            borderBottomEndRadius: INNER_RADIUS,
          },
        ]}
      >
        {iconName && <Icon source={iconName} size={20} color={colors.on} />}
        <Typography
          variant="labelLarge"
          numberOfLines={1}
          style={{ color: colors.on }}
        >
          {children}
        </Typography>
      </TouchableRipple>
      <Menu
        anchor={trailing}
        items={items}
        visible={open}
        onDismiss={() => setOpen(false)}
      />
    </View>
  );
};

export default SplitButton;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", gap: GAP },
    half: {
      height: HEIGHT,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    leading: {
      gap: theme.spacing.s,
      paddingStart: theme.spacing.m,
      paddingEnd: theme.spacing.s + theme.spacing.xs,
    },
    trailing: { width: TRAILING_WIDTH },
    flipped: { transform: [{ rotate: "180deg" }] },
    disabled: { opacity: 0.38 },
  });
