import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Dialog, Typography, useTheme, type Theme } from "@its/glowup-ui";
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
  pageShortcuts = [],
  visible,
  onDismiss,
}: {
  shortcuts: Shortcut[];
  /** The page on screen's own (`usePageShortcuts`), under "This page". */
  pageShortcuts?: Shortcut[];
  visible: boolean;
  onDismiss: () => void;
}) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const row = (shortcut: Shortcut) => (
    <View key={shortcut.description} style={styles.row}>
      <View style={styles.keys}>
        {shortcut.meta ? (
          <Text style={styles.key}>{COMMAND_KEY_LABEL}</Text>
        ) : null}
        {shortcut.shift ? <Text style={styles.key}>Shift</Text> : null}
        <Text style={styles.key}>{shortcut.label}</Text>
      </View>
      <Typography
        variant="bodyMedium"
        style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}
      >
        {shortcut.description}
      </Typography>
    </View>
  );

  return (
    <Dialog
      visible={visible}
      onClose={onDismiss}
      title="Keyboard shortcuts"
      icon="keyboard-outline"
    >
      <View style={styles.list}>
        {shortcuts.map(row)}
        {pageShortcuts.length > 0 ? (
          <Typography variant="labelLarge" style={styles.group}>
            This page
          </Typography>
        ) : null}
        {pageShortcuts.map(row)}
      </View>
    </Dialog>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    list: { gap: theme.spacing.s, minWidth: 280 },
    group: { marginTop: theme.spacing.s },
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
