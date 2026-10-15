/**
 * `@its/glowup-device/location` — foreground location: permission (with
 * precise / approximate), one position, a watch, the compass heading,
 * geocoding. Needs `expo-location` on iOS and Android; the web uses
 * `navigator.geolocation` and has no geocoder unless the app supplies one.
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
export { useGeocoder, type GeocodeOptions, type UseGeocoder } from "./geocoder";
export {
  isLocationError,
  LocationError,
  type LocationErrorCode,
} from "../core/geo";
export { expoGeocoderAdapter, expoLocationAdapter } from "./expo";
export { webLocationAdapter } from "./web";
export type {
  GeoCoordinates,
  GeocodedAddress,
  GeocodedLocation,
  GeocoderAdapter,
  GeoPoint,
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
