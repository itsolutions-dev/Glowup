/**
 * useWebAuthn
 *
 * React hook that wraps WebAuthnService and exposes a clean API for the UI.
 *
 * Usage:
 *   const { register, authenticate, status, error, isSupported, hasSavedPasskey } = useWebAuthn();
 *
 * Flow:
 *   First visit  → call register(username, displayName)
 *   Return visit → call authenticate(username)  [or authenticate() for passkey picker]
 */

import { useState, useCallback, useEffect } from "react";
import { Platform } from "react-native";

import {
  isWebAuthnAvailable,
  isPlatformAuthenticatorAvailable,
  registerPasskey,
  authenticatePasskey,
  getCredentialByUsername,
  getStoredCredentials,
  type RegistrationResult,
  type AuthenticationResult,
  type WebAuthnStatus,
} from "../services/WebAuthnService";

// ─── Types exposed to consumers ───────────────────────────────────────────────

export interface UseWebAuthnReturn {
  /** Current state of the WebAuthn operation */
  status: WebAuthnStatus;
  /** Human-readable error message, set when status === 'error' */
  error: string | null;
  /** True when WebAuthn + platform authenticator are both available */
  isSupported: boolean;
  /**
   * True when we're running on web (false on iOS/Android native).
   * On native, the hook surfaces a biometric-simulation path instead.
   */
  isWeb: boolean;
  /** Whether a passkey is already stored for the given username */
  hasSavedPasskey: (username: string) => boolean;
  /**
   * Register a new passkey for the user.
   * Resolves with the registration result (send attestationObject + clientDataJSON to server).
   */
  register: (
    username: string,
    displayName?: string,
  ) => Promise<RegistrationResult | null>;
  /**
   * Authenticate with an existing passkey.
   * Pass a username to restrict to that credential, or omit for discoverable-credential flow.
   * Resolves with the authentication result (send to server for verification).
   */
  authenticate: (username?: string) => Promise<AuthenticationResult | null>;
  /** Reset status and error back to idle */
  reset: () => void;
}

// ─── Native biometric simulation ─────────────────────────────────────────────
// A thin stand-in used on iOS / Android so the UI can still exercise the
// passwordless path without wiring in expo-local-authentication yet.

const NATIVE_PASSKEY_KEY = "native_passkeys";

function nativeLoadPasskeys(): Record<
  string,
  { username: string; displayName: string }
> {
  try {
    // React Native does not have localStorage; in production replace with
    // expo-secure-store or @react-native-async-storage/async-storage.
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(NATIVE_PASSKEY_KEY);
      return raw ? JSON.parse(raw) : {};
    }
  } catch {}
  return {};
}

function nativeSavePasskey(username: string, displayName: string): void {
  try {
    if (typeof localStorage !== "undefined") {
      const all = nativeLoadPasskeys();
      all[username.toLowerCase()] = { username, displayName };
      localStorage.setItem(NATIVE_PASSKEY_KEY, JSON.stringify(all));
    }
  } catch {}
}

async function simulateBiometricDelay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 900));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWebAuthn(): UseWebAuthnReturn {
  const [status, setStatus] = useState<WebAuthnStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const isWeb = Platform.OS === "web";

  // Only the web path has something to probe (the Web Credentials API).
  // On native the biometric simulation is always available, so support is a
  // constant there rather than state an effect has to write.
  const [isWebSupported, setIsWebSupported] = useState(false);
  const isSupported = isWeb ? isWebSupported : true;

  // Probe availability once on mount
  useEffect(() => {
    if (!isWeb) return;
    isPlatformAuthenticatorAvailable().then(setIsWebSupported);
  }, [isWeb]);

  const hasSavedPasskey = useCallback(
    (username: string): boolean => {
      if (isWeb) {
        return !!getCredentialByUsername(username);
      }
      const all = nativeLoadPasskeys();
      return !!all[username.toLowerCase()];
    },
    [isWeb],
  );

  // ── Register ──────────────────────────────────────────────────────────────

  const register = useCallback(
    async (
      username: string,
      displayName?: string,
    ): Promise<RegistrationResult | null> => {
      setError(null);
      setStatus("registering");

      try {
        if (isWeb) {
          // ── Web: real WebAuthn registration ──
          if (!isWebAuthnAvailable()) {
            throw new Error(
              "Your browser does not support WebAuthn / Passkeys. " +
                "Please use a modern browser such as Chrome, Edge, Firefox, or Safari.",
            );
          }

          const result = await registerPasskey({
            username,
            displayName: displayName || username,
          });

          setStatus("success");
          return result;
        } else {
          // ── Native: biometric simulation ──
          await simulateBiometricDelay();
          nativeSavePasskey(username, displayName || username);

          setStatus("success");
          // Return a shape that matches RegistrationResult so callers type-check
          return {
            credentialId: `native-${username}-${Date.now()}`,
            publicKey: "",
            username,
            displayName: displayName || username,
            attestationObject: "",
            clientDataJSON: "",
            transports: [],
          };
        }
      } catch (err: any) {
        const message = friendlyError(err);
        setError(message);
        setStatus("error");
        return null;
      }
    },
    [isWeb],
  );

  // ── Authenticate ──────────────────────────────────────────────────────────

  const authenticate = useCallback(
    async (username?: string): Promise<AuthenticationResult | null> => {
      setError(null);
      setStatus("authenticating");

      try {
        if (isWeb) {
          // ── Web: real WebAuthn authentication ──
          if (!isWebAuthnAvailable()) {
            throw new Error(
              "Your browser does not support WebAuthn / Passkeys.",
            );
          }

          const result = await authenticatePasskey({ username });
          setStatus("success");
          return result;
        } else {
          // ── Native: biometric simulation ──
          if (username) {
            const all = nativeLoadPasskeys();
            if (!all[username.toLowerCase()]) {
              throw new Error(
                `No passkey registered for "${username}". ` +
                  "Please register first or sign in with your password.",
              );
            }
          }

          await simulateBiometricDelay();
          setStatus("success");

          return {
            credentialId: `native-${username || "unknown"}-${Date.now()}`,
            authenticatorData: "",
            clientDataJSON: "",
            signature: "",
            userHandle: null,
          };
        }
      } catch (err: any) {
        const message = friendlyError(err);
        setError(message);
        setStatus("error");
        return null;
      }
    },
    [isWeb],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  return {
    status,
    error,
    isSupported,
    isWeb,
    hasSavedPasskey,
    register,
    authenticate,
    reset,
  };
}

// ─── Error normalisation ──────────────────────────────────────────────────────

function friendlyError(err: any): string {
  const name: string = err?.name ?? "";
  const message: string = err?.message ?? "An unknown error occurred.";

  // Spec-defined DOMException names
  switch (name) {
    case "NotAllowedError":
      return "The request was denied or timed out. Please try again.";
    case "SecurityError":
      return "A security error occurred. Make sure you are using HTTPS.";
    case "AbortError":
      return "The operation was aborted.";
    case "InvalidStateError":
      return "A passkey is already registered for this account on this device.";
    case "ConstraintError":
      return "The authenticator does not meet the requested constraints.";
    case "NotSupportedError":
      return "This operation is not supported on your device.";
    case "UnknownError":
      return "An unknown authenticator error occurred. Please try again.";
    default:
      return message;
  }
}
