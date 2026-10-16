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

/** The SDK's antenna power is centi-dBm (3000 = 30 dBm). */
export const toCentiDbm = (dbm: number) => Math.round(dbm * 100);
export const toDbm = (centiDbm: number) => centiDbm / 100;

const TO_SDK_VOLUME: Record<RfidBeeperVolume, string> = {
  off: "MUTE",
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

export function fromNativeSettings(
  native: NativeSettings,
  fallbackPower: number,
): RfidSettings {
  return {
    power: native.power === null ? fallbackPower : toDbm(native.power),
    session: SESSIONS[native.session ?? 0] ?? 0,
    beeperVolume: fromSdkVolume(native.volume),
    region: native.region,
  };
}

/**
 * A read in the contract's units. The SDK reports RSSI as a signed byte from
 * the reader, which is dBm (read from the SDK's bytecode; the spike confirms
 * it), and the EPC as uppercase hex already.
 */
export function fromNativeRead(read: NativeTagRead): RfidTagRead | null {
  const epc = normalizeEpc(read.epc ?? "");
  if (epc === null || !Number.isFinite(read.rssi)) return null;
  return {
    epc,
    rssi: read.rssi,
    antenna: read.antenna,
    readCount: Math.max(1, read.readCount || 1),
    timestamp: read.timestamp,
    ...(read.tid ? { tid: read.tid.toUpperCase() } : {}),
  };
}

export function fromNativeReads(reads: NativeTagRead[]): RfidTagRead[] {
  return reads.flatMap((read) => fromNativeRead(read) ?? []);
}

/** The battery string: a decimal percentage, empty when the reader did not answer. */
export function parseBatteryLevel(raw: string): number | null {
  if (typeof raw !== "string" || raw.trim() === "") return null;
  const level = Number.parseInt(raw, 10);
  return Number.isFinite(level) ? Math.min(100, Math.max(0, level)) : null;
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
