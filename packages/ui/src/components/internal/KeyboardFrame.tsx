import React from "react";
import { KeyboardAvoidingView, Platform, StyleSheet } from "react-native";

/**
 * The root of an overlay's `Modal` window: it gives up the room the keyboard
 * takes, so a field and the buttons under it stay reachable while typing. A
 * `Modal` is a window of its own, which Android does not resize for the
 * keyboard (seen on the emulator: the notes and the Confirm button of a
 * full-screen dialog sat behind it). The web has no on-screen keyboard to avoid.
 */
const KeyboardFrame = ({ children }: { children: React.ReactNode }) =>
  Platform.OS === "web" ? (
    <>{children}</>
  ) : (
    <KeyboardAvoidingView behavior="padding" style={styles.frame}>
      {children}
    </KeyboardAvoidingView>
  );

export default KeyboardFrame;

const styles = StyleSheet.create({ frame: { flex: 1 } });
