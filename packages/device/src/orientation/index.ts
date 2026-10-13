/**
 * `@its/glowup-device/orientation` — the interface orientation, kept live,
 * and locks scoped to a component. Needs `expo-screen-orientation` on iOS and
 * Android; the web reads `screen.orientation` (locking rarely works there).
 */
export {
  useOrientation,
  useOrientationLock,
  useOrientationLockSupport,
  type UseOrientation,
  type UseOrientationLock,
  type UseOrientationLockOptions,
} from "./hooks";
export {
  isOrientationError,
  OrientationError,
  type OrientationErrorCode,
} from "./errors";
export { expoOrientationAdapter } from "./expo";
export { webOrientationAdapter } from "./web";
export type { Orientation, OrientationAdapter, OrientationLock } from "./types";
