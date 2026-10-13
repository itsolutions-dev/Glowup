import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

import { isNativePlatform } from "../core/support";
import type {
  HapticsAdapter,
  ImpactStyle,
  InteractionKind,
  NotificationFeedback,
} from "./types";

const IMPACT: Record<ImpactStyle, Haptics.ImpactFeedbackStyle> = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
};

const NOTIFICATION: Record<
  NotificationFeedback,
  Haptics.NotificationFeedbackType
> = {
  success: Haptics.NotificationFeedbackType.Success,
  warning: Haptics.NotificationFeedbackType.Warning,
  error: Haptics.NotificationFeedbackType.Error,
};

// Android: View.performHapticFeedback, which honours the user's "touch
// feedback" setting (expo's impact and selection go through the Vibrator,
// which does not). Only constants every API level has: the newer ones
// (TOGGLE_ON, SEGMENT_TICK, …) throw below API 30 / 34.
const ANDROID: Record<InteractionKind, Haptics.AndroidHaptics> = {
  press: Haptics.AndroidHaptics.Virtual_Key,
  toggle: Haptics.AndroidHaptics.Context_Click,
  selection: Haptics.AndroidHaptics.Clock_Tick,
  longPress: Haptics.AndroidHaptics.Long_Press,
};

function iosInteraction(kind: InteractionKind): Promise<void> {
  switch (kind) {
    case "selection":
      return Haptics.selectionAsync();
    case "longPress":
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    default:
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
}

/** The native default: expo-haptics. */
export const expoHapticsAdapter: HapticsAdapter = {
  isSupported: () => isNativePlatform,
  impact: (style) => Haptics.impactAsync(IMPACT[style]),
  notification: (type) => Haptics.notificationAsync(NOTIFICATION[type]),
  selection: () => Haptics.selectionAsync(),
  interaction: (kind) =>
    Platform.OS === "android"
      ? Haptics.performAndroidHapticsAsync(ANDROID[kind])
      : iosInteraction(kind),
};
