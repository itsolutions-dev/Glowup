import React, { useState, useMemo } from "react";
import {
  Modal as NativeModal,
  StyleSheet,
  Text,
  Pressable,
  View,
} from "react-native";
import { useTheme, Theme } from "providers/ThemeProvider";
import Button from "../Button";
import Title from "components/Typography";

interface ModalProps {
  children: React.ReactNode | string;
  title?: string;
  animationType?: "none" | "slide" | "fade";
  transparent?: boolean;
  visible?: boolean;
  onClose?: () => void;
}

function Modal({
  children,
  title,
  visible,
  animationType = "fade",
  transparent = true,
  onClose,
}: ModalProps) {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const isText = typeof children === "string";
  let component = children;
  if (isText) {
    component = <Text style={styles.bodyText}>{children}</Text>;
  }

  return (
    <NativeModal
      animationType={animationType || "fade"}
      transparent={transparent || true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {title && (
            <View style={styles.modalTitleContainer}>
              {" "}
              {/* Container for title and border */}
              <Title
                variant="headlineMedium"
                style={styles.modalTitleText} // Specific style for the Title component's text
              >
                {title}
              </Title>
            </View>
          )}
          {/* Fix: Applied 'body' style to the container holding the content */}
          <View style={styles.bodyContainer}>{component}</View>

          {onClose && <Button onPress={onClose}>Chiudi</Button>}
        </View>
      </View>
    </NativeModal>
  );
}

const makeStyles: (theme: Theme) => StyleSheet.NamedStyles<any> = (
  theme: Theme,
) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)", // Sfondo semitrasparente
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      width: "85%",
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
      textAlign: "center", // Fix: Center text content
    },
    bodyContainer: {
      flex: 1, // Allow content to grow
      width: "100%", // Ensures content respects modal width
      marginBottom: theme.spacing.m,
    },
    bodyText: {
      ...theme.typography.bodyLarge,
      color: theme.colors.onSurface,
      textAlign: "center", // Example: center body text
    },
  });

export default Modal;
