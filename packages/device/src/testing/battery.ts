import type { BatteryAdapter, BatteryStatus } from "../battery/types";

/** 80 %, unplugged, Low Power Mode off. */
export const MOCK_BATTERY: BatteryStatus = {
  isAvailable: true,
  level: 0.8,
  charging: "unplugged",
  lowPowerMode: false,
};

export interface MockBatteryAdapter extends BatteryAdapter {
  /** Changes the status and notifies every subscriber, as a platform event would. */
  setStatus(next: Partial<BatteryStatus>): void;
  /** Active platform subscriptions: the hooks share one per adapter. */
  readonly subscriberCount: number;
}

/**
 * An in-memory `BatteryAdapter`, starting from `MOCK_BATTERY` merged with
 * `initial`. Inject it with `<DeviceAdaptersProvider adapters={{ battery }}>`
 * and drive it with `setStatus({ level: 0.1 })`.
 */
export function createMockBatteryAdapter(
  initial: Partial<BatteryStatus> = {},
): MockBatteryAdapter {
  let status: BatteryStatus = { ...MOCK_BATTERY, ...initial };
  const listeners = new Set<(status: BatteryStatus) => void>();

  return {
    isSupported: () => true,
    getStatus: async () => status,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setStatus(next) {
      status = { ...status, ...next };
      [...listeners].forEach((listener) => listener(status));
    },
    get subscriberCount() {
      return listeners.size;
    },
  };
}
