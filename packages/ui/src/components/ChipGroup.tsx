import React, { useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { useTheme, Theme } from "../providers/ThemeProvider";
import Chip from "./Chip";
import type { MaterialCommunityIconsGlyphs } from "./types";
import { isSelected, selectionRoles, toggleIn } from "./internal/selection";

export interface ChipGroupOption {
  value: string;
  label: string;
  icon?: MaterialCommunityIconsGlyphs;
  disabled?: boolean;
}

export interface ChipGroupProps {
  options: ChipGroupOption[];
  /** The selected value (or `null`), or the selected values with `multiSelect`. */
  value: string | string[] | null;
  onValueChange: (value: any) => void;
  /** Filter chips: any number selected. Defaults to `false` (one at most). */
  multiSelect?: boolean;
  /** Single select only: the selected chip cannot be deselected. */
  required?: boolean;
  /** `true` wraps onto more lines; `false` scrolls sideways. Defaults to `true`. */
  wrap?: boolean;
  /** Chip look. Defaults to `"outlined"`, the M3 filter chip. */
  mode?: "filled" | "tonal" | "outlined";
  /** Names the group for assistive tech. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * A set of filter chips with the selection handled: one at a time, or any
 * number with `multiSelect`.
 */
const ChipGroup = ({
  options,
  value,
  onValueChange,
  multiSelect = false,
  required = false,
  wrap = true,
  mode = "outlined",
  accessibilityLabel,
  style,
  testID,
}: ChipGroupProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const roles = selectionRoles(multiSelect);
  const press = (v: string) => {
    if (multiSelect) onValueChange(toggleIn(value, v));
    else if (value !== v) onValueChange(v);
    else if (!required) onValueChange(null);
  };

  const chips = options.map((option) => (
    <Chip
      key={option.value}
      label={option.label}
      icon={option.icon}
      mode={mode}
      selected={isSelected(value, option.value, multiSelect)}
      disabled={option.disabled}
      onPress={() => press(option.value)}
      accessibilityRole={roles.item}
    />
  ));

  const a11y = {
    accessibilityRole: roles.group,
    accessibilityLabel,
    testID,
  };

  if (!wrap) {
    return (
      <ScrollView
        {...a11y}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={style}
        contentContainerStyle={styles.row}
      >
        {chips}
      </ScrollView>
    );
  }
  return (
    <View {...a11y} style={[styles.row, styles.wrap, style]}>
      {chips}
    </View>
  );
};

export default ChipGroup;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    row: { flexDirection: "row", gap: theme.spacing.s },
    wrap: { flexWrap: "wrap" },
  });
