# @its/glowup-device

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
