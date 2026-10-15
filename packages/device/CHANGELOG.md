# @its/glowup-device

## 0.10.0

### Minor Changes

- 37d8100: Add `@its/glowup-device/bluetooth`: Bluetooth Low Energy as the central (GATT client), on
  `react-native-ble-manager` (a new optional peer, loaded on first use: the web and Expo Go read
  `unsupported` instead of crashing).

  - `useBluetoothState` (the radio, and Android's "turn on Bluetooth?" dialog) and
    `useBluetoothPermission` (Android's nearby devices permissions; on iOS it reads
    `undetermined` until a request in the launch, which shows no UI after the first answer).
  - `useBluetoothScan`: one shared scan, service filter, devices listed once with their latest
    signal and advertisement, paused in the background, guarded against Android's five-starts-in-30-
    seconds throttling.
  - `useBluetoothDevice`: one shared connection per device with a timeout, service discovery,
    reads, writes (chunked at MTU − 3), MTU, RSSI and bonding (Android); closed when the last
    component using it unmounts unless `disconnectOnUnmount: false`.
  - `useBluetoothNotifications`: shared per characteristic, turned on again after every
    reconnection.
  - Device Information and Battery helpers, the Nordic UART UUIDs, UTF-8 helpers,
    `toBluetoothUuid`, `BluetoothError`.
  - Config plugin key `bluetooth: { permission, neverForLocation }` (through ble-manager's plugin,
    `neverForLocation` defaulting to `true`).
  - `/testing`: `createMockBluetoothAdapter()` and `buildBluetoothDevice()`.

## 0.9.0

### Minor Changes

- 010fcf4: Removes exports that duplicated what the package already does by itself. Hooks and default
  behaviour are unchanged.

  Removed exports:

  - `webHapticsAdapter` (`/haptics`), `webBiometricsAdapter` (`/biometrics`) and
    `webSecureStoreAdapter` (`/secure-store`). The Expo adapters answer `isSupported()` false on
    the web and every hook checks it first, so nothing plays, authenticates or stores there, as
    before. An app that passed one of them to `DeviceAdaptersProvider` can drop it.
  - `createExpoMediaLibraryAdapter` and `createWebMediaLibraryAdapter` (`/media-library`): the
    adapters hold no state. Use `expoMediaLibraryAdapter` / `webMediaLibraryAdapter`.
  - `createExpoMediaPickerAdapter` and `createWebMediaPickerAdapter` (`/media-picker`): use
    `expoMediaPickerAdapter` / `webMediaPickerAdapter`.

  Internally, the stores, listener sets, client-only reads and error classes share one
  implementation in `core`.

## 0.8.0

### Minor Changes

- 0a94e84: `@its/glowup-device/background-location`: location updates that go on with the app in the
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

## 0.7.0

### Minor Changes

- baae253: `/location` gains the compass and geocoding. Neither needs a new peer: both run on
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

## 0.6.0

### Minor Changes

- 5ee7e9a: Two new subpaths for photos and videos: picking them, and saving them to the device's
  library.

  `/media-picker`, on `expo-image-picker` (an optional peer):

  - `useMediaPicker().pick(options)` opens the system picker. No permission is needed on any
    platform.
  - Options: `mediaTypes`, `multiple` with `limit`, `edit` with `aspect`, `quality` and `exif`.
    An invalid combination rejects with a `TypeError` before anything opens. That includes
    `edit` with `exif`: on iOS it would prompt for full library access just to read the EXIF.
  - Every outcome resolves: `picked`, `cancelled`, `busy`, `unsupported` or `failed`.
  - Picked assets are normalised: `duration` is in ms on every platform, and on the web each
    asset carries its `File`, ready for `FormData`.
  - Only one pick runs at a time. expo would otherwise leave the first promise unanswered on iOS.
  - `getPendingResult()` recovers a pick that Android interrupted by stopping the app.
  - The web uses the package's own file-input adapter instead of expo's web build, and applies
    `limit`.
  - `useAppLock` no longer locks on the way back from the picker, although Android sends the app
    to the background behind it.
  - The config plugin key `mediaPicker` removes Android's `CAMERA` and `RECORD_AUDIO`, unless
    `camera` needs them.

  `/media-library`, on `expo-media-library` (an optional peer):

  - `useMediaLibrary().save(uri)` saves a local image or video. It keeps the original file and
    resolves `saved` (with the library's `assetId`), `denied`, `unsupported` or `failed`.
  - `save()` asks for the permission only where saving needs it: iOS's add-only access, and
    storage on Android 10 and earlier. Android 11 and later save without a prompt. The
    permission state comes with `isRequired`, `request()` and `openSettings()`.
  - Saving is unsupported on the web, and the web bundle never loads expo-media-library, whose
    default entry throws at import in a browser.
  - The config plugin key `mediaLibrary: { savePermission }` writes the add-only purpose string.
    It also removes Android's `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO`, `READ_MEDIA_AUDIO`,
    `READ_MEDIA_VISUAL_USER_SELECTED` and `ACCESS_MEDIA_LOCATION`. Saving does not need them, and
    Google Play restricts them.

  `/testing` adds `createMockMediaPickerAdapter()`, `buildPickedMedia()` and
  `createMockMediaLibraryAdapter()`.

## 0.5.0

### Minor Changes

- ced0f80: New `/sensors` subpath on `expo-sensors` (an optional peer): accelerometer, gyroscope,
  magnetometer, barometer, light sensor and device motion, in one set of units and axes on every
  platform.

  - Readings are normalised whatever expo-sensors sends: acceleration in m/s² including gravity
    (iOS's inverted signs fixed, so a phone lying face up reads `z ≈ +9.81` everywhere), rotation
    in rad/s, magnetic field in µT, pressure in hPa, light in lux, along the device's axes, with
    millisecond timestamps.
  - Value hooks (`useAccelerometer`, `useGyroscope`, `useMagnetometer`, `useBarometer`,
    `useLightSensor`, `useDeviceMotion`) and `useSensorListener` for readings that must not
    re-render. `useSensorAvailability` answers whether the device has the sensor.
  - One platform subscription per sensor, shared by every reader at the fastest interval asked
    for (default 200 ms, each reader throttled to its own), opened only once the sensor is known
    to exist and paused while the app is in the background.
  - `useDeviceMotion`: the user's acceleration and gravity apart, with the rotation rate. No
    attitude: expo's iOS and Android angles start from different axes.
  - `useDeviceOrientation`: how the device is held (`portrait-up`, `landscape-left`, `face-up`…),
    from gravity, with hysteresis; it re-renders only when the answer changes.
  - `useSensorPermission(sensor)`: the motion permission where a sensor needs it (iOS's
    barometer, iOS Safari's motion sensors), with `isRequired`, `request()` (synchronous down to
    Safari's prompt, which grants only inside the user's gesture) and `openSettings()`. The
    sensor hooks never prompt.
  - The web reads the DeviceMotion events itself instead of expo-sensors' web build, which sends
    orientation angles as the accelerometer.
  - The config plugin takes `sensors: { motionPermission, highSamplingRate }`: the Motion & Fitness
    purpose string, the removal of `ACTIVITY_RECOGNITION` (added by expo-sensors for a pedometer
    this package does not expose) and, on request, `HIGH_SAMPLING_RATE_SENSORS`.
  - `/testing` adds `createMockSensorsAdapter()`.

## 0.4.0

### Minor Changes

- 0f41f21: New `/secure-store` subpath on `expo-secure-store` (an optional peer): small secrets in the
  Keychain on iOS and Keystore-encrypted storage on Android.

  - `useSecureStore()`: `get`, `set`, `remove` and JSON helpers. Keys and values are validated
    first; every failure rejects with a `SecureStoreError` (`invalid-key`, `invalid-value`,
    `locked`, `unsupported`, `failed`).
  - `useSecureValue(key)`: one shared read per key and service, updated by every write made
    through the package, read again in the foreground after a failure.
  - iOS defaults to `accessible: "when-unlocked"` and `thisDeviceOnly: true` (stricter than
    expo-secure-store). An existing iOS item is replaced on write, since expo's update keeps the
    old accessibility.
  - Protected items, bound to the enrolled biometrics: `getProtected`, `setProtected` and
    `removeProtected` resolve every outcome as `{ status }`, including `invalidated` when the
    enrolled biometrics changed (a marker written beside each item tells it from `missing`). Each
    protected item gets its own service, since Android deletes every protected item of a service
    when an invalidated one is written again.
  - The config plugin takes `secureStore: true | { faceIDPermission, androidBackupRules }`
    (Android Auto Backup rules on by default).
  - Unsupported on web, with no `localStorage` fallback. `/testing` adds
    `createMockSecureStoreAdapter()`.

  `/biometrics` now shares one system prompt with the protected items: while either is open, the
  other resolves `busy`, and `useBiometrics().isAuthenticating` is true for both.

## 0.3.0

### Minor Changes

- 45ebb3b: New `/biometrics` subpath on `expo-local-authentication` (an optional peer): a local gate, not
  server authentication.

  - `useBiometrics()`: the device's status (`hasHardware`, `isEnrolled`, `types`, `level`), read
    again whenever the app returns to the foreground, plus `authenticate(options)` and `cancel()`.
    `authenticate()` resolves every outcome as `{ success: false, error }` (`cancelled`,
    `fallback`, `lockout`, `not-enrolled`, `unavailable`, `busy`, `unsupported`, `failed`) and
    never rejects for one. One prompt at a time: a second call resolves `busy`. `promptMessage`
    and `cancelLabel` are required, since expo-local-authentication fills in English. The
    passcode fallback is on by default (`fallback: "none"` for biometrics only); `strength`
    picks Android's biometric class, and `strong` goes out as biometrics only on Android 9 and
    10, where AndroidX cannot combine it with the passcode.
  - `useAppLock({ enabled, relockAfter, prompt, promptOnLock, whenUnavailable })`: one lock over
    the whole app, locked at a cold start and after a trip to the background longer than
    `relockAfter` (default 0). Never on `inactive` (Face ID's own prompt), and not after a
    background a prompt caused (Android's device-credential screen). The app draws the lock
    screen.
  - The config plugin takes `biometrics: { faceIDPermission }`, Face ID's purpose string (without
    it Face ID silently falls back to the passcode; the package warns once in development).
  - Unsupported on web. `/testing` adds `createMockBiometricsAdapter()`.

## 0.2.0

### Minor Changes

- 068f98a: Five new capabilities, each on its own subpath with its Expo module as an optional peer:

  - `/network` (`@react-native-community/netinfo`): `useNetwork()` (connected, internet
    reachable, type, metered, cellular generation; unknown is `null`, never `false`) and
    `useIsOnline()`, kept live through one shared subscription. On web, `navigator.onLine` and the
    Network Information API instead of netinfo's web build, which probes `HEAD /` every minute.
  - `/battery` (`expo-battery`): `useBattery()` (level, charging state, Low Power Mode). On web,
    the Battery Status API (Chromium) instead of expo-battery's web build, whose listeners throw.
  - `/keep-awake` (`expo-keep-awake`): `useKeepAwake({ enabled })`, one tag per mounted hook, and
    `useKeepAwakeSupport()`. On web, a Screen Wake Lock that is taken again after the tab is
    hidden and never leaks when deactivated mid-request.
  - `/orientation` (`expo-screen-orientation`): `useOrientation()` (the interface orientation,
    live) and `useOrientationLock(lock, { enabled })`. Locks stack, the most recent wins, and
    releasing the last one restores the app's own orientation (expo's `unlockAsync()` would let a
    portrait-only app rotate). A refused lock is reported in `error`, never thrown.
  - `/haptics` (`expo-haptics`): `useHaptics()` (impact, notification, selection, interaction;
    never rejects) and `hapticFeedback`, ready for `@its/glowup-ui`'s
    `ThemeProvider onInteractionFeedback`. Android interactions honour the system's touch
    feedback setting; nothing plays on web.
  - `/testing`: `createMockNetworkAdapter`, `createMockBatteryAdapter`,
    `createMockKeepAwakeAdapter`, `createMockOrientationAdapter`, `createMockHapticsAdapter`.

## 0.1.0

### Minor Changes

- a4ebefd: First release of `@its/glowup-device`, a headless device hardware layer for Expo apps, one
  subpath per capability so an app installs only the Expo modules it uses:

  - `/info`: `useDeviceInfo()` — model, OS, device type, emulator, app version and build.
  - `/location`: `useLocationPermission()` (with precise / approximate), `useCurrentPosition()`
    (timeout, cached fix with `maxAge`), `useWatchPosition()`; foreground only, and the hooks
    never prompt.
  - `/camera`: a headless `CameraView` with photos, video (native) and barcode / QR scanning
    through its ref and props, and `useCameraPermission()` (camera, then the microphone).
  - Every capability sits behind an adapter: Expo by default, swappable with
    `DeviceAdaptersProvider`; `/testing` ships in-memory adapters for apps' tests.
  - A config plugin (`["@its/glowup-device", { location, camera }]`) writing only the purpose
    strings and permissions of the capabilities listed.
