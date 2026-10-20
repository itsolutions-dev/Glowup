import React from "react";
import { View, StyleProp, ViewStyle } from "react-native";
import Checkbox from "./Checkbox";
import FormControl from "./FormControl";
import { useTheme } from "../providers/ThemeProvider";

export interface CheckboxOption {
  label: string;
  value: any;
  /** Disables only this option. */
  disabled?: boolean;
}

export interface CheckboxGroupProps {
  label?: string;
  options: CheckboxOption[];
  /** The values of the checked options. */
  value: any[];
  /** Receives the new set of checked values after each toggle. */
  onChange: (values: any[]) => void;
  /** Stacks the options (`"column"`) or lays them in a wrapping line (`"row"`). Defaults to `"column"`. */
  direction?: "column" | "row";
  disabled?: boolean;
  /** Marks the label with an asterisk. */
  required?: boolean;
  /** Error text below the group; it also turns the checkboxes and the label red. */
  error?: string;
  /** Supporting text below the group; hidden while an error is shown. */
  helperText?: string;
  /**
   * Report each toggle to `ThemeProvider`'s `onInteractionFeedback` (haptics).
   * Defaults to true.
   */
  feedback?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Several independent choices under one label: the checkbox counterpart of
 * `RadioGroup`, which takes one. The group owns the array of checked values.
 */
const CheckboxGroup = ({
  label,
  options,
  value,
  onChange,
  direction = "column",
  disabled,
  required,
  error,
  helperText,
  feedback = true,
  style,
  testID,
}: CheckboxGroupProps) => {
  const { theme } = useTheme();
  const toggle = (optionValue: any) =>
    onChange(
      value.includes(optionValue)
        ? value.filter((item) => item !== optionValue)
        : [...value, optionValue],
    );

  return (
    <FormControl
      label={label}
      error={error}
      helperText={helperText}
      required={required}
      style={style}
      testID={testID}
    >
      <View
        role="group"
        accessibilityLabel={label}
        style={{ flexDirection: direction, flexWrap: "wrap" }}
      >
        {options.map((option, index) => (
          <View
            key={index}
            style={
              direction === "row" ? { marginRight: theme.spacing.m } : undefined
            }
          >
            <Checkbox
              label={option.label}
              checked={value.includes(option.value)}
              onValueChange={() => toggle(option.value)}
              disabled={disabled || option.disabled}
              error={!!error}
              feedback={feedback}
            />
          </View>
        ))}
      </View>
    </FormControl>
  );
};

export default CheckboxGroup;
