/**
 * `@its/glowup-device/background-location` — location updates that go on
 * while the app is in the background, and geofencing (entering and leaving
 * regions), each delivered to a task defined at module scope. Needs
 * `expo-location` and `expo-task-manager`, a development build, and
 * `backgroundLocation` in the config plugin. Not on the web.
 */
export { defineGeofenceTask, defineLocationTask } from "./define";
export {
  useBackgroundLocation,
  useBackgroundLocationPermission,
  useGeofencing,
  type UseBackgroundLocation,
  type UseBackgroundLocationPermission,
  type UseGeofencing,
} from "./hooks";
export { expoBackgroundLocationAdapter } from "./expo";
// The same class and types as `/location`'s (they live in core).
export {
  isLocationError,
  LocationError,
  type GeoCoordinates,
  type GeoPosition,
  type LocationAccuracy,
  type LocationErrorCode,
  type LocationPermissionState,
} from "../core/geo";
export type {
  BackgroundLocationAdapter,
  BackgroundLocationBaseOptions,
  BackgroundLocationOptions,
  ForegroundServiceOptions,
  GeofenceEvent,
  GeofenceEventRegion,
  GeofenceRegion,
  GeofenceTaskHandler,
  LocationActivityType,
  LocationTaskEvent,
  LocationTaskHandler,
} from "./types";
