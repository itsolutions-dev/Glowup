import { SecureStoreError } from "./errors";
import type { SecureStoreAdapter } from "./types";

const unsupported = () => Promise.reject(new SecureStoreError("unsupported"));

/**
 * The web default: no secure storage. `localStorage` is readable by any
 * script on the origin, so it is not offered as a stand-in; an app that
 * accepts that can provide its own adapter. expo's web build is an empty
 * module whose every call throws a TypeError.
 */
export const webSecureStoreAdapter: SecureStoreAdapter = {
  isSupported: () => false,
  getItem: unsupported,
  setItem: unsupported,
  deleteItem: unsupported,
  getProtectedItem: unsupported,
  setProtectedItem: unsupported,
};
