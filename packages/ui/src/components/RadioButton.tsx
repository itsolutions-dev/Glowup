import React, { useMemo } from "react";
import { Pressable, View, Text, StyleSheet, Platform } from "react-native";
import { useTheme, getGlowStyles } from "../providers/ThemeProvider";
import { PressableState } from "./types";

interface RadioButtonProps {
  label?: string;
  labelPosition?: "left" | "right";
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
  error?: boolean;
}

const RadioButton = ({
  label,
  labelPosition = "right",
  selected,
  onPress,
  disabled,
  error,
}: RadioButtonProps) => {
  const { theme } = useTheme();

  const radioColor = useMemo(
    () =>
      error
        ? theme.colors.error
        : selected
          ? theme.colors.primary
          : theme.colors.onSurfaceVariant,
    [error, selected, theme.colors],
  );

  const labelComponent = useMemo(() => {
    if (!label) return null;

    return (
      <Text
        style={[
          theme.typography.bodyLarge,
          { color: theme.colors.onSurface },
          labelPosition === "left" ? { marginRight: 12 } : { marginLeft: 12 },
        ]}
      >
        {label}
      </Text>
    );
  }, [label, labelPosition, theme.typography, theme.colors]);

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      style={[styles.wrapper, { opacity: disabled ? 0.38 : 1 }]}
    >
      {({ hovered, pressed }: PressableState) => (
        <>
          {labelPosition === "left" && labelComponent}

          <View style={styles.container}>
            {/* State Layer (Hover/Pressed Effect) */}
            <View
              style={[
                styles.stateLayer,
                {
                  backgroundColor: pressed
                    ? theme.colors.primary
                    : hovered
                      ? theme.colors.onSurface
                      : "transparent",
                  opacity: pressed ? 0.12 : hovered ? 0.08 : 0,
                },
              ]}
            />

            {/* The Actual Radio */}
            <View
              style={[
                styles.circle,
                { borderColor: radioColor },
                (hovered || pressed) &&
                  getGlowStyles(theme, true, error ? "error" : undefined),
                (hovered || pressed) && { borderRadius: 10 },
              ]}
            >
              {selected && (
                <View style={[styles.dot, { backgroundColor: radioColor }]} />
              )}
            </View>
          </View>

          {labelPosition === "right" && labelComponent}
        </>
      )}
    </Pressable>
  );
};

export interface RadioOption {
  id: string;
  label: string;
  value: any;
  /** Disables only this option. */
  disabled?: boolean;
}

interface RadioGroupProps {
  label?: string;
  options: RadioOption[];
  value: any;
  onValueChange: (value: any) => void;
  direction?: "column" | "row";
  disabled?: boolean;
  error?: string;
}

export const RadioGroup = ({
  label,
  options,
  value,
  onValueChange,
  direction = "column",
  disabled,
  error,
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
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    alignSelf: "flex-start",
    ...Platform.select({
      web: { cursor: "pointer" },
    }),
  },
  container: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  stateLayer: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
  },
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
