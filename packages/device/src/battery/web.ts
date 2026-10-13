import { hasDOM } from "../core/support";
import type { BatteryAdapter, BatteryStatus } from "./types";

/**
 * The web default, on the Battery Status API (Chromium only), read directly:
 * expo-battery's web build has no `addListener`, so its change listeners
 * throw in a browser, and it reports Low Power Mode as `false` where it
 * cannot know. Here an unknown is `null`.
 */

interface BatteryManager {
  level: number;
  charging: boolean;
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

type BatteryNavigator = Navigator & {
  getBattery?: () => Promise<BatteryManager>;
};

const getBattery = () => (navigator as BatteryNavigator).getBattery!();

const EVENTS = ["levelchange", "chargingchange"] as const;

function toStatus({ level, charging }: BatteryManager): BatteryStatus {
  return {
    isAvailable: true,
    level,
    charging: charging ? (level >= 1 ? "full" : "charging") : "unplugged",
    lowPowerMode: null,
  };
}

export const webBatteryAdapter: BatteryAdapter = {
  isSupported: () =>
    hasDOM() &&
    typeof (navigator as BatteryNavigator).getBattery === "function",
  getStatus: async () => toStatus(await getBattery()),
  subscribe(listener) {
    let active = true;
    let manager: BatteryManager | null = null;
    const emit = () => {
      if (active && manager) listener(toStatus(manager));
    };
    getBattery().then(
      (resolved) => {
        if (!active) return;
        manager = resolved;
        EVENTS.forEach((type) => resolved.addEventListener(type, emit));
        emit();
      },
      () => {},
    );
    return () => {
      active = false;
      EVENTS.forEach((type) => manager?.removeEventListener(type, emit));
    };
  },
};
