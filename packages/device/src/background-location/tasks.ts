import {
  LocationError,
  toGeoPosition,
  type LocationObjectLike,
} from "../core/geo";
import type { LocationTaskEvent, LocationTaskHandler } from "./types";

/**
 * Every location task the app defined, by name. Plain JavaScript (no native
 * module), so the hooks can check a task exists before starting it and
 * `/testing` can run a handler the way the platform would.
 */
const handlers = new Map<string, LocationTaskHandler>();

export function checkTaskName(name: unknown, api: string): string {
  if (typeof name !== "string" || name.trim() === "") {
    throw new TypeError(`${api}: the task name must be a non-empty string.`);
  }
  return name;
}

export function registerLocationTask(
  name: string,
  handler: LocationTaskHandler,
): void {
  handlers.set(name, handler);
}

export function isLocationTaskDefined(name: string): boolean {
  return handlers.has(name);
}

/** Runs a task's handler; resolves without doing anything for an unknown name. */
export async function runLocationTask(
  name: string,
  event: LocationTaskEvent,
): Promise<void> {
  await handlers.get(name)?.(event);
}

/** expo-task-manager's task body, structurally. */
export interface LocationTaskBodyLike {
  data?: { locations?: LocationObjectLike[] } | null;
  error?: { code?: unknown; message?: string } | null;
}

// CLError.denied: the user took the permission away while the updates ran.
const IOS_DENIED = 1;

/**
 * The platform's body as an event. iOS reports a CoreLocation failure as the
 * `NSError`'s numeric code; Android delivers positions only. Positions come
 * oldest first, as both platforms batch them.
 */
export function toLocationTaskEvent(
  body: LocationTaskBodyLike,
): LocationTaskEvent {
  if (body.error) {
    const { code, message } = body.error;
    return {
      type: "error",
      error: new LocationError(
        code === IOS_DENIED ? "permission-denied" : "unavailable",
        message,
        body.error,
      ),
    };
  }
  const positions = (body.data?.locations ?? [])
    .map(toGeoPosition)
    .sort((a, b) => a.timestamp - b.timestamp);
  return { type: "positions", positions };
}
