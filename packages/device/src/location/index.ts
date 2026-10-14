/**
 * `@its/glowup-device/location` — foreground location: permission (with
 * precise / approximate), one position, a watch, the compass heading. Needs
 * `expo-location` on iOS and Android; the web uses `navigator.geolocation`.
 */
export {
  useCurrentPosition,
  useLocationPermission,
  useWatchPosition,
  type UseCurrentPosition,
  type UseCurrentPositionOptions,
  type UseLocationPermission,
  type UseWatchPosition,
  type UseWatchPositionOptions,
} from "./hooks";
export { useHeading, type UseHeading, type UseHeadingOptions } from "./heading";
export {
  isLocationError,
  LocationError,
  type LocationErrorCode,
} from "./errors";
export { expoLocationAdapter } from "./expo";
export { webLocationAdapter } from "./web";
export type {
  GeoCoordinates,
  GeoPosition,
  Heading,
  HeadingAccuracy,
  LastKnownPositionOptions,
  LocationAccuracy,
  LocationAdapter,
  LocationPermissionState,
  LocationPrecision,
  PositionOptions,
  WatchPositionOptions,
} from "./types";
