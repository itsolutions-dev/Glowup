/**
 * `@its/glowup-device/background-location` — location updates that go on
 * while the app is in the background, delivered to a task defined at module
 * scope. Needs `expo-location` and `expo-task-manager`, a development build,
 * and `backgroundLocation` in the config plugin. Not on the web.
 */
export { defineLocationTask } from "./define";
export {
  useBackgroundLocation,
  useBackgroundLocationPermission,
  type UseBackgroundLocation,
  type UseBackgroundLocationPermission,
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
  LocationActivityType,
  LocationTaskEvent,
  LocationTaskHandler,
} from "./types";
