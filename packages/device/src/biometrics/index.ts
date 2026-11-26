/**
 * `@its/glowup-device/biometrics` — a local gate: the device owner proves
 * they are present with a fingerprint, a face or the device passcode. Not
 * authentication to a server. Needs `expo-local-authentication` on iOS and
 * Android (and `biometrics.faceIDPermission` in the config plugin for Face
 * ID); unsupported on web.
 */
export { useBiometrics, type UseBiometrics } from "./hooks";
export { useAppLock, type AppLockOptions, type UseAppLock } from "./appLock";
export { expoBiometricsAdapter } from "./expo";
export type {
  AuthenticateOptions,
  BiometricErrorCode,
  BiometricLevel,
  BiometricResult,
  BiometricStatus,
  BiometricType,
  BiometricsAdapter,
} from "./types";
