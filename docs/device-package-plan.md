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
  no background permission.
- `./app.plugin.js` goes in `exports` and `files`; it uses `expo/config-plugins`, so `expo`
  becomes a peer.

## Phases

| Phase | Content                                                                                                                       | Status   |
| ----- | ----------------------------------------------------------------------------------------------------------------------------- | -------- |
| 1     | Scaffolding: workspace, export map + fallback folders, core (permission model, platform guards), ESLint boundaries, build, CI | **done** |
| 2     | Device info: adapter contract, Expo adapter, `DeviceAdaptersProvider`, hooks, mock adapter                                    |          |
| 3     | Location: permission, current position, watch; config plugin (location part)                                                  |          |
| 4     | Camera: `CameraView`, photo, video, barcode/QR; config plugin (camera part)                                                   |          |
| 5     | Playground: pages, camera recipe, `app.config.ts` plugin, tsconfig paths                                                      |          |
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

### To verify in phase 4

Whether `expo-camera` on web supports video recording and barcode scanning in SDK 57. If
not, those APIs reject on web through `assertSupported()`.

## Open for v2 (to discuss at the end of v1)

- A `/camera/ui` subpath with MD3 camera components (it would need `@its/glowup-ui` as a peer).
- Location: background and geofencing (`expo-task-manager`, development build), geocoding and
  reverse geocoding, heading.
- Gallery: `expo-image-picker` / `expo-media-library`.
- Device: battery, network, haptics, sensors, biometrics, orientation, keep-awake.
