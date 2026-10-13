import type { HapticsAdapter } from "./types";

const nothing = async () => {};

/**
 * The web default: no feedback. Browsers have no haptics API:
 * expo-haptics' web build buzzes `navigator.vibrate` (Android Chrome only: a
 * vibration motor, not a haptic tap) or, on iOS Safari, clicks a hidden
 * `<input switch>` it adds to the page. An app that wants that can pass
 * its own adapter.
 */
export const webHapticsAdapter: HapticsAdapter = {
  isSupported: () => false,
  impact: nothing,
  notification: nothing,
  selection: nothing,
  interaction: nothing,
};
