import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
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

import Dialog from "../components/Dialog/Dialog";
import Button from "../components/Button";

type ShowAlert = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
) => void;

interface AlertConfig {
  title: string;
  message?: string;
  buttons: AlertButton[];
}

// The provider that `Alert()` reaches. A module-level reference rather than a
// context because `Alert` is called from outside React (a service, a catch
// block), exactly like react-native's own `Alert.alert`.
export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertConfig>({
    title: "",
    message: "",
    buttons: [],
  });
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const showAlert: ShowAlert = useCallback((title, message, buttons) => {
    // If on Mobile (iOS/Android), use native system dialog
    if (Platform.OS !== "web") {
      RNAlert.alert(title, message, buttons);
      return;
    }

    // If on Web, trigger the custom Dialog
    setConfig({ title, message, buttons: buttons || [{ text: "OK" }] });
    setVisible(true);
  }, []);

  useEffect(() => {
    alertRef = showAlert;
    return () => {
      if (alertRef === showAlert) alertRef = undefined;
    };
  }, [showAlert]);

  const closeAlert = () => setVisible(false);

  return (
    <>
      {children}
      {/* The Web-only Dialog Component */}
      {Platform.OS === "web" && (
        <Dialog
          visible={visible}
          title={config.title}
          onClose={closeAlert}
          // The buttons are the way out, as in a native alert.
          closeIcon={false}
          actions={
            config.buttons.length === 0 ? (
              <Button onClick={closeAlert}>OK</Button>
            ) : (
              config.buttons.map((button, index) => (
                <Button
                  key={index}
                  variant={button.style === "cancel" ? "text" : "filled"}
                  color={button.style === "destructive" ? "error" : "primary"}
                  onClick={() => {
                    closeAlert();
                    button.onPress?.();
                  }}
                >
                  {button.text}
                </Button>
              ))
            )
          }
        >
          <View style={styles.messageContainer}>
            {!!config.message && (
              <Text style={styles.message}>{config.message}</Text>
            )}
          </View>
        </Dialog>
      )}
    </>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    messageContainer: { alignItems: "center", width: "100%" },
    message: {
      ...theme.typography.bodyLarge,
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
      paddingHorizontal: theme.spacing.s,
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

/**
 * @deprecated `AlertProvider` now wires up `Alert()` by itself. This renders
 * its children unchanged and will be removed in a later release.
 */
export const AlertProviderWrapper = ({ children }: { children: ReactNode }) => (
  <>{children}</>
);
