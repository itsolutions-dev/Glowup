import {
  defineGeofenceTask,
  defineLocationTask,
} from "@its/glowup-device/background-location";

import { recordTaskEvent } from "./backgroundLog";

/** The names the background location page starts and stops. */
export const TRIP_TASK = "playground-trip";
export const SITES_TASK = "playground-sites";

defineLocationTask(TRIP_TASK, (event) => {
  if (event.type === "error") {
    recordTaskEvent("trip", `Failed: ${event.error.code}`);
    return;
  }
  for (const { coords } of event.positions) {
    recordTaskEvent(
      "trip",
      `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}${
        coords.accuracy === null ? "" : ` ± ${Math.round(coords.accuracy)} m`
      }`,
    );
  }
});

defineGeofenceTask(SITES_TASK, (event) => {
  recordTaskEvent(
    "sites",
    event.type === "error"
      ? `Failed: ${event.error.code}`
      : `${event.type === "enter" ? "Entered" : "Left"} "${event.region.id}"`,
  );
});
