/**
 * `@its/glowup-device/secure-store` — small secrets (tokens, keys) in the
 * Keychain on iOS and Keystore-encrypted storage on Android. Needs
 * `expo-secure-store`; unsupported on web, with no insecure fallback.
 */
export {
  useSecureStore,
  useSecureValue,
  type SecureValueState,
  type UseSecureStore,
  type UseSecureValue,
} from "./hooks";
export {
  isSecureStoreError,
  SecureStoreError,
  type SecureStoreErrorCode,
} from "./errors";
export { expoSecureStoreAdapter } from "./expo";
export { webSecureStoreAdapter } from "./web";
export type { SecureStoreAdapter, SecureStoreOptions } from "./types";
