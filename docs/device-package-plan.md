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
| 6     | Release: drop `private`, first changeset, README, `examples/consumer` smoke                                                   | **done** |

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
- Found, not caused here: every exported page of the site, the home page included, logged
  React's hydration error #418 — also with the device pages and their nav entry removed.
  Fixed separately in #61 (window size, icon font, current time, `Grid`; see
  `apps/playground/CLAUDE.md`, "Hydration").

### Phase 6 — what landed

- `"private"` removed; `.changeset/glowup-device-initial.md` ships the first release as
  `0.1.0` (minor from `0.0.0`) when the "Version Packages" PR is merged.
- README rewritten for npm (install, entry points and their exports, absolute links).
- `examples/consumer` installs `@its/glowup-device` from the registry too: `Device.tsx` imports
  every subpath with its published types, and `app.json` lists the config plugin.
  `consumer-smoke.yml` pins, waits for and checks both packages. Rehearsed locally on
  `npm pack` tarballs outside the workspace: install, `tsc --noEmit`, `expo export -p web`
  and the introspected native config all pass.
- **Before the first publish**: npm trusted publishing is configured per package, so
  `@its/glowup-device` needs its own trusted publisher on npmjs.com (see `release.yml`).
- **Expected red run**: between the merge of this work and the merge of the "Version
  Packages" PR, master declares `@its/glowup-device@0.0.0`, which is not on the registry, so
  the consumer smoke fails after its wait. It turns green with the publish.

## v2 decisions

| #   | Question               | Decision                                                                                                             |
| --- | ---------------------- | -------------------------------------------------------------------------------------------------------------------- |
| V1  | Release order          | v0.2 network, battery, keep-awake, haptics, orientation · v0.3 gallery, biometrics · v0.4 advanced location, sensors |
| V2  | `/camera/ui`           | No. The camera recipe stays in the playground as the example to copy.                                                |
| V3  | Gallery                | Both: pick (`expo-image-picker`) and save (`expo-media-library`).                                                    |
| V4  | Gallery permission     | `access: "all" \| "limited"` on the media permission state, as `precision` is on location's.                         |
| V5  | Network                | `@react-native-community/netinfo` (pinned exactly by SDK 57: `12.0.1`), for real internet reachability.              |
| V6  | Biometrics             | A local gate only (`authenticate()`, `useBiometrics()`), documented as not server authentication.                    |
| V7  | Sensors                | Hooks with explicit `enabled` and `interval`, a conservative default, paused while the app is in the background.     |
| V8  | Haptics and the UI kit | `@its/glowup-ui` gets a generic `onInteractionFeedback` on `ThemeProvider`; `/haptics` ships the implementation.     |

### V8 — haptics without coupling the packages

- **`@its/glowup-ui` (minor).** `ThemeProvider` takes
  `onInteractionFeedback?: (kind: "press" | "toggle" | "selection" | "longPress") => void`.
  `Button`, `IconButton`, `FAB`, `Toggle`, `Checkbox`, `RadioButton`, `Chip`,
  `ToggleButtonGroup` and `Slider` (per step) call it; a `feedback={false}` prop opts a single
  component out. The library knows no native module and imports nothing from `device`.
- **`@its/glowup-device/haptics`.** `useHaptics()` (impact, notification, selection) and a
  ready-made `hapticFeedback` that maps the four kinds onto `expo-haptics`.
- **The app wires them:** `<ThemeProvider onInteractionFeedback={hapticFeedback}>`. Nothing
  vibrates until it does.

## v0.2 phases

Each phase is one commit with its tests, docs and `/testing` adapter; the release phase adds
the playground pages and the changesets. Every web behaviour below is to be checked against the
module's source before its contract is written, as phases 3 and 4 did.

| Phase | Content                                                                                                                                     | Status   |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| 7     | `/network` on netinfo: `useNetwork()` (connected, internet reachable, type), the shared "live value" store with a server snapshot           | **done** |
| 8     | `/battery` (level, charging state, low-power mode) and `/keep-awake` (`useKeepAwake`, imperative activate / deactivate), on phase 7's store | **done** |
| 9     | `/orientation` on `expo-screen-orientation`: current orientation, lock / unlock                                                             |          |
| 10    | `/haptics` and `@its/glowup-ui`'s `onInteractionFeedback` (V8)                                                                              |          |
| 11    | Playground pages, `examples/consumer`, changesets (`@its/glowup-device` minor, `@its/glowup-ui` minor), release                             |          |

### Phase 7 — what landed

- `/network`: `useNetwork()` (connected, internet reachable, type, metered, cellular
  generation; every unknown is `null`, never `false`) and `useIsOnline()`.
- `src/core/liveStore.ts`: one platform subscription shared by every hook, opened by the first
  listener and closed by the last, shallow-equal updates skipped, a `null` server snapshot for
  the static export. Battery and keep-awake (phase 8) build on it.
- Native on netinfo `12.0.1` (the exact pin of SDK 57; optional peer).
- **Web: our own adapter, not netinfo's web build.** Its source shows the reachability check
  is `HEAD /` on the page's origin every minute (every 5 s after a failure), with anything but
  a 200 counted as offline: an app served under a subpath can read as offline while online, and
  the polling is traffic nobody asked for. The web adapter reads `navigator.onLine`, the
  `online` / `offline` events and the Network Information API, and reports
  `isInternetReachable: null` while online.
- `/testing`: `createMockNetworkAdapter()`, `MOCK_NETWORK`, `OFFLINE_NETWORK`.

### Phase 8 — what landed

- `/battery`: `useBattery()` (`isAvailable`, `level` 0–1, `charging`, `lowPowerMode`; unknowns
  are `null`) on phase 7's live store. Native on expo-battery `~57.0.3`, whose three events
  (level, state, power mode) the adapter merges into one status; an event that beats the first
  read is kept, not overwritten by the older read.
- **Web battery: our own adapter.** expo-battery's web build has no `addListener`, so its
  change listeners throw in a browser, and it answers `false` for Low Power Mode where nothing
  can be known. `web.ts` reads `navigator.getBattery()` (Chromium only) and reports
  `lowPowerMode: null`.
- `/keep-awake`: `useKeepAwake({ enabled })` holds one tag per mounted hook;
  `useKeepAwakeSupport()` reads support with a `false` server snapshot. "Imperative activate /
  deactivate" is `enabled` in React and the exported adapters outside it: a module-level
  function could not see `DeviceAdaptersProvider`, so tests would be back to mocking Expo.
  Native on expo-keep-awake `~57.0.2`.
- **Web keep-awake: our own adapter.** expo-keep-awake's web build (1) never re-acquires the
  wake lock the browser releases when the tab is hidden, so the screen sleeps after a tab
  switch while the hook is mounted, and (2) throws on a deactivation that beats the pending
  request, after which the request lands and its lock is never released. `web.ts` re-acquires
  on `visibilitychange`, keeps one request in flight per tag and releases a lock granted after
  its deactivation.
- `/testing`: `createMockBatteryAdapter()` + `MOCK_BATTERY`, `createMockKeepAwakeAdapter()`.

To verify per phase: netinfo on web (`navigator.onLine` and the Network Information API, which
only Chromium has) — done, phase 7; the Battery Status API (Chromium only) and the Wake Lock API
(secure context, released when the tab is hidden) — done, phase 8; screen orientation lock on web (often only in fullscreen);
haptics on web (no-op, or `navigator.vibrate` on Android Chrome).

## Open for later

- **Advanced location (v0.4):** background and geofencing, geocoding (and which web
  provider), heading — to be decided before v0.4.
- **Secure store:** a separate capability binding secrets to biometrics (`expo-secure-store`)
  — to propose at the end of v2.
