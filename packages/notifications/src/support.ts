import { Platform } from "react-native";

/**
 * Push needs a native module: web gets a provider that reports `unsupported`
 * and touches nothing.
 */
export const isNotificationsSupported =
  Platform.OS === "ios" || Platform.OS === "android";

/**
 * For the imperative helpers (scheduling, badge, presented notifications):
 * on web they reject instead of reaching a native module that is not there.
 */
export function assertSupported(api: string): void {
  if (!isNotificationsSupported) {
    throw new Error(
      `${api}() is not supported on ${Platform.OS}. Check isNotificationsSupported first.`,
    );
  }
}
