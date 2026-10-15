import { Platform } from "react-native";

/** iOS or Android: where the native Expo modules are linked. */
export const isNativePlatform =
  Platform.OS === "ios" || Platform.OS === "android";

/**
 * True in a browser, false on native and while the static web export
 * prerenders in Node. Read it when an API is called, never at module scope:
 * a module-level `window` check runs once during the prerender and is wrong
 * for the hydrated page.
 */
export function hasDOM(): boolean {
  return (
    Platform.OS === "web" &&
    typeof window !== "undefined" &&
    typeof document !== "undefined"
  );
}
