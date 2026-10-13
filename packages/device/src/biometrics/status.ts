import type { BiometricStatus } from "./types";

/** What the status reads where there is nothing to authenticate with. */
export const UNAVAILABLE_BIOMETRICS: BiometricStatus = {
  hasHardware: false,
  isEnrolled: false,
  types: [],
  level: "none",
};
