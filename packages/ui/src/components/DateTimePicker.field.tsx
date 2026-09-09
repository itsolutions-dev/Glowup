import React, { forwardRef, useMemo } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import { Theme, useTheme, getGlowStyles } from "../providers/ThemeProvider";
import { MaterialCommunityIconsGlyphs, PressableState } from "./types";

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
  onPress?: () => void;
  accessibilityLabel?: string;
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
      style,
      testID,
      children,
    },
    ref,
  ) => {
    const { theme } = useTheme();
    const styles = useMemo(() => makeStyles(theme), [theme]);
    const activeColor = error ? theme.colors.error : theme.colors.primary;
    const hasValue = displayValue.length > 0;
    const showClear = clearable && hasValue && !disabled && !!onClear;

    return (
      <View style={[styles.wrapper, style]} testID={testID}>
        {!!label && (
          <Text
            style={[
              theme.typography.bodySmall,
              styles.label,
              {
                color: active ? activeColor : theme.colors.onSurfaceVariant,
              },
            ]}
          >
            {required ? `${label} *` : label}
          </Text>
        )}

        <Pressable
          ref={ref}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel ?? label}
          accessibilityValue={{ text: displayValue }}
          accessibilityState={{ disabled, expanded: active }}
          disabled={disabled}
          onPress={onPress}
          style={[
            styles.container,
            getGlowStyles(theme, !!active, error),
            disabled && styles.disabled,
          ]}
        >
          <View style={styles.content}>
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
          </View>

          {showClear && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={clearAccessibilityLabel}
              onPress={onClear}
              hitSlop={8}
              style={({ hovered }: PressableState) => [
                styles.clearButton,
                hovered && {
                  backgroundColor: theme.colors.surfaceContainerHighest,
                },
              ]}
            >
              <Icons
                name="close"
                size={18}
                color={theme.colors.onSurfaceVariant}
              />
            </Pressable>
          )}

          <Icons
            name={icon}
            size={20}
            color={error ? theme.colors.error : theme.colors.onSurfaceVariant}
          />
          {children}
        </Pressable>

        {!!error && (
          <Text
            style={[
              theme.typography.bodySmall,
              styles.supportingText,
              { color: theme.colors.error },
            ]}
          >
            {error}
          </Text>
        )}
        {!error && !!helperText && (
          <Text
            style={[
              theme.typography.bodySmall,
              styles.supportingText,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {helperText}
          </Text>
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
    content: { flex: 1, justifyContent: "center" },
    clearButton: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    disabled: { opacity: 0.38 },
    supportingText: {
      marginTop: theme.spacing.xs,
      marginLeft: theme.spacing.m,
    },
  });
