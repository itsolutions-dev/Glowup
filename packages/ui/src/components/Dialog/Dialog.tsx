import React, { useCallback, useContext, useId, useMemo, useRef } from "react";
import {
  Modal as NativeModal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { rgba } from "polished";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";
import { useTheme, Theme, getGlowStyles } from "../../providers/ThemeProvider";
import { ToastLayer } from "../internal/ToastLayer";
import KeyboardFrame from "../internal/KeyboardFrame";

import Button from "../Button";
import Form from "../Form";
import Icon, { IconSource } from "../Icon";
import IconButton from "../IconButton";
import Title from "../Typography";
import type { MaterialCommunityIconsGlyphs } from "../types";

/** Maximum dialog widths: the dialog is 85% of the window, up to this many px. */
const MAX_WIDTHS = { xs: 360, sm: 480, md: 560, lg: 800 } as const;

/** The size of the close control, which the title makes room for. */
const CLOSE_SIZE = 40;

export type DialogWidth = keyof typeof MAX_WIDTHS;

/** Style overrides for the parts of a `Dialog`, applied after its own styles. */
export interface DialogSlotStyles {
  /** The scrim behind the dialog (not drawn by `fullScreen`). */
  backdrop?: StyleProp<ViewStyle>;
  /** The dialog card (the whole window in a `fullScreen` dialog). */
  container?: StyleProp<ViewStyle>;
  /** The header: hero icon, title and close control. */
  header?: StyleProp<ViewStyle>;
  /** The title text. */
  title?: StyleProp<TextStyle>;
  /** The body that holds the children. */
  content?: StyleProp<ViewStyle>;
  /** The row of `actions`. */
  actions?: StyleProp<ViewStyle>;
}

export interface DialogProps {
  children: React.ReactNode | string;
  title?: string;
  /** Hero glyph above the title (M3 dialog icon). Centres the header. */
  icon?: IconSource;
  animationType?: "none" | "slide" | "fade";
  transparent?: boolean;
  /** Whether the dialog is on screen. */
  visible: boolean;
  /**
   * Asks the dialog to close: called by the close icon, a click on the
   * backdrop, Escape (web) and Android back. Without it the dialog has no
   * way to close itself, so `visible` stays up to the app.
   */
  onClose?: () => void;
  /** Accessible name of the close icon, and the label of the fallback close button. */
  closeText?: string;
  /**
   * The close icon in the header, shown while `onClose` is set: a glyph name,
   * your own element, or `false` to hide it. Hidden, a dialog without
   * `actions` falls back to a text button labelled `closeText`.
   * Defaults to `"close"`.
   */
  closeIcon?: MaterialCommunityIconsGlyphs | React.ReactElement | false;
  /**
   * Keeps Escape (web) and Android back from calling `onClose`. Turn it on
   * for a decision the user must not be able to skip. Defaults to `false`.
   */
  disableEscapeKeyDown?: boolean;
  /**
   * Keeps a click on the backdrop from calling `onClose`. Defaults to `false`.
   */
  disableBackdropClick?: boolean;
  /**
   * How wide the dialog may grow on a wide window: `"xs"` 360, `"sm"` 480,
   * `"md"` 560, `"lg"` 800. Defaults to `"md"`. Ignored by `fullScreen`.
   */
  width?: DialogWidth;
  /**
   * A fixed height for the dialog card, in px or as a percentage of the
   * window (`"60%"`). The body scrolls when the content is taller. The card
   * never grows past 90% of the window. Ignored by `fullScreen`.
   */
  height?: number | `${number}%`;
  /** Scrolls the body when the content is taller than the dialog. */
  scrollable?: boolean;
  /**
   * Wraps the body and the `actions` in a `Form`, so a `Button
   * type="submit"` in `actions` (or Enter in a field, on the web) calls
   * `onSubmit`. In a `fullScreen` dialog the header is inside it too.
   */
  form?: boolean;
  /** Called when the `form` is submitted. Only used with `form`. */
  onSubmit?: () => void;
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
  /**
   * The ARIA role of the card, for the web and for screen readers elsewhere.
   * `"alertdialog"` marks a dialog that interrupts to ask for an answer (see
   * `AlertDialog`); the title then names the card. Left out, the card has no
   * role of its own and react-native-web's modal supplies `dialog`.
   */
  role?: "dialog" | "alertdialog";
  /**
   * The `nativeID` of the element that describes the dialog (an alert's
   * message), set as `aria-describedby`. Only used with `role`.
   */
  describedBy?: string;
  /**
   * Web: where focus goes once the dialog is open. `"auto"` leaves it to the
   * modal's focus trap, which takes the first focusable element (the close
   * icon, or a field in the body). `"actions"` focuses the first control of
   * the `actions` row, so an alert starts on its least destructive button.
   * Ignored by `fullScreen`. Defaults to `"auto"`.
   */
  initialFocus?: "auto" | "actions";
  /** Style overrides for the parts of the dialog, merged after its own styles. */
  slotStyles?: DialogSlotStyles;
  /** Root testID. The scrim gets `${testID}-scrim`, the close icon `${testID}-close`, the form `${testID}-form`. */
  testID?: string;
}

const NO_INSETS = { top: 0, bottom: 0, left: 0, right: 0 };

/** What can take focus inside the actions row on the web. */
const FOCUSABLE =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

interface CloseControlProps {
  icon: MaterialCommunityIconsGlyphs | React.ReactElement;
  label: string;
  onClick: () => void;
  testID: string;
  style?: StyleProp<ViewStyle>;
}

/** The dialog's close control: an `IconButton`, or a bare press target around your own element. */
function CloseControl({
  icon,
  label,
  onClick,
  testID,
  style,
}: CloseControlProps) {
  if (typeof icon === "string") {
    return (
      <IconButton
        icon={icon}
        accessibilityLabel={label}
        onClick={onClick}
        testID={testID}
        style={style}
      />
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onClick}
      testID={testID}
      style={[closeStyles.custom, style]}
    >
      {icon}
    </Pressable>
  );
}

const closeStyles = StyleSheet.create({
  custom: {
    width: CLOSE_SIZE,
    height: CLOSE_SIZE,
    borderRadius: CLOSE_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
});

function Dialog({
  children,
  title,
  icon,
  visible,
  animationType = "fade",
  transparent = true,
  onClose,
  closeText = "Close",
  closeIcon = "close",
  disableEscapeKeyDown = false,
  disableBackdropClick = false,
  width = "md",
  height,
  scrollable = false,
  form = false,
  onSubmit,
  actions,
  fullScreen = false,
  role,
  describedBy,
  initialFocus = "auto",
  slotStyles,
  testID = "dialog",
}: DialogProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const titleId = useId();
  const actionsRef = useRef<View>(null);

  // The modal calls this once it is on screen, before its focus trap looks for
  // something to focus: focus already inside the dialog is left where it is.
  const focusActions = useCallback(() => {
    if (Platform.OS !== "web") return;
    const row = actionsRef.current as unknown as HTMLElement | null;
    row?.querySelector?.<HTMLElement>(FOCUSABLE)?.focus();
  }, []);

  const roleProps = role && {
    role,
    "aria-labelledby": title ? titleId : undefined,
    "aria-describedby": describedBy,
  };
  const titleProps = role ? { nativeID: titleId } : undefined;

  // Read without requiring a SafeAreaProvider: only the full-screen dialog
  // uses the insets, and a plain dialog must keep working without one.
  const insets = useContext(SafeAreaInsetsContext) ?? NO_INSETS;

  // `onRequestClose` is Android back and, on the web, Escape: react-native-web's
  // Modal calls it for the topmost modal only. A key listener of our own would
  // call `onClose` twice and close every dialog of a stack at once.
  const onEscape = disableEscapeKeyDown ? undefined : onClose;

  const closable = !!onClose && closeIcon !== false;
  const closeControl = (style?: StyleProp<ViewStyle>) =>
    closable ? (
      <CloseControl
        icon={closeIcon}
        label={closeText}
        onClick={onClose}
        testID={`${testID}-close`}
        style={style}
      />
    ) : null;

  const content =
    typeof children === "string" ? (
      <Text style={styles.bodyText}>{children}</Text>
    ) : (
      children
    );

  if (fullScreen) {
    const screen = (
      <>
        <View style={[styles.fullScreenHeader, slotStyles?.header]}>
          {closeControl()}
          <Title
            variant="titleLarge"
            numberOfLines={1}
            accessibilityRole="header"
            {...titleProps}
            style={[styles.fullScreenTitle, slotStyles?.title]}
          >
            {title ?? ""}
          </Title>
          {actions}
        </View>
        <ScrollView
          style={[styles.fullScreenScroll, slotStyles?.content]}
          contentContainerStyle={styles.fullScreenBody}
        >
          {content}
        </ScrollView>
      </>
    );

    return (
      <NativeModal
        animationType={animationType === "fade" ? "slide" : animationType}
        visible={visible}
        onRequestClose={onEscape}
      >
        <KeyboardFrame>
          <View
            testID={testID}
            accessibilityViewIsModal
            {...roleProps}
            style={[
              styles.fullScreen,
              { paddingTop: insets.top, paddingBottom: insets.bottom },
              slotStyles?.container,
            ]}
          >
            {form ? (
              <Form
                onSubmit={onSubmit}
                style={styles.fullScreenForm}
                testID={`${testID}-form`}
              >
                {screen}
              </Form>
            ) : (
              screen
            )}
            <ToastLayer active={visible} />
          </View>
        </KeyboardFrame>
      </NativeModal>
    );
  }

  // A fixed height only makes sense with a body that can scroll inside it.
  const scrolls = scrollable || height != null;
  const bodyStyle = [
    styles.bodyContainer,
    scrolls && styles.bodyScroll,
    height != null && styles.bodyFill,
    slotStyles?.content,
  ];

  const footer = actions ? (
    <View ref={actionsRef} style={[styles.actions, slotStyles?.actions]}>
      {actions}
    </View>
  ) : (
    // The text button stands in for the close icon, not next to it.
    !!onClose &&
    closeIcon === false && <Button onClick={onClose}>{closeText}</Button>
  );

  const main = (
    <>
      {scrolls ? (
        <ScrollView style={bodyStyle} contentContainerStyle={styles.scrollBody}>
          {content}
        </ScrollView>
      ) : (
        <View style={bodyStyle}>{content}</View>
      )}
      {footer}
    </>
  );

  return (
    <NativeModal
      animationType={animationType}
      transparent={transparent}
      visible={visible}
      onRequestClose={onEscape}
      onShow={initialFocus === "actions" ? focusActions : undefined}
    >
      <KeyboardFrame>
        <View testID={testID} style={styles.overlay}>
          {/*
          The scrim is a sibling *behind* the dialog, not its parent: as a
          parent it would need a no-op press handler on the dialog to stop the
          dismiss from firing through it. Hidden from assistive tech, which
          should reach the dialog, not a full-screen button.
        */}
          <Pressable
            testID={`${testID}-scrim`}
            style={[
              StyleSheet.absoluteFill,
              styles.scrim,
              slotStyles?.backdrop,
            ]}
            onPress={disableBackdropClick ? undefined : onClose}
            importantForAccessibility="no"
            accessibilityElementsHidden
          />

          <View
            accessibilityViewIsModal
            {...roleProps}
            style={[
              styles.modalContent,
              { maxWidth: MAX_WIDTHS[width] },
              height != null && { height },
              getGlowStyles(theme, true),
              slotStyles?.container,
            ]}
          >
            {(!!icon || !!title || closable) && (
              <View
                style={[
                  styles.header,
                  closable && styles.headerClosable,
                  slotStyles?.header,
                ]}
              >
                {closeControl(styles.closeCorner)}

                {!!icon && (
                  <View style={styles.iconRow}>
                    <Icon
                      source={icon}
                      size={24}
                      color={theme.colors.secondary}
                    />
                  </View>
                )}

                {!!title && (
                  <View style={styles.modalTitleContainer}>
                    <Title
                      variant="headlineMedium"
                      accessibilityRole="header"
                      {...titleProps}
                      style={[
                        styles.modalTitleText,
                        closable && styles.titleInset,
                        slotStyles?.title,
                      ]}
                    >
                      {title}
                    </Title>
                  </View>
                )}
              </View>
            )}

            {form ? (
              <Form
                onSubmit={onSubmit}
                style={[styles.form, height != null && styles.formFill]}
                testID={`${testID}-form`}
              >
                {main}
              </Form>
            ) : (
              main
            )}
          </View>
          <ToastLayer active={visible} />
        </View>
      </KeyboardFrame>
    </NativeModal>
  );
}

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    fullScreen: { flex: 1, backgroundColor: theme.colors.surface },
    fullScreenForm: { flex: 1 },
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
    header: {
      width: "100%",
      alignItems: "center",
    },
    // Room for the close control, which sits over the end corner.
    headerClosable: { minHeight: CLOSE_SIZE },
    closeCorner: { position: "absolute", top: 0, end: 0, zIndex: 1 },
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
    // Both sides, so the title stays centred while clear of the close control.
    titleInset: { paddingHorizontal: CLOSE_SIZE + theme.spacing.xs },
    bodyContainer: {
      // No `flex: 1` here: inside an `alignItems: "center"` column it forced
      // the body to fill the dialog and pushed the actions off short content.
      width: "100%",
      marginBottom: theme.spacing.m,
    },
    // A scrolling body shrinks to the room the card has; it only grows to
    // fill it when the card has a fixed height.
    bodyScroll: { flexShrink: 1 },
    bodyFill: { flexGrow: 1 },
    scrollBody: {
      paddingBottom: theme.spacing.xs,
    },
    form: {
      width: "100%",
      alignItems: "center",
      flexShrink: 1,
    },
    formFill: { flexGrow: 1 },
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

export default Dialog;
