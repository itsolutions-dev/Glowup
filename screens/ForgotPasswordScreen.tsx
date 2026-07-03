import React, { useState, useMemo } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme, Theme } from "../providers/ThemeProvider";
import Input from "../components/Input";
import Button from "../components/Button";
import Typography from "../components/Typography";

interface ForgotPasswordScreenProps {
  onBackToLogin?: () => void;
  onResetSuccess?: () => void;
}

const ForgotPasswordScreen = ({
  onBackToLogin,
  onResetSuccess,
}: ForgotPasswordScreenProps) => {
  const { theme, toggleTheme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleResetPassword = async () => {
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
      if (onResetSuccess) {
        onResetSuccess();
      }
    }, 1500);
  };

  if (isSubmitted) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={toggleTheme} style={styles.themeToggle}>
              <Icons
                name={theme.isDark ? "brightness-7" : "brightness-4"}
                size={24}
                color={theme.colors.onSurface}
              />
            </Pressable>
          </View>

          {/* Success Message */}
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <Icons
                name="email-check-outline"
                size={64}
                color={theme.colors.primary}
              />
            </View>

            <Typography variant="headlineMedium" style={styles.title}>
              Check Your Mail
            </Typography>

            <Typography variant="bodyMedium" style={styles.subtitle}>
              We have sent a password reset link to:
            </Typography>

            <Typography variant="titleMedium" style={styles.emailText}>
              {email}
            </Typography>

            <Typography variant="bodySmall" style={styles.instruction}>
              Please check your inbox and click the link to reset your password.
              If you don&apos;t see the email, check your spam folder.
            </Typography>

            <Button onPress={onBackToLogin} style={styles.button}>
              Back to Login
            </Button>

            <View style={styles.resendContainer}>
              <Typography variant="bodySmall">
                Didn&apos;t receive the email?{" "}
              </Typography>
              <Pressable onPress={() => setIsSubmitted(false)}>
                <Typography
                  variant="bodySmall"
                  style={{ color: theme.colors.primary, fontWeight: "700" }}
                >
                  Resend
                </Typography>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={toggleTheme} style={styles.themeToggle}>
            <Icons
              name={theme.isDark ? "brightness-7" : "brightness-4"}
              size={24}
              color={theme.colors.onSurface}
            />
          </Pressable>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Icons name="lock-reset" size={64} color={theme.colors.primary} />
          </View>

          <Typography variant="headlineMedium" style={styles.title}>
            Forgot Password?
          </Typography>

          <Typography variant="bodyMedium" style={styles.subtitle}>
            Enter your email address and we&apos;ll send you a link to reset
            your password.
          </Typography>

          <View style={styles.form}>
            <Input
              label="Email Address"
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              leadingIcon="email-outline"
            />

            {error ? (
              <View style={styles.errorContainer}>
                <Icons
                  name="alert-circle"
                  size={20}
                  color={theme.colors.error}
                />
                <Typography variant="bodySmall" style={styles.errorText}>
                  {error}
                </Typography>
              </View>
            ) : null}

            <Button
              onPress={handleResetPassword}
              loading={isLoading}
              style={styles.button}
            >
              Send Reset Link
            </Button>
          </View>

          <View style={styles.backToLogin}>
            <Pressable onPress={onBackToLogin} style={styles.backButton}>
              <Icons name="arrow-left" size={20} color={theme.colors.primary} />
              <Typography variant="bodyMedium" style={styles.backText}>
                Back to Login
              </Typography>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
    },
    container: {
      flex: 1,
      padding: 24,
      justifyContent: "center",
    },
    header: {
      position: "absolute",
      top: 0,
      right: 0,
      padding: 16,
      zIndex: 10,
    },
    themeToggle: {
      padding: 8,
    },
    content: {
      alignItems: "center",
    },
    iconContainer: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.colors.primaryContainer,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
    },
    title: {
      fontWeight: "700",
      marginBottom: 8,
      textAlign: "center",
    },
    subtitle: {
      opacity: 0.7,
      textAlign: "center",
      marginBottom: 24,
      paddingHorizontal: 16,
    },
    emailText: {
      color: theme.colors.primary,
      fontWeight: "700",
      marginBottom: 24,
      textAlign: "center",
    },
    instruction: {
      opacity: 0.7,
      textAlign: "center",
      marginBottom: 32,
      paddingHorizontal: 16,
      lineHeight: 20,
    },
    form: {
      width: "100%",
      marginBottom: 24,
    },
    button: {
      marginTop: 16,
    },
    errorContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.errorContainer,
      padding: 12,
      borderRadius: 8,
      marginBottom: 16,
    },
    errorText: {
      color: theme.colors.error,
      marginLeft: 8,
      flex: 1,
    },
    backToLogin: {
      marginTop: 16,
    },
    backButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    backText: {
      color: theme.colors.primary,
      marginLeft: 8,
      fontWeight: "600",
    },
    resendContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 24,
    },
  });

export default ForgotPasswordScreen;
