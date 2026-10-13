import * as Battery from "expo-battery";

import { isNativePlatform } from "../core/support";
import type { BatteryAdapter, BatteryStatus, ChargingState } from "./types";

const CHARGING: Record<number, ChargingState> = {
  [Battery.BatteryState.UNKNOWN]: "unknown",
  [Battery.BatteryState.UNPLUGGED]: "unplugged",
  [Battery.BatteryState.CHARGING]: "charging",
  [Battery.BatteryState.FULL]: "full",
};

export const UNAVAILABLE_BATTERY: BatteryStatus = {
  isAvailable: false,
  level: null,
  charging: "unknown",
  lowPowerMode: null,
};

// expo-battery answers -1 for a level it cannot read.
const toLevel = (level: number) => (level >= 0 ? level : null);

async function readStatus(): Promise<BatteryStatus> {
  if (!(await Battery.isAvailableAsync())) return UNAVAILABLE_BATTERY;
  const [level, state, lowPowerMode] = await Promise.all([
    Battery.getBatteryLevelAsync(),
    Battery.getBatteryStateAsync(),
    Battery.isLowPowerModeEnabledAsync(),
  ]);
  return {
    isAvailable: true,
    level: toLevel(level),
    charging: CHARGING[state] ?? "unknown",
    lowPowerMode,
  };
}

/**
 * The native default: expo-battery. Its three events (level, state, power
 * mode) are merged into one status, so a listener always gets all of it.
 */
export const expoBatteryAdapter: BatteryAdapter = {
  isSupported: () => isNativePlatform,
  getStatus: readStatus,
  subscribe(listener) {
    let status: BatteryStatus | null = null;
    // Events that beat the first read: newer than what it may return.
    let early: Partial<BatteryStatus> = {};
    let active = true;
    const update = (patch: Partial<BatteryStatus>) => {
      if (!active) return;
      if (!status) {
        early = { ...early, ...patch };
        return;
      }
      status = { ...status, ...patch };
      listener(status);
    };
    readStatus().then(
      (first) => {
        if (!active) return;
        status = first.isAvailable ? { ...first, ...early } : first;
        listener(status);
      },
      () => {},
    );
    const subscriptions = [
      Battery.addBatteryLevelListener(({ batteryLevel }) =>
        update({ level: toLevel(batteryLevel) }),
      ),
      Battery.addBatteryStateListener(({ batteryState }) =>
        update({ charging: CHARGING[batteryState] ?? "unknown" }),
      ),
      Battery.addLowPowerModeListener(({ lowPowerMode }) =>
        update({ lowPowerMode }),
      ),
    ];
    return () => {
      active = false;
      subscriptions.forEach((subscription) => subscription.remove());
    };
  },
};
