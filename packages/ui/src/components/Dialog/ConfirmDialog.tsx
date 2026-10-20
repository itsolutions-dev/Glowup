import { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme, Theme } from "../../providers/ThemeProvider";
import Dialog, { type DialogSlotStyles } from "./Dialog";
import Button from "../Button";
import { IconSource } from "../Icon";

export interface ConfirmDialogProps {
  visible: boolean;
  title?: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  /** Renders the confirm action in the error tone (delete, discard). */
  destructive?: boolean;
  /** Hero glyph above the title. */
  icon?: IconSource;
  /**
   * Whether the backdrop and ESC cancel the dialog. Turn it off for a decision
   * the user must answer explicitly. Defaults to `true`.
   */
  dismissable?: boolean;
  /**
   * Style overrides for the parts of the dialog, merged after its own styles;
   * `actions` covers the cancel and confirm buttons.
   */
  slotStyles?: DialogSlotStyles;
}

function ConfirmDialog({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  destructive = false,
  icon,
  dismissable = true,
  slotStyles,
}: ConfirmDialogProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <Dialog
      visible={visible}
      title={title}
      icon={icon}
      onClose={onCancel}
      // Cancel is right there in the actions: a second way to close is noise.
      closeIcon={false}
      disableBackdropClick={!dismissable}
      disableEscapeKeyDown={!dismissable}
      slotStyles={slotStyles}
      actions={
        <>
          <Button onClick={onCancel} variant="text">
            {cancelText}
          </Button>
          <Button onClick={onConfirm} color={destructive ? "error" : "primary"}>
            {confirmText}
          </Button>
        </>
      }
    >
      <View style={styles.container}>
        {!!message && <Text style={styles.message}>{message}</Text>}
      </View>
    </Dialog>
  );
}

export default ConfirmDialog;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      alignItems: "center",
      width: "100%",
    },
    message: {
      ...theme.typography.bodyLarge,
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
      paddingHorizontal: theme.spacing.s,
    },
  });
