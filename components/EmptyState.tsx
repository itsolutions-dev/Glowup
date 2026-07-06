import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme, Theme } from "../providers/ThemeProvider";
import Typography from "./Typography";
import Button from "./Button";
import { MaterialCommunityIconsGlyphs } from "./types";

interface EmptyStateAction {
  label: string;
  onPress: () => void;
  iconName?: MaterialCommunityIconsGlyphs;
}

interface EmptyStateProps {
  icon?: MaterialCommunityIconsGlyphs;
  title: string;
  description?: string;
  action?: EmptyStateAction;
}

const EmptyState = ({
  icon = "inbox-outline",
  title,
  description,
  action,
}: EmptyStateProps) => {
  const { theme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Icons name={icon} size={40} color={theme.colors.onSurfaceVariant} />
      </View>

      <Typography variant="titleMedium" style={styles.title}>
        {title}
      </Typography>

      {description && (
        <Typography variant="bodyMedium" style={styles.description}>
          {description}
        </Typography>
      )}

      {action && (
        <Button
          mode="tonal"
          onPress={action.onPress}
          iconName={action.iconName}
          style={styles.actionButton}
        >
          {action.label}
        </Button>
      )}
    </View>
  );
};

export default EmptyState;

const makeStyles: (theme: Theme) => StyleSheet.NamedStyles<any> = (
  theme: Theme,
) =>
  StyleSheet.create({
    container: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: theme.spacing.xl,
      paddingHorizontal: theme.spacing.l,
      width: "100%",
    },
    iconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.surfaceContainerHigh,
      marginBottom: theme.spacing.m,
    },
    title: {
      color: theme.colors.onSurface,
      textAlign: "center",
      marginBottom: theme.spacing.xs,
    },
    description: {
      color: theme.colors.onSurfaceVariant,
      textAlign: "center",
      maxWidth: 360,
      marginBottom: theme.spacing.m,
    },
    actionButton: {
      marginTop: theme.spacing.xs,
    },
  });
