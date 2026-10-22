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
| 23    | Playground pages, `examples/consumer`, changeset (`@its/glowup-device` minor, `0.6.0`), release                               | **done** |

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

### Phase 23 — what landed

- Playground: `/device/media-picker` (media types, several at once with a limit of three, crop,
  the outcome and a card per picked item; the pending result shown at mount) and
  `/device/media-library` (the save permission, then a photo chosen through the picker and saved
  back). Both are linked from the overview and the nav. `expo-image-picker` and
  `expo-media-library` are playground dependencies, with `mediaPicker` and `mediaLibrary` in its
  config plugin.
- `examples/consumer` imports `/media-picker` and `/media-library` and lists both plugin keys.
- Changeset: `@its/glowup-device` minor (`0.6.0`).
- **G6 checked in a real web bundle:** the static export has no `ExpoMediaLibraryNext` anywhere,
  and neither does the consumer's `expo export -p web` on the packed tarball (the tarball ships
  `expo.web` in `src` and `lib`; Metro reads `src` through the subpath's `react-native` field).
  That field was a defect, found after phase 37: the root resolved to `lib/commonjs`, so `core/`
  was bundled twice (see "After phase 37").
- Chromium at 1440 and 390 px, without errors: a real file chooser opens synchronously from the
  press with the right `accept` and `multiple`; one PNG, then two PNGs and a `.txt` (skipped),
  come back with their sizes; no input is left in the page. The library page reads unsupported
  with the save button disabled.
- Consumer smoke on `npm pack` tarballs: `tsc --noEmit`, `expo export -p web`, and an
  introspected config with the add-only string and `RECORD_AUDIO`, `READ_MEDIA_*` and
  `ACCESS_MEDIA_LOCATION` removed (`CAMERA` kept for `/camera`).
- Found on the way, outside this work: `@its/glowup-ui`'s `ListItem` without `onPress` puts
  `aria-disabled` on its whole row, so a `Toggle` in `trailing` is exposed as disabled.
- **Expected red run**, as for every new subpath: until the "Version Packages" merge, master
  declares `0.5.0`, which has neither subpath, so the consumer smoke fails its type-check.

**To verify on a device:** whether `PickMultipleVisualMedia(limit)` throws above the system's
maximum; whether `UIImagePickerController` (editing) works without
`NSPhotoLibraryUsageDescription`; what `shouldDownloadFromNetwork` changes for an iCloud-only
photo.

## v0.7 / v0.8 — advanced location

Heading and geocoding (`expo-location` 57.0.21), then background updates and geofencing
(`expo-task-manager` 57.0.20). The sources were read before the contract was written:

- **Heading.** Android keeps one native heading watch (`mHeadingId`): a second
  `watchHeadingAsync` takes the events away from the first. iOS opens one `CLLocationManager`
  per watch. Both need the foreground location permission: iOS throws, Android silently never
  emits. `trueHeading` is `-1` without the permission, and on Android until a fix arrives (the
  declination comes from a location). `accuracy` is 0–3. Android reports the azimuth of the
  device's top edge (no remapping for the display's rotation) and only when it moves by about 2°.
  Without a magnetometer iOS sends an error event, while Android never emits (its
  `getHeadingAsync` then waits forever). Removing a watch after the permission was revoked
  rejects inside expo's subscriber, unhandled (Android kills an app whose permission is revoked,
  so it is only reachable on iOS, where `removeWatchAsync` does not throw). The web build warns
  and emits nothing.
- **Geocoding.** iOS (`CLGeocoder`) needs no permission, is rate-limited by Apple, reads "no
  result" as `[]` and a network failure as an error. Android (`Geocoder`) requires the
  foreground permission (expo's check, not the platform's), uses the deprecated synchronous
  API with one result, leaves an `IOException` uncaught, answers "Geocoder is not running" while
  the app is in the background, and has no geocoder without Google Play services. The web
  returns `[]`, indistinguishable from "not found".
- **Background and geofencing.** Both run through `expo-task-manager`: a task is defined at
  module scope with `defineTask` and runs without React (headless on Android, relaunched on
  iOS). Android background updates either run as a foreground service with a notification
  (foreground permission only, started while the app is open) or with
  `ACCESS_BACKGROUND_LOCATION`, which Google Play accepts only with a declaration. iOS needs
  When-in-use plus the `location` background mode; Always for relaunches. Geofencing needs the
  background permission on both, with at most 20 regions on iOS (more fail silently) and 100 on
  Android. expo-task-manager's plugin always adds `UIBackgroundModes: fetch`, applied by
  prebuild even when unlisted. Expo Go has no background on Android.

| #   | Question           | Decision                                                                                                                            |
| --- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| L1  | Subpaths           | Heading and geocoding in `/location` (no new peer); background and geofencing in `/background-location` (`expo-task-manager`).      |
| L2  | Heading            | `useHeading({ enabled })`: magnetic, true (`null`, never `-1`), accuracy as a label; one shared native watch, paused in background. |
| L3  | Geocoding          | `useGeocoder()`: `geocode` / `reverseGeocode`, normalised addresses, `LocationError` codes; "not found" is an empty list.           |
| L4  | Geocoding provider | None bundled: the adapter is replaceable for an app's own provider; the default answers `unsupported` on the web.                   |
| L5  | Background         | `defineLocationTask` at module scope plus `useBackgroundLocation(name)`; Android defaults to the foreground service.                |
| L6  | Geofencing         | `defineGeofenceTask` plus `useGeofencing(name)`; region counts above the platform's limit are refused up front.                     |
| L7  | Background consent | `useBackgroundLocationPermission()`, separate, asked only after the foreground one (Android 11+ sends the user to settings).        |
| L8  | Plugin             | `backgroundLocation: { mode, geofencing }` adds only that mode's permissions and removes task-manager's `fetch` mode.               |
| L9  | Web                | Heading, background and geofencing unsupported; geocoding only through an adapter the app supplies.                                 |

| Phase | Content                                                                                | Release | Status |
| ----- | -------------------------------------------------------------------------------------- | ------- | ------ |
| 24    | Heading in `/location`: shared watch, normalisation, mock                              | `0.7.0` | done   |
| 25    | Geocoding in `/location`: replaceable adapter, normalised errors, mock                 | `0.7.0` | done   |
| 26    | Playground, `examples/consumer`, changeset, release                                    | `0.7.0` | done   |
| 27    | `/background-location`: tasks, background updates, background permission, plugin, mock | `0.8.0` | done   |
| 28    | Geofencing                                                                             | `0.8.0` | done   |
| 29    | Playground, `examples/consumer`, changeset, release                                    | `0.8.0` | done   |

### Phase 24 — what landed

- `useHeading({ enabled })` in `/location`: `magneticHeading` and `trueHeading` normalised to
  0 up to 360, `trueHeading` `null` for expo's `-1`, accuracy 3/2/1/0 as
  `high`/`medium`/`low`/`unreliable`. `watchHeading` is an optional method of
  `LocationAdapter`: the Expo adapter has it on native only, so the web (and any custom adapter
  without it) reads `unsupported`.
- `heading.ts` keeps one stream per adapter: one native watch for every reader, stopped on
  `background` (not `inactive`) and reopened on return, the last reading handed to a reader that
  joins (never one from before a pause or a failure). A failure stops the watch and reaches every
  reader; only a new subscription reopens it. It closes with the last reader, without the
  sensors' microtask: a reader subscribes after an asynchronous permission read, so the grace
  period would never have kept the watch open for it.
- The hook checks support and the permission (never a prompt), not the services.
- `/testing`: `emitHeading`, `failHeading` (the watches stay open, as on the platform),
  `headingWatches`, `headingWatchesOpened`, `buildHeading`, and `heading: false` for an adapter
  without a compass. The mock assigns `watchHeading` after building the object: Babel's object
  spread copied the counters' getters as values.
- **Departs from L2:** an Android device without a magnetometer cannot be detected through
  expo-location (it never emits), so `heading` stays `null` there instead of an
  `isAvailable: false`. Documented on the hook and in the README.
- Mutation-tested by hand: every mutant in `heading.ts` and in the Expo adapter's heading code
  is killed.

**To verify on a device:** the time to the first reading on iOS and Android; `trueHeading`
turning from `null` to a number on Android once a fix arrives.

### Phase 25 — what landed

- `useGeocoder()` in `/location`: `geocode(address, { timeout })` and
  `reverseGeocode(point, { timeout })`, `isSupported` through `useSyncExternalStore` (`null`
  while a static page renders). Nothing found resolves `[]`; failures reject with a
  `LocationError`; an empty address throws a `TypeError`, a point off the globe a `TypeError` or
  `RangeError`, before the adapter. The timeout (15 s by default, as `useCurrentPosition`)
  rejects with `timeout`; the native request runs on, its answer dropped.
- **Its own adapter key, `geocoder`** (`GeocoderAdapter`), rather than methods on
  `LocationAdapter`: an app that brings its own provider swaps only that, and keeps expo's
  positions. Any error such an adapter throws that is not a `LocationError` reads `unavailable`.
- `expoGeocoderAdapter` (exported, to fall back to on native): unsupported on the web (expo's
  web build answers `[]`, indistinguishable from "not found"); iOS placemarks without a location
  are dropped; Android's accuracy of 0 (a point it never measured, altitude 0 likewise) becomes
  `null` and the altitude is left out; blank strings become `null`. Native codes:
  `ERR_LOCATION_UNAUTHORIZED` → `permission-denied` (Android), `ERR_NO_GEOCODE` →
  `unsupported` (no Google Play services), `ERR_GEOCODE` ("Geocoder is not running", the app in
  the background), `ERR_GEOCODING_NETWORK` (iOS: offline and throttled alike) and anything else
  → `unavailable`. No new `LocationErrorCode`: iOS cannot tell a rate limit from a lost
  network, so a `rate-limited` code would promise what it cannot keep.
- No permission check in the hook: iOS needs none, a custom provider needs none, and Android's
  own refusal maps to `permission-denied`.
- `/testing`: `createMockGeocoderAdapter({ supported })` with `setGeocode` /
  `setReverseGeocode` (results, an error code, a `LocationError` or `"pending"`), the calls it
  received, `buildGeocodedLocation`, `buildGeocodedAddress`.
- Mutation-tested by hand: every mutant in `geocoder.ts` and in the Expo adapter's geocoding is
  killed.

**To verify on a device:** what Android's `IOException` (offline) reaches JS as (expo rejects
with `ERR_UNEXPECTED`, read as `unavailable`); whether iOS returns more than one place for an
ambiguous address.

### Phase 26 — what landed

- Playground: `/device/location` gains a **Compass** section (start and stop, a needle turned
  back by the magnetic heading, magnetic and true north with the cardinal point, the accuracy
  with a calibration hint) and a **Geocoding** section (an address to coordinates, and "What is
  here?", which reads a position and reverse-geocodes it). The web says up front that it has no
  compass or geocoder. Three new page tests run on the mock adapters.
- `examples/consumer` calls `useHeading` and `useGeocoder` and annotates `HeadingAccuracy` and
  `GeocodedAddress`, so the published `.d.ts` must carry them.
- Changeset: `@its/glowup-device` minor (`0.7.0`).
- Consumer smoke on `npm pack` tarballs: `tsc --noEmit` and `expo export -p web` pass.
- Chromium at 1440 and 390 px on the static export, without errors or horizontal scroll: both
  sections read unsupported on the web.
- **Expected red run**, as for every release that adds API: until the "Version Packages" merge,
  master's consumer smoke installs `0.6.0`, which has neither hook, and fails its type-check.

### Phase 27 — what landed

Sources read beyond the plan's notes (`expo-location` 57.0.20, `expo-task-manager` 57.0.21):
iOS's `startLocationUpdatesAsync` checks the services, the foreground permission and the
`location` background mode (`ERR_LOCATION_UPDATES_UNAVAILABLE` without it); its consumer sets
`pausesLocationUpdatesAutomatically` to **true** unless told otherwise, though expo's docs say
false. Android's checks the foreground permission, the background one when there is no
foreground service (`ERR_LOCATION_BACKGROUND_UNAUTHORIZED`), that a foreground service starts
from the foreground (`ERR_FOREGROUND_SERVICE_START_NOT_ALLOWED`) and its manifest permissions
(`ERR_FOREGROUND_SERVICE_PERMISSIONS`); `unregisterTask` throws `TaskNotFoundException` for a
task that is not running. iOS sends a CoreLocation failure to the task as the `NSError`'s
numeric code; Android sends positions only. iOS's background permission reads `undetermined`
for "While Using" until it is asked in this launch (expo keeps `_wasAsked` in memory), then
`denied`. Prebuild applies task-manager's plugin by itself after the app's plugins, and
Info.plist mods run in reverse order of registration.

- `/background-location` (`expo-location` + `expo-task-manager`, the latter a new optional
  peer): `defineLocationTask(name, handler)`, `useBackgroundLocation(name)` (`start`, `stop`,
  `isRunning`, `isSupported`, `refresh`) and `useBackgroundLocationPermission()` (L5, L7).
- **Shared code moved to core:** `GeoPosition` and the other position types, the location
  permission state, `LocationError` and the expo converters now live in `core/geo.ts`; `/location`
  re-exports them unchanged. `DEVICE_CAPABILITIES` lists `expo-location` for both subpaths, and
  the lint rule now forbids a module only to the capabilities that do not list it.
- **`foregroundService` is required** (an object, or `false` for background updates with the
  background permission), so the Android choice is visible at every call; the plugin's
  `backgroundLocation.mode` matches it.
- The hook checks support, the task's definition, the foreground permission and the services;
  the Android-only checks stay in expo's native code, mapped by `toStartError` (a build without
  the setup reads `unsupported`, with how to fix it). No new `LocationErrorCode`.
- The background request runs inside `systemSheet`, so Android 11+'s trip to the settings page
  does not lock the app (`useAppLock`); it asks nothing until the foreground permission is
  granted.
- Plugin: `backgroundLocation: { mode, alwaysPermission }`, through `withLocation` (one call to
  expo-location's run-once plugin); iOS's `location` background mode and Always strings, Android's
  permissions of that mode only; task-manager's `fetch` removed unless the app declares it or uses
  expo-background-fetch / expo-background-task, with a warning when expo-task-manager is listed
  before the package (its mod would run last).
- `/testing`: `createMockBackgroundLocationAdapter()` with `deliver()` / `deliverError()`, which
  run the handler `defineLocationTask` registered, `stopBySystem()`, `failNextStart()` and
  `running`.
- Mutation-tested by hand: every mutant in the hooks, options, tasks, the Expo adapter, the mock
  and the plugin key is killed but one equivalent (an early return that only skips a
  notification `useSyncExternalStore` would drop anyway).

**To verify on a device:** a relaunch on iOS after the app was terminated (Always granted);
Android's headless delivery after the app was swiped away with `stopWithApp: false`; whether
batching (`batchInterval`) delivers on time while the device sleeps; Android 11+'s settings
page and the app lock.

### Phase 28 — what landed

Sources read beyond the plan's notes: iOS's `startGeofencingAsync` checks the background
permission ("Always") and the `location` background mode; Android's checks the background
permission, and so does its `hasStartedGeofencingAsync`, which throws without it. iOS's consumer
reads the enter flag as `notifyOnEntry` while expo's type and Android say `notifyOnEnter`, and it
reports each region's determined state (`didDetermineState`) without looking at the flags: once
when monitoring starts (an `exit` for every region the device is outside of) and again later.
Android adds its geofences with `INITIAL_TRIGGER_ENTER | INITIAL_TRIGGER_EXIT`, so both report
the starting state. A region without `identifier` gets a random UUID on both. Android reports
failures as a message alone (`"Geofencing not available."` when location is off, `"Too many
geofences."`); iOS as the `NSError`'s code. Android's region record keeps `identifier`,
`notifyOnEnter` and `notifyOnExit`, so the task's options read them back.

- `defineGeofenceTask(name, handler)` and `useGeofencing(name)` (`start(regions)`, `stop`,
  `isRunning`, `isSupported`, `limit`) in `/background-location` (L6). One task registry for both
  kinds: a name holds one, and defining it as the other kind throws.
- Regions need a unique `id` and are checked before anything starts (`TypeError`), with a
  `RangeError` above the platform's limit (20 on iOS, 100 on Android, `adapter.geofenceLimit`).
  `start()` needs the foreground permission, the services and the background permission.
- The Expo adapter sends `notifyOnEntry` beside `notifyOnEnter`, and the task drops a transition
  its region turned off, read back from the task's options (`getTaskOptionsAsync`), which outlive
  the app. The starting state is documented, not hidden: it is the region's state, and the app
  may need it.
- Plugin: `backgroundLocation.geofencing: true` adds `ACCESS_BACKGROUND_LOCATION` in any mode;
  the new `mode: "none"` configures geofencing alone (no foreground-service permissions), and
  without `geofencing` it is refused.
- `/testing`: the mock watches regions (`geofences`, `geofenceLimit`), and `deliverGeofence()` /
  `deliverGeofenceError()` run the handler; `stopBySystem()` stops both kinds.
- Mutation-tested by hand: every mutant is killed but two equivalent ones (the kind check inside
  `runLocationTask` / `runGeofenceTask`, unreachable because a name holds one kind).

**To verify on a device:** the starting events on both platforms; how late a transition arrives
with the screen off; iOS dropping a disabled `exit` through the task's options; Android after a
reboot (expo-task-manager re-registers the geofences, not verified here).

### Phase 29 — what landed

- Playground: `/device/background-location` (both permissions, recording through the
  foreground service, a 150 m circle watched around the current position, and the log of what
  the tasks received), linked from the overview. The tasks live in `site/backgroundTasks.ts`,
  imported by the playground's own entry file before `expo-router/entry`: a task defined in a
  route or in `_layout` would be missing when Android runs it headless, and expo unregisters a
  task it cannot find. The README says the same for apps on Expo Router. `expo-task-manager` is
  a playground dependency, with `backgroundLocation` (foreground service, geofencing) in its
  config plugin.
- Found on the way: the Expo adapter read `LocationActivityType` at module scope, so a test that
  mocks expo-location partially (the playground's did) failed at import. The enums are now read
  when the options are converted.
- `examples/consumer` defines both kinds of task, calls the three hooks and annotates
  `GeofenceRegion` and `LocationTaskEvent`, and lists `backgroundLocation` in its plugin.
- Changeset: `@its/glowup-device` minor (`0.8.0`).
- Consumer smoke on `npm pack` tarballs: `tsc --noEmit`, `expo export -p web`, and
  `expo config --type introspect`, which applies prebuild's own plugins too: `UIBackgroundModes`
  is `["location"]` (task-manager's `fetch` removed), with `ACCESS_BACKGROUND_LOCATION`,
  `FOREGROUND_SERVICE` and `FOREGROUND_SERVICE_LOCATION` on Android.
- Chromium at 1440 and 390 px on the static export, without errors or horizontal scroll: the page
  reads unsupported on the web.
- **Expected red run**, as for every release that adds a subpath: until the "Version Packages"
  merge, master's consumer smoke installs `0.7.0`, which has no `/background-location`.

## v0.9 — Bluetooth

Bluetooth Low Energy with the phone as **central** (GATT client): scan, connect, read, write and
notifications. It is the one Bluetooth standard every platform the package targets opens to apps,
and the one that sensors, wearables, scales, badge readers and industrial gateways speak today
(serial data over BLE is, in practice, the Nordic UART Service: one write and one notify
characteristic, usable through plain GATT). Expo has no Bluetooth module, so the native side is a
third-party library. `react-native-ble-manager` 12.5.3 and `react-native-ble-plx` 3.5.1 were
read before the contract was written:

- **No Expo Go.** Both need a development build. `react-native-ble-manager` throws at import
  when its native module is missing (its module-level `new BleManager()` throws
  `BleManagerModule not found`), so the subpath must load it lazily or Expo Go and the web would
  crash on import.
- **ble-manager** is a TurboModule (`codegenConfig`; from RN 0.76 it supports the New
  Architecture only), published September 2026, with its own Expo plugin (`neverForLocation`,
  `companionDeviceEnabled`). Android serialises GATT operations in a per-peripheral command
  queue (`Peripheral.java`), as the platform requires. It has bonding, MTU, connection priority,
  companion devices and iOS state restoration; data travels as `number[]`. It has **no
  advertising API** (no peripheral role).
- **ble-plx** is a legacy bridge module (no codegen), its compatibility table stops at RN 0.74 /
  Expo 51, last published February 2026. On RN 0.86 it would run only through the interop layer,
  untested here. Observable API, no bonding, central only.
- **iOS permission.** The prompt appears when the central manager is created (ble-manager's
  `start()`), and there is no read before that: `checkState()` answers only once a manager
  exists (before `start()` its callback is never called). So the permission cannot be read on
  iOS without the risk of a prompt: it reads `undetermined` until the app asks, and asking again
  after an answer shows nothing and returns the state at once. `NSBluetoothAlwaysUsageDescription`
  is required.
- **Android permissions.** ble-manager requests none at runtime. Android 12+ needs
  `BLUETOOTH_SCAN` and `BLUETOOTH_CONNECT` (with `neverForLocation`, no location; some beacons
  are then filtered out of scans); Android 11 and earlier need `ACCESS_FINE_LOCATION`, and scans
  return nothing while the location services are off. React Native's `PermissionsAndroid` can
  ask for them with no new dependency, but tells "blocked" (`never_ask_again`) only from a
  request, never from a check.
- **State.** ble-manager reports `on`, `off`, `unauthorized`, `unsupported`, and on iOS
  `unknown` and `resetting`. Only Android can ask the user to switch Bluetooth on
  (`enableBluetooth()`, a system dialog); iOS can only show its own power alert.
- **Known platform behaviour, not verified here:** Android silently returns no results to an
  app that starts more than about five scans in 30 seconds; a device's id is a per-app UUID on
  iOS and its MAC address on Android, portable on neither; iOS reports SIG-assigned UUIDs in their
  short form (`180D`), Android in full 128-bit form.
- **Web Bluetooth** exists on Chromium only (not Safari, not Firefox) and only as
  `requestDevice()`, a browser chooser opened from a user gesture: no free scan, so it would need
  a different API from the native one.

| #   | Question     | Decision                                                                                                                                                                                                                 |
| --- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| B1  | Scope        | BLE central: scan, connect, GATT read / write / notify. No Bluetooth Classic (iOS opens it to MFi hardware only), no peripheral role (advertising), no Bluetooth Mesh.                                                   |
| B2  | Subpath      | `/bluetooth`, on `react-native-ble-manager` (an optional peer), loaded lazily so a missing native module reads `unsupported` instead of throwing.                                                                        |
| B3  | Data         | Values are `Uint8Array`; UUIDs come out lowercase 128-bit and go in short or long. Errors are `BluetoothError`: `unsupported`, `permission-denied`, `powered-off`, `timeout`, `not-connected`, `disconnected`, `failed`. |
| B4  | Permission   | `useBluetoothPermission()` reports the usual `PermissionState`; iOS reads `undetermined` until a request (see above), Android learns `canAskAgain: false` from a request.                                                |
| B5  | Connections  | Explicit `connect()` / `disconnect()`, kept in one store per adapter so every component on a peripheral shares the connection; `disconnectOnUnmount` as an option. Notifications are shared and counted per reader.      |
| B6  | Scan         | Filtered by service, deduplicated with the latest RSSI and advertising data (manufacturer data included, for beacons), stopped in the background, guarded against Android's throttling.                                  |
| B7  | SIG profiles | Parsers for Device Information (`0x180A`) and Battery (`0x180F`) only; other profiles when a real device needs them.                                                                                                     |
| B8  | Plugin       | `bluetooth: { permission, neverForLocation }` in the package's plugin; `neverForLocation` defaults to `true` and must be `false` for beacon-based presence.                                                              |
| B9  | Web          | Unsupported in the first release.                                                                                                                                                                                        |
| B10 | Background   | Not in the first release (connections kept alive, iOS state restoration, background scanning).                                                                                                                           |

| Phase | Content                                                                                                                                                                                      | Release | Status |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ------ |
| 30    | `/bluetooth` core: types, errors, the lazy ble-manager adapter, `useBluetoothState`, `useBluetoothPermission`, plugin key, mock                                                              | `0.9.0` | done   |
| 31    | Scanning: `useBluetoothScan`, service filter, dedupe, advertising data, timeout, background pause, throttling guard                                                                          | `0.9.0` | done   |
| 32    | Connections and GATT: connection store, discovery, read, write with and without response, shared notifications, unexpected disconnects, MTU, bonding; Device Information and Battery parsers | `0.9.0` | done   |
| 33    | Playground (the mock in Expo Go and on the web, the real module in a development build), `examples/consumer`, changeset, release                                                             | `0.9.0` | done   |

### Phase 30 — what landed

- **`@its/glowup-device/bluetooth`** on `react-native-ble-manager` 12.5 (an optional peer, the
  first that is not an Expo module): `useBluetoothState`, `useBluetoothPermission`,
  `BluetoothError` / `isBluetoothError`, `toBluetoothUuid` / `shortBluetoothUuid`,
  `bleManagerAdapter` and `createBleManagerAdapter({ neverForLocation })`.
- **Lazy module.** The adapter requires ble-manager on first use, inside a `try`, and never on
  the web: Expo Go, the web and jest read `unsupported` instead of crashing at import.
- **One `start()` per process**, after `isStarted()`: ble-manager builds a new central manager
  on every iOS `start()`. iOS starts only from `requestPermission()` (building the manager is
  the prompt), so before a request in the launch it reads `undetermined` and the radio
  `unknown`; the request waits for the first settled state (`unauthorized` → `denied`, anything
  else known → `granted`), at most a minute. Android starts on the first state subscription,
  which prompts nothing and is what makes its state events flow. The iOS power alert is off.
- **Android permissions** through `PermissionsAndroid`: "Nearby devices" from API 31 (plus the
  precise location with `neverForLocation: false`), the precise location up to API 30. A check
  cannot tell "never ask again", so a request's refusal is kept for the launch. Requests and
  `enable()` (Android's "turn on Bluetooth?" dialog, which needs the permission) run inside
  `systemSheet`, so `useAppLock` does not count the trip.
- **Read from the source, not on a device:** Android's `scan()` returns without calling back
  while the radio is off (phase 31 checks the state first); Android's `checkState()` answers
  before `start()`, iOS's never does; `enableBluetooth()` rejects with "User refused to enable".
- **Plugin key `bluetooth: { permission, neverForLocation }`** through ble-manager's plugin,
  `neverForLocation` defaulting to `true`. It is registered before `location`: manifest mods
  run in reverse order, and the other way round ble-manager would add a second
  `ACCESS_FINE_LOCATION` capped at API 30 next to expo-location's (a test pins it).
- **`/testing`:** `createMockBluetoothAdapter()`.
- **Not verified on a device:** whether iOS's first state after the prompt arrives as described;
  whether Android's `getState()` needs `BLUETOOTH_CONNECT` (the docs say no).

### Phase 31 — what landed

- **`useBluetoothScan()`**: `start({ services, timeout })`, `stop()`, `clear()`, `devices`,
  `isScanning`, `error`. One scan per adapter (the platform has one): a start replaces it, every
  component shares the list, the last one leaving stops it.
- **Checks first, never prompts:** `start()` validates its options (`TypeError` / `RangeError`)
  and runs `ensureBluetoothReady` (support, permission, radio `on`) before the adapter.
- **Dedupe and rendering:** one entry per `id` with the latest RSSI and advertisement,
  `firstSeen` / `lastSeen`, a repeat without a name keeping the known one; the list renders at
  most every 250 ms. The adapter scans with `allowDuplicates` (otherwise iOS reports a device
  once and its RSSI never updates) and Android's low-latency mode.
- **Advertising data** (`BluetoothAdvertisement`): local name, service UUIDs (normalised),
  service data, manufacturer data as `{ companyId, data }`, transmit power, connectable. From
  the source: ble-manager keeps one manufacturer entry on both platforms, keyed by the company
  id in hex, and passes Android's missing transmit power as `Integer.MIN_VALUE`.
- **Lifecycle:** the timeout is the store's own timer, so a scan pauses on `background` and
  resumes on `active` for the time it had left; the radio going `off` (or iOS's
  `unauthorized`) ends it with an error.
- **Android's throttling:** starts are counted and a sixth within 30 s waits until it is
  allowed (`throttle.ts`, 0.5 s margin). `scan()` without a callback in 5 s (Android's, with the
  radio off) rejects with `timeout`. Android's `ScanCallback` failures arrive as `onStopScan`
  statuses and map to `failed` (4, no LE scanning, to `unsupported`).
- **`/testing`:** `discover()`, `failScan()`, `failNextScan()`, `scanning`, `scanCount`, and
  `buildBluetoothDevice()`.
- **Not verified on a device:** the throttling limit and its margin, iOS's duplicate reports in
  the foreground, Android 11's silence with the location services off.

### Phase 32 — what landed

- **`useBluetoothDevice(id, { disconnectOnUnmount })`**: `connect({ timeout })`, `disconnect()`,
  `status`, `error`, `services`, `read`, `write`, `requestMtu`, `mtu`, `readRssi`, `bond` /
  `canBond`. One connection per device id, shared by every component; it closes when the last
  one unmounts unless that one set `disconnectOnUnmount: false`.
- **`useBluetoothNotifications(id, service, characteristic, onValue, { enabled })`**: counted per
  characteristic, on once connected and again after each reconnection, off with the last reader;
  the latest callback is called; one reader throwing does not keep the others from the value.
- **Timeouts**: connecting 10 s by default (iOS never gives up; a timeout disconnects to cancel
  the attempt), every GATT call 10 s (the platform's request is not cancelled).
- **Unexpected disconnects** read `disconnected` with that error; no automatic reconnection.
- **Writes** default to with-response when the characteristic allows it, without otherwise. A
  value longer than one write is split by ble-manager into writes of MTU − 3 bytes: the adapter
  passes Android's negotiated MTU (20 bytes until `requestMtu`) or iOS's
  `maximumWriteValueLength`. A characteristic that needs one long value must fit in one write.
- **Read from the source:** ble-manager rejects GATT calls with strings (mapped by wording to
  `disconnected` / `not-connected` / `failed`) and iOS's failed connections with
  `{ code, domain, message }`; it serialises Android's GATT commands per peripheral; its Android
  `startNotification` also turns indications on. SIG UUIDs go to it short, since iOS builds
  `CBUUID`s from the strings.
- **Profiles (B7):** `readDeviceInformation`, `readBatteryLevel` / `parseBatteryLevel`, the SIG
  and Nordic UART UUIDs (`BLUETOOTH_SERVICES`, `BLUETOOTH_CHARACTERISTICS`), `encodeUtf8` /
  `decodeUtf8`.
- **`/testing`:** GATT on the mock (`gatt`, `setGatt`, `notify`, `disconnectBySystem`,
  `holdNextConnect`, `failNextConnect`, `failNextGatt`, `connected`, `notifying`, `writes`,
  `bonded`).
- **Not verified on a device:** everything GATT. In particular iOS's `CBUUID` matching with short
  UUIDs, Android's behaviour on a connection that times out natively (status 133), and bonding.

### Phase 33 — what landed

- **Playground `/device/bluetooth`**: permission and radio, a scan (all, or heart rate only), the
  device list, a connection with its services, battery and Device Information reads, live heart
  rate notifications and a Nordic UART exchange. Where `bleManagerAdapter.isSupported()` is
  false (the web, Expo Go) the page wraps itself in a provider with `site/bluetoothDemo.ts`: the
  package's mock driven by a timer, with three simulated devices. The same answer while
  prerendering and in the browser, so it hydrates.
- **`examples/consumer`** imports `/bluetooth` (state, permission, scan, device, notifications)
  and lists the plugin's `bluetooth` key. On the `npm pack` tarballs: `tsc`, the web export and
  `expo config --type introspect` pass; with `location` beside it the manifest declares the
  location permissions once, uncapped, and `BLUETOOTH_SCAN` with `neverForLocation`.
- **Changeset** `0.9.0` (minor).
- ble-manager's plugin also adds the legacy `BLUETOOTH` and `BLUETOOTH_ADMIN` without
  `maxSdkVersion`: harmless normal permissions, left as they are.
- **To verify on a device:** everything in phases 30–32 marked so, on an iPhone and on Android
  12+ and 11, with a real peripheral (a heart rate strap, a Nordic UART board).

**Before choosing hardware:** a "Bluetooth" time clock can work three ways. The phone connects to
it over GATT (covered), or the clock broadcasts a beacon the phone detects (covered, with
`neverForLocation: false`; detection in the background is B10), or the phone broadcasts and the
clock detects it (the peripheral role, not covered: another library). Ask the vendor which, and
for the GATT UUIDs.

## v0.10 — RFID

UHF RFID through handheld readers, **vendor-neutral by contract**. Three things to do:

- **Multiple scan:** every tag in range, each with how near it is.
- **Single search:** find a given tag by its proximity.
- **Single read:** read the one tag in front of the reader for its id.

The first vendor is Honeywell (IH40 paired over Bluetooth with a CT40, RFID SDK **v1.1.0**). Zebra
or others may follow without the app's code changing. The library has no UI.

### The architecture (ADR-R1)

The contract and the vendors live in separate packages: the app depends on the contract, and each
vendor implements it.

- **`@its/glowup-device/rfid`** is the contract and the engine. It has:
  - the `RfidAdapter` interface;
  - the types, with units fixed by the contract;
  - `RfidError`;
  - the hooks;
  - the shared engine: one mode at a time, deduplication, RSSI smoothing and proximity, the
    single read and the locate emulated where a vendor lacks them, timeouts.

  It has no native code and no default adapter. Without one, everything reads `unsupported`.

- **`@its/rfid-honeywell`** (later `@its/rfid-zebra`, …) is a vendor package: an Android-only Expo
  module (Kotlin) around the vendor's SDK, a JS adapter that implements `RfidAdapter`, and its
  config plugin. It takes the contract's types through `import type` and `RfidError` at run
  time, with `@its/glowup-device` as a peer.
- **The app** picks the vendor in one place,
  `<DeviceAdaptersProvider adapters={{ rfid: getHoneywellRfidAdapter() }}>` (one build per vendor,
  R13). Screens use only `/rfid`'s hooks, so changing vendor changes that line and the installed
  package, nothing else.

Rejected alternatives:

- **One package with every vendor:** every app would bundle every SDK, with their licences.
- **Vendor packages with their own hooks:** no common API, so switching vendor rewrites the
  screens.
- **A separate `@its/rfid` contract package:** another package to version for no gain. The
  device package already has the adapter and provider model, and its testing kit.

How it stays honest:

- **Thin adapter.** The adapter implements only primitives: connect, inventory start / stop, and
  the settings. The rest are optional methods (native locate, native single read, trigger,
  discovery, battery, reader info) plus `supportsTid`, and `capabilities` are read from which
  methods exist rather than declared, so an adapter cannot claim what it lacks. The engine emulates what a vendor lacks (locate = inventory
  filtered by EPC plus the engine's proximity; single read = a short inventory window keeping the
  strongest tag), so a new vendor costs only its primitives.
- **Units are the contract's.** RSSI is dBm, transmit power is dBm, times are ms epoch, EPC and
  TID are uppercase hex. Each adapter converts (Honeywell's power 500–3000 is centi-dBm). The
  engine computes proximity (0–1) from smoothed RSSI, between near / far bounds. The adapter
  supplies default bounds and the app may calibrate them. Metres are never promised: RSSI follows
  distance only roughly.
- **Contract version.** `/rfid` exports `RFID_CONTRACT_VERSION`; each adapter declares the version
  it implements, as a number literal (importing the constant would always match). The hooks reject a mismatch with `RfidError("incompatible-adapter")`, and the
  vendor package's peer range follows the device package's minor version (0.x): it is written as
  `>=0.x.0 <0.y.0`, whose bounds changesets moves whenever the device package passes them.
- **Conformance kit.** `@its/glowup-device/testing` exports `describeRfidAdapterContract()`: a Jest
  suite that every vendor package runs against its adapter with its native module faked. It checks
  units, event order, stop semantics, errors and capabilities. A vendor that does not pass cannot
  ship.

### Honeywell SDK v1.1.0 (read from the AAR with `javap` and from its Javadoc)

- **Transport: BLE GATT.** `connect(mac)` goes through `getRemoteDevice(mac).connectGatt()` on a
  proprietary service (`e093f3b5-00a3-a9e5-9eca-40016e0edc24`).
  - No scan is needed to connect, so `BLUETOOTH_CONNECT` is enough from Android 12.
  - The SDK exposes no reader search. Discovery is therefore the Honeywell module's own BLE scan
    (a contract capability), not `/bluetooth`.
  - The protocol inside is proprietary (Silion / ThingMagic, native `libModuleAPIJni.so`).
- **AAR facts:**
  - `minSdkVersion` 26.
  - An embedded bound `RfidService`: no Honeywell app needs to be installed.
  - The manifest declares only the legacy `BLUETOOTH` / `BLUETOOTH_ADMIN`.
  - Native code for `arm64-v8a` (64 KB-aligned: Android 15's 16 KB pages are fine) and 32-bit ARM.
    There is no x86, so no emulator: JS tests run on the mock and the faked module.
  - No code checks the device's brand.
- **How the three modes map:**
  - **Multiple scan:** `read()` + `OnTagReadListener.onTagRead(TagReadData[])`, in batches on an
    SDK thread. `TagReadData` gives the EPC, RSSI, antenna, read count, frequency and time.
  - **Single read:** `syncRead(windowMs)`, then the strongest tag. With a TID, a `read()` window
    instead: `syncRead` takes no `TagReadOption`, so it cannot ask for the TID's data (phase 35).
  - **Single search:** native Tag Finder. `setLocateEPC(epc)` + `read()`; the SDK then passes on
    only that tag, `EventListener.onReceivedFindingTag(rssi / readCount)` gives the value, and the
    reader beeps faster as the tag nears. The EPC is matched with `String.equals`, so case matters.
    `setLocateEPC("")` stops it.
- **Trigger:** `onRfidTriggered(pressed)` only in `TriggerMode.RFID`. In `BARCODE` mode the trigger
  drives the host's own scanner.
- **Reader:**
  - `setAutoReconnect`, `readerAvailable()` (false while reconnecting);
  - `getBatteryLevel()` (a `String`: polled, no event);
  - beeper volume, LED;
  - antenna power, Gen2 session S0–S3, Q, target, region, versions and serial number.
- **Read in phase 35 (`javap -c`):**
  - `RfidManager.create()` binds `new Intent(context, RfidService.class)`: the service embedded in
    the AAR, inside the app. **No Honeywell app is needed.**
  - `SecurityGuard` is a challenge-response that authenticates the **reader** (SHA-1 over a salt);
    it does not check the host's brand.
  - EPCs come out of `bytes_Hexstr()` with `toUpperCase()`: uppercase.
  - RSSI: the Bluetooth path's tag info stores it as a signed `byte`, so -128…127, which reads as
    dBm. The hardware confirms the range.
  - Some of `TagReadData`'s constructors build the time from `0`. The module keeps a guard (a
    time before 2001 becomes the arrival time), but the IH40's reads carry real times (measured).
  - While locating, `onTagRead` receives only the searched tag (or an empty array), with its full
    RSSI; `onReceivedFindingTag` gets `rssi / readCount` (integer division). The module sends the
    RSSI and keeps the SDK's value for the diagnostics.
  - `getBatteryLevel()` is `String.valueOf(byte)` of a characteristic, `""` on failure.
  - Antenna power passes through to the reader's `AntPower` unchanged (centi-dBm).
  - The SDK uses `androidx.localbroadcastmanager` without declaring it.
  - It also needs Honeywell's Data Collection SDK (`com.honeywell.aidc`), which it neither bundles
    nor declares. `RfidService.init` builds `com.usb.UsbCommunication` → `UsbPortManager`, which
    calls `AidcManager`, on every bind. Without `DataCollection.aar` the app dies with
    `NoClassDefFoundError` even over Bluetooth (seen on the CT40, phase 35). Honeywell's sample
    app ships it in `app/libs` beside the RFID AAR (1.97.00.0060); the CT40 has no shared library
    for it.
  - Its internal search (`Comm_Bluetooth.StartSearch`) has no name or service filter, and is not
    public.
- **Measured on a CT40 (Android 11) + IH40, phase 35 spike (first report, 16 October):**
  - The development build works once the app also supplies `DataCollection.aar` (above).
  - Connection: `onDeviceConnected` 135 ms after `connect()`, then `onReaderCreated(true)` about
    **2 s** later (what the old MES app's fixed 2 s delay stood in for). The module waits for the
    event.
  - RSSI in dBm: −25 / −23 with the tag against the reader, −45 / −52 at a short distance, −71 the
    weakest heard. The adapter's default bounds moved from −35 / −75 to **−30 / −70**.
  - EPCs uppercase; tag times real; `readCount` always 1 (the SDK reports every read on its own,
    so the module's 100 ms batches matter: up to 8 reads each).
  - Locate: about one read every 120–300 ms; `onReceivedFindingTag` equals the read's RSSI (117
    samples), as `readCount` is 1.
  - A new SDK thread for every read session (`Thread-10`, `-14`, …); the module's lock covers it.
  - `syncRead`: 500 ms found 0, 5 and 7 tags; 2 s found 6.
  - Battery `"46"`; the trigger reached the app (six presses and releases).
  - The IH40 answers `getSN()` with `"Not Support!"`: the adapter reads it as no serial number.
- **Second report (16 October):**
  - **The search works with the reader disconnected.** The IH40 advertises the name `IH40` and
    manufacturer data under company id 1318 (0x0526), no service UUID; connected, it does not
    advertise at all. The filter matched it by name; it now also matches the company id.
  - The trigger drove the multiple scan (about 30 presses, reads after each).
  - Reconnecting by hand after a disconnect: `onReaderCreated` again 2.2 s after
    `onDeviceConnected`.
  - Every inventory starts a new SDK thread; reads may carry the time of a previous session's
    last read (an SDK buffer), harmless to the merge.
- **Third report (16 October):**
  - **The SDK's auto-reconnect does not work:** after the IH40 was switched off and on, nothing
    happened for 61 s, while a connection by hand worked in 2 s. Its daemon (a 3 s retry, created
    in `onReaderCreated` when auto-reconnect is on) made no attempt. The module now turns it off
    and reconnects itself (1, 3, 5, then every 10 s; an attempt without a reader in 15 s is
    closed and retried).
  - **TIDs did not arrive:** `additionData` stayed empty. The SDK's own `read()` sets `data` and
    `protocol` in its `TagReadOption`; the module's did not. It does now.
  - The reader beeps faster during a locate started through the module.
  - Handed back, the trigger drives the CT40's own scanner again.
- **Fourth report (16 October):**
  - **The module's reconnection works:** the IH40 switched off and on while connected, the first
    `reconnectAttempt` 1 s after the drop, `onDeviceConnected` 4.3 s and `onReaderCreated(true)`
    6.5 s after it.
  - **TIDs arrive in the multiple scan:** every read's `additionData` holds 12 bytes (for
    example `E28068942000401007656433`).
  - **No TID in the single read:** the diagnostics' single read never asked for one. Asking would
    not have been enough either: `syncRead(TID_BANK, ms)` builds the TID read plan but takes no
    `TagReadOption`, so the `data` flag the multiple scan needed is never set. With a TID the
    module now reads for the window with `read(TID_BANK, option)` and collects the reads itself;
    without one it keeps `syncRead`. The diagnostics' single read has a "Read the TID" toggle.
- **Fifth report (16 October):** the build carried the read window (each single read's
  diagnostic names its path), but all five single reads reached the module without a TID asked
  (`path: "syncRead"`): the "Read the TID" toggle was off. The JavaScript passes the option
  through (a test now covers it). The buttons now name the TID when it is on, the measurements
  show each single read's path and TID count, and the module reports a revision
  (`getRevision`, `HONEYWELL_NATIVE_REVISION`) so the diagnostics flag an app built before the
  latest native change, which a Metro reload does not update.
- **Sixth report (16 October): the single read returns the TID.** With "Read the TID" on, six
  single reads took the read window (`path: "read"`): 2 s gave 50 reads, 45 with a TID; 500 ms gave
  11–15, 10–13 with a TID. About one read in ten arrives with an empty `additionData`, in the
  multiple scan too; the engine merges a tag's reads, so its TID comes from the others. Six tags,
  each with one stable TID (two TID families: `E2806894…` and `E2801130…`). A `syncRead` without
  the TID, for comparison: 8 reads. The locate gave 36 values between −60 and −49 dBm.
- **Not verifiable here:** whether Honeywell's Maven repository (`repo.honeywellaidc.com`) serves
  the SDK; the build environment's proxy refuses that host, so `aarPath` stays required.

### The licence

Honeywell's Software Developer License Agreement, as received (an extract, not the full text
accepted at download; worth keeping that one too):

- **Grant (§1):** limited, personal, non-exclusive, non-transferable and royalty-free, for internal
  business purposes: designing, developing, testing and validating proprietary applications.
- **Hardware binding (§2):** applications that embed or link `honeywell_rfid_sdk` must run only on
  Honeywell hardware (IH40 / IH45 readers and compatible mobile computers).
- **Restrictions (§3):** no sublicensing, sale, rental or commercial distribution of the SDK as a
  standalone component; no modifying, decompiling or disassembling the AAR beyond what the law
  allows.
- **No runtime licence (§4):** no per-seat or per-transaction fees, no activation ids; accepting
  the terms covers including the binary in the distributed application.

What follows from it:

- **The AAR travels only inside the app's build** (§1, §3, §4). It never goes into a published
  package, public or not.
  - The `@its/rfid-honeywell` config plugin takes the app's own copy (`aarPath`), copies it into
    the Android project and declares Android 12's Bluetooth permissions.
  - The module compiles against it with `compileOnly`.
  - If Honeywell's Maven repository serves it, Gradle downloads it instead.
- **One build per vendor** (§2). An app that embedded both Honeywell's SDK and another vendor's
  would carry Honeywell's SDK onto other brands' devices. Each fleet gets its own build with its
  own vendor package; the screens, written against `/rfid`, are the same in every build.
  `firstSupportedRfidAdapter()` stays for a build that ships several adapters on one brand's
  devices.
- **The Honeywell adapter reads `unsupported` off Honeywell hosts:** `isSupported()` checks
  `Build.MANUFACTURER`, so the SDK is never initialised on another brand's device.
- **Decompiling** (§3): part of the section above was read from the AAR's bytecode (`javap -c`),
  which §3 forbids beyond what the law allows. The details are kept in this plan by decision.

### Decisions

| #   | Question     | Decision                                                                                                                                                                                                                                                 |
| --- | ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Architecture | Contract and engine in `@its/glowup-device/rfid`; one package per vendor (`@its/rfid-honeywell` first) implementing `RfidAdapter`; the app chooses through the provider (ADR-R1 above).                                                                  |
| R2  | Modes        | One at a time per reader. `inventory` (deduplicated by EPC, sorted by proximity), `readSingle` (native or emulated window, the strongest tag or `null`), `locate(epc)` (native Tag Finder or emulated).                                                  |
| R3  | Data         | `RfidTag`: `epc`, `tid` when asked, `rssi` (dBm), `proximity` (0–1), `antenna`, `readCount`, `firstSeen` / `lastSeen`.                                                                                                                                   |
| R4  | Distance     | Relative proximity from smoothed RSSI, calibratable bounds, never metres; the raw RSSI stays available.                                                                                                                                                  |
| R5  | Connection   | One reader at a time: `connect(address)` resolves when the reader is ready (Honeywell: `createReader()` on every `onDeviceConnected`, `onReaderCreated(true)`, no fixed delay); auto-reconnect; `reconnecting` while it runs; open until `disconnect()`. |
| R6  | Discovery    | In scope (each CT40 picks from a pool of readers): `startDiscovery()` as a capability; Honeywell's through its own native scan, filtered to what looks like a reader.                                                                                    |
| R7  | Trigger      | A capability: a hook puts the reader in RFID trigger mode while mounted, restores it after, and exposes the presses.                                                                                                                                     |
| R8  | Settings     | Transmit power (dBm), Gen2 session, beeper volume; the region read-only (setting it wrongly is unlawful).                                                                                                                                                |
| R9  | Platforms    | Android only for Honeywell; the contract has no platform, and iOS and the web read `unsupported` until a vendor supports them.                                                                                                                           |
| R10 | Events       | The vendor module batches tag reads (at most every 100 ms) before they reach JavaScript, and runs the SDK's blocking calls off the main thread.                                                                                                          |
| R11 | Distribution | The AAR travels only inside the app's build (the plugin's `aarPath`), never in a published package (the licence, §1 and §3).                                                                                                                             |
| R12 | Out for now  | Writing, locking and killing tags; USB / serial sleds; firmware updates; GS1 decoding of the EPC (a later helper).                                                                                                                                       |
| R13 | Builds       | One build per vendor (the licence, §2); the Honeywell adapter reads `unsupported` off Honeywell hosts (`Build.MANUFACTURER`).                                                                                                                            |

| Phase | Content                                                                                                                                                                                                                                                               | Release  | Status |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ------ |
| 34    | The contract in `@its/glowup-device/rfid`: `RfidAdapter` and capabilities, units, `RfidError`, `RFID_CONTRACT_VERSION`, the engine (modes, dedupe, proximity, emulated single read and locate), the hooks, `createMockRfidAdapter()`, `describeRfidAdapterContract()` | `0.11.0` | done   |
| 35    | `packages/rfid-honeywell` skeleton and spike: Expo module (Android), the plugin wiring the app's AAR, connect / inventory / locate / trigger, a diagnostics screen in a development build; the team runs it on a CT40 + IH40 and the readings fill the list above     | —        | done   |
| 36    | `@its/rfid-honeywell` complete: the adapter passing the conformance kit, unit conversion, batching, threading, reconnection, discovery, errors; the new package's publishing (changesets, trusted publisher)                                                          | `0.1.0`  | done   |
| 37    | Playground page (a simulated reader everywhere; Honeywell stays in `apps/rfid-diagnostics`), `examples/consumer`, changesets, release; the team's check on the real IH40                                                                                              | `0.11.0` | done   |

**Answered:**

- **The three modes:** multiple scan with proximity, single search, single read for the id. The
  Honeywell SDK supports all three natively.
- **Architecture:** the contract in `@its/glowup-device/rfid`, vendors in `@its/rfid-*`.
- **SDK:** Honeywell RFID SDK v1.1.0 only. The host is a CT40 and the link is BLE.
- **No UI** in the library: hooks and the adapter API only.
- **The licence:** use is royalty-free with no runtime licence; the AAR stays inside the app's
  build (R11) and each vendor gets its own build (R13).

- **Choosing a reader:** each CT40 picks from a pool of IH40s, so the search (R6) is in scope.
- **The CT40 runs Android 11:** connecting needs no runtime permission there, but a search needs
  the precise location (and location switched on); the plugin declares it capped at Android 11.
- **Release:** `@its/glowup-device` shipped Bluetooth as `0.10.0`, so `/rfid` ships as `0.11.0`.
  `@its/rfid-honeywell`'s peer range is `>=0.10.0 <0.12.0` in the workspace (whose device
  package is still `0.10.0`); the "Version Packages" PR rewrites it to `>=0.11.0 <0.12.0` (phase
  37).

**Still open:** whether Honeywell's Maven repository serves the SDK (above); the spike's other
questions are answered.

### Phase 34 — what landed

- **`@its/glowup-device/rfid`**, no native code and no default adapter (`unsupportedRfidAdapter`
  rejects everything with `unsupported`). Lint lists it in `DEVICE_CAPABILITIES` with no module.
- **The contract** (`types.ts`): `RfidAdapter` with its required primitives (permission,
  connection, inventory, settings) and its optional methods (`readOnce`, `startLocate` /
  `stopLocate`, `subscribeTrigger`, `startDiscovery` / `stopDiscovery`, `getBatteryLevel`,
  `getReaderInfo`); `RFID_CONTRACT_VERSION = 1`; `RfidTagRead` as the adapter reports a read and
  `RfidTag` as the hooks expose it; `RfidSettings` (power in dBm, session 0–3, beeper volume, the
  region read-only). `getRfidCapabilities()` reads `native` / `emulated` from the methods;
  `firstSupportedRfidAdapter()` picks among vendors at run time.
- **`RfidError`** with eight codes: `unsupported`, `incompatible-adapter`, `permission-denied`,
  `not-connected`, `disconnected`, `timeout`, `cancelled`, `failed`.
- **The engine** (`engine.ts`), one per adapter:
  - readiness: supported → contract version → permission → connected; never prompts;
  - the connection outlives the components; `connect()` times out after 20 s and closes the
    attempt; the latest failure stays in `useRfidReader().error`;
  - one mode at a time: the last start wins, a new mode starts only after the previous one
    stopped on the reader, and the running one ends in the background and when the link leaves
    `connected` (`disconnected`);
  - settings checked before they reach the reader (`RangeError` outside `powerRange`).
- **The hooks:**
  - `useRfidPermission`, `useRfidReader`;
  - `useRfidInventory`: merged by EPC, RSSI smoothed (EMA 0.3), proximity between the bounds,
    nearest first or first seen, rendered at most every 250 ms, `forgetAfter`, `duration`;
  - `useRfidSingleRead`: native `readOnce` or a 500 ms inventory, the strongest tag or `null`;
  - `useRfidLocate`: native tag finder or a filtered inventory, out of range after 2 s of silence;
  - `useRfidTrigger` (press / release handlers; pairs with any mode);
  - `useRfidReaderDiscovery`.
- **Testing:** `createMockRfidAdapter()` (every optional part switchable) and
  `describeRfidAdapterContract({ describe, it }, setup)`: 13 checks on units, connection states,
  stop semantics, errors and the optional parts. It runs on the mock with every part and with
  none, and its own tests prove it fails adapters that keep vendor units, report after a stop,
  or resolve `connect()` early.
- **Decided on the way:**
  - The trigger is a hook of its own rather than an option of each mode: one way to pair it with
    any mode, and nothing to keep in sync.
  - A mode ends (rather than pauses) in the background: a handheld returning to the app expects
    to press the trigger again.
  - `read()` hands back its promise before the reader starts, so a read replaced during a
    native window rejects at once, not when the window ends.
- **Not yet:** no vendor and no playground page; the units the Honeywell module must convert from
  (RSSI, the locate value) wait for the spike in phase 35.

### Phase 35 — what landed

- **`packages/rfid-honeywell`** (`@its/rfid-honeywell`, private): an Android-only Expo module, its
  adapter and its config plugin.
  - **Kotlin** (`HoneywellRfidModule.kt`): binds the SDK's service, connects (and reconnects by
    itself) and is `connected` after `onReaderCreated(true)`; inventory (`read`, with `TID_BANK` on
    request), single read (`syncRead`, or a `read` window for a TID), locate (`setLocateEPC` +
    `read`, the value from the filtered reads), trigger hand-over (`TriggerMode.RFID`, then
    `BARCODE` again: revision 3, below), settings, battery, reader info; reads batched to JavaScript every 100 ms; raw diagnostic events.
    `ReaderScanner.kt` is the search: a low-latency BLE scan that refuses to start with location
    off up to Android 11 and reports each device at most every 500 ms.
  - **Adapter** (`createHoneywellRfidAdapter`, `getHoneywellRfidAdapter`): every optional part of
    the contract; centi-dBm and volume names converted; the module's error codes mapped to
    `RfidError`; `unsupported` off Honeywell hosts (R13); Android permissions: nearby devices from
    Android 12, the precise location up to 11.
  - **Plugin** (`aarPath`): copies the app's AAR into a Maven repository in `android/`, declares it
    for the SDK's group only, raises `minSdkVersion` to 26 and declares the permissions. A real
    `expo prebuild` of the diagnostics app produced the expected `build.gradle`,
    `gradle.properties`, manifest and repository, and autolinking found the module.
  - **Checked:** the Kotlin compiles against the AAR's `classes.jar` (stubs for Android and
    Expo's DSL; no Android SDK can be downloaded here). The adapter passes the conformance kit
    against a JavaScript copy of the module (`fakeNative.ts`).
- **`apps/rfid-diagnostics`** (private): one screen over `/rfid`'s hooks (permission, search,
  connection, settings, multiple scan with the trigger, single read, search) and the measurements
  the spike needs, shared as a JSON report. `README.md` is the team's checklist.
- **Repository:** lint keeps the device package from importing a vendor and a vendor to `/rfid`;
  `.gitignore` blocks the SDK anywhere in the tree.
- **What the six reports changed** (the measurements above):
  - `DataCollection.aar` became a second SDK the app supplies (`dataCollectionAarPath`);
  - the default proximity bounds moved to −30 / −70 dBm;
  - the search also matches the IH40's company id (1318);
  - the module reconnects by itself, the SDK's auto-reconnect being off;
  - the read option sets `data` and `protocol`, and a single read with a TID is a `read()` window;
  - the module reports a revision, so the diagnostics flag a stale native build.
- **Decided on the way:**
  - The module computes the locate value from the reads the SDK filters for it, not from
    `onReceivedFindingTag`, whose integer division by the read count is not a signal strength.
  - The search filters to the SDK's service or an `IH4x` name; the diagnostics turn the filter
    off to learn what the IH40 really advertises.
  - Plain React Native components in the diagnostics app: a short-lived tool, built without the
    UI kit's fonts and native modules.

### Phase 36 — what landed

- **`@its/rfid-honeywell` is publishable** (no longer `private`), built like the device package:
  bob into `lib/` (CommonJS, ES modules, types), an `exports` map (`.`, `./app.plugin.js`,
  `./package.json`), `validate-package` (publint, attw) in CI and the root `build`, `release.yml`
  naming it. The tarball holds `lib/`, `src/`, the Android module (`build.gradle`, sources),
  `expo-module.config.json` and `app.plugin.js`: no SDK. A changeset makes it `0.1.0`.
- **The adapter's work** listed for this phase (the conformance kit, units, batching, threading,
  reconnection, discovery, errors) landed during the spike and was measured there (phase 35).
- **Found on the way:** the package's type-check and tests resolved `@its/glowup-device/rfid`
  through the device package's `exports`, so its built `lib/`; CI type-checks and tests before it
  builds, so on a clean checkout both failed. `tsconfig.json` (`paths`) and Jest
  (`moduleNameMapper`) now map `/rfid` and `/testing` to the device package's `src`;
  `tsconfig.build.json` clears the mapping, so the published types import the package by name.
- **`PermissionState` is exported from `/rfid`:** the adapter imported it from the root entry,
  which a vendor package should not need. ESLint now refuses the root entry in `packages/rfid-*`.
- **The peer range** on `@its/glowup-device` had to exclude `0.10.0`, which has no `/rfid` (phase
  37 settles it). The package is no longer private, so `changeset publish` publishes it with the
  first release from `master`: this branch merges only with phase 37.
- **The trusted publisher** is set up on npmjs.com by a maintainer. npm may not offer the setting
  before the package's first version exists; if it does not, the first version needs a one-off
  publish by hand (to check on npmjs.com). The Release runs after phase 37 answered it: every
  package npm did not know yet failed with `E404` on `PUT` (see "After phase 37").

### Phase 37 — what landed

- **Playground `/device/rfid`** on a simulated reader (`site/rfidDemo.ts`: the package's mock
  driven by a timer). The reader section searches, connects and shows the reader's identity and
  battery; the multiple scan lists tags with their proximity (with TIDs on request) and runs on
  the trigger (a button pulls the simulated one); the single read shows the nearest tag and its
  TID; a tag picked in either is the search's target, whose gauge follows the sweep. The page
  provides the demo only without an adapter above it, so its tests drive a mock: connection,
  scan, trigger, single read, search and the simulated reader.
- **Decided:** the playground depends on no RFID vendor, against the earlier "Honeywell in a
  development build". A vendor package is autolinked into every Android build of the app that
  depends on it, so every playground build would need Honeywell's two AARs, and would carry the
  SDK onto other brands' devices (R13). `apps/rfid-diagnostics` is the Honeywell build.
- **`examples/consumer`** installs `@its/rfid-honeywell` from the registry beside the other two:
  it renders `/rfid` on the Honeywell adapter (unsupported on the web), types it as
  `RfidAdapter` and lists the config plugin with SDK paths that do not exist (the plugin reads
  them only at prebuild). The smoke workflow waits for, installs and checks the three versions.
  Checked here with the three packages packed locally: `tsc`, the web export, and
  `expo config` resolving and running the plugin.
- **Changesets:** `@its/glowup-device` minor (`/rfid`, `0.11.0`) and `@its/rfid-honeywell` minor
  (`0.1.0`). The peer range is `>=0.10.0 <0.12.0`: a caret on `0.11.0` would fail `npm ci` until
  the device package is bumped. A dry run of `changeset version` gave device `0.11.0`,
  rfid-honeywell `0.1.0` and the peer range `>=0.11.0 <0.12.0`.
- **After the merge:** the trusted publisher of `@its/rfid-honeywell` on npmjs.com (above), then
  the team's check on the IH40 with the published packages.

### After phase 37

- **Publishing is blocked.** The Release after the "Version Packages" merge failed as on 15
  October: `@its/glowup-device@0.11.0` and `@its/glowup-notifications@0.3.1` with `E404` on
  `PUT`, and nothing was published (npm knows only `@its/glowup-ui`). Trusted publishing cannot
  create a package, and the workflow has no token: the first version of each needs a publish
  by hand or a temporary token, then a trusted publisher. A maintainer's choice; the versions on
  `master` stay, and `changeset publish` publishes whatever the registry lacks.
- **The check on the IH40 no longer waits for it.** `npm run packed -w @its/rfid-diagnostics --
  <dir>` builds the two packages, packs the tarballs npm would publish and makes a copy of the
  diagnostics app outside the repository that installs them (inside it, Node would fall back to
  the root `node_modules`, where both are links to their source). The same screen and checklist
  then run on `lib/`, the `exports`, the config plugin and the Android module as the tarballs
  ship them; only the provenance is left to the Release.
- **Found by it: every subpath was bundled from another build than the root.** Metro resolves
  `@its/glowup-device/rfid` through the nearest `package.json`, the node10 fallback folder,
  which has no `exports`. Its `react-native` field led to `src` on iOS and Android, its `module`
  field to `lib/module` on the web (Expo reads `browser`, `module`, `main` there); the root
  resolved through `exports` to `lib/commonjs`. `core/` was in the bundle twice, so the
  diagnostics app's `DeviceAdaptersProvider` (from the root) would not have reached
  `useRfidReader` (from `/rfid`): the Honeywell adapter would never have been used. Neither the
  playground (`paths` to `src` for every entry) nor the consumer smoke (it bundles, but renders
  nothing that depends on the provider) could see it. `@its/glowup-notifications`' `/testing`
  had the same shape.
- **Fixed** in both packages: the fallback folders and the roots point only at `lib/commonjs`
  (`main`, `types`, `source`; no `react-native`, no `module`), so every resolver, with or
  without `exports`, native, web or server, lands on one build. Each package's
  `package-exports.test.ts` pins it. Patch changesets: device `0.11.1`, notifications `0.3.2`.
  Checked on the packed tarballs: the Android bundle of the diagnostics copy and the consumer's
  web bundle each hold one `core/adapters.js`, from `lib/commonjs` (before: `src` beside
  `lib/commonjs` on Android, `lib/module` beside it on the web); `tsc`, the config plugin at
  prebuild (with placeholder files where the SDKs go) and autolinking of the Honeywell module
  pass on the copy. The tests, type-check and lint pass with no `lib/` in the tree.
- **Still open:** whether Honeywell's Maven repository serves the SDK (phase 35); the team's
  check on the IH40 with the packed tarballs.

### Zebra (RFD40) — the second vendor

The request: a vendor package for Zebra's RFD40 that implements the same contract, so an app
switches vendor by the provider's line and the installed package (ADR-R1). The contract needed
no change: `vendor: "zebra"` and `firstSupportedRfidAdapter([honeywell…, zebra…])` were written
for it.

**The hardware.** The RFD40 is a UHF sled in three models: _Standard_ (no Bluetooth: eConnex on
a Zebra mobile computer, or USB-C), _Premium_ (Bluetooth 5.3, Wi-Fi, NFC tap-to-pair; also with
other brands' devices) and _Premium Plus_ (the Premium with a barcode imager). Zebra also ships
an RFID SDK for iOS (an XCFramework, Bluetooth MFi or LE) that supports the Premium models.

**Zebra RFID SDK for Android 2.0.5.297** (the requester's download from Zebra's portal,
`Zebra_RFIDAPI3_SDK_2.0.5.297.zip`; its public API read with `javap` without `-c`, its manifests,
and its handheld sample `HHSampleApp/RFIDHandler.java`):

- **Packaging:** one AAR for the handhelds, `rfidapi3lib-2.0.5.297.aar` (it bundles
  `rfidserviceapi.jar`; 2.0.5.224 was fifteen AARs). `rfidapi3ziotcllrplib` holds the same
  classes plus LLRP for fixed readers: one or the other. No native code (no ABI constraint). Not
  on a public Maven repository. **The zip holds no licence text.**
- **Manifest:** `minSdkVersion` 29; `BLUETOOTH`, `BLUETOOTH_ADMIN`, `BLUETOOTH_CONNECT`,
  `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION` and `READ_EXTERNAL_STORAGE`, all uncapped.
- **Undeclared dependencies:** `androidx.localbroadcastmanager` (`RFIDManagerAPI`); Qualcomm's
  `com.qti.qrs` (the `QC_SERIAL` transport of readers built into hosts), which Zebra's sample
  declares as an optional `uses-library`; bouncycastle inside the scanner library only.
- **API3:** `Readers(context, ENUM_TRANSPORT)` + `GetAvailableRFIDReaderList()` →
  `ReaderDevice` (`getName`, `getAddress`) → `getRFIDReader().connect()`, blocking (the sample
  runs both off the main thread). Transports `BLUETOOTH`, `SERVICE_SERIAL`, `SERVICE_USB`,
  `RE_SERIAL`, `RE_USB`, `QC_SERIAL`, `ZIOTC`, `ALL`; the sample tries them in turn. Paired
  names look like `RFD40+_211545201D0011` (Bluetooth) and `RFD4031-G10B700-US` (serial).
  `Readers.attach()` reports `RFIDReaderAppeared` / `Disappeared`.
- **Events:** one `RfidEventsListener`: `eventReadNotify` (then `Actions.getReadTags(n)`) and
  `eventStatusNotify` with `HANDHELD_TRIGGER_EVENT` (pressed / released), `DISCONNECTION_EVENT`
  (`CONNECTION_LOST`, `READER_INITIATED_DISCONNECTION`, `READER_EXCEPTION`) and `BATTERY_EVENT`
  (`getLevel()`), each switched on through `Events.set…Event(true)`.
- **Tags:** `TagData`: `getTagID()`, `getPeakRSSI()` (a `short`), `getAntennaID()`,
  `getTagSeenCount()`, `getMemoryBankData()`, and `LocationInfo.getRelativeDistance()` (a
  `short`) with `isContainsLocationInfo()`.
- **How the three modes map:**
  - **Multiple scan:** `Actions.Inventory.perform()` / `stop()` with immediate start and stop
    triggers. With TIDs: `Actions.TagAccess.readEvent()` on `MEMORY_BANK_TID` (count 0, the
    whole bank), which reads each tag's TID as it inventories, stopped by `stopAccess()`.
  - **Single read:** none in the SDK.
  - **Single search:** `Actions.TagLocationing.Perform(epc, null, null)` / `Stop()`; the SDK's
    value is a **relative distance from 0 to 100**, not a signal.
- **Reader:** power as an index into `ReaderCapabilities.getTransmitPowerLevelValues()`
  (`Antennas.AntennaRfConfig.setTransmitPowerIndex`); session through
  `Antennas.SingulationControl`; beeper `HIGH`, `MEDIUM`, `LOW`, `QUIET`; region from
  `getRegulatoryConfig()`; `setTriggerMode(RFID_MODE | BARCODE_MODE, boolean)`;
  `getDeviceStatus(battery, …)` (answered by `BATTERY_EVENT`) and `getBatteryStats()`; model and
  serial from `ReaderCapabilities`, firmware from `versionInfo()`, every component's version from
  `getDeviceVersionInfo(map)`.
- **No brand check** in the RFID classes (`isZebraDevice` exists only in the barcode scanner
  library, which the module does not use).

**Decisions (taken with the requester):**

| #   | Question    | Decision                                                                                                                                                                                                                                                 |
| --- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Z1  | Hardware    | The **RFD40 Premium over Bluetooth, on any Android device**. eConnex, USB, the Standard model and the Premium Plus's imager are out.                                                                                                                     |
| Z2  | SDK         | 2.0.5.297, `rfidapi3lib` only, supplied by the app (`aarPath`) as for Honeywell (R11): never in the repository or a published package. The licence's terms are still to read (below).                                                                    |
| Z3  | Search      | The reader's own `TagLocationing`, its value the searched tag's **peak RSSI** in dBm; the relative distance goes to the diagnostics only. If the spike finds no RSSI in those reads, the adapter drops `startLocate` and the engine emulates the search. |
| Z4  | Single read | Emulated by the engine (no `readOnce`): the SDK has none.                                                                                                                                                                                                |
| Z5  | TID         | A TID-bank access during the scan (`TagAccess.readEvent`).                                                                                                                                                                                               |
| Z6  | Discovery   | The SDK's list of **paired** readers, polled every 3 s, with no RSSI; pairing is Android's (settings or NFC tap). No Bluetooth scan of the module's own.                                                                                                 |
| Z7  | Host        | No host check: the Premium pairs with any Android device and the SDK checks no brand (unlike R13's Honeywell).                                                                                                                                           |
| Z8  | Platforms   | Android only. iOS (Zebra's iOS SDK) is for later; the contract allows it (R9).                                                                                                                                                                           |
| Z9  | Diagnostics | One app, `apps/rfid-diagnostics`, one build per vendor: `RFID_VENDOR` picks the plugin and excludes the other vendor from autolinking.                                                                                                                   |
| Z10 | Power       | Through the reader's table: read as tenths of a dBm, a setting picks the nearest level, `powerRange` 0–30 dBm with the reported power kept inside it.                                                                                                    |
| Z11 | Release     | `@its/rfid-zebra` stays private through the spike, as Honeywell did through phase 35.                                                                                                                                                                    |

Rejected: turning the relative distance into a made-up dBm (the contract's units would lie), and
a contract change for a native proximity (it would touch every vendor for one SDK's value);
DataWedge's RFID input (intents, no search or settings: it cannot implement the contract).

| Phase | Content                                                                                                                                                                                                     | Release | Status      |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ----------- |
| Z1    | `packages/rfid-zebra` (private): Kotlin module, adapter, plugin, the conformance kit over a fake; the diagnostics app per vendor; the team runs it on an RFD40 Premium and the readings fill the list below | —       | in progress |
| Z2    | `@its/rfid-zebra` publishable: changeset `0.1.0`, trusted publisher, `validate-package` in CI, `release.yml`, the root `build`                                                                              | `0.1.0` | —           |
| Z3    | The playground's install snippet per vendor, `examples/consumer` (a Zebra build of its own, R13 / Z9)                                                                                                       | —       | —           |

### Phase Z1 — what landed

- **`packages/rfid-zebra`** (`@its/rfid-zebra`, private), the Honeywell package's shape:
  - **Kotlin** (`ZebraRfidModule.kt`): `Readers` over Bluetooth; `connect(id)` finds the paired
    reader by address or name and connects on the module's `link` thread; configures the events
    and immediate triggers; reconnects by itself after `DISCONNECTION_EVENT` (1, 3, 5, then
    every 10 s; at once on `RFIDReaderAppeared`); a `generation` counter lets a late attempt
    close what it opened. Inventory (with TIDs through the TID-bank access), native locate (the
    peak RSSI; the relative distance as a diagnostic), trigger hand-over (`RFID_MODE`), settings,
    battery (`BATTERY_EVENT`, `getBatteryStats()` as a fallback), reader info and versions, the
    paired readers' list; reads batched every 100 ms; raw diagnostic events.
  - **Adapter** (`createZebraRfidAdapter`, `getZebraRfidAdapter`): every optional part but
    `readOnce`; `nativeLocate` (default on) and `setNativeLocate()` for the comparison; power
    through the table; `off` ↔ `QUIET`; nearby devices permissions from Android 12, nothing
    before.
  - **Plugin** (`aarPath`): the SDK in a Maven repository in `android/` for `com.zebra.rfid`
    only, `minSdkVersion` 29, `BLUETOOTH_SCAN` / `BLUETOOTH_CONNECT`, the SDK's location capped at
    Android 11 (`tools:node="replace"`), `com.qti.qrs.qc_sdk` optional.
- **Checked:** the Kotlin compiles against the 2.0.5.297 `classes.jar` (stubs for Android and
  Expo's DSL), without a warning; the adapter passes the conformance kit twice (native and
  emulated search) over `fakeNative.ts`; the package builds and passes `validate-package`; a real
  `expo prebuild` of the diagnostics app with `RFID_VENDOR=zebra` and the AAR produced the
  repository, `minSdkVersion=29`, the permissions, the optional library and
  `expoAutolinking.exclude = ["@its/rfid-honeywell"]` (and the Honeywell build the reverse);
  autolinking then resolves only `@its/rfid-zebra`.
- **`apps/rfid-diagnostics`** runs either vendor: `vendors.ts` picks the linked one, the
  measurements read both vendors' events (Zebra: the locate's RSSI beside its relative
  distance, the paired readers, the battery level), the search can switch between the reader's
  and the engine's, and `README.md` has the RFD40 checklist.

**Not verified until the spike** (the RFD40 checklist measures each):

- the power table's unit (tenths of a dBm?) and range, the region's name;
- the peak RSSI's range and the proximity bounds (−30 / −70 dBm until measured), the EPC's case;
- whether the TID-bank access gives every tag its TID, and how much it slows the scan;
- whether the locate's reads carry a peak RSSI (Z3), and the beeper during it;
- whether `QUIET` mutes the beeper; what `setTriggerMode`'s boolean does; whether the
  trigger needs `RFID_MODE` at all on a Premium;
- the battery through `BATTERY_EVENT` or `getBatteryStats()`;
- what the paired readers' list holds, the connection time, and the reconnection after the
  reader is switched off or walks out of range;
- whether anything needs a permission the module does not ask (Android 10 and 11: location;
  12 and later: `BLUETOOTH_SCAN`), and whether the missing Qualcomm library is ever loaded.

**Still open:** the SDK's licence. The zip has no EULA: the text accepted at download (or
Zebra's terms for the RFID SDK) decides whether Z2's "the app supplies the SDK" is a choice or
an obligation, and whether it binds the SDK to Zebra hardware (here the reader is Zebra's, the
host may not be).

## v0.12 — barcode scanner

The request: the CT40's built-in barcode / QR imager behind a vendor-neutral interface, with the
same split as RFID: a contract in `@its/glowup-device`, a package per vendor (Honeywell first,
Zebra later). A read confirms by itself: the app gets the code and acts on it (submits the
form, calls its API) without a keypress.

### The SDK received, and why it is not the one

`Honeywell_Scanner_SDK_for_Android-v6.00.06.00.zip` (read from its manifests, class names,
release notes, sample and EULA; not its bytecode, which its licence forbids reverse compiling)
is the **Android Gen7 BT SDK** for the **Seychelles 8680i / 8680iB / 8690i** wearable scanners:

- Bluetooth only (`com.honeywell.scanner.sdk.bt.classicbt`, `bt.ble`; BLE "in a future
  release"): connect to the ring scanner, read its barcodes (and the 8690i's RFID), flash its
  firmware (`libFlashFirmwareLib.so`). The CT40 and CT60 appear only as the host it pairs with.
- Android 7.1 to 10 in its release notes; `minSdkVersion` 24, `targetSdkVersion` 28, last
  release 6 October 2021. It declares `BLUETOOTH` / `BLUETOOTH_ADMIN` only, none of Android 12's
  nearby devices permissions. Nothing in it requires Android 13; newer Android is where it is
  least likely to work.
- Its EULA ("Honeywell Productivity Products Developer License", §4) forbids copying,
  distributing, modifying and reverse compiling the DevTools.

It does not drive the CT40's own imager. That is Honeywell's **Data Collection SDK** (Mobility
SDK, `com.honeywell.aidc`, `DataCollection.aar`), the same AAR `@its/rfid-honeywell` already
requires (1.97.00.0060, phase 35). The ring scanners are out unless someone uses them (below).

### The architecture (ADR-C1)

- **`@its/glowup-device/scanner`**: the contract and the engine, like `/rfid`.
  - `BarcodeScannerAdapter`: `vendor`, `symbologies` (what it can turn on), `isSupported()`,
    `open(request, handlers)` / `close()` (Honeywell's claim / release; the request's
    symbologies applied on each `open()`), reads, trigger presses and a scanner taken away as
    events, `softwareTrigger?(pressed)`, `getScannerInfo?()`.
  - A read: `data` (text), `type` (`BarcodeType` or `"unknown"`), `rawType` (the vendor's
    code id), `aimId` when the SDK gives one, `timestamp`.
  - `useBarcodeScanner({ onScan, enabled, symbologies })`: the scanner is open while the screen
    is mounted, `enabled` and the app in the foreground, and released otherwise (another app, or
    the device's own keyboard wedge, gets it back).
  - **Automatic confirmation** is the app's `onScan`: the library never submits anything. To
    keep a confirmation from running twice, the hook drops a read while the previous
    `onScan`'s promise is pending, and the same code within a short window (both configurable).
  - `createMockBarcodeScannerAdapter()` and `describeBarcodeScannerAdapterContract()` in
    `/testing`.
  - `BarcodeType` moves from `/camera` to `core/` (a capability imports no other, D2), as the
    location types did in phase 27; `/camera` re-exports it.
- **`@its/scanner-honeywell`**: Android Expo module over the Data Collection SDK, adapter,
  config plugin; the AAR supplied by the app (`dataCollectionAarPath`), never in the repository
  or a package (R11). It supports what the SDK supports: no Android floor of its own, and the
  same host check as R13.
- **`@its/scanner-zebra`** later, on the same contract (DataWedge's intents on Zebra mobile
  computers, or Zebra's scanner library for a Bluetooth imager): decided when a Zebra device is
  there to try (done: "Zebra (TC22)" below, DataWedge).

**Data Collection SDK 1.97.00.0060** (the requester's `DataCollection.aar`, its public API read
with `javap` without `-c`; the AAR holds no licence text):

- **Packaging:** `com.honeywell.aidc`, one `classes.jar`, no native code; `minSdkVersion` 16; it
  declares `com.honeywell.decode.permission.DECODE` (the scanner service's own permission).
- **Session:** `AidcManager.create(context, CreatedCallback)` (asynchronous, `onCreated(manager)`)
  → `createBarcodeReader()` (or by name, from `listBarcodeDevices()`; `BarcodeDeviceListener`
  reports a device connected or disconnected) → `claim()` / `release()` / `close()`, then
  `manager.close()`.
- **Reads:** `BarcodeListener.onBarcodeEvent(BarcodeReadEvent)`: `getBarcodeData()` (a
  `String`), `getCharset()`, `getCodeId()` (Honeywell's own id), `getAimId()` (ISO/IEC 15424:
  `]Q` QR, `]C` Code 128, `]E0` EAN-13, `]d` Data Matrix), `getTimestamp()` (a `String`),
  `getBarcodeBounds()`; `onFailureEvent` (a decode that found nothing).
- **Trigger:** `TriggerListener.onTriggerEvent(TriggerStateChangeEvent.getState())`;
  `PROPERTY_TRIGGER_CONTROL_MODE`: `autoControl` (the service decodes on the trigger),
  `clientControl` (the app calls `softwareTrigger` / `decode` on each press) or `disable`;
  `PROPERTY_TRIGGER_SCAN_MODE`: `oneShot`, `continuous`, `readOnRelease`,
  `readOnSecondTriggerPress`; `PROPERTY_TRIGGER_SCAN_SAME_SYMBOL_TIMEOUT` (the service's own
  repeat filter); `softwareTrigger(boolean)` (needs a claim).
- **Settings:** `setProperty` / `setProperties(map)` / `getAllProperties()` over about 200
  `PROPERTY_*` keys: one `…_ENABLED` per symbology (`DEC_QR_ENABLED`, `DEC_CODE128_ENABLED`,
  `DEC_EAN13_ENABLED`, `DEC_DATAMATRIX_ENABLED`, `DEC_GS1_128_ENABLED`, …), good-read and
  vibrate notifications, the data processor (prefix, suffix, charset, scan-to-intent, launch
  browser); `loadProfile(name)`.
- **Reader info:** `BarcodeReaderInfo` (name, friendly name, scanner id, firmware, serial).

The **IH40 has no imager of its own**: its SDK has no barcode API, and in `TriggerMode.BARCODE`
its trigger drives the host's scanner (measured in phase 35: "handed back, the trigger drives the
CT40's own scanner again"). Reading barcodes with the IH40 is pulling its trigger while
`/scanner` holds the CT40's imager and no RFID screen is mounted (C6).

**To confirm on the CT40:** whether a claim stops the keyboard wedge for the app; whether the
IH40's trigger reaches `onTriggerEvent` and decodes under `autoControl`; the code ids and AIM ids
of the four symbologies; what the service does to the claim when the app goes to the
background; the charset of a QR holding non-ASCII text. And, from phase C2's code: that the
properties a claim sets apply to this app only (the wedge keeps the device's after a release);
that `softwareTrigger` decodes under `autoControl`; whether the service applies `DPR_PREFIX` /
`DPR_SUFFIX` to the listener's data or only to the wedge's (the adapter clears them either way);
the format of `getTimestamp()` (measured: unpadded offset, below); that UPC-A and UPC-E come as `]E0` with code ids `c` and `E`;
which `DEC_*` keys the CT40 lacks (the module skips and reports them); and that the RFID SDK's
own `AidcManager` (its USB transport) and the scanner's live in one process with an RFID screen
and a scanner screen used in turn.

### Decisions

| #   | Question      | Decision                                                                                                                                                                                                                            | Status  |
| --- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| C1  | Honeywell     | The Data Collection SDK (`com.honeywell.aidc`), not the scanner service's intents.                                                                                                                                                  | decided |
| C2  | Confirmation  | A read reaches the app as `onScan`, which confirms by itself; no keyboard wedge, no Enter key.                                                                                                                                      | decided |
| C3  | Support       | Whatever the Data Collection SDK supports, checked on the team's CT40 (Android 11).                                                                                                                                                 | decided |
| C4  | Ring scanner  | The Gen7 BT SDK (8680i / 8690i) is out: the team uses no ring scanner.                                                                                                                                                              | decided |
| C5  | One build     | The scanner and RFID packages share `DataCollection.aar`: the same Maven coordinate in each plugin's repository, so Gradle resolves it once; the versions must agree.                                                               | decided |
| C6  | Trigger       | No screen reads RFID and barcodes together: an RFID screen owns the trigger (`useRfidTrigger`, `TriggerMode.RFID`); everywhere else it stays in `BARCODE` mode and drives the imager `/scanner` holds, the IH40's trigger included. | decided |
| C7  | First scope   | Hardware and software trigger; QR, Code 128, EAN-13, EAN-8 and Data Matrix (the others off; EAN-8 added in phase ZB2); no GS1 parsing.                                                                                              | decided |
| C8  | Camera        | Phones without an imager read through the camera, with the same `onScan` (how: C10).                                                                                                                                                | decided |
| C9  | Names         | `/scanner`, `@its/scanner-honeywell`, `@its/scanner-zebra`; a scanner section in `apps/rfid-diagnostics`, later renamed for both.                                                                                                   | decided |
| C10 | Camera wiring | The camera needs a preview on screen, so it stays in `/camera`; the read's shape, the AIM mapping and the busy and repeat guards live in `core/`, used by both.                                                                     | decided |

| Phase | Content                                                                                                                                                                                                                     | Release      | Status |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------ |
| C1    | `/scanner` contract, engine (open while focused, busy and repeat guards), hooks, mock, conformance kit; `BarcodeType`, the read, the AIM mapping and the guards in `core/`; `/camera`'s reads through the same guards (C10) | device minor | done   |
| C2    | `packages/scanner-honeywell` (private): Kotlin module, adapter, plugin, the conformance kit over a fake; the diagnostics screen; the team runs it on a CT40                                                                 | —            | done   |
| C3    | `@its/scanner-honeywell` publishable: changeset, trusted publisher, `validate-package`, `release.yml`, the root `build`                                                                                                     | `0.1.0`      | done   |
| C4    | Playground page on a simulated scanner, `examples/consumer`, changesets                                                                                                                                                     | —            | done   |

### Phase C1 — what landed

- **`@its/glowup-device/scanner`** (`src/scanner`):
  - **Contract** (`types.ts`, `BARCODE_SCANNER_CONTRACT_VERSION` 1): `BarcodeScannerAdapter`
    as above; a read (`BarcodeScannerRead`: `data`, `aimId`, `rawType`, optional `type` and
    `timestamp`); `BarcodeScannerError` (`unsupported`, `incompatible-adapter`, `unavailable`,
    `not-open`, `failed`); `unsupportedBarcodeScannerAdapter`,
    `firstSupportedBarcodeScannerAdapter`, capabilities read from the optional methods.
  - **Engine** (`engine.ts`, one per adapter): a stack of holders, one per mounted and enabled
    `useBarcodeScanner`. The scanner is open while the stack is not empty and the app is in the
    foreground; the reads go to the top holder; its symbologies are the request, reapplied
    with `open()` while open (no release between screens). One open or close at a time, on a
    promise chain; a session counter drops what an earlier claim reports after it closed. An
    adapter's `onClose` (another app took the scanner) reads `closed` with `unavailable`, and
    `retry()` opens again; the next foreground or holder change does too.
  - **Hook** (`useBarcodeScanner`): `onScan` (the latest one, without reopening), `enabled`,
    `symbologies` (`null`: the device's own configuration), `repeatInterval` (1000 ms),
    `dropWhileBusy` (true); it reports `state`, `isActive`, `error`, `isTriggerPressed`,
    `isBusy`, and gives `softwareTrigger`, `getScannerInfo` and `retry`. A symbology the
    scanner cannot decode is a `RangeError`, only where the adapter is supported (elsewhere the
    same list goes to the camera). Unsupported and closed while a static page prerenders.
- **Shared with `/camera`** (`core/barcodes.ts`, C10): `BarcodeType` (moved from `/camera`,
  which re-exports it), `BarcodeScan` (`data`, `type`, `rawType`: what a camera read and a
  hardware read share, so one handler serves both), `aimToBarcodeType` (ISO/IEC 15424: `]Q`,
  `]C`, `]E0` / `]E4`, `]d`, `]A`, `]G`, `]F`, `]I`, `]L`, `]z`) and `createScanGate` (the
  repeat window and the busy guard). `CameraView` now uses the gate: a handler that returns a
  promise makes it drop codes until the promise settles.
- **Wiring:** `DeviceAdapters.barcodeScanner`, the `./scanner` export, its node10 folder (`main`,
  `types`, `source` only) and `files`; `DEVICE_CAPABILITIES.scanner` with no module; ESLint
  keeps `@its/scanner-*` out of the device package and gives `packages/scanner-*` the vendor
  rules RFID's have (one rule built for both contracts); the playground maps the subpath.
- **Testing:** `createMockBarcodeScannerAdapter()` (decodes only while open and only the
  symbologies turned on; trigger, take-away, failed and held opens) and
  `describeBarcodeScannerAdapterContract()` (declaration, one delivery per decode with the text
  intact, non-ASCII included, a request reapplied while open, close semantics, reopening, the
  software trigger needing a claim, the hardware trigger, a scanner taken away, the identity).
  `scanner-contract.test.ts` runs it on the mock with every part and with none, and checks it
  catches five broken adapters (a version imported, a suffix and a missing AIM id, a listener
  added on each open, reads after close, a software trigger that works while closed).
- **Changeset:** `@its/glowup-device` minor.

### Phase C2 — what landed

- **`packages/scanner-honeywell`** (`@its/scanner-honeywell`, private, `0.0.0`): the RFID
  packages' shape (bob build, `validate-package`, `/scanner` and `/testing` only, mapped to the
  device package's `src`).
  - **Kotlin module** (`HoneywellScannerModule`, revision 1): binds the service once
    (`AidcManager.create`, 10 s timeout), creates the internal imager's reader once with its
    barcode and trigger listeners, then on `open(properties, triggerControl)` sets the
    properties, sets `TRIG_CONTROL_MODE` (`autoControl`, or `clientControl` where the module
    aims, lights and decodes on each trigger event) and claims; again while claimed it applies
    only. It keeps each key's value from before its first change and puts back the keys a later
    request leaves out, so `symbologies: null` returns to the device's settings; a key the
    scanner lacks is skipped and reported. `close()` releases, the reader stays. Reads,
    triggers and a claim lost (`ScannerNotClaimedException` / `ScannerUnavailableException` on
    a software trigger, the reader's device disconnected) go to JavaScript only while claimed;
    the last one once, as `onClose(ERR_UNAVAILABLE)`. Diagnostics: raw reads (code id, AIM id,
    charset, timestamp string, thread), failed decodes, triggers claimed or not, the claim's
    life, `listDevices()`, `getAllProperties()`. Compiled with `kotlinc` against the AAR's
    `classes.jar` and stubs (no Android SDK in the session).
  - **Adapter** (`createHoneywellBarcodeScannerAdapter`): every `BarcodeType` (`symbologies`),
    `softwareTrigger`, `getScannerInfo` (the friendly name, serial, firmware, and the engine's
    model from `scannerId`, since the CT40 run); one set of subscriptions per claim, removed before `close()`
    resolves. `toOpenProperties()` maps the request to the SDK's keys: one switch per type
    (Code 128 with GS1-128, ITF-14 as Interleaved 2 of 5), the SDK's 24 other symbologies off,
    postal `none`, OCR `off`; and on every claim no prefix, suffix or symbology id, no data or
    scan intents, browser or EZConfig. The type is the AIM id's, except UPC-A / UPC-E (code id
    `c` / `E` under `]E0`); `rawType` is the code id; the timestamp is the SDK's when it parses
    to a real time, the arrival's otherwise. Host check as R13. (Since the CT40 run, every claim
    also transmits EAN's and UPC's check digit and number system: "measured on the CT40" below.)
  - **Config plugin** (`dataCollectionAarPath`): the AAR into `honeywell-scanner-repository/`
    as `com.honeywell.aidc:datacollection:1.97.00.0060`, the coordinate `@its/rfid-honeywell`
    uses (C5); no manifest or `minSdkVersion` change (the SDK's manifest carries its
    permission, its minimum is 16).
  - **Tests:** the conformance kit over `fakeNative.ts` (the Kotlin module and the service: a
    read arrives only for an enabled symbology), the adapter, the mapping, the plugin.
- **`apps/rfid-diagnostics`:** a "Barcode scanner" screen beside the RFID one (one at a time,
  C6): the hook's state, holding on and off, the first scope (C7) or the device's settings, a
  slow confirmation (the busy guard), the repeat window, a held software trigger, client
  control, the reads `onScan` received, a keyboard wedge field, the SDK's raw events and a
  shared report (`scannerMeasurements.ts`). The Honeywell build applies both Honeywell plugins
  on one `DataCollection.aar`, the Zebra build leaves both modules out; `packed.mjs` packs the
  scanner package too; a test fails if the two plugins' coordinates differ.

### Phase C2 — measured on the CT40

The team's CT40 (Android 11, API 30), the reports of 21 October, native module revision 1:

- **The four symbologies** (`code id` / AIM id): QR `s` / `]Q1`, Code 128 `j` / `]C0`,
  EAN-13 `d` / `]E0`, Data Matrix `w` / `]d1`, as Honeywell's chart says; each read typed right.
- **Every key the adapter sets exists** (48 set, none skipped), and the restore works: the first
  scope turned off put back 40 keys, on again set them.
- **EAN-13 lost its check digit:** `978274340080` for `9782743400804`, `806802075320` for
  `8068020753209`. The CT40's `DEC_EAN13_CHECK_DIGIT_TRANSMIT` is off and the adapter did not
  set it, so a read differed from the camera's (13 digits) and from another CT40 configured
  otherwise. Fixed: every claim transmits the check digit of EAN-13, EAN-8, UPC-A and UPC-E,
  and UPC-A's and UPC-E's number system (`DATA_PROPERTIES`, the device's values back on a
  release as the other keys).
- **The timestamp** is local time with an unpadded offset, `2026-10-21T09:27:47.246+2:00`:
  Hermes parsed it right, V8 does not. Fixed: the offset is padded before the parse.
- **The trigger:** under `autoControl` the side buttons decode, and `onTriggerEvent` never
  comes (5 reads and 5 failed decodes, no trigger event), so `isTriggerPressed` stays `false`;
  under `clientControl` every press and release came, the read 50–500 ms after the press.
- **Charset:** a QR holding `Città perché € ñ ß 日本語` in UTF-8 arrived as
  `CittÃ  perchÃ© â‚¬ Ã± ÃŸ æ—¥æœ¬èªž`, the same with and without an ECI declaring UTF-8: the
  service decodes every symbol's bytes with `DPR_CHARSET` (`ISO-8859-1` on the CT40, in fact
  Windows-1252: `0x97` became `—`) and ignores the ECI. Repairing it in JavaScript would lose the
  five bytes Windows-1252 lacks (`Á` is `C3 81`), so every claim sets `DPR_CHARSET` to `UTF-8`
  (`DATA_PROPERTIES`; the device's back on a release). A symbol holding Latin-1 text beyond
  ASCII now reads with replacement characters: none in this scope.
- **The guards:** six reads of one EAN-13 in 3 s reached `onScan` three times (the window counts
  from the last delivered read: one 948 ms later was dropped); with the repeat window off, all
  of them. With a 1.5 s confirmation, a different code within it was dropped each time (3 of 3).
- **The background:** six releases and claims (the home screen, the screen off), the reads back
  each time, and Notes got the scanner meanwhile. The software trigger read under both trigger
  controls. Closed, the app left the device as it was: Notes read the EAN-13 in 12 digits.
- **Info and properties:** `scannerId` `N6803FR` (the N6803 engine, now the info's `model`),
  firmware `3.23`; 359 properties, the claim's as set. While claimed `DPR_WEDGE` is `false`,
  which the adapter does not set: the service turns the wedge off for the claiming app.
- **Callbacks** on the service's Binder threads; the claim's life on the module's thread.
- **The IH40's trigger did not scan** with the imager held, in either trigger control: no read,
  no failed decode, so the service never fired. The RFID report showed why: with the trigger not
  handed over, `onRfidTriggered` came on every press, so the IH40 was in `TriggerMode.RFID` at
  connection (left so by an earlier session), and the hand-over neither changed nor restored it
  (no mode event). The module put back the mode it found, never `BARCODE`, against C6. Fixed in
  `@its/rfid-honeywell`'s native revision 3 (4, below): `BARCODE` at connection, after the hand-over and at
  disconnection, `RFID` only while handed over; a `triggerModeApplied` diagnostic says what it
  found and set. With it, **the IH40's trigger fires the imager this app holds** (auto
  control: reads and failed decodes, no trigger event, as the side buttons).
- **`getTriggerMode()` cannot be trusted:** the next RFID report had it answer `RFID` at a
  disconnection, at the connection after it and when the hand-over began, while
  `onTriggerModeSwitched(BARCODE)` had come after each switch to `BARCODE`. Revision 3 compared
  with it and so skipped the switch to `RFID`: the hand-over gave no trigger events. Revision 4
  sets the mode without asking (`triggerModeApplied` keeps the answer as `reported`).
- **No keyboard wedge in this app,** held or released: neither the side buttons nor the IH40's
  trigger typed into the diagnostics' text field with "Hold the scanner" off, while Notes got
  the text. So a release does give the scanner back to other apps; the likeliest reason for this
  app is that the service sends no wedge text to an app with an open Data Collection connection
  (the module keeps its `AidcManager` and reader between claims, and `@its/rfid-honeywell`'s SDK
  opens one of its own), not confirmed. Not fixed, by decision: an app on these packages reads
  through `useBarcodeScanner` only (C2), on every screen that scans, a text field included.
  Closing the reader and the service on each release would cost every claim its setup and might
  not be enough with the RFID SDK's connection open.
- **The UTF-8 charset works:** both QRs, with and without ECI, read `Città perché € ñ ß 日本語`,
  the service reporting `UTF-8` (55 keys set).
- **Not read on purpose:** a symbology outside the request (EAN-8, PDF417 and UPC are off in the
  properties).
- **Revision 4 works:** `BARCODE` at the disconnection and at the connection, `RFID` for the
  hand-over (trigger events, 40 tag reads), `BARCODE` after it, each confirmed by
  `onTriggerModeSwitched` while `getTriggerMode()` kept answering `RFID`; then the IH40's
  trigger read a QR on the scanner screen. The CT40 run is through.

### Phase C3 — what landed

- **`@its/scanner-honeywell` is publishable** (no longer `private`), as `@its/rfid-honeywell`
  became in phase 36: bob into `lib/`, the `exports` map (`.`, `./app.plugin.js`,
  `./package.json`), `validate-package` (publint, attw) in CI and the root `build`,
  `release.yml` and the changesets' README naming it, `publishConfig` (`access: public`,
  `provenance: true`). The tarball holds `lib/`, `src/`, the Android module (`build.gradle`,
  sources), `expo-module.config.json` and `app.plugin.js`: no SDK. A changeset makes it `0.1.0`.
- **`@its/rfid-honeywell` has its `publishConfig` back,** removed with the temporary token's
  revert: every published package now asks for provenance, as `SECURITY.md` promises.
- **`examples/consumer` waits for phase C4** (with the playground page, as the RFID page and the
  consumer went together in phase 37): it installs from the registry, and the package is not
  there yet.
- **Not published yet:** as after phase 37, npm knows only `@its/glowup-ui` (checked 21
  October). Trusted publishing cannot create a package, so the first version of each, this one
  included, needs a publish by hand or a temporary token before its trusted publisher is set up:
  a maintainer's choice. Until then the Release fails with `E404`, as it does for the others.

### Phase C4 — what landed

- **Playground `/device/scanner`** on a simulated scanner (`site/scannerDemo.ts`: the package's
  mock with five warehouse labels to aim at). The page holds the scanner with the first scope's
  symbologies (C7) and shows its state, the trigger and the busy guard; switches turn the
  symbologies off (the device's settings), make the confirmation slow (1.5 s, reads meanwhile
  dropped), let the same code through every time, and give the scanner back to read through
  `CameraView` into the same `onScan` (C8, C10). The simulated trigger, the software trigger and
  another app taking the scanner (with `retry()`) are buttons; an EAN-8, outside the scope, is
  not decoded until the first switch is off. The page provides the demo only without an adapter
  above it; its tests drive a mock: the symbologies, the repeat window, a slow confirmation, the
  scanner taken away, the camera fallback, the simulated scanner. Checked in Chromium on the
  static export at 1440 and 390 px: no console error (hydration included), no horizontal scroll,
  the trigger, the ignored EAN-8 and the software trigger as in the tests.
- **No vendor in the playground,** as decided for RFID in phase 37: `@its/scanner-honeywell`'s
  module would be autolinked into every Android build of the playground, which would then need
  Honeywell's `DataCollection.aar`.
- **`examples/consumer`** installs `@its/scanner-honeywell` from the registry beside the other
  three: it renders `/scanner` on the Honeywell adapter (unsupported on the web), types it as
  `BarcodeScannerAdapter` and lists the config plugin with a `DataCollection.aar` path that does
  not exist. The smoke workflow waits for, installs and checks the four versions. Checked here on
  the four packages packed locally: `tsc`, the web export (the page reads `Scanner honeywell
false · closed`) and `expo config` resolving both Honeywell plugins.
- **No release:** the playground is private and the consumer is no package, so no changeset;
  the table's "device minor" for this phase did not hold, nothing in `/scanner` changed. The
  smoke stays red until the packages are on npm (see "Phase C3 — what landed").

### Zebra (TC22) — the barcode scanner's second vendor

The request: the TC22's built-in imager behind the same contract, so an app switches vendor by
the provider's line and the installed package. The contract needed no change (`vendor: "zebra"`,
`aimId: null` with an explicit `type`, `onTrigger` optional). The team's TC22: Android 15,
DataWedge 15.0.96, scanning framework 43.63.50.0.

**The SDK received, and why it is not the one.** `Android_ScannerSDK_v2.7.4.0.zip`
(`com.zebra.scannercontrol`, `barcode_scanner_library_v2.7.4.0-release.aar`, its javadoc and
demo; and the two public sample repositories, `ZebraDevs/Scanner-SDK-for-Android` and
`…-Code-Snippets`) drives **external** scanners: its operational modes and connection types are
Bluetooth classic, Bluetooth LE, USB SNAPI and USB CDC; its scanner list is "paired via
bluetooth"; its manifest asks for Bluetooth permissions only; its samples name the CS4070,
RFD8500, DS3678, RS5100, LI4278, DS2278. Zebra's documentation says it is not approved for Zebra's
own mobile computers, which use EMDK. It would serve a Zebra Bluetooth or USB scanner on another
brand's host (an RS5100 on a CT40): a package of its own if that is ever wanted. Its AAR is in
`.gitignore`.

**Two ways to the TC22's imager:**

- **DataWedge** (chosen): the scanning service on every Zebra mobile computer, driven by
  broadcast intents (`com.symbol.datawedge.api.ACTION`), no SDK at all. A profile per app
  (associated with its activities) picks the input (barcode), the decoders and the output
  (keystroke, intent, …); the app's own profile with the intent output on and the keystroke
  output off sends its reads to the app and leaves every other app's wedge alone. Zebra
  recommends it for scanning apps.
- **EMDK's Barcode API** (`com.symbol.emdk.barcode`): `compileOnly` from Zebra's Maven repository
  plus the library on the device; a `BarcodeManager` disables DataWedge for the **whole device**
  until the app releases it (the CT40's measured behaviour, again); its lifecycle (asynchronous
  manager, release on every pause, `INVALID_OBJECT` after a reconnection) is the app's to get
  right. Still supported (EMDK 13 lists the TC22), not recommended.

Neither reports trigger presses (DataWedge's `SCANNER_STATUS`: `WAITING`, `SCANNING`, `IDLE`,
`DISABLED`; EMDK's `onStatus` likewise), and neither sends an AIM id.

**DataWedge's intent API, as used** (Zebra's TechDocs and the public samples by Zebra's
developer relations, `darryncampbell/DataWedgeKotlin` and `…/Appforum_2019_DataWedge_API`;
TechDocs itself was not reachable from the session that wrote this, so the names below are to
confirm on the TC22):

- **Commands** (extras of `…api.ACTION`): `SET_CONFIG` (a profile bundle: `PROFILE_NAME`,
  `CONFIG_MODE` `CREATE_IF_NOT_EXIST` / `UPDATE`, `APP_LIST` of `PACKAGE_NAME` +
  `ACTIVITY_LIST`, `PLUGIN_CONFIG` as a list of `PLUGIN_NAME` `BARCODE` / `INTENT` /
  `KEYSTROKE` / `BDF` with `RESET_CONFIG` and a `PARAM_LIST` of strings), `GET_CONFIG`,
  `GET_ACTIVE_PROFILE`, `SWITCH_TO_PROFILE` (refused for a profile associated with an app:
  `PROFILE_HAS_APP_ASSOCIATION`), `SWITCH_SCANNER_PARAMS` (the active profile's barcode
  parameters, until the next profile switch), `SCANNER_INPUT_PLUGIN` (`ENABLE_PLUGIN` /
  `DISABLE_PLUGIN`, the active profile's), `SOFT_SCAN_TRIGGER` (`START_SCANNING` /
  `STOP_SCANNING`), `GET_DATAWEDGE_STATUS`, `GET_VERSION_INFO` (`DATAWEDGE`, `BARCODE_SCANNING`,
  `DECODER_LIBRARY`, `SCANNER_FIRMWARE`), `ENUMERATE_SCANNERS` (`SCANNER_NAME`, `SCANNER_INDEX`,
  `SCANNER_IDENTIFIER`: `INTERNAL_IMAGER`, `INTERNAL_CAMERA`, `BLUETOOTH_ZEBRA`, …),
  `REGISTER_FOR_NOTIFICATION` (`SCANNER_STATUS`, `PROFILE_SWITCH`).
- **Results** on `…api.RESULT_ACTION` (`SEND_RESULT`, `COMMAND_IDENTIFIER`, `RESULT`,
  `RESULT_INFO`), notifications on `…api.NOTIFICATION_ACTION`; DataWedge's intents carry the
  `DEFAULT` category, which a receiver's filter must name.
- **A read** (the intent output): `com.symbol.datawedge.data_string`, `…label_type`
  (`LABEL-TYPE-QRCODE`, `-CODE128`, `-EAN128`, `-EAN13`, `-EAN8`, `-UPCA`, `-UPCE0`,
  `-DATAMATRIX`, `-I2OF5`, …), `…source`, `…decode_data` (the raw bytes), `…decoded_mode`. No
  decode time.
- **Barcode parameters:** a `decoder_*` switch per symbology (`decoder_qrcode`,
  `decoder_code128` with its GS1-128 subtype `decoder_code128_enable_ean128`, `decoder_ean13`,
  `decoder_datamatrix`, `decoder_i2of5`, `decoder_upce0`, …); `decoder_upca_report_check_digit`
  and `decoder_upca_preamble` (`0` none, `1` the number system, `2` with the country code), the
  same for UPC-E0; `charset_name` (`UTF-8`, the default in DataWedge 14's guide, `AUTO`,
  `ISO-8859-1`, `Shift_JIS`, `GB18030`).

**Decisions (taken with the requester):**

| #   | Question | Decision                                                                                                                                                                                                                                                                                                                                  |
| --- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ZD1 | Way      | DataWedge's intents, not EMDK and not the Scanner SDK: no SDK in the package or the app's build, nothing to supply, and the wedge of other apps untouched.                                                                                                                                                                                |
| ZD2 | Hardware | The TC22's internal imager. Zebra Bluetooth scanners (on the TC22 DataWedge reaches them too) and Zebra scanners on other brands' hosts are out.                                                                                                                                                                                          |
| ZD3 | Profile  | The package creates the app's own DataWedge profile, named after the app's package (`profileName` changes it), associated with every activity; it stays on the device. An MDM-managed profile is the app's call.                                                                                                                          |
| ZD4 | Claim    | The claim's decoders written in the app's stored profile (`SET_CONFIG`); `null` puts back the profile's own, kept on the device from before the first write. Not `SWITCH_SCANNER_PARAMS`: on the TC22 it changed no decoder (ZB2). The barcode input enabled on `open()`, disabled on `close()` while the app is in front on its profile. |
| ZD5 | Release  | `@its/scanner-zebra` stays private through the TC22 run (ZB2), as `@its/scanner-honeywell` did through C2.                                                                                                                                                                                                                                |
| ZD6 | Plugin   | None: the only manifest entry (`<queries>` for DataWedge) is in the module's own manifest.                                                                                                                                                                                                                                                |

| Phase | Content                                                                                                                                                         | Release | Status      |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ----------- |
| ZB1   | `packages/scanner-zebra` (private): Kotlin module over DataWedge, adapter, the conformance kit over a fake; the Zebra build of the diagnostics gets the scanner | —       | done        |
| ZB2   | The team runs it on the TC22; fixes from the readings                                                                                                           | —       | in progress |
| ZB3   | `@its/scanner-zebra` publishable: changeset `0.1.0`, trusted publisher, `validate-package` in CI, `release.yml`, the root `build`                               | `0.1.0` | —           |
| ZB4   | The playground's install line, `examples/consumer` and its smoke                                                                                                | —       | —           |

### Phase ZB1 — what landed

- **`packages/scanner-zebra`** (`@its/scanner-zebra`, private), `@its/scanner-honeywell`'s shape:
  - **Kotlin** (`ZebraScannerModule.kt`): no dependency. `open()` checks DataWedge answers and
    is enabled, sets the app's profile up (created if missing, then barcode input, intent
    output as a broadcast to `<package>.GLOWUP_SCAN`, keystroke output and data formatting
    off), registers for `SCANNER_STATUS` and `PROFILE_SWITCH`, checks the active profile is the
    app's (`SWITCH_TO_PROFILE` once, then `unavailable`), switches the claim's symbologies and
    enables the barcode input. Commands wait for their result (5 s) on the module's thread;
    the exported receiver runs on its own. `close()` disables the input only while the profile
    is active (in the background it is another app's). A switch to another profile while the
    app is in front closes with `unavailable`; back to the app's, the claim's switches are sent
    again. Raw diagnostics: every command with its result, the notifications, each read with
    its label type, source and bytes.
  - **Adapter** (`createZebraBarcodeScannerAdapter`, `getZebraBarcodeScannerAdapter`): every
    `BarcodeType`; the software trigger and the scanner info (DataWedge's scanners and
    versions); no trigger events; the type from the label type, the time the arrival; a Zebra
    host with DataWedge installed (`requireZebraHost: false` for a lab test).
  - **Profile parameters:** UTF-8, UPC-A and UPC-E with their check digit and number system,
    UPC-E not converted to UPC-A; with a list, every other decoder off (the GS1 variants of Data
    Matrix and QR left alone).
- **Checked:** the Kotlin compiles with Gradle's `kotlinc` against stubs of the Android classes
  it uses and Expo's DSL, without a warning; the adapter passes the conformance kit (no
  `pressTrigger`: none to report) and its own tests over `fakeNative.ts`, a copy of the module
  and of DataWedge (a stored profile, the claim's switches, reads only for an enabled decoder,
  UPC digits by the profile).
- **`apps/rfid-diagnostics`:** the Zebra build links `@its/scanner-zebra` beside
  `@its/rfid-zebra` (each vendor's `packages` are what the other build leaves out of
  autolinking); the scanner screen runs either vendor (Zebra: the label type for the code id,
  the profile's parameters and the active profile for the properties, DataWedge's commands and
  notifications in the timeline), and `README.md` has the TC22 checklist. The Zebra build still
  needs the RFID SDK's AAR (its RFID module is in it).

**Not verified until the TC22 run** (the checklist measures each):

- that `SET_CONFIG` with `CREATE_IF_NOT_EXIST` and a list of plugins sets the profile up as
  written, and which parameter names DataWedge 15 refuses (each command's result is in the
  report);
- whether DataWedge switches to the new profile at once on the first run, or the app has to come
  to the front again (and what `SWITCH_TO_PROFILE` answers for an associated profile);
- that `SWITCH_SCANNER_PARAMS` turns decoders on and off, and that a profile switch drops it;
- that `charset_name` UTF-8 gives a non-ASCII QR's text right, with and without ECI;
- the digits of an EAN-13, a UPC-A and a UPC-E with the parameters above;
- the label types of the four symbologies and of a GS1-128;
- whether `DISABLE_PLUGIN` lasts past a profile switch, and the wedge in other apps after the
  app has used the scanner;
- what `ENUMERATE_SCANNERS` and `GET_VERSION_INFO` return on the TC22 (names, identifiers,
  firmware order);
- the scanner statuses and profile switches around the background and the software trigger.

### Phase ZB2 — measured on the TC22

The first run (TC22, Android 15, DataWedge 15.0.96, scanning framework 43.63.50.0, decoder library
`IMGKIT_10.04T02.20`; native revision 1), from the report, the screenshots and the requester's
notes:

- **The profile:** created on the first `open()` and associated with the app (`*`), barcode
  input on, intent output to `it.itsolutions.rfiddiagnostics.GLOWUP_SCAN` as a broadcast with the
  `DEFAULT` category, keystroke output off. DataWedge was on it at once: "opening" for about 3 s,
  then open, no error and no `SWITCH_TO_PROFILE`. Profile0 untouched; Notes kept its wedge.
- **The parameters:** `GET_CONFIG` lists 229, among them every name the adapter sends but
  `decoder_us_postnet` and `decoder_us_planet` (no longer sent); `charset_name="UTF-8"`, the UPC
  check digits and preambles and `decoder_upce0_convert_to_upca="false"` as set;
  `decoder_code128_enable_ean128="true"` exists (GS1-128 read as Code 128).
- **Reads** (label type → type, all with `source` `scanner` and `decoded_mode`
  `single_decode`): QR `LABEL-TYPE-QRCODE`, Code 128 `LABEL-TYPE-CODE128`, EAN-13
  `LABEL-TYPE-EAN13` (13 digits), Data Matrix `LABEL-TYPE-DATAMATRIX`, EAN-8 `LABEL-TYPE-EAN8`,
  UPC-A `LABEL-TYPE-UPCA` (12 digits), UPC-E `LABEL-TYPE-UPCE0` (8 digits), GS1-128
  `LABEL-TYPE-EAN128` (`010800123456789710LOT42`, no FNC1 character). A QR with
  `Città perché € ñ ß 日本語` read right with and without the UTF-8 ECI.
- **The wedge:** nothing typed into the app, held or released. With the input disabled
  (`DISABLE_PLUGIN`, "Hold the scanner" off) the trigger does nothing: no beam, no beep.
- **Info:** ten scanners, the camera first (index 0), the imager `INTERNAL_IMAGER` (index 1,
  `IS_DEFAULT_SCANNER`), then Bluetooth and USB ones, not connected; one `SCANNER_FIRMWARE`
  entry, `"2D Barcode Imager: PAAFNS00-002-R06"`: not one per scanner. Fixed: the firmware is
  the entry named after the scanner.
- **Not right:**
  - **An EAN-8 read with the first scope on** (it beeped and reached `onScan`):
    `SWITCH_SCANNER_PARAMS` sent before `ENABLE_PLUGIN` did not hold, and one sent while the
    input was disabled had no answer in 5 s. Its result carried no `RESULT`: with `SEND_RESULT`
    `COMPLETE_RESULT`, the commands but `SET_CONFIG` answered with `COMMAND` and
    `COMMAND_IDENTIFIER` only.
  - **"Unavailable" on the Home button** (three times): DataWedge names the launcher's profile
    before Expo reports the app in the background. The engine reopened by itself on return.
  - **Each command takes about 0.5 s to answer,** so `open()` (four in a row) took about 2 s,
    during which a trigger decoded and the read was dropped.
- **Fixed in native revision 2:** the input enabled before the symbologies; `SEND_RESULT` `true`
  but for `SET_CONFIG`; a switch away from the profile reported only if the app is still in front
  a second later; DataWedge's status checked once per process and the active profile taken from
  its notifications; the input's answer not awaited when a command follows. And a second way to
  set the symbologies, `symbologyMethod: "config"` (`SET_CONFIG` in the stored profile, put back
  on `null`), with a switch in the diagnostics, to keep whichever holds (revision 3 keeps the
  second, below).
- **The first scope** takes EAN-8 (C7, at the requester's ask): the diagnostics, the playground
  page (its out-of-scope label is now a UPC-A) and the consumer. The TC22's checks use UPC-A and
  UPC-E as the codes outside it.
- **The second run (revision 2)** still read UPC-A and UPC-E with the first scope on, with both
  ways. DataWedge's log (`adb logcat -s DWAPI DataWedge`) told why for `SET_CONFIG`: "Key
  PLUGIN_CONFIG expected ArrayList but value was a android.os.Bundle", so the single plugin
  bundle the module sent was ignored (the profile's set-up, sent as a list, applied).
  `SWITCH_SCANNER_PARAMS` answered SUCCESS and DataWedge's log shows it setting the scanner's
  parameters, yet the decoders stayed on. UPC-A unchecked by hand in the app's profile
  (DataWedge → Barcode input → Decoders) stopped the reads: the stored profile's decoders hold.
  The run also showed the module believing the app in the background while it was in front
  (every `close()` read no active profile, and `ENABLE_PLUGIN` answered
  `SCANNER_ALREADY_ENABLED` each time): Expo's activity events are not reliable here.
- **Fixed in native revision 3:** the decoders go in the stored profile only (`SET_CONFIG`, its
  `PLUGIN_CONFIG` a list), `SWITCH_SCANNER_PARAMS` and `symbologyMethod` gone; the profile's own
  values from before the first write kept in `SharedPreferences`, so `null` restores them after a
  restart or a crash too; a value already written not written again (each `SET_CONFIG` reloads
  the profile); the app's place in front read from Android (`ActivityManager.getMyMemoryState`).
- **The third run (revision 3)** still read UPC-A and UPC-E with the first scope on, though the
  decoders' `SET_CONFIG` (now a list) answered SUCCESS for the barcode module and DataWedge
  reloaded the profile. Zebra's `SET_CONFIG` reference: "It is required to specify which scanner
  the configurations apply to either by using `scanner_selection` set to auto,
  `scanner_selection_by_identifier` or `configure_all_scanners`". The profile's set-up named
  it (`scanner_selection: "auto"` among the data parameters, which applied); the decoders' write
  did not, so nothing changed. The same holds for `SWITCH_SCANNER_PARAMS` on a device with more
  than one scanner (`scanner_selection_by_identifier`), which explains the first two runs.
- **Fixed in native revision 4:** every decoder write names `scanner_selection: "auto"` (the
  default scanner's configuration, the one DataWedge's own decoder screen edits).
- **The fourth run (revision 4) holds:** with the first scope on, the decoders' write (37 keys,
  `scanner_selection: "auto"`) answered SUCCESS and two trigger pulls on a UPC-A and a UPC-E
  went `SCANNING` → `WAITING` with no read and no beep; with the scope off the module wrote back
  the 9 decoders whose own value differed (UPC-A, UPC-E, Aztec, Codabar, Code 39, PDF417,
  MaxiCode, GS1 DataBar and its expanded form) and both codes read, 12 and 8 digits. Opening
  took about 2.3 s the first time (the profile's set-up) and 0.5 s for a new request.
- **The diagnostics' settings applied on `open()`** (Honeywell's trigger control, and Zebra's
  symbology method while it existed) remounted the scanner section, which kept the same request: the engine did
  not reopen and the setting waited for the next claim. The screen now lets go of the scanner for
  a moment, and its tests check the new `open()`.

## Open for later

- **Library browsing:** assets and albums, with the `all` / `limited` access and Google Play's
  photo and video permissions policy.
- **Bluetooth in the background:** connections kept alive, iOS state restoration
  (`bluetooth-central` background mode), background scanning and beacon regions.
- **Bluetooth peripheral role** (the phone advertising, e.g. as a badge) and **Bluetooth
  Classic** (SPP: Android only, or MFi hardware on iOS): each needs another native library.
- **Web Bluetooth:** a `pickDevice()` on Chromium's chooser.
