import type { RfidProximityBounds, RfidTag, RfidTagRead } from "./types";

const HEX = /^[0-9A-F]+$/;

/**
 * An EPC as the contract writes it: uppercase hex. Separators (spaces,
 * dashes, colons) are dropped. `null` when what is left is not hex in whole
 * 16-bit words, as every EPC is.
 */
export function normalizeEpc(epc: string): string | null {
  if (typeof epc !== "string") return null;
  const hex = epc.replace(/[\s:-]/g, "").toUpperCase();
  return hex.length > 0 && hex.length % 4 === 0 && HEX.test(hex) ? hex : null;
}

/** `normalizeEpc`, or a `TypeError` naming the caller. */
export function requireEpc(epc: string, caller: string): string {
  const normalized = normalizeEpc(epc);
  if (normalized === null) {
    throw new TypeError(
      `${caller}: the EPC must be hex in whole 16-bit words (4 digits each), got ${JSON.stringify(epc)}.`,
    );
  }
  return normalized;
}

/** How much a new read moves the average: higher follows faster, lower is steadier. */
export const RSSI_SMOOTHING = 0.3;

/** Where `rssi` falls between the bounds: 0 at or beyond `far`, 1 at or within `near`. */
export function toProximity(rssi: number, bounds: RfidProximityBounds): number {
  const span = bounds.near - bounds.far;
  if (!(span > 0)) return rssi >= bounds.near ? 1 : 0;
  return Math.min(1, Math.max(0, (rssi - bounds.far) / span));
}

/** An app's bounds, checked: `near` must be the stronger (higher) dBm. */
export function requireBounds(
  bounds: RfidProximityBounds,
  caller: string,
): RfidProximityBounds {
  const { near, far } = bounds;
  if (!Number.isFinite(near) || !Number.isFinite(far) || near <= far) {
    throw new RangeError(
      `${caller}: proximity.near must be a stronger (higher) dBm than proximity.far, got near ${String(near)} and far ${String(far)}.`,
    );
  }
  return { near, far };
}

/**
 * Merges a read into what is known of its tag; returns `known` unchanged
 * (and `null` for a new tag) when the read's EPC is not one.
 */
export function mergeRead(
  known: RfidTag | undefined,
  read: RfidTagRead,
  bounds: RfidProximityBounds,
  now: number,
): RfidTag | null {
  const epc = normalizeEpc(read.epc);
  if (epc === null || !Number.isFinite(read.rssi)) return known ?? null;
  const at = read.timestamp ?? now;
  const averageRssi = known
    ? known.averageRssi + RSSI_SMOOTHING * (read.rssi - known.averageRssi)
    : read.rssi;
  return {
    epc,
    tid: read.tid ? read.tid.toUpperCase() : (known?.tid ?? null),
    rssi: read.rssi,
    averageRssi,
    proximity: toProximity(averageRssi, bounds),
    antenna: read.antenna ?? known?.antenna ?? null,
    readCount: (known?.readCount ?? 0) + Math.max(1, read.readCount ?? 1),
    firstSeen: known ? Math.min(known.firstSeen, at) : at,
    lastSeen: known ? Math.max(known.lastSeen, at) : at,
  };
}

/** The reads merged by EPC. */
export function mergeReads(
  reads: RfidTagRead[],
  bounds: RfidProximityBounds,
  now: number,
): Map<string, RfidTag> {
  const tags = new Map<string, RfidTag>();
  for (const read of reads) {
    const epc = normalizeEpc(read.epc);
    if (epc === null) continue;
    const merged = mergeRead(tags.get(epc), read, bounds, now);
    if (merged) tags.set(epc, merged);
  }
  return tags;
}

/** The nearest tag: the highest average RSSI, then the most reads. */
export function strongestTag(tags: Iterable<RfidTag>): RfidTag | null {
  let best: RfidTag | null = null;
  for (const tag of tags) {
    if (
      !best ||
      tag.averageRssi > best.averageRssi ||
      (tag.averageRssi === best.averageRssi && tag.readCount > best.readCount)
    ) {
      best = tag;
    }
  }
  return best;
}
