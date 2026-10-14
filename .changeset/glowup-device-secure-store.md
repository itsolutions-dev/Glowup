---
"@its/glowup-device": minor
---

New `/secure-store` subpath on `expo-secure-store` (an optional peer): small secrets in the
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
