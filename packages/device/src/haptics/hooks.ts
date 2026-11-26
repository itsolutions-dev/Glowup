import { useMemo } from "react";

import { useDeviceAdapter } from "../core/adapters";
import { useClientValue } from "../core/shared";
import { expoHapticsAdapter } from "./expo";
import type {
  ImpactStyle,
  InteractionKind,
  NotificationFeedback,
} from "./types";

// Unsupported on web: browsers have no haptics API (expo-haptics' web build
// buzzes `navigator.vibrate` or clicks a hidden switch; pass an adapter for that).
const defaultHapticsAdapter = expoHapticsAdapter;

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

/**
 * Haptic feedback through the provided adapter (expo-haptics by default).
 * Every call resolves, never rejects, and does nothing where unsupported.
 * The functions are stable across renders.
 */
export function useHaptics(): UseHaptics {
  const adapter = useDeviceAdapter("haptics") ?? defaultHapticsAdapter;
  const isSupported = useClientValue(() => adapter.isSupported(), false);
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
