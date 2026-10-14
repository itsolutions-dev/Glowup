import type { AccelerometerReading } from "./types";

/**
 * How the device is held, from gravity, whatever the interface does: a
 * portrait-locked app still reads `landscape-left` when the phone is turned.
 * Portrait and landscape are named as `/orientation` names the interface
 * orientation the app would take if it rotated freely (iOS's names), so the
 * two hooks agree; `face-up` / `face-down` lie flat.
 */
export type DeviceOrientation =
  | "portrait-up"
  | "portrait-down"
  | "landscape-left"
  | "landscape-right"
  | "face-up"
  | "face-down";

const STANDARD_GRAVITY = 9.80665;

/**
 * Within 35° of an axis to enter its orientation. Between 35° and 55° the
 * previous answer holds, so a phone tilted halfway does not flicker.
 */
const ENTER = Math.cos((35 * Math.PI) / 180);

/**
 * The orientation a reading shows, or `previous` when it shows none
 * clearly: halfway between two, or shaken (an acceleration far from 1 g is
 * not mostly gravity).
 */
export function classifyOrientation(
  { x, y, z }: AccelerometerReading,
  previous: DeviceOrientation | null,
): DeviceOrientation | null {
  const magnitude = Math.hypot(x, y, z);
  if (
    magnitude < 0.5 * STANDARD_GRAVITY ||
    magnitude > 1.5 * STANDARD_GRAVITY
  ) {
    return previous;
  }
  // The reading points up, away from the ground (W3C/Android signs): the
  // right edge up is the interface's landscape-right (content turned so
  // that the device's top is on the left).
  const candidates: [number, DeviceOrientation][] = [
    [z, "face-up"],
    [-z, "face-down"],
    [y, "portrait-up"],
    [-y, "portrait-down"],
    [x, "landscape-right"],
    [-x, "landscape-left"],
  ];
  let best = candidates[0];
  for (const candidate of candidates) {
    if (candidate[0] > best[0]) best = candidate;
  }
  return best[0] / magnitude >= ENTER ? best[1] : previous;
}
