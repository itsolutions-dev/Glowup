---
"@its/glowup-device": minor
---

New `/biometrics` subpath on `expo-local-authentication` (an optional peer): a local gate, not
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
