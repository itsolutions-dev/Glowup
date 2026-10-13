import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { isNativePlatform } from "../core/support";
import type { SecureStoreAdapter, SecureStoreOptions } from "./types";

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
};
