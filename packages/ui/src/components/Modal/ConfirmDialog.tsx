import { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme, Theme } from "../../providers/ThemeProvider";
import Modal from "./Modal";
import Button from "../Button";
import { IconSource } from "../Icon";

interface ConfirmDialogProps {
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
   * Whether the scrim and ESC cancel the dialog. Leave it off for a decision
   * the user must answer explicitly. Defaults to `true`.
   */
  dismissable?: boolean;
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
}: ConfirmDialogProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <Modal
      visible={visible}
      title={title}
      icon={icon}
      onDismiss={onCancel}
      dismissable={dismissable}
      actions={
        <>
          <Button onPress={onCancel} mode="text">
            {cancelText}
          </Button>
          <Button onPress={onConfirm} tone={destructive ? "error" : "primary"}>
            {confirmText}
          </Button>
        </>
      }
    >
      <View style={styles.container}>
        {!!message && <Text style={styles.message}>{message}</Text>}
      </View>
    </Modal>
  );
}

export default ConfirmDialog;

const makeStyles: (theme: Theme) => StyleSheet.NamedStyles<any> = (
  theme: Theme,
) =>
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
