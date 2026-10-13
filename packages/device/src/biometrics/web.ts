import { UNAVAILABLE_BIOMETRICS } from "./status";
import type { BiometricResult, BiometricsAdapter } from "./types";

const UNSUPPORTED: BiometricResult = { success: false, error: "unsupported" };

/**
 * The web default: nothing to authenticate with. A local gate on WebAuthn
 * would need a credential registered and stored per user, which is the app's
 * own authentication, not a device capability. expo's web build is not used:
 * its `authenticateAsync` does not exist there and throws.
 */
export const webBiometricsAdapter: BiometricsAdapter = {
  isSupported: () => false,
  getStatus: async () => UNAVAILABLE_BIOMETRICS,
  authenticate: async () => UNSUPPORTED,
  cancel: async () => {},
};
