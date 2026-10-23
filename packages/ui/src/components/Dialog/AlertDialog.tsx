import React, { useId, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTheme, Theme } from "../../providers/ThemeProvider";
import Dialog, { type DialogSlotStyles } from "./Dialog";
import Button from "../Button";
import Icons from "../Glyph";
import type { MaterialCommunityIconsGlyphs } from "../types";
import { colorRoleTokens } from "../internal/colorRole";

/** The status of an `AlertDialog`: it picks the icon and its colour. */
export type AlertDialogSeverity = "info" | "success" | "warning" | "error";

const ICONS: Record<AlertDialogSeverity, MaterialCommunityIconsGlyphs> = {
  info: "information-outline",
  success: "check-circle-outline",
  warning: "alert-outline",
  error: "alert-circle-outline",
};

export interface AlertDialogProps {
  /** Whether the dialog is on screen. */
  visible: boolean;
  /** The headline. It is the dialog's accessible name. */
  title?: string;
  /** What the alert says. With the `children`, it is the dialog's accessible description. */
  message?: string;
  /** More body under the `message`, or in its place: a string or any node. */
  children?: React.ReactNode;
  /**
   * Puts a status icon above the title, in the colour of the status role.
   * Left out, no icon.
   */
  severity?: AlertDialogSeverity;
  /** Label of the primary action. Defaults to `"OK"`. */
  actionText?: string;
  /** Called when the primary action is pressed. */
  onAction?: () => void;
  /**
   * Label of the secondary action, drawn before the primary one. Left out,
   * the alert has the primary action only.
   */
  cancelText?: string;
  /**
   * Called when the secondary action is pressed, and when the backdrop,
   * Escape or Android back dismiss the alert (once enabled).
   */
  onCancel?: () => void;
  /** Draws the primary action in the error tone (delete, discard). */
  destructive?: boolean;
  /**
   * The primary action shows a spinner and does nothing, the secondary one is
   * disabled, and the alert stays until `visible` goes down: dismissing it is
   * off while it works.
   */
  loading?: boolean;
  /**
   * Keeps a click on the backdrop from calling `onCancel`: an alert needs an
   * answer. Set `false` to let it dismiss. Defaults to `true`.
   */
  disableBackdropClick?: boolean;
  /**
   * Keeps Escape (web) and Android back from calling `onCancel`. Set `false`
   * to let them dismiss. Defaults to `true`.
   */
  disableEscapeKeyDown?: boolean;
  /** As `Dialog`; `actions` covers the buttons and `title` the headline. */
  slotStyles?: DialogSlotStyles;
  /** Root testID. The buttons get `${testID}-cancel` and `${testID}-action`. Defaults to `"alert-dialog"`. */
  testID?: string;
}

/**
 * A dialog that interrupts to say something and wait for an answer: one
 * primary action, optionally a secondary. `Dialog` underneath, with the
 * `alertdialog` role (the title names it, the message describes it), no way
 * out but its buttons, and focus on its least destructive one on the web.
 * For a plain two-way question use `ConfirmDialog`.
 *
 * ```tsx
 * <AlertDialog
 *   visible={open}
 *   severity="error"
 *   title="Delete the project?"
 *   message="Its 12 files are removed for good."
 *   actionText="Delete"
 *   destructive
 *   cancelText="Keep it"
 *   onAction={remove}
 *   onCancel={() => setOpen(false)}
 * />
 * ```
 */
const AlertDialog = ({
  visible,
  title,
  message,
  children,
  severity,
  actionText = "OK",
  onAction,
  cancelText,
  onCancel,
  destructive = false,
  loading = false,
  disableBackdropClick = true,
  disableEscapeKeyDown = true,
  slotStyles,
  testID = "alert-dialog",
}: AlertDialogProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const descriptionId = useId();
  const tone = severity && colorRoleTokens(theme, severity).main;

  return (
    <Dialog
      visible={visible}
      title={title}
      icon={
        severity &&
        (() => <Icons name={ICONS[severity]} size={24} color={tone} />)
      }
      role="alertdialog"
      describedBy={descriptionId}
      initialFocus="actions"
      // While it works, nothing dismisses it.
      onClose={loading ? undefined : onCancel}
      // The buttons are the way out: a close icon would be a second one.
      closeIcon={false}
      disableBackdropClick={disableBackdropClick}
      disableEscapeKeyDown={disableEscapeKeyDown}
      slotStyles={slotStyles}
      testID={testID}
      actions={
        <>
          {!!cancelText && (
            <Button
              variant="text"
              disabled={loading}
              onClick={onCancel}
              testID={`${testID}-cancel`}
            >
              {cancelText}
            </Button>
          )}
          <Button
            color={destructive ? "error" : "primary"}
            loading={loading}
            onClick={onAction}
            testID={`${testID}-action`}
          >
            {actionText}
          </Button>
        </>
      }
    >
      <View nativeID={descriptionId} style={styles.body}>
        {!!message && <Text style={styles.message}>{message}</Text>}
        {typeof children === "string" ? (
          <Text style={styles.message}>{children}</Text>
        ) : (
          children
        )}
      </View>
    </Dialog>
  );
};

export default AlertDialog;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    body: {
      alignItems: "center",
      width: "100%",
      gap: theme.spacing.s,
    },
    message: {
      ...theme.typography.bodyLarge,
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
      paddingHorizontal: theme.spacing.s,
    },
  });
