import { useCallback, useMemo, useSyncExternalStore } from "react";
import { Platform } from "react-native";

import { useDeviceAdapter } from "../core/adapters";
import { expoHapticsAdapter } from "./expo";
import type {
  ImpactStyle,
  InteractionKind,
  NotificationFeedback,
} from "./types";
import { webHapticsAdapter } from "./web";

const defaultHapticsAdapter =
  Platform.OS === "web" ? webHapticsAdapter : expoHapticsAdapter;

// Haptics decorate an action: a failure (an unsupported constant, a missing
// activity) must never reach the code that asked for one.
const quietly = (run: () => Promise<void>): Promise<void> =>
  run().catch(() => {});

export interface UseHaptics {
  /** False on web, and while a statically exported page hydrates. */
  isSupported: boolean;
  impact(style?: ImpactStyle): Promise<void>;
  notification(type: NotificationFeedback): Promise<void>;
  selection(): Promise<void>;
  /** Fits `ThemeProvider`'s `onInteractionFeedback` as it is. */
  interaction(kind: InteractionKind): Promise<void>;
}

const subscribeNothing = () => () => {};
const getServerSupport = () => false;

/**
 * Haptic feedback through the provided adapter (expo-haptics by default).
 * Every call resolves, never rejects, and does nothing where unsupported.
 * The functions are stable across renders.
 */
export function useHaptics(): UseHaptics {
  const adapter = useDeviceAdapter("haptics") ?? defaultHapticsAdapter;
  const getSupport = useCallback(() => adapter.isSupported(), [adapter]);
  const isSupported = useSyncExternalStore(
    subscribeNothing,
    getSupport,
    getServerSupport,
  );
  return useMemo(() => {
    const run = (call: () => Promise<void>) =>
      adapter.isSupported() ? quietly(call) : Promise.resolve();
    return {
      isSupported,
      impact: (style = "light") => run(() => adapter.impact(style)),
      notification: (type) => run(() => adapter.notification(type)),
      selection: () => run(() => adapter.selection()),
      interaction: (kind) => run(() => adapter.interaction(kind)),
    };
  }, [adapter, isSupported]);
}

/**
 * The platform's feedback for a UI interaction, on the default adapter:
 * `<ThemeProvider onInteractionFeedback={hapticFeedback}>`. It does not see
 * `DeviceAdaptersProvider`; for that, pass `useHaptics().interaction`.
 */
export function hapticFeedback(kind: InteractionKind): void {
  if (!defaultHapticsAdapter.isSupported()) return;
  quietly(() => defaultHapticsAdapter.interaction(kind));
}
