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
  // One alert at a time, the others wait their turn: a second Alert() must not
  // replace the first, whose buttons someone is waiting on.
  const [queue, setQueue] = useState<AlertConfig[]>([]);
  const config = queue[0];
  const visible = !!config;
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const showAlert: ShowAlert = useCallback((title, message, buttons) => {
    setQueue((current) => [
      ...current,
      { title, message, buttons: buttons || [{ text: "OK" }] },
    ]);
  }, []);

  useEffect(() => {
    alertRef = showAlert;
    // The ones raised before this provider was there.
    pending.splice(0).forEach((args) => showAlert(...args));
    return () => {
      if (alertRef === showAlert) alertRef = undefined;
    };
  }, [showAlert]);

  const closeAlert = () => setQueue((current) => current.slice(1));
  // Escape, like a native alert's dismissal, answers with the cancel button.
  const cancelAlert = () => {
    closeAlert();
    config?.buttons.find((button) => button.style === "cancel")?.onPress?.();
  };

  return (
    <>
      {children}
      {/* The Web-only Dialog Component */}
      {Platform.OS === "web" && (
        <Dialog
          visible={visible}
          title={config?.title}
          onClose={cancelAlert}
          // The buttons are the way out, as in a native alert.
          closeIcon={false}
          actions={
            !config || config.buttons.length === 0 ? (
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
            {!!config?.message && (
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
/** Web alerts raised before an `AlertProvider` mounted: it shows them when it does. */
const pending: Parameters<ShowAlert>[] = [];

export const Alert: ShowAlert = (title, message, buttons) => {
  // On iOS and Android it is the system's own alert, which needs no provider.
  if (Platform.OS !== "web") {
    RNAlert.alert(title, message, buttons);
  } else if (alertRef) {
    alertRef(title, message, buttons);
  } else {
    pending.push([title, message, buttons]);
  }
};

/**
 * @deprecated `AlertProvider` now wires up `Alert()` by itself. This renders
 * its children unchanged and will be removed in a later release.
 */
export const AlertProviderWrapper = ({ children }: { children: ReactNode }) => (
  <>{children}</>
);
