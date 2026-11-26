import React from "react";
import { KeyboardAvoidingView, Platform, StyleSheet } from "react-native";
import { PortalHost } from "../Portal";

/**
 * The root of an overlay's `Modal` window (a `Dialog`, a `BottomSheet`, a side
 * sheet). It is a `PortalHost`: a `Modal` is a layer above the app's root, so a
 * list, a tooltip or a card portalled to the root host from inside it would be
 * drawn under it; here they are drawn at the top of the overlay's own window.
 * It also gives up the room the keyboard takes, so a field and the buttons
 * under it stay reachable while typing. A `Modal` is a window of its own, which
 * Android does not resize for the keyboard (seen on the emulator: the notes and
 * the Confirm button of a full-screen dialog sat behind it). The web has no
 * on-screen keyboard to avoid.
 */
const KeyboardFrame = ({ children }: { children: React.ReactNode }) => (
  // Outside the keyboard's padding: the portals are placed in window
  // coordinates, so their layer must cover the whole window.
  <PortalHost>
    {Platform.OS === "web" ? (
      children
    ) : (
      <KeyboardAvoidingView behavior="padding" style={styles.frame}>
        {children}
      </KeyboardAvoidingView>
    )}
  </PortalHost>
);

export default KeyboardFrame;

const styles = StyleSheet.create({ frame: { flex: 1 } });
