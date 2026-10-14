---
"@its/glowup-device": minor
---

`@its/glowup-device/background-location`: location updates that go on with the app in the
background, and geofencing, each delivered to a task defined at module scope. It needs
`expo-location` and `expo-task-manager` (a new optional peer), a development build and the
plugin's `backgroundLocation` key; the web reads `unsupported`.

Background updates:

- `defineLocationTask(name, handler)`, called at module scope in a file the app's entry imports
  first: Android runs the task headless and iOS relaunches the app for it, with no React tree.
  The handler receives `{ type: "positions", positions }` (oldest first, several at once when
  batching) or `{ type: "error", error }`.
- `useBackgroundLocation(name)`: `start(options)`, `stop()`, `isRunning`, `isSupported`. The
  updates outlive the screen and the app until `stop()`; `isRunning` is read again on every return
  to the foreground. `start()` never prompts and rejects with a `LocationError`
  (`permission-denied`, `services-disabled`, `unsupported`, `unavailable`); invalid options throw
  a `TypeError` first.
- `foregroundService` is required, so the Android choice is written at every start:
  `{ title, body, color?, stopWithApp? }` runs a foreground service with that notification (the
  foreground permission suffices, but it starts only while the app is in the foreground);
  `false` runs plain background updates, which need the background permission.
- Options: `accuracy`, `distanceInterval`, `timeInterval`, `batchInterval` / `batchDistance`,
  and on iOS `activityType`, `showsIndicator` and `pausesAutomatically`, which defaults to
  `false` (expo's iOS default is `true`, whatever its docs say).

Geofencing:

- `defineGeofenceTask(name, handler)` and `useGeofencing(name)` (`start(regions)`, `stop()`,
  `isRunning`, `limit`). Events are `enter` / `exit` with the region's `id`, or `error`.
- Regions need a unique `id`; they are checked before anything starts, and more than the
  platform watches (20 on iOS, 100 on Android, shared by the app) is a `RangeError`.
- Geofencing needs the background permission on both platforms, after the foreground one.
- Each region first reports where the device already is when monitoring starts (`exit` when
  outside). A transition a region turned off with `notifyOnEnter` / `notifyOnExit` is dropped,
  also on iOS, whose expo code reports it anyway.

`useBackgroundLocationPermission()` reads and asks for the background permission ("Always",
"Allow all the time"). It asks nothing until the foreground permission is granted, and Android
11+'s trip to the settings page does not lock the app (`useAppLock`).

The config plugin's `backgroundLocation: { mode, geofencing, alwaysPermission }` adds iOS's
`location` background mode and "Always" purpose strings, and on Android only the permissions of
the chosen `mode` (`"foreground-service"`, the default; `"background"`; `"none"` for geofencing
alone), plus the background permission for `geofencing`. It removes the `fetch` background mode
expo-task-manager adds, unless the app declares it or uses expo-background-fetch /
expo-background-task.

`/testing` adds `createMockBackgroundLocationAdapter()`: its `deliver()` and `deliverGeofence()`
run the handlers the app defined, as the platform would.

`/location`'s `LocationError`, positions and permission types now live in a shared module that
both subpaths re-export: the same class and types, imported exactly as before.
