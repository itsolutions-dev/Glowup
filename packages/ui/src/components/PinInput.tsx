import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Platform,
  StyleSheet,
  StyleProp,
  ViewStyle,
  NativeSyntheticEvent,
  TextInputKeyPressEventData,
} from "react-native";
import { Theme, useTheme, getGlowStyles } from "../providers/ThemeProvider";
import HelperText from "./HelperText";

export interface PinInputProps {
  /** Number of cells. Defaults to 6. */
  length?: number;
  value: string;
  onChangeText: (value: string) => void;
  /** Fired once the last cell is filled. */
  onComplete?: (value: string) => void;
  /** Renders dots instead of characters. */
  mask?: boolean;
  /** Restricts the accepted characters. Defaults to `"numeric"`. */
  type?: "numeric" | "alphanumeric";
  label?: string;
  error?: string;
  /** Supporting text below the cells; hidden while an error is shown. */
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Cell edge length. Defaults to 48. */
  cellSize?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

const PATTERNS: Record<NonNullable<PinInputProps["type"]>, RegExp> = {
  numeric: /[^0-9]/g,
  alphanumeric: /[^0-9a-zA-Z]/g,
};

/**
 * One-time-code / PIN entry: a row of single-character cells that behaves like
 * one field. Typing advances, Backspace retreats, and pasting a whole code
 * into any cell fills the row.
 */
const PinInput = ({
  length = 6,
  value,
  onChangeText,
  onComplete,
  mask = false,
  type = "numeric",
  label,
  error,
  helperText,
  required,
  disabled,
  autoFocus,
  cellSize = 48,
  style,
  testID,
}: PinInputProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const inputs = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const sanitize = (raw: string) =>
    raw.replace(PATTERNS[type], "").slice(0, length);
  const characters = value.slice(0, length).split("");

  // Report completion once, on the transition into a full code.
  const wasComplete = useRef(value.length >= length);
  useEffect(() => {
    const complete = value.length >= length;
    if (complete && !wasComplete.current) onComplete?.(value);
    wasComplete.current = complete;
  }, [value, length, onComplete]);

  const focusCell = (index: number) => {
    if (index < 0 || index >= length) return;
    inputs.current[index]?.focus();
  };

  const handleChange = (index: number, raw: string) => {
    const cleaned = sanitize(raw);
    if (!cleaned) return;

    if (cleaned.length > 1) {
      // Paste (or an autofilled SMS code): spread it from this cell onward.
      const next = (value.slice(0, index) + cleaned).slice(0, length);
      onChangeText(next);
      focusCell(Math.min(next.length, length - 1));
      return;
    }

    const chars = value.padEnd(length, " ").split("");
    chars[index] = cleaned;
    onChangeText(chars.join("").trimEnd().slice(0, length));
    focusCell(index + 1);
  };

  const handleKeyPress = (
    index: number,
    event: NativeSyntheticEvent<TextInputKeyPressEventData>,
  ) => {
    if (event.nativeEvent.key !== "Backspace") return;
    if (characters[index]) {
      // Clear this cell but stay put, matching native OTP fields.
      const chars = value.split("");
      chars.splice(index, 1);
      onChangeText(chars.join(""));
      return;
    }
    focusCell(index - 1);
  };

  return (
    <View style={[styles.wrapper, style]} testID={testID}>
      {!!label && (
        <Text
          style={[
            theme.typography.bodySmall,
            styles.label,
            {
              color: error ? theme.colors.error : theme.colors.onSurfaceVariant,
            },
          ]}
        >
          {required ? `${label} *` : label}
        </Text>
      )}

      <View style={styles.row}>
        {Array.from({ length }, (_, index) => {
          const character = characters[index] ?? "";
          const filled = character.length > 0;
          return (
            <TextInput
              key={index}
              ref={(instance) => {
                inputs.current[index] = instance;
              }}
              value={mask && filled ? "•" : character}
              onChangeText={(raw) => handleChange(index, raw)}
              onKeyPress={(event) => handleKeyPress(index, event)}
              onFocus={() => setFocusedIndex(index)}
              onBlur={() => setFocusedIndex(null)}
              editable={!disabled}
              autoFocus={autoFocus && index === 0}
              keyboardType={type === "numeric" ? "number-pad" : "default"}
              autoCapitalize="characters"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              // Not maxLength={1}: a longer string has to reach onChangeText
              // for paste and SMS autofill to work.
              selectTextOnFocus
              accessibilityLabel={`${label ?? "Code"} ${index + 1}/${length}`}
              accessibilityState={{ disabled: !!disabled }}
              style={[
                styles.cell,
                theme.typography.titleLarge,
                {
                  width: cellSize,
                  height: cellSize,
                  color: theme.colors.onSurface,
                },
                getGlowStyles(theme, focusedIndex === index, error),
                filled && !error && { borderColor: theme.colors.primary },
                disabled && styles.disabled,
              ]}
            />
          );
        })}
      </View>

      {!!(error || helperText) && (
        <HelperText
          type={error ? "error" : "info"}
          padding="none"
          containerStyle={styles.supportingText}
        >
          {error || helperText}
        </HelperText>
      )}
    </View>
  );
};

export default PinInput;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    wrapper: { marginBottom: theme.spacing.m },
    label: { marginBottom: theme.spacing.xs, marginLeft: theme.spacing.xs },
    row: { flexDirection: "row", gap: theme.spacing.s },
    cell: {
      textAlign: "center",
      borderRadius: theme.shape.medium,
      backgroundColor: theme.colors.surface,
      // Suppress the browser focus ring; getGlowStyles draws the M3 one.
      ...Platform.select({ web: { outlineWidth: 0 } }),
    },
    disabled: { opacity: 0.38 },
    supportingText: {
      marginLeft: theme.spacing.xs,
    },
  });
