import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import Icons from "../Glyph";
import HelperText from "../HelperText";
import { Theme, useTheme, getGlowStyles } from "../../providers/ThemeProvider";
import { useDensity, type Density } from "../../providers/Density";
import type { MaterialCommunityIconsGlyphs } from "../types";
import { fieldWidth } from "./fieldWidth";
import { filledField } from "./fieldVariant";

/**
 * The props `Input` and `InputArea` share: the label, the box, the helper line.
 * Each component adds its own text field on top (`FieldShell`'s function child).
 */
export interface FieldShellProps {
  label?: string;
  labelPlacement?: "inside" | "outside";
  variant?: "outlined" | "filled";
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  reserveHelperText?: boolean;
  fullWidth?: boolean;
  density?: Density;
  minHeight?: number;
  /** The field holds several lines: on iOS it gets 8 px of vertical padding, a single line gets none. */
  multiline?: boolean;
  style?: StyleProp<ViewStyle>;
  prefix?: string;
  suffix?: string;
  leadingIcon?: MaterialCommunityIconsGlyphs;
  trailingIcon?: MaterialCommunityIconsGlyphs;
  onTrailingIconPress?: () => void;
  endAdornment?: React.ReactNode;
  onFocus?: () => void;
  onBlur?: () => void;
  children: (field: FieldShellApi) => React.ReactNode;
}

/** What the shell hands the text field it wraps. */
export interface FieldShellApi {
  /** Spread on the `TextInput`: the shell tracks focus for the ring and the label. */
  onFocus: () => void;
  onBlur: () => void;
  /** The text field's own style: typography, colour and vertical padding. */
  style: TextStyle;
}

/**
 * The text a field draws and the metrics to size it from: its style, the
 * vertical padding inside it and the line height of its typography.
 */
export const fieldText = (
  theme: Theme,
  dense: boolean,
  labelInside: boolean,
) => {
  const typography = dense
    ? theme.typography.bodyMedium
    : theme.typography.bodyLarge;
  const paddingVertical = labelInside ? 2 : dense ? 8 : 12;
  const style: TextStyle = {
    ...typography,
    // No browser focus ring: the field draws its own.
    ...Platform.select<TextStyle>({ web: { outlineWidth: 0 } }),
    color: theme.colors.onSurface,
    paddingVertical,
  };
  return { style, paddingVertical, lineHeight: typography.lineHeight ?? 24 };
};

const FieldShell = ({
  label,
  labelPlacement,
  variant = "outlined",
  error,
  helperText,
  required,
  disabled,
  reserveHelperText = false,
  fullWidth = true,
  density,
  minHeight,
  multiline = false,
  style,
  prefix,
  suffix,
  leadingIcon,
  trailingIcon,
  onTrailingIconPress,
  endAdornment,
  onFocus,
  onBlur,
  children,
}: FieldShellProps) => {
  const dense = useDensity(density) === "dense";
  const [isFocused, setIsFocused] = useState(false);
  const { theme } = useTheme();
  const styles = useMemo(
    () => makeStyles(theme, dense, multiline),
    [theme, dense, multiline],
  );
  const activeColor = error ? theme.colors.error : theme.colors.primary;
  const labelInside = labelPlacement === "inside";

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

          {children({
            onFocus: () => {
              setIsFocused(true);
              onFocus?.();
            },
            onBlur: () => {
              setIsFocused(false);
              onBlur?.();
            },
            style: fieldText(theme, dense, labelInside).style,
          })}
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

        {!!endAdornment && (
          <View style={styles.endAdornment}>{endAdornment}</View>
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

export default FieldShell;

const makeStyles = (theme: Theme, dense: boolean, multiline: boolean) =>
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

    textInputWrapper: {
      flex: 1,
      // iOS needs a bit of padding for multiline. A single line has none: it
      // made the field 66 high on iOS instead of the 56 `minHeight` gives.
      paddingVertical: Platform.OS === "ios" && !dense && multiline ? 8 : 0,
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
    // Hugs the edge: the field's own padding is more than a control needs.
    endAdornment: {
      marginLeft: theme.spacing.xs,
      marginRight: -theme.spacing.s,
      alignItems: "center",
      justifyContent: "center",
    },
    affix: {
      paddingHorizontal: 4,
      fontSize: 16,
      fontWeight: "400",
      textAlignVertical: "center",
    },
  });
