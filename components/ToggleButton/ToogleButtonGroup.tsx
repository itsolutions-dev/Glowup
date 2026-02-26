import React from "react";
import { View, StyleSheet } from "react-native";
import ToggleButton from "./ToggleButton";

interface ToggleButtonGroupProps {
  options: { label?: string; icon?: string; value: string }[];
  value: string | string[]; // Single string or array of strings
  onValueChange: (val: any) => void;
  multiSelect?: boolean;
}

export const ToggleButtonGroup = ({
  options,
  value,
  onValueChange,
  multiSelect = false,
}: ToggleButtonGroupProps) => {
  const handlePress = (itemValue: string) => {
    if (multiSelect) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValue = currentValues.includes(itemValue)
        ? currentValues.filter((v) => v !== itemValue)
        : [...currentValues, itemValue];
      onValueChange(newValue);
    } else {
      onValueChange(itemValue);
    }
  };

  const isActive = (itemValue: string) => {
    return multiSelect
      ? (value as string[]).includes(itemValue)
      : value === itemValue;
  };

  return (
    <View style={styles.groupContainer}>
      {options.map((option, index) => (
        <ToggleButton
          key={option.value}
          label={option.label}
          icon={option.icon}
          active={isActive(option.value)}
          onPress={() => handlePress(option.value)}
          isFirst={index === 0}
          isLast={index === options.length - 1}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  groupContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
});

export default ToggleButtonGroup;
