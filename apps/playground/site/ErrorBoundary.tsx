import React from "react";
import { View, StyleSheet } from "react-native";
import { Button, Typography, useTheme, type Theme } from "@its/glowup-ui";

interface Props {
  /** Shown in the fallback so the reader knows which demo failed. */
  label: string;
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches a throwing demo so it takes down one card instead of the site.
 *
 * A gallery renders arbitrary components with arbitrary props, several of them
 * typed in live by whoever is reading — a bad value in the properties panel
 * used to blank the entire app with no way back except a reload. React only
 * offers this as a class component; there is no hook equivalent.
 */
export class DemoErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  reset = () => this.setState({ error: null });

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <ErrorCard
        label={this.props.label}
        error={this.state.error}
        onRetry={this.reset}
      />
    );
  }
}

const ErrorCard = ({
  label,
  error,
  onRetry,
}: {
  label: string;
  error: Error;
  onRetry: () => void;
}) => {
  const { theme } = useTheme();
  const styles = React.useMemo(() => makeStyles(theme), [theme]);

  return (
    <View style={styles.card} accessibilityRole="alert">
      <Typography
        variant="titleSmall"
        style={{ color: theme.colors.onErrorContainer }}
      >
        {label} could not render
      </Typography>
      <Typography
        variant="bodySmall"
        style={{ color: theme.colors.onErrorContainer }}
      >
        {error.message}
      </Typography>
      <Button mode="tonal" tone="error" iconName="refresh" onPress={onRetry}>
        Try again
      </Button>
    </View>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    card: {
      width: "100%",
      gap: theme.spacing.s,
      padding: theme.spacing.l,
      borderRadius: theme.shape.large,
      backgroundColor: theme.colors.errorContainer,
      alignItems: "flex-start",
    },
  });

export default DemoErrorBoundary;
