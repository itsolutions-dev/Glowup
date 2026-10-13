/**
 * `@its/glowup-device/keep-awake` — keep the screen on while a component is
 * mounted. Needs `expo-keep-awake` on iOS and Android; the web uses the
 * Screen Wake Lock API.
 */
export {
  useKeepAwake,
  useKeepAwakeSupport,
  type UseKeepAwakeOptions,
} from "./hooks";
export { expoKeepAwakeAdapter } from "./expo";
export { webKeepAwakeAdapter } from "./web";
export type { KeepAwakeAdapter } from "./types";
