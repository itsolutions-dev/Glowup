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

| #   | Question               | Decision                                                                                                                                                  |
| --- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V1  | Release order          | v0.2 network, battery, keep-awake, haptics, orientation · v0.3 biometrics (alone, B1) · v0.4 secure store (S5) · then gallery, advanced location, sensors |
| V2  | `/camera/ui`           | No. The camera recipe stays in the playground as the example to copy.                                                                                     |
| V3  | Gallery                | Both: pick (`expo-image-picker`) and save (`expo-media-library`).                                                                                         |
| V4  | Gallery permission     | `access: "all" \| "limited"` on the media permission state, as `precision` is on location's.                                                              |
| V5  | Network                | `@react-native-community/netinfo` (pinned exactly by SDK 57: `12.0.1`), for real internet reachability.                                                   |
| V6  | Biometrics             | A local gate only (`authenticate()`, `useBiometrics()`), documented as not server authentication.                                                         |
| V7  | Sensors                | Hooks with explicit `enabled` and `interval`, a conservative default, paused while the app is in the background.                                          |
| V8  | Haptics and the UI kit | `@its/glowup-ui` gets a generic `onInteractionFeedback` on `ThemeProvider`; `/haptics` ships the implementation.                                          |

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
| 9     | `/orientation` on `expo-screen-orientation`: current orientation, lock / unlock                                                             | **done** |
| 10    | `/haptics` and `@its/glowup-ui`'s `onInteractionFeedback` (V8)                                                                              | **done** |
| 11    | Playground pages, `examples/consumer`, changesets (`@its/glowup-device` minor, `@its/glowup-ui` minor), release                             | **done** |

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

### Phase 9 — what landed

- `/orientation`: `useOrientation()` (the interface orientation, live, with `isLandscape`),
  `useOrientationLock(lock, { enabled })` scoped to the component and
  `useOrientationLockSupport()`. Native on expo-screen-orientation `~57.0.2`.
- **Interface orientation only** (decided): the device's physical orientation belongs to the
  sensors (v0.5).
- **Locks are stacked**, most recent wins (`src/orientation/lockStack.ts`): a video screen
  inside a portrait-locked flow locks landscape and gives portrait back on unmount, and a screen
  replacing another never unlocks in between.
- **Unlock means "the app's own orientation".** Read in the source: expo-screen-orientation's
  `unlockAsync()` is `lockAsync(DEFAULT)`, i.e. "all but upside down" on iOS and `UNSPECIFIED`
  on Android, so a portrait-only app starts rotating after any lock is released. The adapter
  saves `getPlatformOrientationLockAsync()` before the first lock and restores it with
  `lockPlatformAsync()`; Android's landscape attribute is 0, which `lockPlatformAsync()` rejects
  as "undefined", so that one case goes through `lockAsync(LANDSCAPE_RIGHT)` (expo maps it to
  exactly that attribute). `portrait` locks `PORTRAIT_UP`: expo's `PORTRAIT` includes upside
  down on iOS, which iPhones without a home button reject, failing the whole lock.
- **Web: our own adapter.** expo-screen-orientation's web `unlockAsync()` goes through
  `lockAsync(DEFAULT)` → `screen.orientation.lock("natural")`: another lock, which also rejects
  outside fullscreen. `web.ts` reads `screen.orientation`, locks with its names (mapped as expo
  maps them, so a value means the same everywhere) and unlocks with `unlock()`. A refused lock
  is `OrientationError("unsupported")`, reported in the hook's `error` (decided).
- Checked in Chromium (Playwright, desktop and mobile emulation): `screen.orientation.lock` is
  a function in both and rejects with `NotSupportedError` outside fullscreen; `unlock()` does
  not throw. So `useOrientationLockSupport()` means "the API exists", and the lock's `error`
  is the real answer.
- `/testing`: `createMockOrientationAdapter()`.

### Phase 10 — what landed

- `@its/glowup-ui` (minor): `ThemeProvider onInteractionFeedback` and `useInteractionFeedback()`.
  `Button`, `IconButton`, `FAB`, `Toggle`, `Checkbox`, `RadioButton` / `RadioGroup`, `Chip`,
  `ToggleButtonGroup` and `Slider` (each step crossed, with a `step` only) report
  `press | toggle | selection`, before their own handler and only when the press does
  something; `feedback={false}` opts one out. The handler lives in its own context behind a
  stable function, so an inline handler re-renders no control. `longPress` is in the type for
  the app's own components: no library control has a long press yet.
- `/haptics`: `useHaptics()` (impact, notification, selection, interaction; never rejects) and
  `hapticFeedback` for `onInteractionFeedback`. Native on expo-haptics `~57.0.3`.
- Defaults (proposed and kept): iOS press / toggle → light impact, selection → selection tick,
  long press → medium impact. Android interactions through `performAndroidHapticsAsync`
  (read in the source: `View.performHapticFeedback`, which honours the touch-feedback setting,
  where expo's impacts use the `Vibrator`), with constants available on every API level.
- **Web: no haptics.** expo-haptics' web build calls `navigator.vibrate` (Android Chrome: a
  motor buzz) or, on iOS Safari, appends and clicks a hidden `<input type="checkbox" switch>`;
  the default adapter does neither, and an app can provide one that does.
- `/testing`: `createMockHapticsAdapter()`.

### Phase 11 — what landed

- Playground: one page per capability (`/device/network`, `battery`, `keep-awake`,
  `orientation`, `haptics`) and the overview's list. The keep-awake and orientation pages hold
  their lock only while focused (a page left in the stack stays mounted). The whole site is
  wired to `hapticFeedback` through its root `ThemeProvider`, with a persisted switch on the
  haptics page (decided).
- `examples/consumer` imports every new subpath and hands `hapticFeedback` to
  `ThemeProvider onInteractionFeedback`, so the two packages' published types must agree.
  Checked before release on `npm pack` tarballs of both packages: `tsc --noEmit` and
  `expo export -p web` pass. Its CI job can only pass once the versions are on npm.
- Changesets: `@its/glowup-device` minor, `@its/glowup-ui` minor.
- **Versions.** v1 was released first, as `0.1.0`; this release is `0.2.0`.

To verify per phase: netinfo on web (`navigator.onLine` and the Network Information API, which
only Chromium has) — done, phase 7; the Battery Status API (Chromium only) and the Wake Lock API
(secure context, released when the tab is hidden) — done, phase 8; screen orientation lock on
web (only mobile Chromium in fullscreen) — done, phase 9; haptics on web (a no-op by
default) — done, phase 10.

## v0.3 — biometrics

`/biometrics` on `expo-local-authentication` (V6: a local gate, not server authentication).
Its source (57.0.3) was read before the contract was written:

- The result says nothing of **how** the user got in: with the device fallback a PIN counts as
  `success`.
- **Concurrency:** Android answers a second call with `app_cancel` while a prompt is open; iOS
  starts a second `evaluatePolicy`.
- **Undeclared errors:** iOS resolves `missing_usage_description` (Face ID without a purpose
  string, biometrics only) and `unknown: <code>, <message>`, neither in the TS union. With the
  fallback, Face ID without a purpose string silently uses the passcode, and the result carries
  a `warning` even on success.
- **English defaults:** `promptMessage || "Authenticate"`, `cancelLabel || "Cancel"`: the JS
  layer always sends a cancel label, so the system's localised one is never used.
- **Android:** `cancelLabel` is shown only without the device fallback (negative button);
  `biometricsSecurityLevel` defaults to `weak`; `BIOMETRIC_STRONG | DEVICE_CREDENTIAL` is not
  supported by AndroidX on API 28–29 and `PromptInfo.Builder.build()` throws outside expo's
  try, leaving `isAuthenticating` stuck (from the AndroidX documentation; not reproduced on a
  device).
- **iOS:** Face ID's prompt takes `AppState` through `inactive`; there is no cancel API.
- **Web:** `authenticateAsync` does not exist (throws `UnavailabilityError`); the rest returns
  false / none.

| #   | Question     | Decision                                                                                              |
| --- | ------------ | ----------------------------------------------------------------------------------------------------- |
| B1  | Release      | Biometrics alone in v0.3; the gallery follows on its own.                                             |
| B2  | Result shape | A discriminated union; `authenticate()` never rejects for an outcome (a cancel is not an exception).  |
| B3  | Fallback     | `fallback: "passcode"` by default, `"none"` for biometrics only.                                      |
| B4  | App lock     | A headless `useAppLock({ relockAfter })` (phase 13): locks on `background` only, never on `inactive`. |
| B5  | Labels, web  | `promptMessage` and `cancelLabel` required (English defaults); web unsupported, no WebAuthn gate.     |

| Phase | Content                                                                                   | Status   |
| ----- | ----------------------------------------------------------------------------------------- | -------- |
| 12    | `/biometrics`: adapter, `useBiometrics()`, Expo and web adapters, mock, config plugin key | **done** |
| 13    | `useAppLock` (B4)                                                                         | **done** |
| 14    | Playground page, `examples/consumer`, changeset (`@its/glowup-device` minor), release     | **done** |

### Phase 12 — what landed

- `useBiometrics()`: the status on the live store (read on first use and on every return to
  `active`, plus pushes from an adapter's optional `subscribe`; `types` keeps its identity
  while equal, so a re-read does not re-render), `isSupported` through a `false` server
  snapshot, `isAuthenticating`, `authenticate(options)` and `cancel()`.
- **One prompt per adapter** (a session in a `WeakMap`): a call while one is open resolves
  `busy` without reaching the platform, whichever component made it.
- **Errors normalised** to `cancelled`, `fallback`, `lockout`, `not-enrolled`, `unavailable`,
  `busy`, `unsupported`, `failed`, with the platform's code in `detail`. An adapter that rejects
  becomes `failed`; `not-enrolled` and `unavailable` read the status again.
- `promptMessage` and `cancelLabel` are checked before prompting (a `TypeError`: the only
  rejection). `cancelLabel` is required in both fallback modes because iOS shows it in both;
  Android ignores it with the passcode fallback.
- **Android 9–10:** `strength: "strong"` with the passcode fallback goes out as biometrics only
  instead of building an unsupported prompt.
- **Face ID's warning** is logged once in development. The config plugin gains
  `biometrics: { faceIDPermission }` (warning when left to the default), through
  expo-local-authentication's own plugin (Android `USE_BIOMETRIC`).
- Web: `webBiometricsAdapter`, unsupported. `/testing`: `createMockBiometricsAdapter()` with
  `setStatus`, `setResult`, `calls` and a `manual` mode (`resolve()`, `cancel()`).

### Phase 13 — what landed

- `useAppLock({ enabled, relockAfter, prompt, promptOnLock, whenUnavailable })` →
  `{ isLocked, isLockable, isLoading, isAuthenticating, unlock, lock }`. Decided: one state per
  adapter shared by the tree, locked at a cold start; `relockAfter` 0 by default; no automatic
  prompt by default (`promptOnLock`, once per lock, never after a cancel); `whenUnavailable:
"unlock"` by default, with `isLockable` to say the lock protects nothing.
- Several hooks register their options; the strictest wins (enabled if any, the shortest
  `relockAfter`, `stay-locked` if any). `isLocked` is true while the status loads, so nothing
  shows behind the lock (and the static export renders locked).
- **Found in React Native's source:** Android's `AppState` reports `background` on every
  `onHostPause`, so any activity on top (the device-credential screen, a permission dialog, a
  share sheet) counts. A `background` that starts while a prompt is open is ignored: otherwise
  the unlock through the PIN screen would lock again, as Android delivers the activity result
  before resuming. Permission dialogs and share sheets do count; the README says to raise
  `relockAfter` when an app opens them.
- Out of scope: hiding content in the iOS app switcher's snapshot (taken on `inactive`, which
  Face ID's prompt also triggers).

### Phase 14 — what landed

- Playground: `/device/biometrics` (the status, a prompt with the fallback and strength options
  and its last result, and `useAppLock` guarding one card while the page is focused) and the
  overview's entry. `expo-local-authentication` is a playground dependency and its Face ID text
  is set through the package's config plugin in `app.config.ts`.
- `examples/consumer` imports `/biometrics` (`useBiometrics`, `useAppLock`) and lists the
  `biometrics` key in its plugin config. Checked on `npm pack` tarballs: `tsc --noEmit` and
  `expo export -p web` (which loads expo-local-authentication's plugin through ours) pass.
- Changeset: `@its/glowup-device` minor (`0.3.0`).

## v0.4 — secure store

`/secure-store` on `expo-secure-store` (asked for at the end of v2 as its own capability). Its
source (57.0.4) was read before the contract was written:

- **Invalidation is silent.** An item protected by biometrics reads `null` once the enrolment
  changes (Android catches `KeyPermanentlyInvalidatedException` and logs; iOS uses
  `.biometryCurrentSet`), exactly like an item never written.
- **Android, re-writing an invalidated protected item** deletes every protected item of the same
  `keychainService` (`removeAllEntriesUnderKeychainService`).
- **Protected items differ by platform:** iOS biometrics only (no passcode), a prompt to read
  and update but not to create; Android `BIOMETRIC_STRONG` only, a prompt for every operation
  including the first write, a system-localised cancel button.
- **Prompt errors:** Android throws `AuthenticationException` with an English message and no
  code; iOS throws `OSStatus` messages (`errSecUserCanceled`, `errSecInteractionNotAllowed`).
- **iOS accessibility** defaults to `WHEN_UNLOCKED`: a read while the device is locked throws.
  An existing item is written with `SecItemUpdate`, which keeps its old accessibility.
- **The iOS Keychain outlives the app**; Android's store goes with it. There is no API to list
  or clear every item.
- **Android Auto Backup:** expo's plugin excludes the store; a restored item cannot be decrypted
  (`BadPaddingException`), is deleted and reads `null`.
- **Sync APIs** (`getItem`, `setItem`) block the JS thread, prompts included. **Web:** an empty
  module, every call throws a `TypeError`. Both expo-secure-store and expo-local-authentication
  write `NSFaceIDUsageDescription`.

| #   | Question     | Decision                                                                                                        |
| --- | ------------ | --------------------------------------------------------------------------------------------------------------- |
| S1  | API          | Imperative `useSecureStore()` plus a reactive `useSecureValue(key)`, for plain items only (no prompt on mount). |
| S2  | Invalidation | Detected: a protected item is written with an unprotected marker; `null` with a marker reads `invalidated`.     |
| S3  | Errors       | Plain operations reject with `SecureStoreError`; protected ones resolve a union (a cancel is an outcome).       |
| S4  | iOS defaults | `accessible: "when-unlocked"`, `thisDeviceOnly: true` (stricter than expo, in line with Android's backups).     |
| S5  | Release      | After #65 merged, as its own PR (`0.4.0`).                                                                      |

Applied without objection: strings plus JSON helpers; web unsupported with no `localStorage`
fallback; the iOS reinstall case documented as a recipe (detecting it needs a second, non-Keychain
storage).

| Phase | Content                                                                                        | Status   |
| ----- | ---------------------------------------------------------------------------------------------- | -------- |
| 15    | `/secure-store` plain items: adapter, `useSecureStore`, `useSecureValue`, errors, mock, plugin | **done** |
| 16    | Protected items (biometrics), invalidation detection (S2, S3)                                  | **done** |
| 17    | Playground page, `examples/consumer`, changeset (`@its/glowup-device` minor), release          | **done** |

### Phase 15 — what landed

- `useSecureStore()` → `{ isSupported, get, set, remove, getJSON, setJSON }`, stable. Keys and
  values are validated before the adapter; every failure is a `SecureStoreError` (`invalid-key`,
  `invalid-value`, `locked`, `unsupported`, `failed`), `locked` matched on expo's message for
  `errSecInteractionNotAllowed`.
- `useSecureValue(key, options)`: one store per adapter, service and key (a `null` server
  snapshot for the static export, last call wins), updated by every write made through the
  package; a failed read is tried again on `active`, a successful one is not.
- The Expo adapter maps `accessible` / `thisDeviceOnly` to the Keychain constants and deletes an
  iOS item before writing it, so the accessibility asked for always applies (a crash between the
  two loses the item; documented).
- Config plugin: `secureStore: true | { faceIDPermission, androidBackupRules }`, through
  expo-secure-store's plugin (Android backup rules on by default). With `biometrics` listed,
  its Face ID text, written first, is kept.
- Web: `webSecureStoreAdapter` rejects `unsupported`. `/testing`: `createMockSecureStoreAdapter()`
  with `items`, `writes` and `failNext`.

### Phase 16 — what landed

Applied as proposed (the four phase-16 questions, accepted without changes):

- **A service per protected item** (`glowup.protected.<service>.<key>`), so Android's "re-write
  after invalidation deletes the service's protected items" cannot take other secrets along.
- **One prompt session for the package** (`core/promptSession.ts`), shared by `/biometrics` and
  the protected items: a second prompt from either resolves `busy`, `isAuthenticating` covers
  both, and `useAppLock`'s "a background a prompt caused does not count" covers both. It moved
  out of `/biometrics`, which no other capability may import.
- **Android outcomes read from expo's English messages** (`PROTECTED_MESSAGES` in the Expo
  adapter, pinned by tests on 57.0.4's strings); an unknown one stays `failed` with `detail`.
- **Methods on `useSecureStore()`:** `getProtected`, `setProtected`, `removeProtected`, resolving
  `{ status }` (`ok`, `missing`, `invalidated`, `cancelled`, `lockout`, `unavailable`, `locked`,
  `busy`, `unsupported`, `failed`); they reject only on an invalid key or value and an empty
  `prompt`.
- **Invalidation:** a plain marker beside each protected item (written after it, best effort);
  `null` with the marker reads `invalidated`. `removeProtected` deletes both, without a prompt.
- The Expo adapter writes a fresh iOS item (delete, then add: no prompt, the access control
  asked for) with `WHEN_UNLOCKED_THIS_DEVICE_ONLY`.
- `/testing`: `protectedItems`, `prompts`, `denyNext(status)`, `invalidate()`.
- **Not verified on a device:** that iOS reports an invalidated `.biometryCurrentSet` item as not
  found (Apple documents it as no longer accessible; if it surfaced as an error, the read would
  resolve `failed` rather than `invalidated`), and the Android messages themselves.

### Phase 17 — what landed

- Playground: `/device/secure-store` (a plain item read by two cards through `useSecureValue`,
  and a protected item with its last outcome) and the overview's entry. `expo-secure-store` is a
  playground dependency and `secureStore: true` is in its config plugin (Face ID text shared with
  `biometrics`).
- `examples/consumer` imports `/secure-store` and lists `secureStore` in its plugin config.
  Checked on `npm pack` tarballs: `tsc --noEmit` and `expo export -p web` pass.
- Changeset: `@its/glowup-device` minor (`0.4.0`), naming the shared prompt session's effect on
  `/biometrics`.

## v0.5 — sensors

`/sensors` on `expo-sensors` (V7). Its source (57.0.3) was read before the contract was written:

- **Units and axes differ by platform.** The accelerometer is in g with opposite signs: Android
  divides the raw value by 9.81 (lying face up, z = +1), iOS passes CoreMotion's (z = -1).
  `DeviceMotion.rotationRate` maps alpha/beta/gamma onto x/y/z on Android and z/y/x on iOS (the
  web a third way); its `interval` is ms on Android, seconds on iOS; its `orientation` is the
  interface's rotation on Android and `UIDevice.orientation` on iOS. `DeviceMotion` on Android
  is unavailable unless all five underlying sensors exist. Timestamps are seconds since boot
  (web: since the page loaded).
- **Web:** `Accelerometer` sends `deviceorientation`'s angles in radians, `Gyroscope` sends
  `accelerationIncludingGravity`; the availability probe tests `!isIOS` (the function, always
  truthy), `startObserving` does not await its permission check (an unhandled rejection), and
  `setUpdateInterval` warns on every call. `DeviceMotion.rotation` is missing.
- **Rate and battery.** The modules are singletons: `setUpdateInterval` is global per sensor
  and the last call wins. Android below 12 registers every sensor at `SENSOR_DELAY_FASTEST` and
  throttles in software whatever the interval; from 12, `SENSOR_DELAY_NORMAL` (200 ms nominal)
  unless the manifest declares `HIGH_SAMPLING_RATE_SENSORS`, then `FASTEST` again. The power
  cost is not controllable from JS: only how long a sensor stays open is. Android Int-converts
  the interval. The iOS barometer ignores it.
- **Background.** Android stops its sensors with the activity; iOS does not (CoreMotion keeps
  running while the app is alive in the background), except the pedometer.
- **Permissions.** expo-sensors' Android manifest always adds `ACTIVITY_RECOGNITION`, and its
  config plugin always adds an English `NSMotionUsageDescription` unless passed `false`. The
  iOS barometer starts CMAltimeter, which asks for Motion & Fitness on first use. iOS Safari
  sends no motion event before `DeviceMotionEvent.requestPermission()`, which must run in a
  user gesture. The iOS light sensor is a JS stub whose `addListener` returns nothing.

| #   | Question   | Decision                                                                                                               |
| --- | ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| Z1  | Scope      | Accelerometer, gyroscope, magnetometer, barometer, light (Android), device motion, physical orientation. No pedometer. |
| Z2  | Units      | Normalised: SI (m/s², rad/s, µT, hPa, lux), device axes `{ x, y, z }`, W3C/Android signs, `timestamp` in ms.           |
| Z3  | Interval   | `DEFAULT_SENSOR_INTERVAL` 200 ms (what Android 12+ guarantees without a permission); faster is opt-in.                 |
| Z4  | API        | A value hook per sensor (re-renders at its interval) and `useSensorListener` (a callback, no render) for high rates.   |
| Z5  | Background | Paused on `background`, resumed on `active`, never on `inactive` (as `useAppLock`). No opt-out.                        |
| Z6  | Heading    | Not here: the compass stays with advanced location (`watchHeadingAsync`, calibrated, true north).                      |
| Z7  | Web        | Our own adapter on `devicemotion`; magnetometer, barometer and light unavailable; iOS Safari's permission in phase 19. |

| Phase | Content                                                                                                      | Status   |
| ----- | ------------------------------------------------------------------------------------------------------------ | -------- |
| 18    | `/sensors`: shared stream, normalised Expo adapter, web adapter, five value hooks, `useSensorListener`, mock | **done** |
| 19    | `useDeviceMotion`, `useDeviceOrientation` (physical, from gravity), `useSensorPermission`, plugin key        | **done** |
| 20    | Playground page, `examples/consumer`, changeset (`@its/glowup-device` minor, `0.5.0`), release               | **done** |

### Phase 18 — what landed

- `/sensors`: `useAccelerometer`, `useGyroscope`, `useMagnetometer`, `useBarometer`,
  `useLightSensor` (`{ enabled, interval }` → `{ isAvailable, reading }`), `useSensorListener`
  (a callback, the latest one called, no re-render) and `useSensorAvailability`. An interval
  that is not a finite number ≥ 0 throws a `TypeError`.
- `src/sensors/stream.ts`: one platform subscription per adapter and sensor. It opens only once
  `isAvailable` answered true (asked once), runs at the fastest interval asked for and
  throttles each reader to its own with a 10% tolerance (Android's own throttle drops events
  against a millisecond clock), stops on `background` and reopens on `active`. It closes a
  microtask after the last reader leaves, so a new interval or a screen swapped for another in
  the same commit does not restart the sensor (a test caught the restart).
- **Expo adapter:** iOS's accelerometer inverted and both scaled to m/s² (`-0` turned into
  `0`), timestamps to ms, the interval rounded, the barometer's `relativeAltitude` `null` on
  Android, a missing subscription (iOS's light stub) tolerated, a failed availability check
  read as unavailable.
- **Web adapter:** `accelerationIncludingGravity` as the accelerometer; `rotationRate` mapped
  onto the device axes (beta → x, gamma → y, alpha → z) in rad/s; partial or null data
  skipped. Availability is a probe: true once an event carries that sensor's data, false after
  `PROBE_TIMEOUT` (1 s), so iOS Safari reads unavailable until its permission (phase 19).
- `/testing`: `createMockSensorsAdapter()` with `emit()` (the timestamp advances by the
  sensor's interval unless given), `intervals` and `isActive()`.
- Mutation checks: 39 mutations on the stream, both adapters, the hooks and the mock, all
  killed (5 survivors in the web adapter first, closed with tests).
- **Not checked on a device:** the iOS accelerometer's sign (from Apple's documented
  convention and expo's source), Safari's signs on iOS, the rates Android actually delivers
  at `SENSOR_DELAY_NORMAL`, whether a phone without a gyroscope reports the others correctly.

### Phase 19 — what landed

- **`useDeviceMotion()`**: `acceleration` (the user's, without gravity), `gravity` and
  `rotationRate`, normalised like the single sensors. From expo's source: `acceleration` keeps
  each platform's sign (iOS inverted), `accelerationIncludingGravity` is
  `accel - 2 * gravity` on Android and the inverted sum on iOS, so on both
  `acceleration - accelerationIncludingGravity` is gravity in Android's convention; the rotation
  rate's alpha/beta/gamma are x/y/z on Android and z/y/x on iOS. A reading missing a part is
  skipped (Android sends them as its sensors start). Web: W3C's `acceleration`, gravity as
  `accelerationIncludingGravity - acceleration`.
- **No attitude, a change from the plan.** expo's iOS yaw is measured from the device's x axis
  to magnetic north and Android's azimuth from its y axis (90° apart), with an arbitrary
  reference where iOS has no magnetometer; the web has none. Heading belongs to advanced
  location (Z6); tilt reads from `gravity`.
- **`useDeviceOrientation()`**: `portrait-up | portrait-down | landscape-left |
landscape-right | face-up | face-down` from the accelerometer alone (works without a
  gyroscope), named as `/orientation` names the interface orientation the app would take (the
  right edge up is `landscape-right`, as in iOS). It enters an orientation within 35° of its
  axis and keeps the previous answer between 35° and 55° and while shaken (not 0.5–1.5 g). It
  re-renders only on a change: a state updater returning the same value still renders once, so
  the last answer is kept in a ref.
- **`useSensorPermission(sensor)`** instead of a sensor-agnostic `useMotionPermission`: the
  permission gates different sensors per platform, so it says whether this sensor needs it
  (`isRequired`) and reads `granted` where it does not, without asking the platform.
  `SensorsAdapter` gains `requiresPermission`, `getPermission`, `requestPermission`; one
  permission store per adapter (`core/permissionStore`). The stream opens a gated sensor only
  once granted, never prompts, and reads the permission again on `active`.
  - **iOS:** the barometer only (CMAltimeter's Motion & Fitness, read through expo's pedometer
    requester, the same authorisation). It is read for no other sensor: expo's requester calls
    `RCTFatal` when the Info.plist lacks `NSMotionUsageDescription`.
  - **Android:** none; expo's own request asks for `ACTIVITY_RECOGNITION` and is never called.
  - **Web:** iOS Safari's `DeviceMotionEvent.requestPermission()`, called synchronously from
    `request()` down to the adapter (Safari grants only inside the gesture; a test pins it). Its
    answer cannot be read back, so the adapter remembers it for the page. Behind the prompt the
    motion sensors are assumed present (Safari runs on iPhones and iPads); elsewhere the probe
    stays.
- **Config plugin `sensors`:** `motionPermission` (text, or `false` to leave the string out:
  expo then compiles its requester out and the barometer reads `denied`), with a warning when
  left to the generic text; `ACTIVITY_RECOGNITION` removed with `tools:node="remove"`;
  `highSamplingRate: true` adds `HIGH_SAMPLING_RATE_SENSORS`. Read in
  `@expo/prebuild-config`: expo-sensors is one of the plugins prebuild applies on its own, so
  an app that does not list `sensors` still gets expo's English motion string.
- Mutation checks: 40 more mutations, all killed but one equivalent (the `-0` guard on one
  axis, the same code as the axis tested); a redundant `+ 0` in the subtraction was removed.
- **Not checked on a device:** the signs and axes of device motion on both platforms (derived
  from expo's source and the platforms' documented conventions), that CMAltimeter shares the
  pedometer's authorisation, whether desktop Safari exposes `requestPermission` (it would read
  available and deliver nothing).

### Phase 20 — what landed

- Playground: `/device/sensors` (how the device is held, a spirit level moved by
  `useSensorListener` through an `Animated.ValueXY` at 50 ms, every sensor's reading with its
  availability, device motion, an interval selector and a switch; motion access where a sensor
  is gated) and the overview's entry. `expo-sensors` is a playground dependency; its config
  plugin lists `sensors` with `highSamplingRate: true`, which the level's 50 ms needs on
  Android 12+.
- `useSensorPermission` gains `openSettings()`, as the location and camera permissions have:
  a refused iOS barometer is turned back on only in the settings. The playground's
  `DevicePermission` shows no settings button without it (the web has none).
- `examples/consumer` imports `/sensors` and lists `sensors` in its plugin config. Checked on
  `npm pack` tarballs: `tsc --noEmit` and `expo export -p web` pass, and the introspected config
  carries `NSMotionUsageDescription` and removes `ACTIVITY_RECOGNITION`.
- Static export checked in Chromium at 1440 and 390 px, without hydration errors: a desktop
  reads every sensor as missing (the probe times out); synthetic `devicemotion` events fill the
  readings, the orientation and device motion; with a stubbed `requestPermission` (iOS Safari)
  the motion access section shows, one tap calls it once and the readings start.
- Changeset: `@its/glowup-device` minor (`0.5.0`).
- **Expected red run**, as for every new subpath: between the merge and the "Version Packages"
  merge, master declares `0.4.0`, which has no `/sensors`, so the consumer smoke fails its
  type-check. It turns green with the publish.

## v0.6 — gallery

Picking photos and videos (`expo-image-picker` 57.0.20) and saving them to the device's library
(`expo-media-library` 57.0.5). Both sources were read before the contract was written:

- **Picking needs no permission.** iOS uses `PHPickerViewController` (`UIImagePickerController`
  when editing), Android the system Photo Picker (`PickVisualMedia`, with androidx's fallback on
  devices without it). image-picker's "media library" permission reads `granted` on Android 13+
  whatever happens and gates nothing on iOS.
- **One picker at a time, enforced by nobody.** iOS stores one picking context: a second
  `launchImageLibraryAsync` replaces it and the first promise never settles. Android answers a
  second call with `canceled: true` at once.
- **Android may kill the app behind the picker.** The result is kept for
  `getPendingResultAsync()`, which only a restarted app that asks receives. Picked files are
  copied into the app's cache (`file://`, images re-encoded at `quality`); deleting them is the
  app's job.
- **The picker takes an Android app to the background.** `useAppLock` would lock on the way
  back (`relockAfter` documents it).
- **Web:** a hidden `<input type="file">` clicked from JS (a user gesture is required). Video
  `duration` is in seconds (milliseconds on native), `selectionLimit` is ignored, and a browser
  without the input's `cancel` event leaves the promise pending and the input in the DOM.
- **Saving.** In SDK 57 `expo-media-library`'s default entry is the object API (`Asset.create`);
  in a browser it throws at import (`requireNativeModule('ExpoMediaLibraryNext')`), so a subpath
  importing it would break every web page that loads it. Only `expo-media-library/legacy` has a
  web stub. `Asset.create(file)` keeps the original file; on iOS it needs the add-only
  permission granted beforehand and never prompts. Android 10+ saves without a permission.
  Named albums need full library access on iOS.
- **Config.** prebuild applies both modules' plugins even when unlisted. image-picker's adds
  `RECORD_AUDIO` and English camera, microphone and photo-library strings; its Android manifest
  declares `CAMERA` and the storage permissions. media-library's plugin always adds
  `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO`, `READ_MEDIA_AUDIO` and the storage permissions, which
  Google Play refuses to apps that only pick or save.

| #   | Question   | Decision                                                                                                                                                                                               |
| --- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| G1  | Scope      | Pick and save. No library browsing (its `all` / `limited` access and Play's media policy come with it), no albums, no camera capture.                                                                  |
| G2  | Subpaths   | `/media-picker` (`expo-image-picker`) and `/media-library` (`expo-media-library`): an app that only picks installs one module.                                                                         |
| G3  | Pick API   | `pick(options)` resolves every outcome (`picked`, `cancelled`, `busy`, `unsupported`, `failed`); invalid options reject.                                                                               |
| G4  | Save API   | `save(uri)` may prompt (always a user's action) and resolves `saved`, `denied`, `unsupported` or `failed`.                                                                                             |
| G5  | Web        | Our own picker adapter on `<input type="file">` (ms durations, `limit` applied, a new pick settles the old one); no save on web.                                                                       |
| G6  | Web import | media-library's object API behind a `.native.ts` / `.web.ts` split, so the web never loads it.                                                                                                         |
| G7  | Plugin     | `mediaPicker`, `mediaLibrary`: Android permissions the app does not use removed (`CAMERA`, `RECORD_AUDIO` unless `/camera` needs them; `READ_MEDIA_*`); iOS keeps expo's purpose strings (ITMS-90683). |
| G8  | App lock   | A system sheet the package opens (the picker) is marked in core; `useAppLock` ignores a background that starts while one is open.                                                                      |

| Phase | Content                                                                                                                       | Status   |
| ----- | ----------------------------------------------------------------------------------------------------------------------------- | -------- |
| 21    | `/media-picker`: Expo and web adapters, `useMediaPicker`, one pick at a time, pending result, app lock (G8), mock, plugin key | **done** |
| 22    | `/media-library`: save, its permission, the platform split (G6), mock, plugin key                                             | **done** |
| 23    | Playground pages, `examples/consumer`, changeset (`@its/glowup-device` minor, `0.6.0`), release                               | planned  |

### Phase 21 — what landed

- `/media-picker`: `useMediaPicker()` → `{ isSupported, isPicking, pick, getPendingResult }`.
  `pick(options)` checks `mediaTypes`, `multiple` + `limit`, `edit` + `aspect`, `quality` and
  `exif` (a `TypeError` before anything opens) and resolves `picked`, `cancelled`, `busy`,
  `unsupported` or `failed`. Assets are normalised: `type`, sizes, `mimeType`, `fileName`,
  `fileSize`, `duration` in ms, `assetId`, `exif`, and the web's `File`.
- **`edit` with `exif` is refused.** Read in the source: on iOS the editing path reads EXIF from
  the photo library (`PHAsset.fetchAssets(withALAssetURLs:)`), which prompts for full library
  access just for that.
- Expo adapter: one picking context, so a second pick answers `busy`; `orderedSelection` with
  `multiple`; `shouldDownloadFromNetwork: true`; Android's `getPendingResultAsync()` mapped,
  error results included.
- Web adapter on a file input: clicked synchronously, `accept` and `multiple` from the request,
  files of another type skipped, `limit` applied, sizes from an `Image` / `<video>`, durations
  in ms; `cancel` or an empty choice is `cancelled`, and a new pick settles an unanswered one as
  `cancelled` (no timer guessing when a dialog closed).
- **G8:** `core/systemSheet.ts`; `useAppLock` ignores a background that starts while the picker
  is open. Tested end to end with both mocks.
- **Config plugin `mediaPicker`:** removes `CAMERA` (expo-image-picker's manifest) and
  `RECORD_AUDIO` (its plugin) unless `camera` needs them; capability functions now receive
  every option. **A change from the proposal:** iOS keeps expo's photo library, camera and
  microphone purpose strings, since its binary references those APIs (ITMS-90683), as the
  location plugin keeps the "Always" strings.
- `/testing`: `createMockMediaPickerAdapter()` (`respondWith`, `holdNext` / `close`,
  `setPending`, `requests`) and `buildPickedMedia()`.
- Mutation checks: 59 mutations; four survivors closed (a list-like `mediaTypes` and the error's
  prefix, a rejecting `getPendingResult`, the reported type against the MIME type) and one
  equivalent guard removed from the web adapter (settling twice changes nothing).

### Phase 22 — what landed

- `/media-library`: `useMediaLibrary()` → the save permission (`status`, `canAskAgain`,
  `isRequired`, `isLoading`, `request`, `refresh`, `openSettings`), `isSupported` and
  `save(uri)`, which refreshes the permission, asks only while `canAskAgain` and resolves
  `saved` (with the library's `assetId`), `denied`, `unsupported` or `failed`. A missing URI
  rejects with a `TypeError`.
- **Android's permission, read in the source (closes a "to verify"):** below Android 11 the
  object API uses `AssetLegacyFactory`, which copies the file into shared storage and requires
  `WRITE_EXTERNAL_STORAGE` granted (and a `file://` URI); from 11 `AssetModernFactory` writes
  through MediaStore with no permission check and accepts `content://` too. expo's write-only
  request still asks for `WRITE_EXTERNAL_STORAGE` up to Android 12, so the adapter does not call
  it from 11: there the permission reads `granted`, `isRequired: false`.
- **G6:** `expo.ts` imports the object API; `expo.web.ts` stands in for it in a web bundle (a type
  import of `./expo` only, checked in the built `lib`). bob emits both, with their `.d.ts`.
- **Config plugin `mediaLibrary`:** `savePermission` (warned when left generic: the save prompt
  shows it, and iOS crashes on that prompt without one); expo's plugin called with no granular
  permissions and no media location, then `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO`,
  `READ_MEDIA_AUDIO`, `READ_MEDIA_VISUAL_USER_SELECTED` and `ACCESS_MEDIA_LOCATION` removed.
  `WRITE_EXTERNAL_STORAGE` stays for Android 10 and earlier; iOS keeps expo's full-library string
  (ITMS-90683).
- `/testing`: `createMockMediaLibraryAdapter()` (`gated`, `permission`, `requestAnswer`,
  `setPermission`, `permissionRequests`, `saved`, `failNext`).
- Mutation checks: 33 mutations; three survivors closed (`isRequired` where saving is
  unsupported, no permission read where none is needed, no prompt for a permission reported
  granted) and one equivalent kept: `granularPermissions: []` in the plugin, since the removals
  cover the same permissions whatever order the mods run in.

**To verify on a device:** whether `PickMultipleVisualMedia(limit)` throws above the system's
maximum; whether `UIImagePickerController` (editing) works without
`NSPhotoLibraryUsageDescription`; what `shouldDownloadFromNetwork` changes for an iCloud-only
photo.

## Open for later

- **Advanced location:** background and geofencing, geocoding (and which web provider),
  heading (`watchHeadingAsync`, Z6) — to be decided before it starts.
- **Library browsing:** assets and albums, with the `all` / `limited` access and Google Play's
  photo and video permissions policy.
