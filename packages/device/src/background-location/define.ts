import * as TaskManager from "expo-task-manager";

import { isNativePlatform } from "../core/support";
import {
  checkTaskName,
  registerGeofenceTask,
  registerLocationTask,
  runGeofenceTask,
  runLocationTask,
  toGeofenceEvent,
  toLocationTaskEvent,
  type GeofenceTaskBodyLike,
  type LocationTaskBodyLike,
} from "./tasks";
import type {
  GeofenceEvent,
  GeofenceTaskHandler,
  LocationTaskHandler,
} from "./types";

function checkHandler(handler: unknown, api: string): void {
  if (typeof handler !== "function") {
    throw new TypeError(`${api}: the handler must be a function.`);
  }
}

/**
 * Names the code that receives background positions. Call it **at module
 * scope** (in the file your app's entry imports first), never in a component
 * or an effect: iOS relaunches the app and Android runs it headless to
 * deliver positions, with no React tree, and only what ran at import time is
 * there to receive them. Defining the same name again replaces the handler
 * (Fast Refresh).
 *
 * ```ts
 * defineLocationTask("trip", async (event) => {
 *   if (event.type === "positions") await saveTrip(event.positions);
 * });
 * ```
 */
export function defineLocationTask(
  name: string,
  handler: LocationTaskHandler,
): void {
  checkTaskName(name, "defineLocationTask()");
  checkHandler(handler, "defineLocationTask()");
  registerLocationTask(name, handler);
  // expo-task-manager catches and logs what the handler throws, then tells
  // the platform the task finished: a failure never leaves it waiting.
  if (isNativePlatform) {
    TaskManager.defineTask<LocationTaskBodyLike["data"]>(name, (body) =>
      runLocationTask(name, toLocationTaskEvent(body)),
    );
  }
}

/** A region as the Expo adapter stored it in the task's options. */
interface StoredRegion {
  identifier?: string;
  notifyOnEnter?: boolean;
  notifyOnExit?: boolean;
}

/**
 * Whether the region asked for this transition. iOS reports a region's state
 * whenever it determines it (when monitoring starts, and again later) without
 * looking at the region's flags, so an `exit` turned off still arrives there.
 * The flags are read back from the task's options, which outlive the app.
 * When they cannot be read, the event goes through.
 */
async function isWanted(name: string, event: GeofenceEvent): Promise<boolean> {
  if (event.type === "error") return true;
  try {
    const options = await TaskManager.getTaskOptionsAsync<{
      regions?: StoredRegion[];
    }>(name);
    const region = options?.regions?.find(
      (stored) => stored.identifier === event.region.id,
    );
    if (!region) return true;
    return event.type === "enter"
      ? region.notifyOnEnter !== false
      : region.notifyOnExit !== false;
  } catch {
    return true;
  }
}

/**
 * Names the code that receives geofence events (`useGeofencing`). Like
 * `defineLocationTask`, call it at module scope: the platform delivers the
 * events with the app in the background, or relaunched for them.
 *
 * ```ts
 * defineGeofenceTask("sites", async (event) => {
 *   if (event.type === "enter") await clockIn(event.region.id);
 * });
 * ```
 */
export function defineGeofenceTask(
  name: string,
  handler: GeofenceTaskHandler,
): void {
  checkTaskName(name, "defineGeofenceTask()");
  checkHandler(handler, "defineGeofenceTask()");
  registerGeofenceTask(name, handler);
  if (isNativePlatform) {
    TaskManager.defineTask<GeofenceTaskBodyLike["data"]>(name, async (body) => {
      const event = toGeofenceEvent(body);
      if (await isWanted(name, event)) await runGeofenceTask(name, event);
    });
  }
}
