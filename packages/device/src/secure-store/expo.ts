import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { isNativePlatform } from "../core/support";
import { ProtectedAccessError } from "./errors";
import type {
  ProtectedErrorStatus,
  SecureStoreAdapter,
  SecureStoreOptions,
} from "./types";

function accessibility({
  accessible = "when-unlocked",
  thisDeviceOnly = true,
}: SecureStoreOptions): SecureStore.KeychainAccessibilityConstant {
  if (accessible === "after-first-unlock") {
    return thisDeviceOnly
      ? SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY
      : SecureStore.AFTER_FIRST_UNLOCK;
  }
  return thisDeviceOnly
    ? SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
    : SecureStore.WHEN_UNLOCKED;
}

/**
 * expo-secure-store reports a prompt's outcome only as text: Android's
 * AuthenticationException carries an English message and no code, iOS an
 * OSStatus description. These are its 57.0.4 messages; anything else is
 * left as it is, and the hooks report it as `failed` with the message.
 */
const PROTECTED_MESSAGES: [RegExp, ProtectedErrorStatus][] = [
  // Android "User canceled the authentication", iOS "User canceled the operation."
  [/user canceled/i, "cancelled"],
  [/authentication is already in progress/i, "busy"],
  // Android "Lockout", "Lockout permanent".
  [/lockout/i, "lockout"],
  [
    /no biometrics|no hardware|hardware not present|hardware unavailable|biometric authentication is unsupported|update is required|requires android api|NSFaceIDUsageDescription/i,
    "unavailable",
  ],
  [/interaction is not allowed/i, "locked"],
];

function toProtectedAccessError(error: unknown): unknown {
  const message = error instanceof Error ? error.message : String(error);
  const match = PROTECTED_MESSAGES.find(([pattern]) => pattern.test(message));
  return match ? new ProtectedAccessError(match[1], message) : error;
}

async function protectedCall<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (error) {
    throw toProtectedAccessError(error);
  }
}

/** The native default: expo-secure-store (Keychain / Android Keystore). */
export const expoSecureStoreAdapter: SecureStoreAdapter = {
  isSupported: () => isNativePlatform,

  getItem: (key, { service }) =>
    SecureStore.getItemAsync(key, { keychainService: service }),

  async setItem(key, value, options) {
    const target = { keychainService: options.service };
    // iOS writes an existing item with SecItemUpdate, which replaces the
    // data and keeps the old accessibility: without the delete, the
    // accessibility asked for here would never reach an item that exists.
    // (Android has no accessibility, and nothing to delete first.)
    if (Platform.OS === "ios") await SecureStore.deleteItemAsync(key, target);
    await SecureStore.setItemAsync(key, value, {
      ...target,
      keychainAccessible: accessibility(options),
    });
  },

  deleteItem: (key, { service }) =>
    SecureStore.deleteItemAsync(key, { keychainService: service }),

  getProtectedItem: (key, { service, prompt }) =>
    protectedCall(() =>
      SecureStore.getItemAsync(key, {
        keychainService: service,
        requireAuthentication: true,
        authenticationPrompt: prompt,
      }),
    ),

  setProtectedItem: (key, value, { service, prompt }) =>
    protectedCall(async () => {
      // iOS: a fresh item, so its access control is the one asked for and
      // writing it shows no prompt (an update would).
      if (Platform.OS === "ios") {
        await SecureStore.deleteItemAsync(key, { keychainService: service });
      }
      await SecureStore.setItemAsync(key, value, {
        keychainService: service,
        requireAuthentication: true,
        authenticationPrompt: prompt,
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    }),
};
