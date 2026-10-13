import { useCallback, useSyncExternalStore } from "react";
import { Platform } from "react-native";

import { useDeviceAdapter } from "../core/adapters";
import { expoDeviceInfoAdapter } from "./expo";
import type { DeviceInfo, DeviceInfoAdapter } from "./types";

/**
 * What the static web export renders, and what the page hydrates with before
 * switching to the browser's answer: the prerender runs in Node, which has no
 * user agent to read, and rendering anything else would mismatch on hydration.
 */
const SERVER_DEVICE_INFO: DeviceInfo = {
  platform: Platform.OS,
  model: null,
  brand: null,
  manufacturer: null,
  os: { name: null, version: null },
  deviceType: "unknown",
  isEmulator: false,
  app: { id: null, name: null, version: null, build: null },
};

// One snapshot per adapter: useSyncExternalStore needs the same object back on
// every call, and the device does not change while the app runs.
const snapshots = new WeakMap<DeviceInfoAdapter, DeviceInfo>();

const subscribe = () => () => {};
const getServerSnapshot = () => SERVER_DEVICE_INFO;

/**
 * The device the app runs on, from the adapter in `DeviceAdaptersProvider` or
 * the Expo adapter when there is none. On a statically exported web page the
 * first render reports every field as unknown, then the browser's values.
 */
export function useDeviceInfo(): DeviceInfo {
  const adapter = useDeviceAdapter("info") ?? expoDeviceInfoAdapter;
  const getSnapshot = useCallback(() => {
    let info = snapshots.get(adapter);
    if (!info) {
      info = adapter.getDeviceInfo();
      snapshots.set(adapter, info);
    }
    return info;
  }, [adapter]);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
