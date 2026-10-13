# @its/glowup-device

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
