import type { Unsubscribe } from "../core/types";

export type ChargingState = "unknown" | "unplugged" | "charging" | "full";

export interface BatteryStatus {
  /** False where there is no battery API (most browsers) or no battery (a simulator). */
  isAvailable: boolean;
  /** 0 to 1; `null` when not known. */
  level: number | null;
  charging: ChargingState;
  /** iOS Low Power Mode / Android Battery Saver; `null` where the platform cannot tell (web). */
  lowPowerMode: boolean | null;
}

/** The contract between `useBattery()` and whatever reads the battery. */
export interface BatteryAdapter {
  isSupported(): boolean;
  getStatus(): Promise<BatteryStatus>;
  /** Calls `listener` with the whole status on every change. */
  subscribe(listener: (status: BatteryStatus) => void): Unsubscribe;
}
