import React, { useMemo } from "react";
import { Pressable, View, Text, StyleSheet, Platform } from "react-native";
import Icons from "expo-vector-icons/MaterialCommunityIcons";
import { useTheme, getGlowStyles } from "../providers/ThemeProvider";

interface CheckboxProps {
  label?: string;
  labelPosition?: "left" | "right";
  checked: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  error?: boolean;
}

const Checkbox = ({
  label,
  labelPosition = "right",
  checked,
  onValueChange,
  disabled,
  error,
}: CheckboxProps) => {
  const { theme } = useTheme();

  const checkboxColor = useMemo(
    () =>
      error
        ? theme.colors.error
        : checked
          ? theme.colors.primary
          : theme.colors.onSurfaceVariant,
    [error, checked, theme.colors],
  );

  const labelComponent = useMemo(() => {
    if (!label) return null;

    return (
      <Text
        style={[
          theme.typography.bodyLarge,
          { color: theme.colors.onSurface, marginLeft: 12 },
        ]}
      >
        {label}
      </Text>
    );
  }, [label, theme.typography, theme.colors]);

  return (
    <Pressable
      onPress={() => onValueChange(!checked)}
      accessibilityLabel={label}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled }}
      disabled={disabled}
      style={({ hovered, pressed }) => [
        styles.wrapper,
        { opacity: disabled ? 0.38 : 1 },
      ]}
    >
      {({ hovered, pressed }) => (
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

            {/* The Actual Box */}
            <View
              style={[
                styles.box,
                {
                  borderColor: checkboxColor,
                  backgroundColor: checked ? checkboxColor : "transparent",
                  borderWidth: checked ? 0 : 2,
                },
                (hovered || pressed) &&
                  getGlowStyles(theme, true, error ? "error" : undefined),
              ]}
            >
              {checked && (
                <Icons name="check" size={14} color={theme.colors.onPrimary} />
              )}
            </View>
          </View>

          {labelPosition === "right" && labelComponent}
        </>
      )}
    </Pressable>
  );
};

export default Checkbox;

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
  box: {
    width: 18,
    height: 18,
    borderRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
