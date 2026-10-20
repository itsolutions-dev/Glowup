import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Platform,
  StyleProp,
  ViewStyle,
} from "react-native";
import Icons from "./Glyph";
import { Theme, useTheme, getGlowStyles } from "../providers/ThemeProvider";
import { MaterialCommunityIconsGlyphs } from "./types";
import HelperText from "./HelperText";
import { useDensity, type Density } from "../providers/Density";
import { fieldWidth } from "./internal/fieldWidth";
import { filledField } from "./internal/fieldVariant";

export interface InputProps {
  label?: string;
  placeholder?: string;
  precision?: number;
  /**
   * The decimal mark a `type="number"` field types and shows: `","` for a user
   * who writes 12,50. `value` and `onChange` stay in the plain form
   * ("12.50"), so the app parses nothing; a typed "." is then ignored, as a
   * thousands mark. Defaults to `"."`.
   */
  decimalSeparator?: "." | ",";
  /** Capitalises what is typed (codes, plates, tax ids). Not for `type="number"`. */
  allUpperCase?: boolean;
  /**
   * Keeps the line under the field even with no helper or error text, so a
   * message appearing does not push the next field down. Default false.
   */
  reserveHelperText?: boolean;
  prefix?: string;
  suffix?: string;
  value: string;
  type?: "text" | "number";
  maxLength?: number;
  /** Called with the new text on every edit (for `type="number"`, already cleaned). */
  onChange: (text: string) => void;
  /**
   * The look of the box: `"outlined"` is a bordered box on the surface,
   * `"filled"` a tinted box (like `PinInput`'s) that shows its border only
   * while focused or in error. Where the label sits is `labelPlacement`'s
   * business, not the variant's. Defaults to `"outlined"`.
   */
  variant?: "outlined" | "filled";
  /**
   * Where the label is drawn: `"outside"` above the box, or `"inside"`, small,
   * above the text within it. Independent of `variant`. Defaults to `"outside"`.
   */
  labelPlacement?: "inside" | "outside";
  /**
   * Stretches the field to its container's width. `false` shrinks it to its
   * content, with a minimum width so an empty field stays usable. Defaults to
   * `true`.
   */
  fullWidth?: boolean;
  error?: string;
  /** Supporting text below the field; hidden while an error is shown. */
  helperText?: string;
  /** Marks the label with an asterisk. */
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  secureTextEntry?: boolean;
  /** Called when the field gains focus. */
  onFocus?: () => void;
  /** Called when the field loses focus. */
  onBlur?: () => void;
  leadingIcon?: MaterialCommunityIconsGlyphs;
  trailingIcon?: MaterialCommunityIconsGlyphs;
  onTrailingIconPress?: () => void;
  /** Lets the text wrap over several lines; see `rows`. */
  multiline?: boolean;
  /** Visible lines of a `multiline` field. Ignored otherwise. Defaults to 4. */
  rows?: number;
  /**
   * Control height. `"dense"` is for desktop forms and tables: a 40 px field instead of 56, 14 px text, less space below.
   */
  density?: Density;
  /** Overrides the height `density` gives (56, or 40 when dense). */
  minHeight?: number;
  style?: StyleProp<ViewStyle>;
}

const Input = ({
  type = "text",
  label,
  placeholder,
  precision,
  decimalSeparator = ".",
  allUpperCase = false,
  reserveHelperText = false,
  prefix,
  suffix,
  value,
  maxLength,
  onChange,
  variant = "outlined",
  labelPlacement,
  fullWidth = true,
  error,
  helperText,
  required,
  disabled,
  readonly,
  secureTextEntry,
  onFocus,
  onBlur,
  leadingIcon,
  trailingIcon,
  onTrailingIconPress,
  multiline = false,
  rows = 4,
  density,
  minHeight,
  style,
}: InputProps) => {
  const dense = useDensity(density) === "dense";
  const [isFocused, setIsFocused] = useState(false);
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme, dense), [theme, dense]);
  const activeColor = error ? theme.colors.error : theme.colors.primary;
  const labelInside = labelPlacement === "inside";

  const handleTextChange = useCallback(
    (text: string) => {
      if (type === "number") {
        // Allow digits, one leading minus and one decimal mark (the one the
        // field is set to: the other character is dropped, so "1.250,50"
        // typed or pasted into a comma field is 1250.50).
        const sign = text.trimStart().startsWith("-") ? "-" : "";
        const [whole, ...rest] = text
          .replace(decimalSeparator === "," ? /[^0-9,]/g : /[^0-9.]/g, "")
          .split(decimalSeparator);
        // Every mark after the first is dropped, then precision applies to the
        // merged fraction: "1.2.34" at precision 2 is "1.23", not "1.234".
        const fraction =
          precision === undefined
            ? rest.join("")
            : rest.join("").slice(0, precision);
        const cleaned = rest.length > 0 ? `${whole}.${fraction}` : whole;
        onChange(sign + cleaned);
      } else {
        onChange(allUpperCase ? text.toUpperCase() : text);
      }
    },
    [type, precision, decimalSeparator, allUpperCase, onChange],
  );

  // Focus ring + error border, both driven by the theme's glow helper.
  const dynamicStyles = useMemo(
    () => getGlowStyles(theme, isFocused, error),
    [theme, isFocused, error],
  );

  return (
    <View style={[styles.wrapper, fieldWidth(fullWidth), style]}>
      {!!label && !labelInside && (
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
          { minHeight: minHeight ?? (dense ? 40 : 56) },
          dynamicStyles,
          variant === "filled" && filledField(theme, isFocused, error),
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
          {!!label && labelInside && (
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
            accessibilityLabel={label}
            accessibilityState={{ disabled }}
            accessibilityValue={{ text: value }}
            accessibilityHint={placeholder}
            multiline={multiline}
            numberOfLines={multiline ? rows : undefined}
            readOnly={readonly}
            maxLength={maxLength}
            style={[
              styles.textInput,
              dense ? theme.typography.bodyMedium : theme.typography.bodyLarge,
              {
                color: theme.colors.onSurface,
                paddingVertical: labelInside ? 2 : dense ? 8 : 12,
                textAlign: type === "number" ? "right" : "left",
              },
            ]}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            autoCapitalize={allUpperCase ? "characters" : undefined}
            value={
              type === "number" && decimalSeparator === ","
                ? value.replace(".", ",")
                : value
            }
            onChangeText={handleTextChange}
            onFocus={() => {
              setIsFocused(true);
              onFocus?.();
            }}
            onBlur={() => {
              setIsFocused(false);
              onBlur?.();
            }}
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

      {(!!(error || helperText) || reserveHelperText) && (
        <HelperText
          type={error ? "error" : "info"}
          disabled={disabled}
          visible={!!(error || helperText)}
        >
          {error || helperText || " "}
        </HelperText>
      )}
    </View>
  );
};

export default Input;

const makeStyles = (theme: Theme, dense: boolean) =>
  StyleSheet.create({
    wrapper: {
      marginBottom: dense ? 12 : 20,
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
      paddingVertical: Platform.OS === "ios" && !dense ? 8 : 0, // iOS needs a bit of padding for multiline
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
