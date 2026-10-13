/**
 * `@its/glowup-device/haptics` — haptic feedback, and `hapticFeedback` for
 * `@its/glowup-ui`'s `ThemeProvider onInteractionFeedback`. Needs
 * `expo-haptics` on iOS and Android; nothing happens on web.
 */
export { hapticFeedback, useHaptics, type UseHaptics } from "./hooks";
export { expoHapticsAdapter } from "./expo";
export { webHapticsAdapter } from "./web";
export type {
  HapticsAdapter,
  ImpactStyle,
  InteractionKind,
  NotificationFeedback,
} from "./types";
