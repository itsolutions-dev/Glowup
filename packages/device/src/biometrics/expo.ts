import * as LocalAuthentication from "expo-local-authentication";
import { Platform } from "react-native";

import { isNativePlatform } from "../core/support";
import type {
  AuthenticateOptions,
  BiometricErrorCode,
  BiometricLevel,
  BiometricResult,
  BiometricType,
  BiometricsAdapter,
} from "./types";

const TYPE_ORDER: readonly BiometricType[] = ["fingerprint", "face", "iris"];

const TYPES: Record<number, BiometricType> = {
  1: "fingerprint",
  2: "face",
  3: "iris",
};

// By number: expo's SecurityLevel.BIOMETRIC is a deprecated getter that warns.
const LEVELS: Record<number, BiometricLevel> = {
  0: "none",
  1: "passcode",
  2: "biometric-weak",
  3: "biometric-strong",
};

/**
 * expo resolves with more strings than its type lists: iOS sends
 * `missing_usage_description` (Face ID without a purpose string) and
 * `unknown: <code>, <message>` for any LAError it does not map.
 */
function toErrorCode(error: string): BiometricErrorCode {
  switch (error) {
    case "user_cancel":
    case "system_cancel":
    case "app_cancel":
      return "cancelled";
    case "user_fallback":
      return "fallback";
    case "lockout":
      return "lockout";
    case "not_enrolled":
    case "passcode_not_set":
      return "not-enrolled";
    case "not_available":
    case "missing_usage_description":
      return "unavailable";
    default:
      return "failed";
  }
}

const SUCCESS: BiometricResult = { success: true };

/**
 * AndroidX rejects BIOMETRIC_STRONG | DEVICE_CREDENTIAL on API 28 and 29
 * (`PromptInfo.Builder.build()` throws), and expo builds the prompt outside
 * its try: the call never settles and every later one answers `app_cancel`.
 */
function canCombineStrongWithPasscode(): boolean {
  if (Platform.OS !== "android") return true;
  const api = Number(Platform.Version);
  return api < 28 || api >= 30;
}

let warnedAboutFaceId = false;

/** The native default: expo-local-authentication. */
export const expoBiometricsAdapter: BiometricsAdapter = {
  isSupported: () => isNativePlatform,

  async getStatus() {
    const [hasHardware, isEnrolled, types, level] = await Promise.all([
      LocalAuthentication.hasHardwareAsync().catch(() => false),
      LocalAuthentication.isEnrolledAsync().catch(() => false),
      LocalAuthentication.supportedAuthenticationTypesAsync().catch(
        (): LocalAuthentication.AuthenticationType[] => [],
      ),
      LocalAuthentication.getEnrolledLevelAsync().catch(
        () => LocalAuthentication.SecurityLevel.NONE,
      ),
    ]);
    const present = new Set(types.map((type) => TYPES[type]));
    return {
      hasHardware,
      isEnrolled,
      types: TYPE_ORDER.filter((type) => present.has(type)),
      level: LEVELS[level] ?? "none",
    };
  },

  async authenticate(options: AuthenticateOptions) {
    const strength = options.strength ?? "weak";
    const biometricsOnly =
      options.fallback === "none" ||
      (strength === "strong" && !canCombineStrongWithPasscode());
    let result: LocalAuthentication.LocalAuthenticationResult;
    try {
      result = await LocalAuthentication.authenticateAsync({
        promptMessage: options.promptMessage,
        cancelLabel: options.cancelLabel,
        fallbackLabel: options.fallbackLabel,
        promptSubtitle: options.subtitle,
        promptDescription: options.description,
        disableDeviceFallback: biometricsOnly,
        biometricsSecurityLevel: strength,
      });
    } catch (error) {
      // A missing activity, or the prompt failing to build.
      return {
        success: false,
        error: "failed",
        detail: error instanceof Error ? error.message : String(error),
      };
    }
    // iOS reports a Face ID purpose string missing even on success, when it
    // silently fell back to the passcode: the developer needs to know.
    const warning = (result as { warning?: string }).warning;
    if (__DEV__ && warning && !warnedAboutFaceId) {
      warnedAboutFaceId = true;
      console.warn(
        `[@its/glowup-device/biometrics] ${warning} Set biometrics.faceIDPermission in the config plugin.`,
      );
    }
    if (result.success) return SUCCESS;
    return {
      success: false,
      error: toErrorCode(result.error),
      detail: warning ? `${result.error}: ${warning}` : result.error,
    };
  },

  async cancel() {
    // iOS has no way to dismiss the prompt from the app.
    if (Platform.OS !== "android") return;
    await LocalAuthentication.cancelAuthenticate().catch(() => {});
  },
};
