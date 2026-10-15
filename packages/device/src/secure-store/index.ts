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
  isProtectedAccessError,
  isSecureStoreError,
  ProtectedAccessError,
  SecureStoreError,
  type SecureStoreErrorCode,
} from "./errors";
export { expoSecureStoreAdapter } from "./expo";
export type {
  AdapterProtectedOptions,
  ProtectedErrorStatus,
  ProtectedOptions,
  ProtectedReadResult,
  ProtectedWriteResult,
  SecureStoreAdapter,
  SecureStoreOptions,
} from "./types";
