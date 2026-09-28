import React, { useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import { useTheme, Theme } from "../providers/ThemeProvider";
import Divider from "./Divider";
import IconButton from "./IconButton";
import Typography from "./Typography";
import SideOverlay from "./internal/SideOverlay";

// M3 side sheet: 256–400dp wide; 360dp is the reference width.
const SHEET_WIDTH = 360;

export interface SideSheetProps {
  /** Modal only: whether the sheet is open. */
  visible?: boolean;
  /** Called by the close button, and in modal mode by the scrim, Android back and Escape. */
  onDismiss: () => void;
  title?: string;
  children: React.ReactNode;
  /** The edge it attaches to, in reading direction. Defaults to `"end"`. */
  side?: "start" | "end";
  /**
   * `true` slides over the content with a scrim; `false` is a standard sheet
   * you place in a row beside the content. Defaults to `true`.
   */
  modal?: boolean;
  /** Defaults to 360, capped at the window width. */
  width?: number;
  /** Shows a back button before the title — for a sheet with sub-pages. */
  onBack?: () => void;
  /** Defaults to `true`. */
  showCloseButton?: boolean;
  /** A row of buttons at the bottom, below a divider. */
  actions?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * The Material 3 side sheet: secondary content — filters, details, a form —
 * beside the main content on wide windows. `BottomSheet` is its compact-window
 * counterpart.
 */
const SideSheet = ({
  visible = false,
  onDismiss,
  title,
  children,
  side = "end",
  modal = true,
  width = SHEET_WIDTH,
  onBack,
  showCloseButton = true,
  actions,
  style,
  testID,
}: SideSheetProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const body = (
    <View style={styles.body}>
      <View style={styles.header}>
        {onBack && (
          <IconButton
            icon="arrow-left"
            accessibilityLabel="Back"
            onPress={onBack}
          />
        )}
        <Typography
          variant="titleLarge"
          accessibilityRole="header"
          numberOfLines={1}
          style={[styles.title, !onBack && { paddingStart: theme.spacing.s }]}
        >
          {title ?? ""}
        </Typography>
        {showCloseButton && (
          <IconButton
            icon="close"
            accessibilityLabel="Close"
            onPress={onDismiss}
            testID={testID ? `${testID}-close` : undefined}
          />
        )}
      </View>
      <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
        {children}
      </ScrollView>
      {actions != null && (
        <>
          <Divider />
          <View style={styles.actions}>{actions}</View>
        </>
      )}
    </View>
  );

  if (modal) {
    // The inner edge is the one that faces the content.
    const inner =
      side === "end"
        ? {
            borderTopStartRadius: theme.shape.large,
            borderBottomStartRadius: theme.shape.large,
          }
        : {
            borderTopEndRadius: theme.shape.large,
            borderBottomEndRadius: theme.shape.large,
          };
    return (
      <SideOverlay
        visible={visible}
        onDismiss={onDismiss}
        side={side}
        width={width}
        scrimLabel="Close sheet"
        panelStyle={[styles.modal, inner, style]}
        testID={testID}
      >
        {body}
      </SideOverlay>
    );
  }

  return (
    <View
      testID={testID}
      style={[
        styles.standard,
        side === "end" ? styles.startBorder : styles.endBorder,
        { width },
        style,
      ]}
    >
      {body}
    </View>
  );
};

export default SideSheet;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    flex: { flex: 1 },
    body: { flex: 1 },
    modal: {
      backgroundColor: theme.colors.surfaceContainerLow,
      overflow: "hidden",
    },
    standard: {
      alignSelf: "stretch",
      maxWidth: "100%",
      backgroundColor: theme.colors.surface,
    },
    startBorder: {
      borderStartWidth: 1,
      borderStartColor: theme.colors.outlineVariant,
    },
    endBorder: {
      borderEndWidth: 1,
      borderEndColor: theme.colors.outlineVariant,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      minHeight: 72,
      paddingHorizontal: theme.spacing.s,
      paddingTop: theme.spacing.s,
    },
    title: { flex: 1 },
    content: {
      paddingHorizontal: theme.spacing.l,
      paddingBottom: theme.spacing.l,
    },
    actions: {
      flexDirection: "row",
      gap: theme.spacing.s,
      paddingHorizontal: theme.spacing.l,
      paddingVertical: theme.spacing.m,
    },
  });
