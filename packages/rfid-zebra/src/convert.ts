import {
  isRfidError,
  normalizeEpc,
  RfidError,
  type RfidBeeperVolume,
  type RfidErrorCode,
  type RfidSettings,
  type RfidTagRead,
} from "@its/glowup-device/rfid";

import type { NativeSettings, NativeTagRead } from "./native";

/**
 * The reader's power table is in tenths of a dBm (300 = 30 dBm): Zebra's
 * convention for its handhelds, to confirm on the RFD40 (plan, phase Z1).
 */
export const levelToDbm = (level: number) => level / 10;

/** The index of the table's level nearest `dbm`; `null` for an empty table. */
export function nearestPowerIndex(
  levels: number[],
  dbm: number,
): number | null {
  let best: number | null = null;
  levels.forEach((level, index) => {
    if (
      best === null ||
      Math.abs(levelToDbm(level) - dbm) <
        Math.abs(levelToDbm(levels[best]!) - dbm)
    ) {
      best = index;
    }
  });
  return best;
}

const TO_SDK_VOLUME: Record<RfidBeeperVolume, string> = {
  off: "QUIET",
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH",
};

export const toSdkVolume = (volume: RfidBeeperVolume) => TO_SDK_VOLUME[volume];

export function fromSdkVolume(volume: string | null): RfidBeeperVolume | null {
  const found = Object.entries(TO_SDK_VOLUME).find(([, sdk]) => sdk === volume);
  return found ? (found[0] as RfidBeeperVolume) : null;
}

const SESSIONS = [0, 1, 2, 3] as const;

/** The settings in the contract's units, the power kept within `range`. */
export function fromNativeSettings(
  native: NativeSettings,
  range: { min: number; max: number },
): RfidSettings {
  const level =
    native.powerIndex === null
      ? undefined
      : native.powerLevels[native.powerIndex];
  const power = level === undefined ? range.max : levelToDbm(level);
  return {
    power: Math.min(range.max, Math.max(range.min, power)),
    session: SESSIONS[native.session ?? 0] ?? 0,
    beeperVolume: fromSdkVolume(native.volume),
    region: native.region,
  };
}

/**
 * A read in the contract's units. The SDK's peak RSSI is a signed dBm value
 * and its tag id hex; the EPC and TID are uppercased here, whatever case the
 * SDK reports them in.
 */
export function fromNativeRead(read: NativeTagRead): RfidTagRead | null {
  const epc = normalizeEpc(read.epc ?? "");
  if (epc === null || !Number.isFinite(read.rssi)) return null;
  return {
    epc,
    rssi: read.rssi,
    antenna: read.antenna,
    readCount: Math.max(1, read.seenCount || 1),
    timestamp: read.timestamp,
    ...(read.tid ? { tid: read.tid.toUpperCase() } : {}),
  };
}

export function fromNativeReads(reads: NativeTagRead[]): RfidTagRead[] {
  return reads.flatMap((read) => fromNativeRead(read) ?? []);
}

/** The module's battery level: 0–100, or -1 when the reader did not answer. */
export function parseBatteryLevel(raw: number): number | null {
  if (typeof raw !== "number" || !Number.isFinite(raw) || raw < 0) return null;
  return Math.min(100, Math.round(raw));
}

const CODES: Record<string, RfidErrorCode> = {
  ERR_NOT_CONNECTED: "not-connected",
  ERR_DISCONNECTED: "disconnected",
  ERR_PERMISSION: "permission-denied",
  ERR_CANCELLED: "cancelled",
};

/** A native rejection as an `RfidError`, by the module's code. */
export function toRfidError(error: unknown): RfidError {
  if (isRfidError(error)) return error;
  const { code, message } = (error ?? {}) as {
    code?: unknown;
    message?: unknown;
  };
  return new RfidError(
    (typeof code === "string" && CODES[code]) || "failed",
    typeof message === "string" && message !== "" ? message : undefined,
    error,
  );
}
