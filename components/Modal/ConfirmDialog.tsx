import { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme, Theme } from "../../providers/ThemeProvider";
import Modal from "./Modal";
import Button from "../Button";

interface ConfirmDialogProps {
  visible: boolean;
  title?: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

function ConfirmDialog({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
}: ConfirmDialogProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <Modal visible={visible} title={title} onDismiss={onCancel}>
      <View style={styles.container}>
        {!!message && <Text style={styles.message}>{message}</Text>}
        <View style={styles.buttonRow}>
          <Button onPress={onCancel} mode="text" style={styles.cancelButton}>
            {cancelText}
          </Button>
          <Button onPress={onConfirm}>{confirmText}</Button>
        </View>
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
      color: theme.colors.onSurfaceVariant, // Often messages are onSurfaceVariant
      marginBottom: theme.spacing.m,
      textAlign: "center", // Center text for dialog messages
      paddingHorizontal: theme.spacing.s, // Add some padding for the message
    },
    buttonRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      width: "100%",
      paddingTop: theme.spacing.s,
    },
    cancelButton: {
      marginRight: theme.spacing.s, // Manual spacing between buttons
    },
  });
