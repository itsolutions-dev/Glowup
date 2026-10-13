---
"@its/glowup-device": minor
---

First release of `@its/glowup-device`, a headless device hardware layer for Expo apps, one
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
