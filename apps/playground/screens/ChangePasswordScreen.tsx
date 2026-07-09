import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme, Theme, Input, Button, Typography, Divider } from "@glowup/ui";

interface ChangePasswordScreenProps {
  onPasswordChanged?: () => void;
  onCancel?: () => void;
}

const ChangePasswordScreen = ({
  onPasswordChanged,
  onCancel,
}: ChangePasswordScreenProps) => {
  const { theme, toggleTheme } = useTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!oldPassword.trim()) {
      newErrors.oldPassword = "Current password is required";
    }

    if (!newPassword.trim()) {
      newErrors.newPassword = "New password is required";
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      newErrors.newPassword =
        "Password must contain uppercase, lowercase, and number";
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (oldPassword && newPassword && oldPassword === newPassword) {
      newErrors.newPassword =
        "New password must be different from current password";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validate()) return;

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      if (onPasswordChanged) {
        onPasswordChanged();
      } else {
        console.log("Password changed successfully");
      }
    }, 1500);
  };

  const getPasswordStrength = (
    password: string,
  ): { label: string; color: string; progress: number } => {
    if (!password) return { label: "", color: "transparent", progress: 0 };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    switch (strength) {
      case 0:
      case 1:
        return { label: "Weak", color: theme.colors.error, progress: 0.2 };
      case 2:
        return { label: "Fair", color: "#FFB300", progress: 0.4 };
      case 3:
        return { label: "Good", color: theme.colors.primary, progress: 0.6 };
      case 4:
        return { label: "Strong", color: "#4CAF50", progress: 0.8 };
      case 5:
        return { label: "Very Strong", color: "#4CAF50", progress: 1 };
      default:
        return { label: "Weak", color: theme.colors.error, progress: 0.2 };
    }
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
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
            <Icons name="lock-reset" size={48} color={theme.colors.primary} />
          </View>

          <Typography variant="headlineMedium" style={styles.title}>
            Change Password
          </Typography>

          <Typography variant="bodyMedium" style={styles.subtitle}>
            Ensure your account is using a strong password for security.
          </Typography>

          <View style={styles.form}>
            {/* Current Password */}
            <Input
              label="Current Password"
              placeholder="Enter current password"
              value={oldPassword}
              onChangeText={setOldPassword}
              leadingIcon="lock-outline"
              secureTextEntry={!showOldPassword}
              trailingIcon={showOldPassword ? "eye-off" : "eye"}
              onTrailingIconPress={() => setShowOldPassword(!showOldPassword)}
              error={errors.oldPassword}
            />

            {/* New Password */}
            <Input
              label="New Password"
              placeholder="Enter new password"
              value={newPassword}
              onChangeText={setNewPassword}
              leadingIcon="lock-outline"
              secureTextEntry={!showNewPassword}
              trailingIcon={showNewPassword ? "eye-off" : "eye"}
              onTrailingIconPress={() => setShowNewPassword(!showNewPassword)}
              error={errors.newPassword}
            />

            {/* Password Strength Indicator */}
            {newPassword.length > 0 && (
              <View style={styles.strengthContainer}>
                <View style={styles.strengthBar}>
                  <View
                    style={[
                      styles.strengthProgress,
                      {
                        width: `${passwordStrength.progress * 100}%`,
                        backgroundColor: passwordStrength.color,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.strengthLabel,
                    { color: passwordStrength.color },
                  ]}
                >
                  {passwordStrength.label}
                </Text>
              </View>
            )}

            {/* Password Requirements */}
            {newPassword.length > 0 && (
              <View style={styles.requirementsContainer}>
                <Typography
                  variant="labelSmall"
                  style={styles.requirementsTitle}
                >
                  Password Requirements:
                </Typography>
                <View style={styles.requirementRow}>
                  <Icons
                    name={
                      newPassword.length >= 8
                        ? "check-circle"
                        : "circle-outline"
                    }
                    size={16}
                    color={
                      newPassword.length >= 8
                        ? "#4CAF50"
                        : theme.colors.outlineVariant
                    }
                  />
                  <Typography
                    variant="bodySmall"
                    style={styles.requirementText}
                  >
                    At least 8 characters
                  </Typography>
                </View>
                <View style={styles.requirementRow}>
                  <Icons
                    name={
                      /(?=.*[a-z])(?=.*[A-Z])/.test(newPassword)
                        ? "check-circle"
                        : "circle-outline"
                    }
                    size={16}
                    color={
                      /(?=.*[a-z])(?=.*[A-Z])/.test(newPassword)
                        ? "#4CAF50"
                        : theme.colors.outlineVariant
                    }
                  />
                  <Typography
                    variant="bodySmall"
                    style={styles.requirementText}
                  >
                    Uppercase and lowercase letters
                  </Typography>
                </View>
                <View style={styles.requirementRow}>
                  <Icons
                    name={
                      /\d/.test(newPassword) ? "check-circle" : "circle-outline"
                    }
                    size={16}
                    color={
                      /\d/.test(newPassword)
                        ? "#4CAF50"
                        : theme.colors.outlineVariant
                    }
                  />
                  <Typography
                    variant="bodySmall"
                    style={styles.requirementText}
                  >
                    At least one number
                  </Typography>
                </View>
                <View style={styles.requirementRow}>
                  <Icons
                    name={
                      /[^a-zA-Z0-9]/.test(newPassword)
                        ? "check-circle"
                        : "circle-outline"
                    }
                    size={16}
                    color={
                      /[^a-zA-Z0-9]/.test(newPassword)
                        ? "#4CAF50"
                        : theme.colors.outlineVariant
                    }
                  />
                  <Typography
                    variant="bodySmall"
                    style={styles.requirementText}
                  >
                    Special character (optional)
                  </Typography>
                </View>
              </View>
            )}

            {/* Confirm Password */}
            <Input
              label="Confirm New Password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              leadingIcon="lock-check-outline"
              secureTextEntry={!showConfirmPassword}
              trailingIcon={showConfirmPassword ? "eye-off" : "eye"}
              onTrailingIconPress={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
              error={errors.confirmPassword}
            />

            <Button
              onPress={handleChangePassword}
              loading={isLoading}
              style={styles.button}
            >
              Update Password
            </Button>

            <Divider style={styles.divider} />

            <Button
              onPress={onCancel}
              mode="outlined"
              style={styles.cancelButton}
            >
              Cancel
            </Button>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const makeStyles = (theme: Theme) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      padding: 24,
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
      paddingTop: 40,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.primaryContainer,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
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
    form: {
      width: "100%",
    },
    button: {
      marginTop: 16,
    },
    cancelButton: {
      marginTop: 8,
    },
    divider: {
      marginVertical: 16,
    },
    strengthContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: -12,
      marginBottom: 16,
      paddingHorizontal: 4,
    },
    strengthBar: {
      flex: 1,
      height: 4,
      backgroundColor: theme.colors.surfaceContainerHighest,
      borderRadius: 2,
      marginRight: 12,
      overflow: "hidden",
    },
    strengthProgress: {
      height: "100%",
      borderRadius: 2,
    },
    strengthLabel: {
      fontSize: 12,
      fontWeight: "600",
      width: 80,
      textAlign: "right",
    },
    requirementsContainer: {
      backgroundColor: theme.colors.surfaceContainerLow,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
    },
    requirementsTitle: {
      marginBottom: 8,
      opacity: 0.7,
    },
    requirementRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 4,
    },
    requirementText: {
      marginLeft: 8,
      opacity: 0.8,
    },
  });

export default ChangePasswordScreen;
