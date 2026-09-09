import React, { createContext, useContext, useMemo } from "react";
import { View, Text, StyleSheet, StyleProp, ViewStyle } from "react-native";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import { Theme, useTheme } from "../providers/ThemeProvider";

interface FormControlState {
  invalid: boolean;
  disabled: boolean;
  required: boolean;
}

const FormControlContext = createContext<FormControlState | null>(null);

/**
 * Reads the surrounding `FormControl` state. Returns `null` outside one, so a
 * component can stay usable standalone.
 */
export const useFormControl = () => useContext(FormControlContext);

export interface FormControlProps {
  children: React.ReactNode;
  label?: string;
  /** Supporting text below the control; hidden while `error` is set. */
  helperText?: string;
  /** Error text below the control. Its presence marks the group invalid. */
  error?: string;
  required?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Groups a label, a control and its supporting text, and shares the
 * invalid/disabled/required state with descendants via `useFormControl`.
 * Use it for controls that have no `label`/`error` props of their own —
 * Checkbox, RadioGroup, Slider, a custom composite — so every field on a form
 * lines up the same way.
 */
const FormControl = ({
  children,
  label,
  helperText,
  error,
  required = false,
  disabled = false,
  style,
  testID,
}: FormControlProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const state = useMemo<FormControlState>(
    () => ({ invalid: !!error, disabled, required }),
    [error, disabled, required],
  );

  return (
    <FormControlContext.Provider value={state}>
      <View style={[styles.wrapper, style]} testID={testID}>
        {!!label && (
          <Text
            style={[
              theme.typography.bodySmall,
              styles.label,
              {
                color: error
                  ? theme.colors.error
                  : theme.colors.onSurfaceVariant,
              },
            ]}
          >
            {required ? `${label} *` : label}
          </Text>
        )}

        <View style={disabled && styles.disabled}>{children}</View>

        {!!error && (
          <View style={styles.supportingRow}>
            <Icons
              name="alert-circle-outline"
              size={14}
              color={theme.colors.error}
            />
            <Text
              style={[
                theme.typography.bodySmall,
                { color: theme.colors.error },
              ]}
            >
              {error}
            </Text>
          </View>
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
    </FormControlContext.Provider>
  );
};

export default FormControl;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    wrapper: { marginBottom: theme.spacing.m, width: "100%" },
    label: { marginBottom: theme.spacing.xs, marginLeft: theme.spacing.xs },
    disabled: { opacity: 0.38 },
    supportingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
      marginTop: theme.spacing.xs,
      marginLeft: theme.spacing.m,
    },
    supportingText: {
      marginTop: theme.spacing.xs,
      marginLeft: theme.spacing.m,
    },
  });
