import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { useTheme, Theme } from "../providers/ThemeProvider";
import { getButtonColors } from "./Button";
import Icon from "./Icon";
import TouchableRipple from "./TouchableRipple";
import Typography from "./Typography";
import type { MaterialCommunityIconsGlyphs } from "./types";
import { isSelected, selectionRoles, toggleIn } from "./internal/selection";

// M3 Expressive button group: heights per size, 2dp between connected
// buttons, whose inner corners are small while the outer ones stay round.
const HEIGHTS = { xs: 32, s: 40, m: 56 } as const;
const CONNECTED_GAP = 2;

export interface ButtonGroupOption {
  value: string;
  label?: string;
  icon?: MaterialCommunityIconsGlyphs;
  disabled?: boolean;
  /** Required when the option has an icon and no label. */
  accessibilityLabel?: string;
}

export interface ButtonGroupProps {
  options: ButtonGroupOption[];
  /** The selected value, or the selected values with `multiSelect`. */
  value: string | string[];
  onValueChange: (value: any) => void;
  multiSelect?: boolean;
  /**
   * `"standard"` spaces the buttons apart; `"connected"` joins them into one
   * control (the successor of segmented buttons). Defaults to `"standard"`.
   */
  type?: "standard" | "connected";
  /** Look of the unselected buttons; selected ones are filled. Defaults to `"tonal"`. */
  mode?: "tonal" | "outlined";
  /** Defaults to `"s"` (40dp). */
  size?: keyof typeof HEIGHTS;
  /** Names the group for assistive tech. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * A row of toggle buttons from M3 Expressive. Same options/value shape as
 * `ToggleButtonGroup`. Selection changes the shape as well as the colour: a
 * selected standard button squares its corners, a selected connected button
 * rounds all of them.
 */
const ButtonGroup = ({
  options,
  value,
  onValueChange,
  multiSelect = false,
  type = "standard",
  mode = "tonal",
  size = "s",
  accessibilityLabel,
  style,
  testID,
}: ButtonGroupProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const height = HEIGHTS[size];
  const round = height / 2;
  const connected = type === "connected";
  const idle = getButtonColors(theme, mode, "primary");
  const picked = getButtonColors(theme, "filled", "primary");

  const roles = selectionRoles(multiSelect);
  const press = (v: string) =>
    onValueChange(multiSelect ? toggleIn(value, v) : v);

  const cornersFor = (index: number, selected: boolean): ViewStyle => {
    if (!connected) {
      const r = selected ? theme.shape.medium : round;
      return { borderRadius: r };
    }
    if (selected) return { borderRadius: round };
    const inner = theme.shape.small;
    const first = index === 0;
    const last = index === options.length - 1;
    return {
      borderTopStartRadius: first ? round : inner,
      borderBottomStartRadius: first ? round : inner,
      borderTopEndRadius: last ? round : inner,
      borderBottomEndRadius: last ? round : inner,
    };
  };

  return (
    <View
      accessibilityRole={roles.group}
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.row,
        { gap: connected ? CONNECTED_GAP : theme.spacing.s },
        style,
      ]}
      testID={testID}
    >
      {options.map((option, index) => {
        const selected = isSelected(value, option.value, multiSelect);
        const colors = selected ? picked : idle;
        const corners = cornersFor(index, selected);
        return (
          <TouchableRipple
            key={option.value}
            onPress={() => press(option.value)}
            disabled={option.disabled}
            underlayColor={colors.underlay}
            rippleColor={colors.on}
            accessibilityRole={roles.item}
            accessibilityLabel={option.accessibilityLabel ?? option.label}
            accessibilityState={{
              checked: selected,
              disabled: !!option.disabled,
            }}
            // TouchableRipple paints the hover/focus/press state layer.
            style={[
              styles.button,
              corners,
              {
                height,
                paddingHorizontal:
                  size === "xs"
                    ? theme.spacing.m - theme.spacing.xs
                    : theme.spacing.m,
                borderWidth: mode === "outlined" && !selected ? 1 : 0,
                borderColor: colors.border ?? "transparent",
              },
              connected && styles.connected,
              option.disabled && styles.disabled,
            ]}
          >
            {option.icon && (
              <Icon source={option.icon} size={20} color={colors.on} />
            )}
            {!!option.label && (
              <Typography
                variant="labelLarge"
                numberOfLines={1}
                style={{ color: colors.on }}
              >
                {option.label}
              </Typography>
            )}
          </TouchableRipple>
        );
      })}
    </View>
  );
};

export default ButtonGroup;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center" },
    button: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: theme.spacing.s,
      minWidth: 48,
      overflow: "hidden",
    },
    connected: { flexGrow: 1 },
    disabled: { opacity: 0.38 },
  });
