import React from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import ToggleButton from "./ToggleButton";
import { MaterialCommunityIconsGlyphs } from "../types";
import { isSelected, selectionRoles, toggleIn } from "../internal/selection";

export interface ToggleButtonOption {
  label?: string;
  icon?: MaterialCommunityIconsGlyphs;
  value: string;
  /** Greys out this segment while leaving the rest of the group usable. */
  disabled?: boolean;
}

export interface ToggleButtonGroupProps {
  options: ToggleButtonOption[];
  value: string | string[]; // Single string or array of strings
  onValueChange: (val: any) => void;
  multiSelect?: boolean;
  /** Disables every segment. */
  disabled?: boolean;
  /** Segments share the row equally instead of sizing to their labels. */
  fullWidth?: boolean;
  /** Show a check mark on the selected segments (M3 segmented button). */
  showSelectedCheck?: boolean;
  /** Names the group for assistive tech — a group of choices needs a question. */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

const ToggleButtonGroup = ({
  options,
  value,
  onValueChange,
  multiSelect = false,
  disabled = false,
  fullWidth = false,
  showSelectedCheck = false,
  accessibilityLabel,
  style,
}: ToggleButtonGroupProps) => {
  const roles = selectionRoles(multiSelect);
  const handlePress = (itemValue: string) =>
    onValueChange(multiSelect ? toggleIn(value, itemValue) : itemValue);

  return (
    <View
      // One choice out of many is a radio group; several is a plain group of
      // checkboxes. Announcing "button" for both loses that distinction.
      accessibilityRole={roles.group}
      accessibilityLabel={accessibilityLabel}
      style={[styles.groupContainer, fullWidth && styles.fullWidth, style]}
    >
      {options.map((option, index) => (
        <ToggleButton
          key={option.value}
          label={option.label}
          icon={option.icon}
          active={isSelected(value, option.value, multiSelect)}
          onPress={() => handlePress(option.value)}
          isFirst={index === 0}
          isLast={index === options.length - 1}
          disabled={disabled || option.disabled}
          grow={fullWidth}
          showSelectedCheck={showSelectedCheck}
          accessibilityRole={roles.item}
        />
      ))}
    </View>
  );
};

export default ToggleButtonGroup;

const styles = StyleSheet.create({
  groupContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  fullWidth: {
    alignSelf: "stretch",
  },
});
