import React, { useContext, useEffect, useMemo } from "react";
import {
  Modal as NativeModal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { rgba } from "polished";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { useTheme, Theme, getGlowStyles } from "../../providers/ThemeProvider";

import Button from "../Button";
import Icon, { IconSource } from "../Icon";
import IconButton from "../IconButton";
import Title from "../Typography";

interface ModalProps {
  children: React.ReactNode | string;
  title?: string;
  /** Hero glyph above the title (M3 dialog icon). Centres the header. */
  icon?: IconSource;
  animationType?: "none" | "slide" | "fade";
  transparent?: boolean;
  /** Whether the dialog is on screen. */
  visible: boolean;
  onClose?: () => void;
  /** Called on Android back / ESC without rendering the close button. Falls back to onClose. */
  onDismiss?: () => void;
  closeText?: string;
  /**
   * Whether tapping the scrim (and pressing ESC on web) dismisses the dialog.
   * Turn it off for a decision the user must not be able to skip.
   * Defaults to `true`.
   */
  dismissable?: boolean;
  /** Scrolls the body when the content is taller than the dialog. */
  scrollable?: boolean;
  /**
   * Trailing action row. Replaces the single `closeText` button. In a
   * full-screen dialog it moves into the header, after the title.
   */
  actions?: React.ReactNode;
  /**
   * The M3 full-screen dialog, for a form on a compact window: it fills the
   * window, with a close button, the title and `actions` in a header row and
   * a scrolling body. Defaults to `false`.
   */
  fullScreen?: boolean;
  /** Root testID. The scrim gets `${testID}-scrim`. */
  testID?: string;
}

const NO_INSETS = { top: 0, bottom: 0, left: 0, right: 0 };

function Modal({
  children,
  title,
  icon,
  visible,
  animationType = "fade",
  transparent = true,
  onClose,
  onDismiss,
  closeText = "Close",
  dismissable = true,
  scrollable = false,
  actions,
  fullScreen = false,
  testID = "modal",
}: ModalProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const dismiss = onDismiss || onClose;
  // Read without requiring a SafeAreaProvider: only the full-screen dialog
  // uses the insets, and a plain dialog must keep working without one.
  const insets = useContext(SafeAreaInsetsContext) ?? NO_INSETS;

  // react-native's `onRequestClose` covers Android back but not the web ESC
  // key, so the platform's own dismiss gesture has to be wired up by hand.
  useEffect(() => {
    if (Platform.OS !== "web" || !visible || !dismissable || !dismiss) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [visible, dismissable, dismiss]);

  const isText = typeof children === "string";
  const body = isText ? (
    <Text style={styles.bodyText}>{children}</Text>
  ) : (
    children
  );

  if (fullScreen) {
    return (
      <NativeModal
        animationType={animationType === "fade" ? "slide" : animationType}
        visible={visible}
        onRequestClose={dismissable ? dismiss : undefined}
      >
        <View
          testID={testID}
          accessibilityViewIsModal
          style={[
            styles.fullScreen,
            { paddingTop: insets.top, paddingBottom: insets.bottom },
          ]}
        >
          <View style={styles.fullScreenHeader}>
            {!!dismiss && (
              <IconButton
                icon="close"
                accessibilityLabel={closeText}
                onPress={dismiss}
                testID={`${testID}-close`}
              />
            )}
            <Title
              variant="titleLarge"
              numberOfLines={1}
              accessibilityRole="header"
              style={styles.fullScreenTitle}
            >
              {title ?? ""}
            </Title>
            {actions}
          </View>
          <ScrollView
            style={styles.fullScreenScroll}
            contentContainerStyle={styles.fullScreenBody}
          >
            {body}
          </ScrollView>
        </View>
      </NativeModal>
    );
  }

  return (
    <NativeModal
      animationType={animationType}
      transparent={transparent}
      visible={visible}
      onRequestClose={dismissable ? dismiss : undefined}
    >
      <View testID={testID} style={styles.overlay}>
        {/*
          The scrim is a sibling *behind* the dialog, not its parent: as a
          parent it would need a no-op press handler on the dialog to stop the
          dismiss from firing through it. Hidden from assistive tech, which
          should reach the dialog, not a full-screen button.
        */}
        <Pressable
          testID={`${testID}-scrim`}
          style={[StyleSheet.absoluteFill, styles.scrim]}
          onPress={dismissable ? dismiss : undefined}
          importantForAccessibility="no"
          accessibilityElementsHidden
        />

        <View
          accessibilityViewIsModal
          style={[styles.modalContent, getGlowStyles(theme, true)]}
        >
          {!!icon && (
            <View style={styles.iconRow}>
              <Icon source={icon} size={24} color={theme.colors.secondary} />
            </View>
          )}

          {!!title && (
            <View style={styles.modalTitleContainer}>
              <Title variant="headlineMedium" style={styles.modalTitleText}>
                {title}
              </Title>
            </View>
          )}

          {scrollable ? (
            <ScrollView
              style={styles.bodyContainer}
              contentContainerStyle={styles.scrollBody}
            >
              {body}
            </ScrollView>
          ) : (
            <View style={styles.bodyContainer}>{body}</View>
          )}

          {actions ? (
            <View style={styles.actions}>{actions}</View>
          ) : (
            onClose && <Button onPress={onClose}>{closeText}</Button>
          )}
        </View>
      </View>
    </NativeModal>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    fullScreen: { flex: 1, backgroundColor: theme.colors.surface },
    fullScreenHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.xs,
      minHeight: 56,
      paddingHorizontal: theme.spacing.xs,
    },
    fullScreenTitle: { flex: 1, paddingHorizontal: theme.spacing.s },
    fullScreenScroll: { flex: 1 },
    fullScreenBody: {
      paddingHorizontal: theme.spacing.l,
      paddingBottom: theme.spacing.l,
    },
    overlay: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: theme.spacing.m,
    },
    scrim: {
      // The M3 `scrim` role at 32%, not a hardcoded rgba black.
      backgroundColor: rgba(theme.colors.scrim, 0.32),
    },
    modalContent: {
      width: "85%",
      maxWidth: 560,
      // Keeps a tall dialog on screen; the body scrolls when `scrollable`.
      maxHeight: "90%",
      backgroundColor: theme.colors.surfaceContainer,
      borderRadius: theme.shape.extraLarge,
      padding: theme.spacing.m,
      alignItems: "center",
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    iconRow: {
      marginBottom: theme.spacing.s,
    },
    modalTitleContainer: {
      marginBottom: theme.spacing.s,
      borderBottomWidth: 1,
      borderColor: theme.colors.outlineVariant,
      paddingBottom: theme.spacing.s,
      width: "100%",
    },
    modalTitleText: {
      ...theme.typography.headlineMedium,
      color: theme.colors.onSurface,
      textAlign: "center",
    },
    bodyContainer: {
      // No `flex: 1` here: inside an `alignItems: "center"` column it forced
      // the body to fill the dialog and pushed the actions off short content.
      width: "100%",
      marginBottom: theme.spacing.m,
    },
    scrollBody: {
      paddingBottom: theme.spacing.xs,
    },
    bodyText: {
      ...theme.typography.bodyLarge,
      color: theme.colors.onSurface,
      textAlign: "center",
    },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: theme.spacing.s,
      width: "100%",
    },
  });

export default Modal;
