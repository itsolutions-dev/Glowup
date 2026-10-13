import * as Application from "expo-application";
import * as Device from "expo-device";
import { Platform } from "react-native";

import type { DeviceInfo, DeviceInfoAdapter, DeviceType } from "./types";

const DEVICE_TYPES: Record<Device.DeviceType, DeviceType> = {
  [Device.DeviceType.UNKNOWN]: "unknown",
  [Device.DeviceType.PHONE]: "phone",
  [Device.DeviceType.TABLET]: "tablet",
  [Device.DeviceType.DESKTOP]: "desktop",
  [Device.DeviceType.TV]: "tv",
};

// expo-device on web answers "" for an OS it cannot parse; the contract says null.
const orNull = (value: string | null | undefined): string | null =>
  value ? value : null;

/**
 * The default adapter: `expo-device` and `expo-application`. Both expose
 * constants read when the module loads, so the result is built once.
 */
export const expoDeviceInfoAdapter: DeviceInfoAdapter = {
  getDeviceInfo(): DeviceInfo {
    return {
      platform: Platform.OS,
      model: orNull(Device.modelName),
      brand: orNull(Device.brand),
      manufacturer: orNull(Device.manufacturer),
      os: { name: orNull(Device.osName), version: orNull(Device.osVersion) },
      deviceType:
        Device.deviceType === null
          ? "unknown"
          : (DEVICE_TYPES[Device.deviceType] ?? "unknown"),
      isEmulator: !Device.isDevice,
      app: {
        id: orNull(Application.applicationId),
        name: orNull(Application.applicationName),
        version: orNull(Application.nativeApplicationVersion),
        build: orNull(Application.nativeBuildVersion),
      },
    };
  },
};
