import React, { useMemo } from "react";
import { View, Pressable, Modal, ScrollView, StyleSheet } from "react-native";
import { Theme, useTheme } from "../providers/ThemeProvider";

export interface PickerDialogProps {
  visible: boolean;
  onClose: () => void;
  /** Accessible name of the scrim, which dismisses the dialog. */
  closeLabel: string;
  children: React.ReactNode;
}

/**
 * The picker's dialog shell: a card centred over a scrim, the way Material's
 * mobile pickers open. Glowup's `Dialog` is a card with its own title bar and
 * action row, and the M3 picker brings its own headline and footer, so this is
 * built on RN's `Modal`. The scrim, the back
 * gesture and the OS back button dismiss it.
 */
const PickerDialog = ({
  visible,
  onClose,
  closeLabel,
  children,
}: PickerDialogProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* The scrim and the card are siblings, not a button inside a button:
          on the web that is invalid markup. The wrapper takes no touches of its
          own, so a press beside the card reaches the scrim behind it. */}
      <View pointerEvents="box-none" style={styles.center}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={closeLabel}
          onPress={onClose}
          style={styles.scrim}
        />
        <View
          style={[
            styles.dialog,
            { backgroundColor: theme.colors.surfaceContainer },
          ]}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.body}>{children}</View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default PickerDialog;

/** M3 basic-dialog width: the 7×40 day grid plus the dialog's own gutters. */
const DIALOG_WIDTH = 328;

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: theme.spacing.m,
    },
    scrim: {
      ...StyleSheet.absoluteFill,
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    dialog: {
      width: DIALOG_WIDTH,
      maxWidth: "100%",
      maxHeight: "90%",
      borderRadius: theme.shape.extraLarge,
      overflow: "hidden",
    },
    body: { alignItems: "stretch" },
  });
