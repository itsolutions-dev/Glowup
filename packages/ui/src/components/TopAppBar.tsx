import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, Theme } from "../providers/ThemeProvider";
import Typography from "./Typography";

// M3 top app bar: a 64dp row; medium (112dp) and large (152dp) add a line
// below it for a bigger title.
const ROW_HEIGHT = 64;
const TITLE_VARIANT = {
  small: "titleLarge",
  center: "titleLarge",
  medium: "headlineSmall",
  large: "headlineMedium",
} as const;
const TITLE_LINE = { medium: 112 - ROW_HEIGHT, large: 152 - ROW_HEIGHT };

export interface TopAppBarProps {
  title: React.ReactNode;
  /** A second line under the title. */
  subtitle?: string;
  /**
   * `"small"` and `"center"` keep the title in the 64dp row; `"medium"` and
   * `"large"` move it to a second, larger line. Defaults to `"small"`.
   */
  variant?: "small" | "center" | "medium" | "large";
  /** Before the title: typically a back or menu `IconButton`. */
  leading?: React.ReactNode;
  /** After the title: up to three action `IconButton`s per M3. */
  actions?: React.ReactNode;
  /** The on-scroll state: `surfaceContainer` instead of `surface`. */
  elevated?: boolean;
  /** Pads the top safe-area inset. Defaults to `true`. */
  safeArea?: boolean;
  /** A hairline under the bar. */
  divider?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * The Material 3 top app bar, independent of any navigator: the screen passes
 * its own leading and trailing actions. `AppBar` adapts it to react-navigation's
 * header contract.
 */
const TopAppBar = ({
  title,
  subtitle,
  variant = "small",
  leading,
  actions,
  elevated = false,
  safeArea = true,
  divider = false,
  style,
  testID,
}: TopAppBarProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const inline = variant === "small" || variant === "center";

  const heading =
    typeof title === "string" ? (
      <Typography
        variant={TITLE_VARIANT[variant]}
        numberOfLines={1}
        accessibilityRole="header"
      >
        {title}
      </Typography>
    ) : (
      title
    );
  const titleBlock = (
    <>
      {heading}
      {!!subtitle && (
        <Typography
          variant="bodyMedium"
          numberOfLines={1}
          style={{ color: theme.colors.onSurfaceVariant }}
        >
          {subtitle}
        </Typography>
      )}
    </>
  );

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          backgroundColor: elevated
            ? theme.colors.surfaceContainer
            : theme.colors.surface,
          paddingTop: safeArea ? insets.top : 0,
        },
        divider && styles.divider,
        style,
      ]}
    >
      <View style={[styles.row, { minHeight: ROW_HEIGHT }]}>
        {leading != null && <View style={styles.side}>{leading}</View>}
        {inline && (
          <View
            style={[
              styles.inlineTitle,
              variant === "center" && styles.centerTitle,
              leading == null && { paddingStart: theme.spacing.m },
            ]}
            pointerEvents={variant === "center" ? "none" : "auto"}
          >
            {titleBlock}
          </View>
        )}
        <View style={[styles.side, styles.actions]}>{actions}</View>
      </View>
      {!inline && (
        <View style={[styles.block, { minHeight: TITLE_LINE[variant] }]}>
          {titleBlock}
        </View>
      )}
    </View>
  );
};

export default TopAppBar;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { width: "100%", zIndex: 100 },
    divider: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: theme.colors.outlineVariant,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: theme.spacing.xs,
    },
    side: { flexDirection: "row", alignItems: "center" },
    actions: { marginStart: "auto" },
    inlineTitle: {
      flex: 1,
      paddingHorizontal: theme.spacing.xs,
    },
    // Centred on the whole bar, not on the space the actions leave.
    centerTitle: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      alignItems: "center",
      justifyContent: "center",
      // Clear of one icon button on each side.
      paddingHorizontal: theme.spacing.xl + theme.spacing.l,
    },
    block: {
      justifyContent: "flex-end",
      paddingHorizontal: theme.spacing.m,
      paddingBottom: theme.spacing.l,
    },
  });
