import React, { useEffect, useMemo, useState } from "react";
import {
  Animated,
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import { Theme, useTheme } from "../providers/ThemeProvider";

export type HelperTextType = "info" | "error";

export interface HelperTextProps {
  children: React.ReactNode;
  /** `error` switches to the error role and shows the alert glyph. */
  type?: HelperTextType;
  /** Fades the text out instead of unmounting it, so the field doesn't jump. */
  visible?: boolean;
  /** Dims the text to match a disabled field. */
  disabled?: boolean;
  /** `none` removes the 16px gutter that aligns the text with the field body. */
  padding?: "normal" | "none";
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Supporting text under a form control — a hint, a counter, a validation
 * message. Every input in the kit renders one of these, so keeping the
 * treatment (colour role, gutter, alert glyph, fade) in one place is what
 * makes a form look like a form.
 *
 * ```tsx
 * <Input label="Email" value={email} onChangeText={setEmail} />
 * <HelperText type="error" visible={!email.includes("@")}>
 *   Indirizzo email non valido
 * </HelperText>
 * ```
 */
const HelperText = ({
  children,
  type = "info",
  visible = true,
  disabled = false,
  padding = "normal",
  style,
  containerStyle,
  testID,
}: HelperTextProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  // Disabled folds into the same animated value: two competing `opacity`
  // entries in one style array would leave the last one to win silently.
  const target = visible ? (disabled ? 0.38 : 1) : 0;
  // Lazy state, not `useRef(new Animated.Value(…)).current`: the value is read
  // during render to build the style, which is not what refs are for.
  const [opacity] = useState(() => new Animated.Value(target));

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: target,
      duration: visible ? 150 : 180,
      useNativeDriver: true,
    }).start();
  }, [target, visible, opacity]);

  const color =
    type === "error" ? theme.colors.error : theme.colors.onSurfaceVariant;

  return (
    <Animated.View
      testID={testID}
      // Hidden text must not be reachable by a screen reader or a mouse.
      pointerEvents={visible ? "auto" : "none"}
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? "auto" : "no-hide-descendants"}
      accessibilityLiveRegion={type === "error" ? "polite" : "none"}
      style={[
        styles.row,
        padding === "normal" && styles.padded,
        { opacity },
        containerStyle,
      ]}
    >
      {type === "error" && (
        <Icons name="alert-circle-outline" size={14} color={color} />
      )}
      <View style={styles.textWrapper}>
        <Animated.Text style={[theme.typography.bodySmall, { color }, style]}>
          {children}
        </Animated.Text>
      </View>
    </Animated.View>
  );
};

export default HelperText;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
      marginTop: theme.spacing.xs,
    },
    padded: {
      marginLeft: theme.spacing.m,
    },
    textWrapper: {
      flex: 1,
    },
  });
