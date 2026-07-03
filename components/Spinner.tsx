import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  ViewStyle,
  TextStyle,
} from "react-native";

import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme, Theme, getGlowStyles } from "../providers/ThemeProvider";
import { PressableState } from "./types";

interface SpinnerProps {
  label?: string;
  value: number;
  onChange: (val: number) => void;
  step?: number;
  min?: number;
  max?: number;
  disabled?: boolean;
}

const Spinner = ({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  max = 100,
  disabled,
}: SpinnerProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [text, setText] = useState(String(value));
  const [prevValue, setPrevValue] = useState(value);
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  // Keep the editable text in sync with external value changes
  // (render-time adjustment instead of an effect)
  if (prevValue !== value) {
    setPrevValue(value);
    setText(String(value));
  }

  const commitText = useCallback(() => {
    const num = parseInt(text, 10);
    const clamped = isNaN(num) ? min : Math.min(max, Math.max(min, num));
    setText(String(clamped));
    if (clamped !== value) onChange(clamped);
  }, [text, min, max, value, onChange]);

  const handleIncrement = useCallback(() => {
    if (value + step <= max) onChange(value + step);
  }, [value, step, max, onChange]);

  const handleDecrement = useCallback(() => {
    if (value - step >= min) onChange(value - step);
  }, [value, step, min, onChange]);

  return (
    <View style={styles.wrapper}>
      {label && (
        <Text
          style={[
            theme.typography.labelMedium,
            styles.staticLabel,
            {
              color: isFocused
                ? theme.colors.primary
                : theme.colors.onSurfaceVariant,
            },
          ]}
        >
          {label}
        </Text>
      )}

      <View style={[styles.container, getGlowStyles(theme, isFocused)]}>
        <Pressable
          onPress={handleDecrement}
          accessibilityRole="button"
          accessibilityLabel={`Decrement ${label || "value"}`}
          disabled={disabled || value - step < min}
          style={({ hovered }: PressableState) => [
            styles.button,
            {
              backgroundColor: hovered
                ? theme.colors.surfaceContainerHigh
                : "transparent",
            },
          ]}
        >
          <Icons
            name="minus"
            size={20}
            color={
              disabled || value - step < min
                ? theme.colors.onSurfaceVariant
                : theme.colors.primary
            }
          />
        </Pressable>

        <View style={styles.inputWrapper}>
          <TextInput
            accessibilityLabel={label}
            accessibilityState={{ disabled }}
            accessibilityValue={{ text: String(value) }}
            keyboardType="numeric"
            value={text}
            onChangeText={(txt) => {
              // Allow intermediate states like "" or "-" while typing
              if (/^-?\d*$/.test(txt)) setText(txt);
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => {
              setIsFocused(false);
              commitText();
            }}
            onSubmitEditing={commitText}
            style={[
              theme.typography.bodyLarge,
              styles.input,
              { color: theme.colors.onSurface },
            ]}
            textAlign="center"
            placeholder="0"
            underlineColorAndroid="transparent"
            placeholderTextColor={theme.colors.onSurfaceVariant}
            editable={!disabled}
          />
        </View>

        <Pressable
          onPress={handleIncrement}
          accessibilityRole="button"
          accessibilityLabel={`Increment ${label || "value"}`}
          disabled={disabled || value + step > max}
          style={({ hovered }: PressableState) => [
            styles.button,
            {
              backgroundColor: hovered
                ? theme.colors.surfaceContainerHigh
                : "transparent",
            },
          ]}
        >
          <Icons
            name="plus"
            size={20}
            color={
              disabled || value + step > max
                ? theme.colors.onSurfaceVariant
                : theme.colors.primary
            }
          />
        </Pressable>
      </View>
    </View>
  );
};

export default Spinner;

type SpinnerStyles = {
  wrapper: ViewStyle;
  staticLabel: TextStyle;
  container: ViewStyle;
  inputWrapper: ViewStyle;
  input: TextStyle;
  button: ViewStyle;
};

const makeStyles: (theme: Theme) => StyleSheet.NamedStyles<SpinnerStyles> = (
  theme: Theme,
) =>
  StyleSheet.create({
    wrapper: {
      marginBottom: 20,
      width: 160, // Spinners are usually narrower than standard inputs
    },
    staticLabel: {
      marginBottom: 8,
      marginLeft: 4,
      fontWeight: "500",
    },
    container: {
      height: 52,
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 12,
      borderWidth: 1,
      overflow: "hidden",
      backgroundColor: theme.colors.surface,
    },
    inputWrapper: {
      flex: 1,
      height: "100%",
      justifyContent: "center",
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: theme.colors.outlineVariant,
    },
    input: {
      height: "100%",
      width: "100%",
      textAlign: "center",
      fontSize: 18,
      paddingHorizontal: 0,
      margin: 0,
      ...Platform.select({
        web: {
          outlineStyle: "none",
          // Removes arrows/spinners in browsers like Chrome/Safari
          appearance: "none",
        },
      }),
    },
    button: {
      width: 48,
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
    },
  });
