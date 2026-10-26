import React, { useCallback, useState } from "react";
import { View } from "react-native";
import { useTheme } from "../providers/ThemeProvider";
import { useDensity } from "../providers/Density";
import Input, { type InputProps } from "./Input";
import IconButton from "./IconButton";
import LinearProgress from "./Progress/LinearProgress";
import { colorRoleTokens, type ColorRole } from "./internal/colorRole";
import { fieldWidth } from "./internal/fieldWidth";

/** A password's strength: `0` very weak up to `4` strong. See `passwordStrength`. */
export type PasswordStrength = 0 | 1 | 2 | 3 | 4;

// The passwords everyone tries first. Matched after the digits and "!" a user
// tacks on the end are dropped, so "Password123!" counts as "password".
const COMMON = [
  "password",
  "passw0rd",
  "qwerty",
  "letmein",
  "welcome",
  "admin",
  "iloveyou",
  "abc",
];

/**
 * A rough 0-4 score for the strength of a password: a hint to show next to the
 * field, not a security check (the server decides what it accepts).
 *
 * One point each for: 8 or more characters, 12 or more, at least two character
 * classes (lower case, upper case, digit, other) and at least three. The score
 * is capped at 1 for a password under 6 characters, one repeated character
 * ("aaaaaaaaaaaa"), a digits-only run like "12345678" or one of a handful of
 * the most common passwords. An empty string is `0`.
 *
 * Ceiling: it knows no dictionary beyond that handful, so a long phrase of
 * lower-case words scores a modest `2`; use a real estimator (zxcvbn) where
 * that matters.
 */
export const passwordStrength = (value: string): PasswordStrength => {
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((re) =>
    re.test(value),
  ).length;
  const points =
    Number(value.length >= 8) +
    Number(value.length >= 12) +
    Number(classes >= 2) +
    Number(classes >= 3);
  const lower = value.toLowerCase();
  const trivial =
    value.length < 6 ||
    /^(.)\1*$/.test(value) ||
    /^\d+$/.test(value) ||
    COMMON.includes(lower.replace(/[\d!]+$/, ""));
  return Math.min(points, trivial ? 1 : 4) as PasswordStrength;
};

const DEFAULT_LABELS = ["Very weak", "Weak", "Fair", "Good", "Strong"];
const ROLES: ColorRole[] = ["error", "error", "warning", "info", "success"];

export interface PasswordFieldProps extends Omit<
  InputProps,
  | "secureTextEntry"
  | "type"
  | "precision"
  | "decimalSeparator"
  | "allUpperCase"
  | "trailingIcon"
  | "onTrailingIconPress"
  | "endAdornment"
> {
  /**
   * Shows the eye button at the end of the field that reveals and hides the
   * text. Turn it off for a field that must never be revealed. Defaults to
   * `true`.
   */
  showToggle?: boolean;
  /** Whether the text starts revealed (uncontrolled). Defaults to `false`. */
  defaultVisible?: boolean;
  /** Controls whether the text is revealed; pair with `onVisibleChange`. */
  visible?: boolean;
  /** Called with the new state when the eye button is pressed. */
  onVisibleChange?: (visible: boolean) => void;
  /** The accessible names of the eye button. Default `Show password` / `Hide password`. */
  toggleLabels?: { show?: string; hide?: string };
  /**
   * Draws a strength meter under the field once something is typed, scored by
   * `passwordStrength`. For a field that creates a password, not one that
   * enters it. Defaults to `false`.
   */
  showStrength?: boolean;
  /**
   * The words of the meter, from very weak (index 0) to strong (index 4).
   * Defaults to `["Very weak", "Weak", "Fair", "Good", "Strong"]`.
   */
  strengthLabels?: readonly string[];
  /**
   * What the platform's password manager should do: fill the saved password
   * (`"current-password"`) or offer to generate and save a new one
   * (`"new-password"`). Defaults to `"current-password"`.
   */
  autoComplete?: "current-password" | "new-password";
}

/**
 * An `Input` for a password: the text is hidden, with an eye button to reveal
 * it, the autofill and keyboard hints a password manager needs, and
 * optionally a strength meter. The value is never put into an accessibility
 * prop, hidden or revealed.
 *
 * ```tsx
 * <PasswordField label="Password" value={pw} onChange={setPw} />
 * <PasswordField label="New password" value={pw} onChange={setPw}
 *   autoComplete="new-password" showStrength />
 * ```
 */
const PasswordField = ({
  showToggle = true,
  defaultVisible = false,
  visible: visibleProp,
  onVisibleChange,
  toggleLabels,
  showStrength = false,
  strengthLabels = DEFAULT_LABELS,
  autoComplete = "current-password",
  value,
  fullWidth = true,
  density,
  style,
  inputProps,
  ...rest
}: PasswordFieldProps) => {
  const { theme } = useTheme();
  const dense = useDensity(density) === "dense";
  const [visibleState, setVisibleState] = useState(defaultVisible);
  const visible = visibleProp ?? visibleState;

  const toggle = useCallback(() => {
    if (visibleProp === undefined) setVisibleState(!visible);
    onVisibleChange?.(!visible);
  }, [visible, visibleProp, onVisibleChange]);

  const field = (
    <Input
      {...rest}
      value={value}
      density={density}
      // Under a strength meter the field lets the meter sit close to it.
      fullWidth={showStrength ? true : fullWidth}
      style={showStrength ? [style, { marginBottom: theme.spacing.s }] : style}
      secureTextEntry={!visible}
      inputProps={{
        autoComplete,
        textContentType:
          autoComplete === "new-password" ? "newPassword" : "password",
        autoCorrect: false,
        autoCapitalize: "none",
        spellCheck: false,
        // Not even revealed: the text is on screen, not in the a11y tree.
        accessibilityValue: undefined,
        ...inputProps,
      }}
      endAdornment={
        showToggle ? (
          <IconButton
            icon={visible ? "eye-off" : "eye"}
            size={dense ? "small" : "medium"}
            accessibilityLabel={
              visible
                ? (toggleLabels?.hide ?? "Hide password")
                : (toggleLabels?.show ?? "Show password")
            }
            disabled={rest.disabled}
            onClick={toggle}
            testID={
              inputProps?.testID ? `${inputProps.testID}-toggle` : undefined
            }
          />
        ) : undefined
      }
    />
  );

  if (!showStrength) return field;

  const score = passwordStrength(value);
  const label = strengthLabels[score] ?? DEFAULT_LABELS[score];
  return (
    <View style={fieldWidth(fullWidth)}>
      {field}
      {/* A live region, there before it has anything to say: a screen reader hears the word change as the score does. */}
      <View
        role="status"
        accessible={!!value}
        accessibilityLabel={value ? `Password strength: ${label}` : undefined}
        style={{ marginBottom: dense ? 12 : 20 }}
      >
        {!!value && (
          <LinearProgress
            decorative
            progress={(score + 1) / 5}
            color={colorRoleTokens(theme, ROLES[score]).main}
            label={label}
            labelPosition="bottom-left"
          />
        )}
      </View>
    </View>
  );
};

export default PasswordField;
