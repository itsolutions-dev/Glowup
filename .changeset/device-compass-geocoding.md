---
"@its/glowup-device": minor
---

`/location` gains the compass and geocoding. Neither needs a new peer: both run on
`expo-location`.

The compass, `useHeading({ enabled })`:

- `heading` carries `magneticHeading` and `trueHeading` in degrees (0 up to 360), an `accuracy`
  label (`high`, `medium`, `low`, `unreliable`) and a `timestamp`. `trueHeading` is `null`, never
  expo's `-1`, until the platform knows the magnetic declination (it needs a location fix).
- Every reader shares one native watch: Android keeps only one, and a second would take the
  events away from the first. The watch stops while the app is in the background and closes with
  its last reader.
- It needs the location permission, not the location services, and never prompts: without the
  permission it reports `permission-denied`. iOS without a magnetometer reports `unavailable`;
  Android without one sends nothing, so `heading` stays `null`. The web reports `unsupported`.
- `LocationAdapter.watchHeading` is optional: an adapter written before this release has no
  compass and reports `unsupported`.

Geocoding, `useGeocoder()`:

- `geocode(address)` resolves the places an address may be (`latitude`, `longitude`,
  `accuracy`); `reverseGeocode(point)` resolves addresses with the same fields on iOS and Android,
  `null` where a platform has nothing. `position.coords` fits as a point. "Nothing found" resolves
  `[]`.
- Failures reject with a `LocationError`: `permission-denied` (Android geocodes only with the
  location permission), `unavailable` (no network, too many requests, no Google Play services
  geocoder, the app in the background on Android), `timeout` (15 s by default, `{ timeout }` per
  call) or `unsupported`. An empty address or a point off the globe rejects with a `TypeError` /
  `RangeError` before anything is asked.
- The geocoder is its own adapter, `geocoder` in `DeviceAdaptersProvider`, so an app can plug in
  its own provider (a web service, for example) and keep expo-location for positions. The default,
  `expoGeocoderAdapter`, is unsupported on the web: expo answers `[]` there, which would read as
  "not found".
- Nothing is cached or throttled: debounce what the user types, Apple limits the request rate.

`/testing` adds `emitHeading()` / `failHeading()` to the mock location adapter, and
`createMockGeocoderAdapter()` with `buildGeocodedLocation()` and `buildGeocodedAddress()`.
