import React, { useMemo } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { useTheme, getGlowStyles } from "../providers/ThemeProvider";
import { useInteractionFeedback } from "../providers/InteractionFeedback";
import SelectionControl from "./internal/SelectionControl";

export interface RadioButtonProps {
  label?: string;
  labelPosition?: "left" | "right";
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  error?: boolean;
  /**
   * Report the selection to `ThemeProvider`'s `onInteractionFeedback` (haptics).
   * Defaults to true.
   */
  feedback?: boolean;
}

const RadioButton = ({
  label,
  labelPosition = "right",
  selected,
  onPress,
  disabled,
  error,
  feedback = true,
}: RadioButtonProps) => {
  const { theme } = useTheme();
  const emitFeedback = useInteractionFeedback(feedback);

  const radioColor = useMemo(
    () =>
      error
        ? theme.colors.error
        : selected
          ? theme.colors.primary
          : theme.colors.onSurfaceVariant,
    [error, selected, theme.colors],
  );

  return (
    <SelectionControl
      label={label}
      labelPosition={labelPosition}
      onPress={() => {
        emitFeedback("selection");
        onPress();
      }}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
    >
      {(active) => (
        <View
          style={[
            styles.circle,
            { borderColor: radioColor },
            active && getGlowStyles(theme, true, error ? "error" : undefined),
            active && { borderRadius: 10 },
          ]}
        >
          {selected && (
            <View style={[styles.dot, { backgroundColor: radioColor }]} />
          )}
        </View>
      )}
    </SelectionControl>
  );
};

export interface RadioOption {
  id: string;
  label: string;
  value: any;
  /** Disables only this option. */
  disabled?: boolean;
}

export interface RadioGroupProps {
  label?: string;
  options: RadioOption[];
  value: any;
  onValueChange: (value: any) => void;
  direction?: "column" | "row";
  disabled?: boolean;
  error?: string;
  /**
   * Report each selection to `ThemeProvider`'s `onInteractionFeedback` (haptics).
   * Defaults to true.
   */
  feedback?: boolean;
}

export const RadioGroup = ({
  label,
  options,
  value,
  onValueChange,
  direction = "column",
  disabled,
  error,
  feedback = true,
}: RadioGroupProps) => {
  const { theme } = useTheme();

  return (
    <View
      accessibilityRole={(Platform.OS === "web" ? "radiogroup" : "none") as any}
    >
      {!!label && (
        <Text
          style={[
            theme.typography.bodySmall,
            { color: theme.colors.primary, marginBottom: 4, marginLeft: 4 },
          ]}
        >
          {label}
        </Text>
      )}
      <View style={{ flexDirection: direction, flexWrap: "wrap" }}>
        {options.map((option) => (
          <View
            key={option.id}
            style={direction === "row" && { marginRight: 16 }}
          >
            <RadioButton
              label={option.label}
              selected={value === option.value}
              onPress={() => onValueChange(option.value)}
              disabled={disabled || option.disabled}
              error={!!error}
              feedback={feedback}
            />
          </View>
        ))}
      </View>
      {!!error && (
        <Text
          style={[
            theme.typography.bodySmall,
            { color: theme.colors.error, marginTop: 4, marginLeft: 16 },
          ]}
        >
          {error}
        </Text>
      )}
    </View>
  );
};

export default RadioButton;

const styles = StyleSheet.create({
  circle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
