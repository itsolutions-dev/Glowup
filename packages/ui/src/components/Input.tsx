import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
  Platform,
  StyleProp,
  ViewStyle,
} from "react-native";
import Icons from "./Glyph";
import { Theme, useTheme, getGlowStyles } from "../providers/ThemeProvider";
import { MaterialCommunityIconsGlyphs } from "./types";
import HelperText from "./HelperText";

/** Every `TextInput` prop passes through, except the ones Input owns. */
export interface InputProps extends Omit<
  TextInputProps,
  "style" | "value" | "onChangeText" | "editable" | "keyboardType"
> {
  label?: string;
  precision?: number;
  prefix?: string;
  suffix?: string;
  value: string;
  type?: "text" | "number";
  onChangeText: (text: string) => void;
  variant?: "outlined" | "filled";
  error?: string;
  /** Supporting text below the field; hidden while an error is shown. */
  helperText?: string;
  /** Marks the label with an asterisk. */
  required?: boolean;
  disabled?: boolean;
  leadingIcon?: MaterialCommunityIconsGlyphs;
  trailingIcon?: MaterialCommunityIconsGlyphs;
  onTrailingIconPress?: () => void;
  minHeight?: number;
  style?: StyleProp<ViewStyle>;
}

const Input = ({
  type = "text",
  label,
  placeholder,
  precision,
  prefix,
  suffix,
  value,
  onChangeText,
  variant = "outlined",
  error,
  helperText,
  required,
  disabled,
  onFocus,
  onBlur,
  leadingIcon,
  trailingIcon,
  onTrailingIconPress,
  multiline = false,
  numberOfLines = 4,
  minHeight = 56,
  style,
  ...textInputProps
}: InputProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const activeColor = error ? theme.colors.error : theme.colors.primary;

  const handleTextChange = useCallback(
    (text: string) => {
      if (type === "number") {
        // Allow digits, one leading minus and one decimal point
        const sign = text.trimStart().startsWith("-") ? "-" : "";
        const [whole, ...rest] = text.replace(/[^0-9.]/g, "").split(".");
        // Every dot after the first is dropped, then precision applies to the
        // merged fraction: "1.2.34" at precision 2 is "1.23", not "1.234".
        const fraction =
          precision === undefined
            ? rest.join("")
            : rest.join("").slice(0, precision);
        const cleaned = rest.length > 0 ? `${whole}.${fraction}` : whole;
        onChangeText(sign + cleaned);
      } else {
        onChangeText(text);
      }
    },
    [type, precision, onChangeText],
  );

  // Focus ring + error border, both driven by the theme's glow helper.
  const dynamicStyles = useMemo(
    () => getGlowStyles(theme, isFocused, error),
    [theme, isFocused, error],
  );

  return (
    <View style={[styles.wrapper, style]}>
      {!!label && variant === "outlined" && (
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
          {required ? `${label} *` : label}
        </Text>
      )}

      <View
        style={[
          styles.inputContainer,
          { minHeight },
          dynamicStyles,
          disabled && styles.disabled,
        ]}
      >
        {prefix ? (
          <Text
            style={[styles.affix, { color: theme.colors.onSurfaceVariant }]}
          >
            {prefix}
          </Text>
        ) : (
          leadingIcon && (
            <View style={styles.iconLeft}>
              <Icons
                name={leadingIcon}
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            </View>
          )
        )}

        <View style={styles.textInputWrapper}>
          {!!label && variant === "filled" && (
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
              {required ? `${label} *` : label}
            </Text>
          )}

          <TextInput
            {...textInputProps}
            accessibilityLabel={label}
            accessibilityState={{ disabled }}
            accessibilityValue={{ text: value }}
            accessibilityHint={placeholder}
            multiline={multiline}
            numberOfLines={numberOfLines}
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
            onFocus={(event) => {
              setIsFocused(true);
              onFocus?.(event);
            }}
            onBlur={(event) => {
              setIsFocused(false);
              onBlur?.(event);
            }}
            editable={!disabled}
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
            <View style={styles.iconRight}>
              <Icons
                name={trailingIcon}
                size={20}
                color={
                  !!error ? theme.colors.error : theme.colors.onSurfaceVariant
                }
                onPress={onTrailingIconPress}
              />
            </View>
          )
        )}
      </View>

      {!!(error || helperText) && (
        <HelperText type={error ? "error" : "info"} disabled={disabled}>
          {error || helperText}
        </HelperText>
      )}
    </View>
  );
};

export default Input;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    wrapper: {
      marginBottom: 20,
      width: "100%",
    },
    inputContainer: {
      minHeight: 52,
      borderRadius: 12,
      paddingHorizontal: 16,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.surface,
    },

    disabled: {
      opacity: 0.38,
      backgroundColor: theme.colors.surfaceVariant,
    },

    textInput: {
      flex: 1,
      paddingVertical: 8,
      ...Platform.select({
        // No browser focus ring: the field draws its own.
        web: { outlineWidth: 0 },
      }),
    },
    textInputWrapper: {
      flex: 1,
      paddingVertical: Platform.OS === "ios" ? 8 : 0, // iOS needs a bit of padding for multiline
    },
    iconLeft: {
      marginRight: 12,
      borderRightWidth: 1,
      alignSelf: "stretch",
      borderColor: theme.colors.outlineVariant,
      justifyContent: "center",
      alignItems: "center",
      paddingRight: 12,
    },
    iconRight: {
      marginLeft: 12,
      borderLeftWidth: 1,
      alignSelf: "stretch",
      borderColor: theme.colors.outlineVariant,
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
