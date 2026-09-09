import React, { useEffect, useRef, useMemo } from "react";
import {
  Animated,
  StyleSheet,
  View,
  Text,
  Platform,
} from "react-native";
import { useTheme, Theme, getGlowStyles } from "../providers/ThemeProvider";
import Button from "./Button";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import { MaterialCommunityIconsGlyphs } from "./types";

export interface SnackbarProps {
  visible: boolean;
  message: string;
  onDismiss: () => void;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
  type?: "default" | "success" | "error";
  icon?: MaterialCommunityIconsGlyphs;
}

const Snackbar = ({
  visible,
  message,
  onDismiss,
  duration = 4000,
  action,
  type = "default",
  icon,
}: SnackbarProps) => {
  const { theme } = useTheme();
  const [shouldRender, setShouldRender] = React.useState(visible);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(100)).current;

  // Keep latest onDismiss without restarting the auto-hide timer on re-renders
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  // Mount the snackbar as soon as it becomes visible (render-time adjustment)
  if (visible && !shouldRender) {
    setShouldRender(true);
  }

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 40,
          friction: 8,
        }),
      ]).start();

      if (duration > 0) {
        const timer = setTimeout(() => {
          onDismissRef.current();
        }, duration);
        return () => clearTimeout(timer);
      }
    } else {
      // Hide animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 100,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShouldRender(false);
      });
    }
  }, [visible, duration, fadeAnim, translateYAnim]);

  const { styles, iconColor } = useMemo(
    () => makeStyles(theme, type),
    [theme, type],
  );

  if (!shouldRender) return null;

  const glowStyles = getGlowStyles(
    theme,
    true,
    type === "error" ? "error" : undefined,
  );

  return (
    <Animated.View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: translateYAnim }],
        },
      ]}
    >
      <View style={[styles.content, glowStyles]}>
        <View style={styles.messageRow}>
          {!!icon && (
            <Icons
              name={icon}
              size={20}
              color={iconColor}
              style={styles.leadingIcon}
            />
          )}
          {!icon && type !== "default" && (
            <Icons
              name={type === "success" ? "check-circle" : "alert-circle"}
              size={20}
              color={iconColor}
              style={styles.leadingIcon}
            />
          )}
          <Text
            style={[theme.typography.bodyMedium, styles.messageText]}
            numberOfLines={2}
          >
            {message}
          </Text>
        </View>

        {action && (
          <Button
            mode="tonal"
            onPress={() => {
              action.onPress();
              onDismiss();
            }}
            style={styles.actionButton}
          >
            {action.label}
          </Button>
        )}
      </View>
    </Animated.View>
  );
};

const makeStyles = (theme: Theme, type: "default" | "success" | "error") => {
  const isError = type === "error";
  const isSuccess = type === "success";

  let backgroundColor = theme.colors.surfaceContainerHighest;
  let textColor = theme.colors.onSurface;
  let iconColor = theme.colors.primary;

  if (isError) {
    backgroundColor = theme.colors.errorContainer;
    textColor = theme.colors.onErrorContainer;
    iconColor = theme.colors.error;
  } else if (isSuccess) {
    backgroundColor = theme.colors.secondaryContainer;
    textColor = theme.colors.onSecondaryContainer;
    iconColor = theme.colors.primary; // Or theme.colors.success if it existed
  }

  const styles = StyleSheet.create({
    container: {
      position: "absolute",
      bottom: 24,
      left: 16,
      right: 16,
      zIndex: 1000,
      alignItems: "center",
      justifyContent: "center",
    },
    content: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 12,
      minHeight: 48,
      width: "100%",
      maxWidth: 600, // For tablet/web
      ...Platform.select({
        web: {
          userSelect: "none",
        },
      }),
    } as any,
    messageRow: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    messageText: {
      color: textColor,
      flex: 1,
    },
    leadingIcon: {
      marginRight: 12,
    },
    actionButton: {
      marginLeft: 8,
      paddingVertical: 6,
      paddingHorizontal: 12,
      minHeight: 32,
    },
  });

  return { styles, iconColor };
};

export default Snackbar;
