import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme, Theme } from "../providers/ThemeProvider";
import Button from "./Button";
import { MaterialCommunityIconsGlyphs } from "./types";

export interface BannerAction {
  label: string;
  onPress: () => void;
}

type BannerType = "default" | "info" | "warning" | "error";

interface BannerProps {
  visible: boolean;
  message: string;
  icon?: MaterialCommunityIconsGlyphs;
  /** Up to two actions, rendered right-aligned below the message. */
  actions?: BannerAction[];
  type?: BannerType;
}

const DEFAULT_ICONS: Record<BannerType, MaterialCommunityIconsGlyphs | null> = {
  default: null,
  info: "information-outline",
  warning: "alert-outline",
  error: "alert-circle-outline",
};

const Banner = ({
  visible,
  message,
  icon,
  actions,
  type = "default",
}: BannerProps) => {
  const { theme } = useTheme();
  const { styles, iconColor } = useMemo(
    () => makeStyles(theme, type),
    [theme, type],
  );

  if (!visible) return null;

  const iconName = icon ?? DEFAULT_ICONS[type];

  return (
    <View
      style={styles.container}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <View style={styles.messageRow}>
        {iconName && (
          <Icons
            name={iconName}
            size={24}
            color={iconColor}
            style={styles.leadingIcon}
          />
        )}
        <Text style={[theme.typography.bodyMedium, styles.messageText]}>
          {message}
        </Text>
      </View>

      {actions && actions.length > 0 && (
        <View style={styles.actionsRow}>
          {actions.slice(0, 2).map((action) => (
            <Button
              key={action.label}
              mode="text"
              onPress={action.onPress}
              style={styles.actionButton}
            >
              {action.label}
            </Button>
          ))}
        </View>
      )}
    </View>
  );
};

export default Banner;

const makeStyles = (theme: Theme, type: BannerType) => {
  let backgroundColor = theme.colors.surfaceContainerLow;
  let textColor = theme.colors.onSurface;
  let iconColor = theme.colors.primary;

  if (type === "error") {
    backgroundColor = theme.colors.errorContainer;
    textColor = theme.colors.onErrorContainer;
    iconColor = theme.colors.error;
  } else if (type === "warning") {
    backgroundColor = theme.colors.tertiaryContainer;
    textColor = theme.colors.onTertiaryContainer;
    iconColor = theme.colors.onTertiaryContainer;
  } else if (type === "info") {
    backgroundColor = theme.colors.secondaryContainer;
    textColor = theme.colors.onSecondaryContainer;
    iconColor = theme.colors.primary;
  }

  const styles = StyleSheet.create({
    container: {
      width: "100%",
      backgroundColor,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outlineVariant,
    },
    messageRow: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    leadingIcon: {
      marginRight: 16,
    },
    messageText: {
      color: textColor,
      flex: 1,
    },
    actionsRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginTop: 8,
      gap: 8,
    },
    actionButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      minHeight: 32,
    },
  });

  return { styles, iconColor };
};
