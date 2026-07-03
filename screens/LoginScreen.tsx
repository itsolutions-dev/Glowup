import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Animated,
  useWindowDimensions,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icons from "@expo/vector-icons/MaterialCommunityIcons";
import { useTheme, Theme } from "../providers/ThemeProvider";
import Input from "../components/Input";
import Button from "../components/Button";
import Typography from "../components/Typography";
import { useWebAuthn } from "../hooks/useWebAuthn";

// ─── Constants ────────────────────────────────────────────────────────────────

/** Minimum width at which the login card is constrained and centred. */
const WIDE_BREAKPOINT = 640;
/** Max width of the login card on wide screens. */
const CARD_MAX_WIDTH = 460;

// ─── Types ────────────────────────────────────────────────────────────────────

interface LoginScreenProps {
  onLoginSuccess?: () => void;
}

type LoginTab = "password" | "passwordless";
type LoginView = "login" | "forgotPassword" | "forgotSuccess";

// ─── Captcha helper ───────────────────────────────────────────────────────────

const CAPTCHA_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const generateCaptcha = () =>
  Array.from({ length: 5 }, () =>
    CAPTCHA_CHARS.charAt(Math.floor(Math.random() * CAPTCHA_CHARS.length)),
  ).join("");

// ─── PasskeyStatusBadge ───────────────────────────────────────────────────────

interface PasskeyStatusBadgeProps {
  status:
    | "idle"
    | "registering"
    | "authenticating"
    | "success"
    | "error"
    | "unsupported";
  error: string | null;
  theme: Theme;
}

const PasskeyStatusBadge = ({
  status,
  error,
  theme,
}: PasskeyStatusBadgeProps) => {
  if (status === "idle") return null;

  const configs: Record<
    string,
    { icon: string; color: string; bg: string; label: string }
  > = {
    registering: {
      icon: "fingerprint",
      color: theme.colors.primary,
      bg: theme.colors.primaryContainer,
      label: "Registering passkey…",
    },
    authenticating: {
      icon: "shield-lock",
      color: theme.colors.primary,
      bg: theme.colors.primaryContainer,
      label: "Verifying with authenticator…",
    },
    success: {
      icon: "check-circle",
      color: "#4CAF50",
      bg: "#E8F5E9",
      label: "Authenticated successfully!",
    },
    error: {
      icon: "alert-circle",
      color: theme.colors.error,
      bg: theme.colors.errorContainer,
      label: error ?? "Authentication failed",
    },
    unsupported: {
      icon: "information",
      color: theme.colors.outline,
      bg: theme.colors.surfaceContainerHigh,
      label: "Passkeys not supported",
    },
  };

  const cfg = configs[status];
  if (!cfg) return null;

  return (
    <View style={[badgeStyles.container, { backgroundColor: cfg.bg }]}>
      <Icons name={cfg.icon as any} size={18} color={cfg.color} />
      <Text style={[badgeStyles.label, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
};

const badgeStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
    marginBottom: 16,
  },
  label: { flex: 1, fontSize: 13, fontWeight: "500" },
});

// ─── Divider ──────────────────────────────────────────────────────────────────

const OrDivider = ({ theme }: { theme: Theme }) => (
  <View
    style={{ flexDirection: "row", alignItems: "center", marginVertical: 20 }}
  >
    <View
      style={{
        flex: 1,
        height: 1,
        backgroundColor: theme.colors.outlineVariant,
      }}
    />
    <Typography
      variant="bodySmall"
      style={{ marginHorizontal: 12, color: theme.colors.onSurfaceVariant }}
    >
      OR
    </Typography>
    <View
      style={{
        flex: 1,
        height: 1,
        backgroundColor: theme.colors.outlineVariant,
      }}
    />
  </View>
);

// ─── Main screen ──────────────────────────────────────────────────────────────

const LoginScreen = ({ onLoginSuccess }: LoginScreenProps) => {
  const { theme, toggleTheme } = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;
  const styles = useMemo(() => makeStyles(theme, isWide), [theme, isWide]);

  // ── View state ──
  const [view, setView] = useState<LoginView>("login");

  // ── Login tab ──
  const [activeTab, setActiveTab] = useState<LoginTab>("password");

  // ── Password-login fields ──
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaCode, setCaptchaCode] = useState(generateCaptcha);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // ── Forgot-password fields ──
  const [fpEmail, setFpEmail] = useState("");
  const [fpLoading, setFpLoading] = useState(false);
  const [fpError, setFpError] = useState("");

  // ── Passkey state ──
  const [passkeyEmail, setPasskeyEmail] = useState("");
  const {
    status: passkeyStatus,
    error: passkeyError,
    isSupported,
    isWeb,
    hasSavedPasskey,
    register,
    authenticate,
    reset: resetPasskey,
  } = useWebAuthn();

  useEffect(() => {
    resetPasskey();
  }, [activeTab]);

  // Pre-fill forgot-password email from the login email
  const openForgotPassword = () => {
    setFpEmail(email);
    setFpError("");
    setView("forgotPassword");
  };

  // ─── Password login ────────────────────────────────────────────────────────

  const refreshCaptcha = () => {
    setCaptchaCode(generateCaptcha());
    setCaptchaInput("");
  };

  const handlePasswordLogin = async () => {
    setLoginError("");
    if (!email.trim()) {
      setLoginError("Please enter your email address");
      return;
    }
    if (!password.trim()) {
      setLoginError("Please enter your password");
      return;
    }
    if (!captchaInput.trim()) {
      setLoginError("Please enter the captcha code");
      return;
    }
    if (captchaInput.toUpperCase() !== captchaCode) {
      setLoginError("Incorrect captcha code. Please try again.");
      refreshCaptcha();
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess?.();
    }, 1500);
  };

  // ─── Forgot password ───────────────────────────────────────────────────────

  const handleForgotPassword = async () => {
    setFpError("");
    if (!fpEmail.trim()) {
      setFpError("Please enter your email address");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fpEmail)) {
      setFpError("Please enter a valid email address");
      return;
    }
    setFpLoading(true);
    setTimeout(() => {
      setFpLoading(false);
      setView("forgotSuccess");
    }, 1500);
  };

  // ─── Passkey ──────────────────────────────────────────────────────────────

  const handlePasskeyRegister = async () => {
    if (!passkeyEmail.trim()) return;
    const result = await register(passkeyEmail.trim(), passkeyEmail.trim());
    if (result) console.log("[WebAuthn] Registered:", result.credentialId);
  };

  const handlePasskeyAuthenticate = async (anyPasskey = false) => {
    const username = anyPasskey ? undefined : passkeyEmail.trim() || undefined;
    const result = await authenticate(username);
    if (result) {
      console.log("[WebAuthn] Authenticated:", result.credentialId);
      onLoginSuccess?.();
    }
  };

  const handleOAuth = (provider: string) => {
    console.log(`OAuth: ${provider}`);
    onLoginSuccess?.();
  };

  const passkeySaved = passkeyEmail ? hasSavedPasskey(passkeyEmail) : false;
  const passkeyBusy =
    passkeyStatus === "registering" || passkeyStatus === "authenticating";

  // ─── Shared wrapper ────────────────────────────────────────────────────────
  // On wide screens the entire background fills the viewport and the card is
  // centred. On mobile the card IS the viewport.

  const renderCard = (children: React.ReactNode) => (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: isWide
            ? theme.colors.surfaceContainerLow
            : theme.colors.background,
        },
      ]}
    >
      {/* Android resizes the window natively (adjustResize); running the
          "height" behavior on top of that double-resizes every keyboard
          frame and makes the screen flicker — so KAV is iOS-only. */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        enabled={Platform.OS === "ios"}
      >
        {/* Theme toggle – always top-right of the full viewport */}
        <Pressable onPress={toggleTheme} style={styles.themeToggle}>
          <Icons
            name={theme.isDark ? "brightness-7" : "brightness-4"}
            size={22}
            color={theme.colors.onSurface}
          />
        </Pressable>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* On wide screens the card is a raised surface; on mobile it is borderless */}
          <View
            style={[
              styles.card,
              isWide && Platform.OS !== "web" && styles.cardShadowNative,
              isWide &&
                Platform.OS === "web" &&
                ({ boxShadow: "0 8px 40px rgba(0,0,0,0.12)" } as any),
            ]}
          >
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  // ─── View: Forgot password success ────────────────────────────────────────

  if (view === "forgotSuccess") {
    return renderCard(
      <>
        <View style={styles.logoContainer}>
          <Icons
            name="email-check-outline"
            size={40}
            color={theme.colors.primary}
          />
        </View>
        <Typography variant="headlineSmall" style={styles.cardTitle}>
          Check Your Email
        </Typography>
        <Typography variant="bodyMedium" style={styles.cardSubtitle}>
          We sent a password reset link to:
        </Typography>
        <Typography
          variant="titleMedium"
          style={[
            styles.cardSubtitle,
            { color: theme.colors.primary, fontWeight: "700" },
          ]}
        >
          {fpEmail}
        </Typography>
        <Typography
          variant="bodySmall"
          style={[styles.cardSubtitle, { marginTop: 8 }]}
        >
          Check your inbox and click the link to reset your password. Didn't
          receive it? Check your spam folder.
        </Typography>

        <Button onPress={() => setView("login")} style={styles.primaryButton}>
          Back to Sign In
        </Button>

        <View style={styles.centeredRow}>
          <Typography variant="bodySmall">Didn't receive it? </Typography>
          <Pressable onPress={() => setView("forgotPassword")}>
            <Typography
              variant="bodySmall"
              style={{ color: theme.colors.primary, fontWeight: "700" }}
            >
              Resend
            </Typography>
          </Pressable>
        </View>
      </>,
    );
  }

  // ─── View: Forgot password form ────────────────────────────────────────────

  if (view === "forgotPassword") {
    return renderCard(
      <>
        {/* Back button */}
        <Pressable onPress={() => setView("login")} style={styles.backButton}>
          <Icons name="arrow-left" size={20} color={theme.colors.primary} />
          <Typography
            variant="bodyMedium"
            style={{ color: theme.colors.primary, marginLeft: 4 }}
          >
            Back to Sign In
          </Typography>
        </Pressable>

        <View style={styles.logoContainer}>
          <Icons name="lock-reset" size={40} color={theme.colors.primary} />
        </View>
        <Typography variant="headlineSmall" style={styles.cardTitle}>
          Forgot Password?
        </Typography>
        <Typography variant="bodyMedium" style={styles.cardSubtitle}>
          Enter your email and we'll send you a reset link.
        </Typography>

        <Input
          label="Email Address"
          placeholder="Enter your email"
          value={fpEmail}
          onChangeText={setFpEmail}
          leadingIcon="email-outline"
        />

        {fpError ? (
          <View
            style={[
              styles.alertBox,
              { backgroundColor: theme.colors.errorContainer },
            ]}
          >
            <Icons name="alert-circle" size={18} color={theme.colors.error} />
            <Typography
              variant="bodySmall"
              style={{ color: theme.colors.error, flex: 1 }}
            >
              {fpError}
            </Typography>
          </View>
        ) : null}

        <Button
          onPress={handleForgotPassword}
          loading={fpLoading}
          style={styles.primaryButton}
        >
          Send Reset Link
        </Button>
      </>,
    );
  }

  // ─── View: Login ────────────────────────────────────────────────────────────

  return renderCard(
    <>
      {/* Logo + title */}
      <View style={styles.logoContainer}>
        <Icons name="lightning-bolt" size={40} color={theme.colors.primary} />
      </View>
      <Typography variant="headlineSmall" style={styles.cardTitle}>
        Welcome Back
      </Typography>
      <Typography variant="bodyMedium" style={styles.cardSubtitle}>
        Sign in to continue to Glowup
      </Typography>

      {/* Tab switcher */}
      <View
        style={[styles.tabBar, { borderColor: theme.colors.outlineVariant }]}
      >
        {(["password", "passwordless"] as LoginTab[]).map((tab) => {
          const active = activeTab === tab;
          return (
            <Pressable
              key={tab}
              style={[
                styles.tab,
                active && { backgroundColor: theme.colors.primaryContainer },
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Icons
                name={tab === "password" ? "lock-outline" : "fingerprint"}
                size={15}
                color={
                  active ? theme.colors.primary : theme.colors.onSurfaceVariant
                }
              />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: active
                      ? theme.colors.primary
                      : theme.colors.onSurfaceVariant,
                  },
                  active && { fontWeight: "700" },
                ]}
              >
                {tab === "password" ? "Password" : "Passkey"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* ── Password tab ── */}
      {activeTab === "password" && (
        <>
          <Input
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            leadingIcon="email-outline"
          />
          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            leadingIcon="lock-outline"
            secureTextEntry
          />

          {/* Captcha */}
          <View style={styles.captchaBox}>
            <Text style={[styles.captchaText, { color: theme.colors.primary }]}>
              {captchaCode}
            </Text>
            <Pressable onPress={refreshCaptcha} style={styles.refreshBtn}>
              <Icons
                name="refresh"
                size={20}
                color={theme.colors.onSurfaceVariant}
              />
            </Pressable>
          </View>
          <Input
            label="Enter Captcha"
            placeholder="Type the code above"
            value={captchaInput}
            onChangeText={setCaptchaInput}
          />

          {loginError ? (
            <View
              style={[
                styles.alertBox,
                { backgroundColor: theme.colors.errorContainer },
              ]}
            >
              <Icons name="alert-circle" size={18} color={theme.colors.error} />
              <Typography
                variant="bodySmall"
                style={{ color: theme.colors.error, flex: 1 }}
              >
                {loginError}
              </Typography>
            </View>
          ) : null}

          <Button
            onPress={handlePasswordLogin}
            loading={isLoading}
            style={styles.primaryButton}
          >
            Sign In
          </Button>

          {/* Forgot password – inline link, triggers view change, not navigation */}
          <View style={styles.centeredRow}>
            <Pressable onPress={openForgotPassword} accessibilityRole="link">
              <Typography
                variant="bodySmall"
                style={{ color: theme.colors.primary }}
              >
                Forgot your password?
              </Typography>
            </Pressable>
          </View>
        </>
      )}

      {/* ── Passkey tab ── */}
      {activeTab === "passwordless" && (
        <>
          <View
            style={[
              styles.alertBox,
              {
                backgroundColor: theme.colors.primaryContainer,
                marginBottom: 16,
              },
            ]}
          >
            <Icons
              name="information-outline"
              size={18}
              color={theme.colors.primary}
            />
            <View style={{ flex: 1 }}>
              <Typography
                variant="labelLarge"
                style={{ color: theme.colors.primary }}
              >
                {isWeb ? "Passkeys (WebAuthn)" : "Biometric Sign-In"}
              </Typography>
              <Typography
                variant="bodySmall"
                style={{
                  color: theme.colors.primary,
                  opacity: 0.8,
                  marginTop: 2,
                }}
              >
                {isWeb
                  ? "Use your device fingerprint, Face ID, or security key — no password needed."
                  : "Authenticate using your device biometric sensor."}
              </Typography>
            </View>
          </View>

          {!isSupported && (
            <View
              style={[
                styles.alertBox,
                {
                  backgroundColor: theme.colors.errorContainer,
                  marginBottom: 16,
                },
              ]}
            >
              <Icons name="alert" size={18} color={theme.colors.error} />
              <Typography
                variant="bodySmall"
                style={{ color: theme.colors.error, flex: 1 }}
              >
                {isWeb
                  ? "Passkeys are not supported in this browser. Try Chrome, Edge or Safari."
                  : "Biometric authentication is unavailable on this device."}
              </Typography>
            </View>
          )}

          <Input
            label="Email"
            placeholder="Enter your email"
            value={passkeyEmail}
            onChangeText={(v) => {
              setPasskeyEmail(v);
              resetPasskey();
            }}
            leadingIcon="email-outline"
          />

          <PasskeyStatusBadge
            status={passkeyStatus}
            error={passkeyError}
            theme={theme}
          />

          {passkeyEmail.length > 3 && (
            <View
              style={[
                styles.alertBox,
                {
                  borderWidth: 1,
                  borderColor: theme.colors.outlineVariant,
                  marginBottom: 16,
                },
              ]}
            >
              <Icons
                name={passkeySaved ? "shield-check" : "shield-outline"}
                size={16}
                color={passkeySaved ? "#4CAF50" : theme.colors.onSurfaceVariant}
              />
              <Typography
                variant="bodySmall"
                style={{
                  color: passkeySaved
                    ? "#4CAF50"
                    : theme.colors.onSurfaceVariant,
                  flex: 1,
                }}
              >
                {passkeySaved
                  ? "A passkey is registered for this account on this device."
                  : "No passkey found for this email on this device."}
              </Typography>
            </View>
          )}

          {passkeySaved ? (
            <Button
              onPress={() => handlePasskeyAuthenticate(false)}
              loading={passkeyBusy}
              disabled={!isSupported || passkeyBusy || !passkeyEmail.trim()}
              iconName="fingerprint"
              style={styles.primaryButton}
            >
              {passkeyBusy ? "Verifying…" : "Sign In with Passkey"}
            </Button>
          ) : (
            <>
              <Button
                onPress={handlePasskeyRegister}
                loading={passkeyBusy}
                disabled={!isSupported || passkeyBusy || !passkeyEmail.trim()}
                iconName="key-plus"
                style={styles.primaryButton}
              >
                {passkeyBusy ? "Setting up…" : "Register a Passkey"}
              </Button>
              <Button
                onPress={() => handlePasskeyAuthenticate(true)}
                mode="outlined"
                loading={passkeyBusy}
                disabled={!isSupported || passkeyBusy}
                iconName="shield-key"
                style={styles.secondaryButton}
              >
                Use Any Saved Passkey
              </Button>
            </>
          )}

          {/* How it works */}
          <View
            style={[
              styles.howBox,
              { backgroundColor: theme.colors.surfaceContainerLow },
            ]}
          >
            <Typography variant="labelSmall" style={styles.howTitle}>
              How it works
            </Typography>
            {[
              {
                icon: "numeric-1-circle-outline",
                text: 'Enter your email, then tap "Register a Passkey".',
              },
              {
                icon: "numeric-2-circle-outline",
                text: "Your device prompts for biometric or PIN.",
              },
              {
                icon: "numeric-3-circle-outline",
                text: "A key pair is created — your private key never leaves this device.",
              },
              {
                icon: "numeric-4-circle-outline",
                text: 'Next time, tap "Sign In with Passkey". No password needed.',
              },
            ].map(({ icon, text }) => (
              <View key={icon} style={styles.howRow}>
                <Icons
                  name={icon as any}
                  size={17}
                  color={theme.colors.primary}
                />
                <Typography variant="bodySmall" style={styles.howText}>
                  {text}
                </Typography>
              </View>
            ))}
          </View>
        </>
      )}

      <OrDivider theme={theme} />

      {/* OAuth */}
      <View style={styles.oauthSection}>
        <Button
          onPress={() => handleOAuth("Google")}
          mode="outlined"
          iconName="google"
          style={styles.oauthButton}
        >
          Continue with Google
        </Button>
        <Button
          onPress={() => handleOAuth("Microsoft")}
          mode="outlined"
          iconName="microsoft"
          style={styles.oauthButton}
        >
          Continue with Microsoft
        </Button>
      </View>

      {/* Sign-up link */}
      <View style={[styles.centeredRow, { marginTop: 16 }]}>
        <Typography variant="bodyMedium">Don't have an account? </Typography>
        <Pressable accessibilityRole="link">
          <Typography
            variant="bodyMedium"
            style={{ color: theme.colors.primary, fontWeight: "700" }}
          >
            Sign Up
          </Typography>
        </Pressable>
      </View>
    </>,
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const makeStyles = (theme: Theme, isWide: boolean) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
    },
    themeToggle: {
      position: "absolute",
      top: Platform.OS === "ios" ? 56 : 16,
      right: 16,
      zIndex: 20,
      padding: 8,
      borderRadius: 20,
      backgroundColor: theme.colors.surfaceContainerHigh + "CC",
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: isWide ? 32 : 0,
      paddingBottom: 40,
      paddingTop: isWide ? 32 : 0,
    },
    // Card is full-screen on mobile, constrained + elevated on wide screens
    card: {
      width: "100%",
      maxWidth: isWide ? CARD_MAX_WIDTH : undefined,
      backgroundColor: theme.colors.surface,
      borderRadius: isWide ? 20 : 0,
      padding: isWide ? 40 : 24,
      paddingTop: isWide ? 40 : 64, // top padding for mobile accounts for status bar
      // Shadow applied via cardShadowWeb / cardShadowNative below; merged at render time
    },
    cardShadowNative: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 8,
    },

    // Logo circle
    logoContainer: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: theme.colors.primaryContainer,
      alignItems: "center",
      justifyContent: "center",
      alignSelf: "center",
      marginBottom: 16,
    },

    // Titles
    cardTitle: {
      fontWeight: "700",
      textAlign: "center",
      marginBottom: 6,
      color: theme.colors.onSurface,
    },
    cardSubtitle: {
      textAlign: "center",
      opacity: 0.65,
      marginBottom: 24,
      color: theme.colors.onSurface,
    },

    // Tab bar
    tabBar: {
      flexDirection: "row",
      borderRadius: 10,
      borderWidth: 1,
      overflow: "hidden",
      marginBottom: 24,
    },
    tab: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 10,
      gap: 6,
    },
    tabLabel: { fontSize: 14 },

    // Captcha
    captchaBox: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: theme.colors.surfaceContainerHigh,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
      marginBottom: 10,
    },
    captchaText: {
      fontSize: 22,
      fontWeight: "700",
      letterSpacing: 8,
      fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    },
    refreshBtn: { padding: 4 },

    // Alert / info box (reused for errors, info banners, hints)
    alertBox: {
      flexDirection: "row",
      alignItems: "flex-start",
      padding: 12,
      borderRadius: 8,
      gap: 8,
    },

    // Buttons
    primaryButton: { marginTop: 8 },
    secondaryButton: { marginTop: 4 },

    // Passkey
    howBox: {
      borderRadius: 10,
      padding: 14,
      marginTop: 20,
    },
    howTitle: {
      marginBottom: 10,
      opacity: 0.55,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    howRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 8,
      gap: 8,
    },
    howText: { flex: 1, opacity: 0.75, lineHeight: 18 },

    // OAuth
    oauthSection: { gap: 10 },
    oauthButton: {},

    // Back button (forgot password view)
    backButton: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 24,
      alignSelf: "flex-start",
    },

    // Utility
    centeredRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: 14,
    },
  });

export default LoginScreen;
