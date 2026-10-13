import { Platform } from "react-native";

import { useDeviceAdapter } from "../core/adapters";
import {
  createLiveStore,
  useLiveValue,
  type LiveStore,
} from "../core/liveStore";
import { expoBatteryAdapter, UNAVAILABLE_BATTERY } from "./expo";
import type { BatteryAdapter, BatteryStatus } from "./types";
import { webBatteryAdapter } from "./web";

const defaultBatteryAdapter =
  Platform.OS === "web" ? webBatteryAdapter : expoBatteryAdapter;

const stores = new WeakMap<BatteryAdapter, LiveStore<BatteryStatus>>();

function getStore(adapter: BatteryAdapter): LiveStore<BatteryStatus> {
  let store = stores.get(adapter);
  if (!store) {
    store = createLiveStore({
      isSupported: () => adapter.isSupported(),
      read: () => adapter.getStatus(),
      subscribe: (listener) => adapter.subscribe(listener),
      unsupported: UNAVAILABLE_BATTERY,
    });
    stores.set(adapter, store);
  }
  return store;
}

export interface UseBattery extends BatteryStatus {
  /** True until the first answer (every field reads unknown meanwhile). */
  isLoading: boolean;
}

/**
 * The battery, kept live: level, charging state, Low Power Mode. One platform
 * subscription is shared by every component that asks.
 */
export function useBattery(): UseBattery {
  const adapter = useDeviceAdapter("battery") ?? defaultBatteryAdapter;
  const status = useLiveValue(getStore(adapter));
  return { ...(status ?? UNAVAILABLE_BATTERY), isLoading: status === null };
}
