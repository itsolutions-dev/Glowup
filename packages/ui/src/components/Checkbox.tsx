import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import Icons from "./Glyph";
import { useTheme, getGlowStyles } from "../providers/ThemeProvider";
import { useInteractionFeedback } from "../providers/InteractionFeedback";
import SelectionControl from "./internal/SelectionControl";

export interface CheckboxProps {
  label?: string;
  labelPosition?: "left" | "right";
  checked: boolean;
  /** Mixed state (e.g. "select all" with partial selection); overrides the checkmark. */
  indeterminate?: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  error?: boolean;
  /**
   * Report the toggle to `ThemeProvider`'s `onInteractionFeedback` (haptics).
   * Defaults to true.
   */
  feedback?: boolean;
}

const Checkbox = ({
  label,
  labelPosition = "right",
  checked,
  indeterminate,
  onValueChange,
  disabled,
  error,
  feedback = true,
}: CheckboxProps) => {
  const { theme } = useTheme();
  const emitFeedback = useInteractionFeedback(feedback);

  const filled = checked || !!indeterminate;

  const checkboxColor = useMemo(
    () =>
      error
        ? theme.colors.error
        : filled
          ? theme.colors.primary
          : theme.colors.onSurfaceVariant,
    [error, filled, theme.colors],
  );

  return (
    <SelectionControl
      label={label}
      labelPosition={labelPosition}
      onPress={() => {
        emitFeedback("toggle");
        onValueChange(!checked);
      }}
      accessibilityRole="checkbox"
      accessibilityState={{
        checked: indeterminate ? "mixed" : checked,
        disabled,
      }}
      disabled={disabled}
    >
      {(active) => (
        <View
          style={[
            styles.box,
            {
              borderColor: checkboxColor,
              backgroundColor: filled ? checkboxColor : "transparent",
              borderWidth: filled ? 0 : 2,
            },
            active && getGlowStyles(theme, true, error ? "error" : undefined),
          ]}
        >
          {filled && (
            <Icons
              name={indeterminate ? "minus" : "check"}
              size={14}
              color={theme.colors.onPrimary}
            />
          )}
        </View>
      )}
    </SelectionControl>
  );
};

export default Checkbox;

const styles = StyleSheet.create({
  box: {
    width: 18,
    height: 18,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
