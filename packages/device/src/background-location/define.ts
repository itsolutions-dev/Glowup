import * as TaskManager from "expo-task-manager";

import { isNativePlatform } from "../core/support";
import {
  checkTaskName,
  registerLocationTask,
  runLocationTask,
  toLocationTaskEvent,
  type LocationTaskBodyLike,
} from "./tasks";
import type { LocationTaskHandler } from "./types";

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
  if (typeof handler !== "function") {
    throw new TypeError(
      "defineLocationTask(): the handler must be a function.",
    );
  }
  registerLocationTask(name, handler);
  // expo-task-manager catches and logs what the handler throws, then tells
  // the platform the task finished: a failure never leaves it waiting.
  if (isNativePlatform) {
    TaskManager.defineTask<LocationTaskBodyLike["data"]>(name, (body) =>
      runLocationTask(name, toLocationTaskEvent(body)),
    );
  }
}
