import type { GeofenceRegion } from "./types";

const API = "useGeofencing().start()";

function fail(message: string): never {
  throw new TypeError(`${API}: ${message}`);
}

function checkFlag(index: number, key: string, value: unknown) {
  if (value === undefined || typeof value === "boolean") return value;
  return fail(`regions[${index}].${key} must be a boolean.`);
}

function checkRegion(raw: unknown, index: number): GeofenceRegion {
  if (typeof raw !== "object" || raw === null) {
    fail(`regions[${index}] must be an object.`);
  }
  const region = raw as Record<string, unknown>;
  const { id, latitude, longitude, radius } = region;
  if (typeof id !== "string" || id.trim() === "") {
    fail(`regions[${index}].id must be a non-empty string.`);
  }
  if (
    typeof latitude !== "number" ||
    !Number.isFinite(latitude) ||
    Math.abs(latitude) > 90
  ) {
    fail(`regions[${index}].latitude must be a number within ±90.`);
  }
  if (
    typeof longitude !== "number" ||
    !Number.isFinite(longitude) ||
    Math.abs(longitude) > 180
  ) {
    fail(`regions[${index}].longitude must be a number within ±180.`);
  }
  if (typeof radius !== "number" || !Number.isFinite(radius) || radius <= 0) {
    fail(`regions[${index}].radius must be a positive number of metres.`);
  }
  const notifyOnEnter = checkFlag(index, "notifyOnEnter", region.notifyOnEnter);
  const notifyOnExit = checkFlag(index, "notifyOnExit", region.notifyOnExit);
  if (notifyOnEnter === false && notifyOnExit === false) {
    fail(
      `regions[${index}] reports nothing: notifyOnEnter and notifyOnExit are both false.`,
    );
  }
  return { id, latitude, longitude, radius, notifyOnEnter, notifyOnExit };
}

/**
 * The regions as the adapter receives them: checked, with nothing but the
 * known keys. A `TypeError` for an invalid one, a `RangeError` for more than
 * the platform watches.
 */
export function checkRegions(raw: unknown, limit: number): GeofenceRegion[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    fail("regions must be a non-empty array (to watch nothing, call stop()).");
  }
  if (raw.length > limit) {
    throw new RangeError(
      `${API}: ${raw.length} regions, but this platform watches at most ${limit} for the app at once.`,
    );
  }
  const regions = raw.map(checkRegion);
  const ids = new Set<string>();
  for (const { id } of regions) {
    if (ids.has(id)) fail(`the region id "${id}" appears twice.`);
    ids.add(id);
  }
  return regions;
}
