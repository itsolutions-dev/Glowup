import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import {
  Platform,
  Alert as RNAlert,
  AlertButton,
  View,
  Text,
  StyleSheet,
} from "react-native";
import { useTheme, Theme } from "./ThemeProvider";

import Modal from "../components/Modal/Modal";
import Button from "../components/Button";

type ShowAlert = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
) => void;

interface AlertContextValue {
  showAlert: ShowAlert;
}

interface AlertConfig {
  title: string;
  message?: string;
  buttons: AlertButton[];
}

const AlertContext = createContext<AlertContextValue | undefined>(undefined);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertConfig>({
    title: "",
    message: "",
    buttons: [],
  });
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const showAlert: ShowAlert = (title, message, buttons) => {
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
        <Modal visible={visible} title={config.title} onDismiss={closeAlert}>
          <View style={styles.messageContainer}>
            <Text style={styles.message}>{config.message}</Text>
          </View>
          {config.buttons.length === 0 && (
            <Button onPress={closeAlert}>OK</Button>
          )}
          {config.buttons.map((button, index) => (
            <Button
              key={index}
              onPress={() => {
                closeAlert();
                button.onPress?.();
              }}
            >
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
    message: {
      marginBottom: 20,
      color: theme.colors.onSurface,
      fontSize: 16,
    },
  });

let alertRef: ShowAlert | undefined;

export const Alert: ShowAlert = (title, message, buttons) => {
  if (alertRef) {
    alertRef(title, message, buttons);
  } else {
    console.warn("AlertProvider is not initialized.");
  }
};

// Update the reference inside the Provider
export const AlertProviderWrapper = ({ children }: { children: ReactNode }) => {
  const context = useContext(AlertContext);

  useEffect(() => {
    alertRef = context?.showAlert;
    return () => {
      alertRef = undefined;
    };
  }, [context?.showAlert]);

  return <>{children}</>;
};
