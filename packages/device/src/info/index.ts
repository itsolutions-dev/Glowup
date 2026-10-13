/**
 * `@its/glowup-device/info` — model, OS, device type, emulator, app version
 * and build. Needs `expo-device` and `expo-application`.
 */
export { useDeviceInfo } from "./useDeviceInfo";
export { expoDeviceInfoAdapter } from "./expo";
export type { DeviceInfo, DeviceInfoAdapter, DeviceType } from "./types";
