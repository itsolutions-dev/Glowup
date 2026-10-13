/**
 * `@its/glowup-device/battery` — level, charging state and Low Power Mode,
 * kept live. Needs `expo-battery` on iOS and Android; the web uses the
 * Battery Status API where the browser has it (Chromium).
 */
export { useBattery, type UseBattery } from "./hooks";
export { expoBatteryAdapter } from "./expo";
export { webBatteryAdapter } from "./web";
export type { BatteryAdapter, BatteryStatus, ChargingState } from "./types";
