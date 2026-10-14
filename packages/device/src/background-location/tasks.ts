import {
  LocationError,
  toGeoPosition,
  type LocationObjectLike,
} from "../core/geo";
import type {
  GeofenceEvent,
  GeofenceTaskHandler,
  LocationTaskEvent,
  LocationTaskHandler,
} from "./types";

export type TaskKind = "location" | "geofence";

type Registered =
  | { kind: "location"; handler: LocationTaskHandler }
  | { kind: "geofence"; handler: GeofenceTaskHandler };

/**
 * Every task the app defined, by name. Plain JavaScript (no native module),
 * so the hooks can check a task exists before starting it and `/testing`
 * can run a handler the way the platform would. A name is one task on the
 * platform, so it holds one kind.
 */
const tasks = new Map<string, Registered>();

export function checkTaskName(name: unknown, api: string): string {
  if (typeof name !== "string" || name.trim() === "") {
    throw new TypeError(`${api}: the task name must be a non-empty string.`);
  }
  return name;
}

function register(name: string, task: Registered, api: string): void {
  const existing = tasks.get(name);
  if (existing && existing.kind !== task.kind) {
    throw new Error(
      `${api}: "${name}" is already a ${existing.kind} task. A name is one task on the platform: pick another.`,
    );
  }
  tasks.set(name, task);
}

export function registerLocationTask(
  name: string,
  handler: LocationTaskHandler,
): void {
  register(name, { kind: "location", handler }, "defineLocationTask()");
}

export function registerGeofenceTask(
  name: string,
  handler: GeofenceTaskHandler,
): void {
  register(name, { kind: "geofence", handler }, "defineGeofenceTask()");
}

export function isTaskDefined(name: string, kind: TaskKind): boolean {
  return tasks.get(name)?.kind === kind;
}

/** Runs a task's handler; resolves without doing anything for an unknown name. */
export async function runLocationTask(
  name: string,
  event: LocationTaskEvent,
): Promise<void> {
  const task = tasks.get(name);
  if (task?.kind === "location") await task.handler(event);
}

export async function runGeofenceTask(
  name: string,
  event: GeofenceEvent,
): Promise<void> {
  const task = tasks.get(name);
  if (task?.kind === "geofence") await task.handler(event);
}

/** expo-task-manager's task body, structurally. */
export interface TaskBodyLike<T> {
  data?: T | null;
  error?: { code?: unknown; message?: string } | null;
}

export type LocationTaskBodyLike = TaskBodyLike<{
  locations?: LocationObjectLike[];
}>;

// CLError.denied: the user took the permission away while it ran.
const IOS_DENIED = 1;
// What Android's GeofenceStatusCodes.GEOFENCE_NOT_AVAILABLE reaches JS as
// (expo sends the message only): location is switched off.
const ANDROID_GEOFENCING_OFF = "Geofencing not available.";

/**
 * A task failure as a `LocationError`. iOS reports a CoreLocation failure as
 * the `NSError`'s numeric code; Android reports geofencing failures as a
 * message alone.
 */
function toTaskError(
  error: NonNullable<TaskBodyLike<unknown>["error"]>,
): LocationError {
  const { code, message } = error;
  if (code === IOS_DENIED) {
    return new LocationError("permission-denied", message, error);
  }
  if (message === ANDROID_GEOFENCING_OFF) {
    return new LocationError("services-disabled", message, error);
  }
  return new LocationError("unavailable", message, error);
}

/** The platform's body as an event. Positions come oldest first. */
export function toLocationTaskEvent(
  body: LocationTaskBodyLike,
): LocationTaskEvent {
  if (body.error) return { type: "error", error: toTaskError(body.error) };
  const positions = (body.data?.locations ?? [])
    .map(toGeoPosition)
    .sort((a, b) => a.timestamp - b.timestamp);
  return { type: "positions", positions };
}

/** expo's geofencing event: 1 entered, 2 left. */
export type GeofenceTaskBodyLike = TaskBodyLike<{
  eventType?: number;
  region?: {
    identifier?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
  };
}>;

const ENTER = 1;

export function toGeofenceEvent(body: GeofenceTaskBodyLike): GeofenceEvent {
  if (body.error) return { type: "error", error: toTaskError(body.error) };
  const region = body.data?.region ?? {};
  return {
    type: body.data?.eventType === ENTER ? "enter" : "exit",
    region: {
      id: region.identifier ?? "",
      latitude: region.latitude ?? Number.NaN,
      longitude: region.longitude ?? Number.NaN,
      radius: region.radius ?? Number.NaN,
    },
  };
}
