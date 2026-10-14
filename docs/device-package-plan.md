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
  sensors (v0.4).
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

## Open for later

- **Advanced location (v0.4):** background and geofencing, geocoding (and which web
  provider), heading — to be decided before v0.4.
- **Secure store:** proposed and started, see v0.4.
