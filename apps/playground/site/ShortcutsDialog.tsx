import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Modal, Typography, useTheme, type Theme } from "@its/glowup-ui";
import type { Shortcut } from "./useKeyboardShortcuts";
import { COMMAND_KEY_LABEL } from "./useKeyboardShortcuts";

/**
 * The list of what the keyboard can do, opened with `?`.
 *
 * Shortcuts nobody can discover are shortcuts nobody uses, and this renders the
 * same array the handler is bound to — so a shortcut cannot be added without
 * appearing here, or documented without existing.
 */
export const ShortcutsDialog = ({
  shortcuts,
  visible,
  onDismiss,
}: {
  shortcuts: Shortcut[];
  visible: boolean;
  onDismiss: () => void;
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      onClose={onDismiss}
      title="Keyboard shortcuts"
      icon="keyboard-outline"
      dismissable
    >
      <View style={styles.list}>
        {shortcuts.map((shortcut) => (
          <View key={shortcut.label} style={styles.row}>
            <View style={styles.keys}>
              {shortcut.meta ? (
                <Text style={styles.key}>{COMMAND_KEY_LABEL}</Text>
              ) : null}
              <Text style={styles.key}>{shortcut.label}</Text>
            </View>
            <Typography
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}
            >
              {shortcut.description}
            </Typography>
          </View>
        ))}
      </View>
    </Modal>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    list: { gap: theme.spacing.s, minWidth: 280 },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.m,
    },
    keys: { flexDirection: "row", gap: 4, minWidth: 72 },
    key: {
      fontSize: 12,
      color: theme.colors.onSurface,
      backgroundColor: theme.colors.surfaceContainerHighest,
      borderWidth: 1,
      borderColor: theme.colors.outlineVariant,
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      overflow: "hidden",
    },
  });

export default ShortcutsDialog;
