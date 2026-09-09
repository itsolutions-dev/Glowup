import React, { forwardRef, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import { Theme, useTheme, getGlowStyles } from "../providers/ThemeProvider";
import { MaterialCommunityIconsGlyphs, PressableState } from "./types";
import HelperText from "./HelperText";

export interface PickerFieldProps {
  label?: string;
  required?: boolean;
  /** Formatted value; falls back to `placeholder` when empty. */
  displayValue: string;
  placeholder?: string;
  icon: MaterialCommunityIconsGlyphs;
  /** Renders the field in its open/focused state. */
  active?: boolean;
  disabled?: boolean;
  error?: string;
  helperText?: string;
  clearable?: boolean;
  onClear?: () => void;
  clearAccessibilityLabel?: string;
  /** Opens the picker. Bound to the whole row, or to the icon when editable. */
  onPress?: () => void;
  accessibilityLabel?: string;
  /**
   * Turns the value area into a text field. The trailing icon keeps opening the
   * picker, so typing and picking stay available at the same time.
   */
  editable?: boolean;
  /** Text shown in the input while editable; ignored otherwise. */
  inputValue?: string;
  onInputChange?: (text: string) => void;
  onInputBlur?: () => void;
  /** Typing hint, e.g. "DD/MM/YYYY". */
  inputPlaceholder?: string;
  /** Label of the trailing icon button in editable mode. */
  openAccessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
  /** Rendered inside the field container — used by the web hidden input. */
  children?: React.ReactNode;
}

/**
 * The trigger row shared by every date/time picker surface: label, value or
 * placeholder, trailing icon, optional clear button, error/helper text.
 * Mirrors `Input`'s outlined variant so pickers line up with text fields.
 */
const PickerField = forwardRef<View, PickerFieldProps>(
  (
    {
      label,
      required,
      displayValue,
      placeholder,
      icon,
      active,
      disabled,
      error,
      helperText,
      clearable,
      onClear,
      clearAccessibilityLabel,
      onPress,
      accessibilityLabel,
      editable,
      inputValue,
      onInputChange,
      onInputBlur,
      inputPlaceholder,
      openAccessibilityLabel,
      style,
      testID,
      children,
    },
    ref,
  ) => {
    const { theme } = useTheme();
    const styles = useMemo(() => makeStyles(theme), [theme]);
    const [focused, setFocused] = useState(false);
    const activeColor = error ? theme.colors.error : theme.colors.primary;
    const hasValue = displayValue.length > 0;
    const showClear = clearable && hasValue && !disabled && !!onClear;
    const highlighted = !!active || focused;

    const openButton = (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={openAccessibilityLabel ?? label}
        accessibilityState={{ disabled, expanded: active }}
        disabled={disabled}
        onPress={onPress}
        hitSlop={8}
        style={({ hovered }: PressableState) => [
          styles.iconButton,
          hovered && { backgroundColor: theme.colors.surfaceContainerHighest },
        ]}
      >
        <Icons
          name={icon}
          size={20}
          color={error ? theme.colors.error : theme.colors.onSurfaceVariant}
        />
      </Pressable>
    );

    const body = (
      <View style={styles.content}>
        {editable ? (
          <TextInput
            accessibilityLabel={accessibilityLabel ?? label}
            editable={!disabled}
            value={inputValue}
            onChangeText={onInputChange}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              onInputBlur?.();
            }}
            placeholder={inputPlaceholder ?? placeholder}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            style={[
              theme.typography.bodyLarge,
              styles.input,
              { color: theme.colors.onSurface },
            ]}
          />
        ) : (
          <Text
            numberOfLines={1}
            style={[
              theme.typography.bodyLarge,
              {
                color: hasValue
                  ? theme.colors.onSurface
                  : theme.colors.onSurfaceVariant,
              },
            ]}
          >
            {hasValue ? displayValue : (placeholder ?? "")}
          </Text>
        )}
      </View>
    );

    // Sibling of the trigger, never a child of it: a Pressable renders a
    // <button> on web, and a button cannot contain another button.
    const clearButton = showClear && (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={clearAccessibilityLabel}
        onPress={onClear}
        hitSlop={8}
        style={({ hovered }: PressableState) => [
          styles.iconButton,
          hovered && {
            backgroundColor: theme.colors.surfaceContainerHighest,
          },
        ]}
      >
        <Icons name="close" size={18} color={theme.colors.onSurfaceVariant} />
      </Pressable>
    );

    const containerStyle = [
      styles.container,
      getGlowStyles(theme, highlighted, error),
      disabled && styles.disabled,
    ];

    return (
      <View style={[styles.wrapper, style]} testID={testID}>
        {!!label && (
          <Text
            style={[
              theme.typography.bodySmall,
              styles.label,
              {
                color: highlighted
                  ? activeColor
                  : theme.colors.onSurfaceVariant,
              },
            ]}
          >
            {required ? `${label} *` : label}
          </Text>
        )}

        {/* A text field cannot live inside a Pressable without swallowing its
            own taps, so editable fields open the picker from the icon only. */}
        {editable ? (
          <View ref={ref} style={containerStyle}>
            {body}
            {clearButton}
            {openButton}
            {children}
          </View>
        ) : (
          <View ref={ref} style={containerStyle}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={accessibilityLabel ?? label}
              accessibilityValue={{ text: displayValue }}
              accessibilityState={{ disabled, expanded: active }}
              disabled={disabled}
              onPress={onPress}
              style={styles.trigger}
            >
              {body}
              <Icons
                name={icon}
                size={20}
                color={
                  error ? theme.colors.error : theme.colors.onSurfaceVariant
                }
              />
            </Pressable>
            {clearButton}
            {children}
          </View>
        )}

        {!!(error || helperText) && (
          <HelperText type={error ? "error" : "info"}>
            {error || helperText}
          </HelperText>
        )}
      </View>
    );
  },
);

PickerField.displayName = "PickerField";

export default PickerField;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    wrapper: { marginBottom: theme.spacing.m, width: "100%" },
    label: { marginBottom: theme.spacing.xs, marginLeft: theme.spacing.xs },
    container: {
      minHeight: 52,
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.s,
      borderRadius: theme.shape.medium,
      paddingHorizontal: theme.spacing.m,
      backgroundColor: theme.colors.surface,
    },
    trigger: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.s,
      alignSelf: "stretch",
    },
    content: { flex: 1, justifyContent: "center" },
    input: { paddingVertical: 0, outlineStyle: "none" } as any,
    iconButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    disabled: { opacity: 0.38 },
  });
