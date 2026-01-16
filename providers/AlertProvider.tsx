import React, { createContext, useState, useContext, useMemo } from "react";
import {
  Platform,
  Alert as RNAlert,
  View,
  Text,
  StyleSheet,
} from "react-native";
import { useTheme, Theme } from "./ThemeProvider";

import Modal from "../components/Modal/Modal";
import Button from "../components/Button";

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState({ title: "", message: "", buttons: [] });
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const showAlert = (title, message, buttons) => {
    // If on Mobile (iOS/Android), use native system dialog
    if (Platform.OS !== "web") {
      RNAlert.alert(title, message, buttons);
      return;
    }

    // If on Web, trigger the custom Modal
    setConfig({ title, message, buttons: buttons || [{ text: "OK" }] });
    setVisible(true);
  };

  const closeAlert = () => setVisible(false);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      {/* The Web-only Modal Component */}
      {Platform.OS === "web" && (
        <Modal visible={visible} title={config.title}>
          <View style={styles.messageContainer}>
            <Text style={styles.message}>{config.message}</Text>
          </View>
          {config.buttons.length === 0 && (
            <Button onPress={closeAlert}>OK</Button>
          )}
          {config.buttons.map((button, index) => (
            <Button key={index} onPress={closeAlert}>
              {button.text}
            </Button>
          ))}
        </Modal>
      )}
    </AlertContext.Provider>
  );
};

const makeStyles: (theme: Theme) => StyleSheet.NamedStyles<any> = (
  theme: Theme,
) =>
  StyleSheet.create({
    messageContainer: { flex: 1, padding: 20 },
    message: { marginBottom: 20, color: theme.colors.text, fontSize: 16 },
  });

let alertRef;

export const Alert = (title, message, buttons) => {
  if (alertRef) {
    alertRef(title, message, buttons);
  } else {
    console.warn("AlertProvider is not initialized.");
  }
};

// Update the reference inside the Provider
export const AlertProviderWrapper = ({ children }) => {
  const { showAlert } = useContext(AlertContext);
  alertRef = showAlert;
  return <>{children}</>;
};
