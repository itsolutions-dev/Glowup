import React, { useCallback, useMemo, useState } from "react";
import { View, Text, TextInput, StyleSheet, Platform } from "react-native";
import Icons, {
  MaterialCommunityIconsGlyphs,
} from "expo-vector-icons/MaterialCommunityIcons";
import { Theme, useTheme, getGlowStyles } from "../providers/ThemeProvider";

interface InputProps {
  label?: string;
  placeholder?: string;
  precision?: number;
  prefix?: string;
  suffix?: string;
  value: string;
  type?: "text" | "number";
  maxLength?: number;
  onChangeText: (text: string) => void;
  variant?: "outlined" | "filled";
  error?: string;
  disabled?: boolean;
  readonly?: boolean;
  secureTextEntry?: boolean;
  leadingIcon?: MaterialCommunityIconsGlyphs;
  trailingIcon?: MaterialCommunityIconsGlyphs;
  onTrailingIconPress?: () => void;
  multiline?: boolean;
  numberOfLines?: number;
  minHeight?: number;
}

const Input = ({
  type = "text",
  label,
  placeholder,
  precision,
  prefix,
  suffix,
  value,
  maxLength,
  onChangeText,
  variant = "outlined",
  error,
  disabled,
  readonly,
  secureTextEntry,
  leadingIcon,
  trailingIcon,
  onTrailingIconPress,
  multiline = false,
  numberOfLines = 4,
  minHeight = 56,
}: InputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const activeColor = !!error ? theme.colors.error : theme.colors.primary;
  const idleColor = !!error ? theme.colors.error : theme.colors.outline;

  const handleTextChange = useCallback(
    (text: string) => {
      if (type === "number") {
        // Allow only numbers and one decimal point
        let cleaned = text.replace(/[^0-9.]/g, "");
        const parts = cleaned.split(".");

        // Prevent multiple decimals
        if (parts.length > 2)
          cleaned = parts[0] + "." + parts.slice(1).join("");

        // Handle precision (e.g., only 2 decimal places for currency)
        if (precision !== undefined && parts[1]?.length > precision) {
          cleaned = `${parts[0]}.${parts[1].substring(0, precision)}`;
        }
        onChangeText(cleaned);
      } else {
        onChangeText(text);
      }
    },
    [type, precision, onChangeText],
  );

  const dynamicStyles = useMemo(
    () => getGlowStyles(theme, isFocused, error),
    [isFocused, theme, error],
  );

  return (
    <View style={styles.wrapper}>
      {label && variant === "outlined" && (
        <Text
          style={[
            theme.typography.bodySmall,
            {
              color: isFocused ? activeColor : theme.colors.onSurfaceVariant,
              marginBottom: 4,
              marginLeft: 4,
            },
          ]}
        >
          {label}
        </Text>
      )}

      <View style={[styles.inputContainer, dynamicStyles]}>
        {prefix ? (
          <Text
            style={[styles.affix, { color: theme.colors.onSurfaceVariant }]}
          >
            {prefix}
          </Text>
        ) : (
          leadingIcon && (
            <Icons
              name={leadingIcon}
              size={20}
              color={theme.colors.onSurfaceVariant}
              style={styles.iconLeft}
            />
          )
        )}

        <View style={styles.textInputWrapper}>
          {label && variant === "filled" && (
            <Text
              style={[
                theme.typography.labelSmall,
                {
                  color: isFocused
                    ? activeColor
                    : theme.colors.onSurfaceVariant,
                },
              ]}
            >
              {label}
            </Text>
          )}

          <TextInput
            accessibilityLabel={label}
            accessibilityRole={Platform.OS === "web" ? "textbox" : "none"}
            accessibilityState={{ isFocused }}
            accessibilityValue={{ value }}
            accessibilityHint={placeholder}
            multiline={multiline}
            numberOfLines={numberOfLines}
            readOnly={readonly}
            disabled={disabled}
            accessible={!disabled}
            maxLength={maxLength}
            style={[
              styles.textInput,
              theme.typography.bodyLarge,
              {
                color: theme.colors.onSurface,
                paddingVertical: variant === "filled" ? 2 : 12,
                textAlign: type === "number" ? "right" : "left",
              },
            ]}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            value={value}
            onChangeText={handleTextChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            editable={!disabled}
            secureTextEntry={secureTextEntry}
            keyboardType={type === "number" ? "decimal-pad" : "default"}
          />
        </View>

        {suffix ? (
          <Text
            style={[styles.affix, { color: theme.colors.onSurfaceVariant }]}
          >
            {suffix}
          </Text>
        ) : (
          trailingIcon && (
            <Icons
              name={trailingIcon}
              size={20}
              color={
                !!error ? theme.colors.error : theme.colors.onSurfaceVariant
              }
              onPress={onTrailingIconPress}
              style={styles.iconRight}
            />
          )
        )}
      </View>

      {(error || placeholder) && (
        <Text
          style={[
            theme.typography.bodySmall,
            {
              color: !!error
                ? theme.colors.error
                : theme.colors.onSurfaceVariant,
              marginTop: 4,
              marginLeft: 16,
            },
          ]}
        >
          {error || ""}
        </Text>
      )}
    </View>
  );
};

export default Input;

const makeStyles: (theme: Theme) => StyleSheet.NamedStyles<any> = (
  theme: Theme,
) =>
  StyleSheet.create({
    wrapper: {
      marginBottom: 20,
      width: "100%",
    },
    staticLabel: {
      marginBottom: 8,
      marginLeft: 4,
      fontWeight: "500",
    },
    inputContainer: {
      minHeight: 52,
      borderRadius: 12,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surface,
    },

    textInput: {
      flex: 1,
      paddingVertical: 8,
      ...Platform.select({
        web: { outlineStyle: "none" },
      }),
    },
    outlined: {
      borderRadius: 4,
    },
    filled: {
      borderTopLeftRadius: 4,
      borderTopRightRadius: 4,
      borderBottomWidth: 1,
    },
    textInputWrapper: {
      flex: 1,
      paddingVertical: Platform.OS === "ios" ? 8 : 0, // iOS needs a bit of padding for multiline
    },
    iconLeft: {
      marginRight: 12,
      borderRightWidth: 1,
      height: "100%",
      borderColor: theme.colors.outlineVariant,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      paddingRight: 12,
    },
    iconRight: {
      marginLeft: 12,
      borderLeftWidth: 1,
      height: "100%",
      borderColor: theme.colors.outlineVariant,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      paddingLeft: 12,
    },
    affix: {
      paddingHorizontal: 4,
      fontSize: 16,
      fontWeight: "400",
      textAlignVertical: "center",
    },
  });
