import React, { useCallback } from "react";
import {
  TextInput,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { useTheme } from "../providers/ThemeProvider";
import { MaterialCommunityIconsGlyphs } from "./types";
import { type Density } from "../providers/Density";
import FieldShell from "./internal/FieldShell";
import { useFormReturnKey } from "./Form";

/** The `TextInput` props an `Input` hands through; its controlled ones (`value`, `onChangeText`, `editable`, `secureTextEntry`) stay with its own props. */
export type InputTextInputProps = Pick<
  TextInputProps,
  | "autoComplete"
  | "textContentType"
  | "autoCorrect"
  | "autoCapitalize"
  | "spellCheck"
  | "autoFocus"
  | "selectTextOnFocus"
  | "returnKeyType"
  | "enterKeyHint"
  | "onSubmitEditing"
  | "onKeyPress"
  | "accessibilityLabel"
  | "accessibilityValue"
  | "testID"
>;

/**
 * A single-line text or number field. For text that wraps over several lines
 * use `InputArea`.
 */
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
  /** Pressing `trailingIcon`. It is a bare, unlabelled icon: for a real control use `endAdornment`. */
  onTrailingIconPress?: () => void;
  /**
   * Any element drawn at the end of the field, after `suffix` or
   * `trailingIcon` (which keep working): an `IconButton` with its own accessible
   * name, a spinner, a unit picker. It is not clipped by the field and takes
   * its own touches.
   */
  endAdornment?: React.ReactNode;
  /**
   * Autofill and keyboard hints, focus and key handling for the underlying
   * `TextInput`: `autoComplete`, `textContentType`, `autoCorrect`,
   * `autoCapitalize`, `spellCheck`, `autoFocus`, `selectTextOnFocus`,
   * `returnKeyType`, `enterKeyHint`, `onSubmitEditing`, `onKeyPress`,
   * `accessibilityLabel` / `accessibilityValue` (replace the ones drawn from
   * `label` and `value`) and `testID`.
   */
  inputProps?: InputTextInputProps;
  /** A ref to the underlying `TextInput`, to focus it or select its text. */
  inputRef?: React.Ref<TextInput>;
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
  endAdornment,
  inputProps,
  inputRef,
  density,
  minHeight,
  style,
}: InputProps) => {
  const { theme } = useTheme();
  // The return key submits the form around it, as Enter does on the web,
  // unless the app handles it (moving to the next field, say).
  const formReturnKey = useFormReturnKey();
  const onSubmitEditing = inputProps?.onSubmitEditing ?? formReturnKey;

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

  return (
    <FieldShell
      label={label}
      labelPlacement={labelPlacement}
      variant={variant}
      error={error}
      helperText={helperText}
      required={required}
      disabled={disabled}
      reserveHelperText={reserveHelperText}
      fullWidth={fullWidth}
      density={density}
      minHeight={minHeight}
      style={style}
      prefix={prefix}
      suffix={suffix}
      leadingIcon={leadingIcon}
      trailingIcon={trailingIcon}
      onTrailingIconPress={onTrailingIconPress}
      endAdornment={endAdornment}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {(field) => (
        <TextInput
          accessibilityLabel={label}
          accessibilityState={{ disabled }}
          // No accessibilityValue: the edit box exposes its own text, and on
          // Android the value made an empty field "Username, ".
          {...field.labelledBy}
          accessibilityHint={placeholder}
          readOnly={readonly}
          maxLength={maxLength}
          style={[
            { flex: 1 },
            field.style,
            { textAlign: type === "number" ? "right" : "left" },
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
          onFocus={field.onFocus}
          onBlur={field.onBlur}
          editable={!disabled}
          secureTextEntry={secureTextEntry}
          keyboardType={type === "number" ? "decimal-pad" : "default"}
          ref={inputRef}
          {...inputProps}
          onSubmitEditing={onSubmitEditing}
        />
      )}
    </FieldShell>
  );
};

export default Input;
