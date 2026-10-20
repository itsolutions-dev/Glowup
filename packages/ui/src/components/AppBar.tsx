import React, { useMemo } from "react";
import { Platform, StyleSheet, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, Theme } from "../providers/ThemeProvider";
import IconButton from "./IconButton";
import Paper from "./Paper";
import type { PaperProps } from "./Paper";
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

export interface AppBarProps {
  /**
   * The headline. A string is drawn in the variant's type style; any other
   * node is placed as is. Left out, it is read from `options` and `route`
   * (see `navigation`).
   */
  title?: React.ReactNode;
  /** A second line under the title. */
  subtitle?: string;
  /**
   * `"small"` and `"center"` keep the title in the 64dp row; `"medium"` and
   * `"large"` move it to a second, larger line. Defaults to `"small"`.
   */
  variant?: "small" | "center" | "medium" | "large";
  /**
   * Before the title: typically a back or menu `IconButton`. Under a
   * navigator it defaults to a back button, or a menu button for a drawer.
   */
  leading?: React.ReactNode;
  /**
   * After the title: up to three action `IconButton`s per M3. Under a
   * navigator it defaults to `options.headerRight()`.
   */
  actions?: React.ReactNode;
  /** The on-scroll state: `surfaceContainer` instead of `surface`. */
  elevated?: boolean;
  /** Pads the top safe-area inset. Defaults to `true`. */
  safeArea?: boolean;
  /**
   * A hairline under the bar. Left out, it is drawn on the web when the bar
   * sits under a navigator and not otherwise.
   */
  divider?: boolean;
  /**
   * Props of the `Paper` the bar is drawn on (`elevation`, `outline`, `glow`,
   * `style`), merged over the bar's own: `elevation` is `0`, or `2` when
   * `elevated`. `<AppBar paper={{ elevation: 3 }} />` lifts the bar to level 3.
   */
  paper?: Omit<PaperProps, "children">;
  /**
   * react-navigation's header contract, for a bar passed as a navigator's
   * `header`: `navigation.goBack` and `navigation.openDrawer` feed the leading
   * button. Structural, so any navigator's object fits; the library never
   * imports react-navigation.
   */
  navigation?: any;
  /** The navigator's route: its `name` is the title when nothing else is. */
  route?: any;
  /**
   * The screen's navigator options: `headerTitle` or `title` give the title,
   * `headerRight` the actions, and `headerLeft: null` or `hideMenuIcon` hides
   * the drawer's menu button.
   */
  options?: any;
  /** Truthy when a back destination exists (native-stack passes `{ title, href }`). */
  back?: { title?: string; href?: string } | boolean;
  /** A pinned (always visible) drawer needs no menu button. */
  isPinned?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * The Material 3 top app bar, drawn on a `Paper`. On its own the screen passes
 * `title`, `leading` and `actions`; as a navigator's `header` it adapts to
 * react-navigation's contract (`navigation`, `route`, `options`, `back`): it
 * reads the title from `options`/`route`, shows a back button when there is
 * somewhere to go back to and a menu button for a drawer navigator. The
 * library itself never imports react-navigation.
 */
const AppBar = ({
  title,
  subtitle,
  variant = "small",
  leading,
  actions,
  elevated = false,
  safeArea = true,
  divider,
  paper,
  navigation,
  route,
  options,
  back,
  isPinned = false,
  style,
  testID,
}: AppBarProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const underNavigator =
    navigation !== undefined || route !== undefined || options !== undefined;
  const hideDrawerToggle =
    options?.headerLeft === null || options?.hideMenuIcon === true || isPinned;

  const resolvedTitle =
    title !== undefined
      ? title
      : options?.headerTitle !== undefined
        ? options.headerTitle
        : options?.title !== undefined
          ? options.title
          : route?.name;

  const resolvedLeading =
    leading !== undefined ? (
      leading
    ) : back ? (
      <IconButton
        icon="arrow-left"
        accessibilityLabel="Go back"
        onClick={navigation?.goBack}
      />
    ) : !hideDrawerToggle && navigation?.openDrawer ? (
      <IconButton
        icon="menu"
        accessibilityLabel="Open navigation menu"
        onClick={navigation.openDrawer}
      />
    ) : undefined;

  const resolvedActions =
    actions !== undefined
      ? actions
      : options?.headerRight
        ? options.headerRight()
        : undefined;

  const showDivider = divider ?? (underNavigator && Platform.OS === "web");
  const inline = variant === "small" || variant === "center";

  const heading =
    typeof resolvedTitle === "string" ? (
      <Typography
        variant={TITLE_VARIANT[variant]}
        numberOfLines={1}
        accessibilityRole="header"
      >
        {resolvedTitle}
      </Typography>
    ) : (
      resolvedTitle
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
    <View testID={testID} style={styles.container}>
      <Paper
        elevation={elevated ? 2 : 0}
        {...paper}
        style={[
          styles.paper,
          { paddingTop: safeArea ? insets.top : 0 },
          showDivider && styles.divider,
          paper?.style,
          style,
        ]}
      >
        <View style={[styles.row, { minHeight: ROW_HEIGHT }]}>
          {resolvedLeading != null && (
            <View style={styles.side}>{resolvedLeading}</View>
          )}
          {inline && (
            <View
              style={[
                styles.inlineTitle,
                variant === "center" && styles.centerTitle,
                resolvedLeading == null && { paddingStart: theme.spacing.m },
              ]}
              pointerEvents={variant === "center" ? "none" : "auto"}
            >
              {titleBlock}
            </View>
          )}
          <View style={[styles.side, styles.actions]}>{resolvedActions}</View>
        </View>
        {!inline && (
          <View style={[styles.block, { minHeight: TITLE_LINE[variant] }]}>
            {titleBlock}
          </View>
        )}
      </Paper>
    </View>
  );
};

export default AppBar;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { width: "100%", zIndex: 100 },
    // A bar spans the window: no corner radius and none of Paper's padding.
    paper: { borderRadius: 0, padding: 0, width: "100%" },
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
