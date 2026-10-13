# Plan: `@its/glowup-device`, the device hardware package

## Why this document exists

The request: add a separate package to the framework for the device hardware (location,
camera, device info) behind adapters of its own, meant to collect every hardware wrapper
and component over time. This document records the decisions taken with the requester, the
architecture that follows from the repo's existing rules, and the phases.

## Decisions

| #   | Question                          | Decision                                                                                       |
| --- | --------------------------------- | ---------------------------------------------------------------------------------------------- |
| D1  | Name                              | `@its/glowup-device`, workspace `packages/device`.                                             |
| D2  | One package or one per capability | One package, **one subpath per capability**, Expo modules as optional peers.                   |
| D3  | Adapter shape                     | Expo adapter is the default inside each subpath; an optional root provider overrides it.       |
| D4  | Camera UI                         | Headless: `CameraView` with no controls + hooks. The MD3 camera screen is a playground recipe. |
| D5  | Location scope (v1)               | Foreground only: permission, current position, watch.                                          |
| D6  | Camera scope (v1)                 | Photo, video (with microphone permission), barcode and QR scanning.                            |
| D7  | Device info scope (v1)            | Model, OS, device type, emulator, app version and build.                                       |
| D8  | Permission model                  | Duplicated from notifications; notifications stays out of this package.                        |
| D9  | Config plugin                     | `app.plugin.js` with explicit per-capability opt-in and placeholder permission texts.          |
| D10 | Testing                           | `/testing` in-memory adapters; the package joins `examples/consumer`.                          |

### D2 — why subpaths, and what they cost

`packages/notifications/CLAUDE.md` records the constraint: Metro resolves every static import
reachable from an entry point, so a native module imported from a barrel becomes a
_required_ peer of every consumer. A single barrel re-exporting location, camera and device
info would force `expo-camera` (and its permission strings) on an app that only reads the OS
version. Subpaths keep one package without that cost, provided that:

- the root entry imports nothing native (it carries types only);
- each capability imports only its own Expo modules and never another capability;
- the Expo modules are declared optional in `peerDependenciesMeta`.

ESLint enforces the first two (`DEVICE_CAPABILITIES` in `eslint.config.js`). The cost is one
node10 fallback folder per subpath (attw checks them) and a test pinning the export map
against the folders and `files`.

### D3 — why the default adapter is baked in

What the repo showed:

- Nothing is injected today: notifications imports `expo-notifications` directly and its
  tests replace the whole native module. Its own CLAUDE.md names the cost: every new Expo
  function the package calls has to be added to the mock, or every consumer's tests break.
  The mock is coupled to Expo's API, not to the package's.
- The ecosystem is Expo-only (the SDK owns the native versions, `examples/consumer` is an
  Expo app). No consumer needs a non-Expo implementation today.

So each subpath imports its Expo adapter as the default and works without wiring. Hooks
talk only to the adapter interface, whose types are the package's own. The root exports an
optional `DeviceAdaptersProvider` (type imports only) that overrides any adapter, which is how
`/testing` injects in-memory adapters: tests depend on the package's contract, not on Expo's.

Accepted limit: the subpath statically imports its default, so `expo-camera` stays required
for anyone importing `/camera`, even with another adapter injected. Should a second
implementation be needed (for example `react-native-vision-camera`), an adapter-free entry
(`/camera/core`) can be added without a breaking change.

### D9 — the config plugin

```ts
// app.config.ts
plugins: [
  ["@its/glowup-device", {
    camera: { cameraPermission: "…", microphonePermission: "…", recordAudio: true },
    location: { whenInUsePermission: "…" },
  }],
],
```

- **Opt-in per capability**: the plugin requires `expo-camera/app.plugin` only when `camera`
  is set. No `require.resolve` probing; a missing module fails loudly at prebuild.
- **Default texts are placeholders.** App Store review rejects generic purpose strings; the
  README says so and the defaults are worded as development defaults.
- **Least privilege**: microphone / `RECORD_AUDIO` only with `recordAudio: true`; location adds
  no background permission. The iOS "Always" purpose strings stay (same text as when-in-use),
  as expo-location's own plugin sets them: its binary references the Always APIs and App
  Store Connect can flag a missing purpose string (ITMS-90683). They grant nothing.
- `./app.plugin.js` goes in `exports` and `files`; it uses `expo/config-plugins`, so `expo`
  becomes a peer.

## Phases

| Phase | Content                                                                                                                       | Status   |
| ----- | ----------------------------------------------------------------------------------------------------------------------------- | -------- |
| 1     | Scaffolding: workspace, export map + fallback folders, core (permission model, platform guards), ESLint boundaries, build, CI | **done** |
| 2     | Device info: adapter contract, Expo adapter, `DeviceAdaptersProvider`, hooks, mock adapter                                    | **done** |
| 3     | Location: permission, current position, watch; config plugin (location part)                                                  | **done** |
| 4     | Camera: `CameraView`, photo, video, barcode/QR; config plugin (camera part)                                                   | **done** |
| 5     | Playground: pages, camera recipe, `app.config.ts` plugin, tsconfig paths                                                      | **done** |
| 6     | Release: drop `private`, first changeset, README, `examples/consumer` smoke                                                   |          |

Device info comes first because it is the simplest capability and proves the adapter,
provider and mock pattern before location and camera build on it.

### Phase 1 — what landed

- `packages/device` with bob build, jest-expo, `validate-package` (publint + attw over every
  subpath), `"private": true` until phase 6 (see `packages/device/CLAUDE.md`).
- `src/core`: `PermissionState`, `toPermissionState()` for Expo permission responses (typed
  structurally, no native import), `combinePermissions()` for camera + microphone, platform
  guards (`isNativePlatform`, `hasDOM()`, `assertSupported()`).
- Empty `info`, `location`, `camera`, `testing` entry points.
- Root `build` script and CI's `validate-package` step include the package.

### Phase 2 — what landed

- `/info`: `useDeviceInfo()` and `expoDeviceInfoAdapter` over `expo-device` +
  `expo-application` (optional peers). The contract is synchronous: the values are constants
  the OS fixes at launch. Empty strings (expo-device on web) become `null`.
- Root: `DeviceAdaptersProvider` (nested providers inherit unset adapters).
- `/testing`: `createMockDeviceInfoAdapter()`, `MOCK_DEVICE_INFO`.
- The hook uses `useSyncExternalStore` with a server snapshot, so the static export
  prerenders "unknown" and hydrates without a mismatch (tested with `react-dom/server`).
- Known limit, documented: in Expo Go `app.*` describes Expo Go. Reading `expo-constants`
  instead would add a peer for a development-only case.

### Phase 3 — what landed

- `/location`: `useLocationPermission()` (shared per adapter, re-read on foreground, with
  `precision`), `useCurrentPosition()` (`maxAge` → last known fix first, `timeout`, `refresh()`),
  `useWatchPosition()`, `LocationError` with typed codes.
- **The hooks never prompt** and run the checks in the order a user can fix them: support →
  permission → device location services (`services-disabled`) → the read.
- **Change from the plan: the web default is our own adapter** (`webLocationAdapter` on
  `navigator.geolocation`), not expo-location's web build. Reading its source showed that it
  drops watch errors (no error callback is passed to `watchPosition`), answers
  `getCurrentPosition` with `maximumAge: Infinity` (a fix of any age as "current") and reports
  a denial as askable again. Native stays on `expoLocationAdapter`; both are exported.
- Config plugin: `app.plugin.js` with the location part, tested through Expo's mod compiler in
  introspection mode (the Info.plist and AndroidManifest a prebuild would write).
- `/testing`: `createMockLocationAdapter()`, `buildPosition()`.

### Phase 4 — what landed

- `/camera`: `CameraView` (headless: children draw over the preview), `CameraHandle` through
  its ref (`takePicture`, `recordVideo`, `stopRecording`), `useCameraPermission()` (camera,
  then the microphone only once the camera is granted; `status` is the weaker), `CameraError`
  with typed codes.
- Decisions applied: `barcodeTypes` defaults to `["qr"]`; results are cache-file URIs, base64
  only on request; `maxDuration` defaults to 60 s and `videoQuality` to `"720p"`.
- Added: the same code is reported once per `scanInterval` (default 1000 ms), because
  scanners fire on every frame; barcode types are normalised (iOS has reported UTIs such as
  `org.iso.QRCode`).
- The generic permission store moved to `src/core/permissionStore.ts`, shared by location and
  camera.
- Config plugin, camera part: camera text, `RECORD_AUDIO` only with `recordAudio: true`,
  `barcodeScanner: false` to drop the scanning libraries.
- `/testing`: `createMockCameraAdapter()`, `MOCK_PICTURE`, `MOCK_VIDEO`.

**Verified on web (expo-camera 57.0.6 source):** preview, pictures and scanning work
(`BarcodeDetector`, else the bundled `barcode-detector` polyfill); `record()` only warns and
returns `{ uri: "" }`. So the adapter reports `supportsVideo()` false on web and
`recordVideo()` rejects with `unsupported` instead of resolving an empty file.

### Phase 5 — what landed

- `/device` (overview), `/device/info`, `/device/location`, `/device/camera` in the playground,
  in the site navigation; the camera page carries the Material camera recipe (scan, photo,
  video with a timer, flash and flip as `IconButton`s over the preview).
- `app.config.ts` lists the package's plugin with the playground's purpose strings; checked
  with `expo config --type introspect` (location when-in-use, camera, microphone; Android
  COARSE/FINE, CAMERA, RECORD_AUDIO, nothing in the background).
- Verified beyond the unit tests: the static export prerenders the four pages, and in
  Chromium (Playwright, simulated geolocation and Chromium's fake camera) the exported pages
  hydrate, locate, follow the position, stream the preview and take a photo.
- Found, not caused here: every exported page of the site, the home page included, logs
  React's hydration error #418 — also with the device pages and their nav entry removed.

## Open for v2 (to discuss at the end of v1)

- A `/camera/ui` subpath with MD3 camera components (it would need `@its/glowup-ui` as a peer).
- Location: background and geofencing (`expo-task-manager`, development build), geocoding and
  reverse geocoding, heading.
- Gallery: `expo-image-picker` / `expo-media-library`.
- Device: battery, network, haptics, sensors, biometrics, orientation, keep-awake.
