# @its/glowup-device

Headless device hardware for Expo apps: location, camera (photo, video, barcode and QR
scanning), network, battery, keep-awake, screen orientation, haptics and device info, each behind an adapter the app can
replace.

## Install

```bash
npm install @its/glowup-device
# then the Expo modules of the subpaths you import:
npx expo install expo-device expo-application   # /info
npx expo install expo-location                  # /location
npx expo install expo-camera                    # /camera
npx expo install @react-native-community/netinfo # /network
npx expo install expo-battery                   # /battery
npx expo install expo-keep-awake                # /keep-awake
npx expo install expo-screen-orientation        # /orientation
npx expo install expo-haptics                   # /haptics
```

Expo SDK 57 or later. The design and its trade-offs are recorded in the
[plan](https://github.com/itsolutions-dev/Glowup/blob/master/docs/device-package-plan.md); the
[documentation site](https://itsolutions-dev.github.io/Glowup/device) runs every capability.

## Entry points

| Import                           | Needs                             | Exports                                                             |
| -------------------------------- | --------------------------------- | ------------------------------------------------------------------- |
| `@its/glowup-device`             | nothing native                    | `DeviceAdaptersProvider`, `PermissionState`                         |
| `@its/glowup-device/info`        | `expo-device`, `expo-application` | `useDeviceInfo`                                                     |
| `@its/glowup-device/location`    | `expo-location`                   | `useLocationPermission`, `useCurrentPosition`, `useWatchPosition`   |
| `@its/glowup-device/camera`      | `expo-camera`                     | `CameraView`, `useCameraPermission`                                 |
| `@its/glowup-device/network`     | `@react-native-community/netinfo` | `useNetwork`, `useIsOnline`                                         |
| `@its/glowup-device/battery`     | `expo-battery`                    | `useBattery`                                                        |
| `@its/glowup-device/keep-awake`  | `expo-keep-awake`                 | `useKeepAwake`, `useKeepAwakeSupport`                               |
| `@its/glowup-device/orientation` | `expo-screen-orientation`         | `useOrientation`, `useOrientationLock`, `useOrientationLockSupport` |
| `@its/glowup-device/haptics`     | `expo-haptics`                    | `useHaptics`, `hapticFeedback`                                      |
| `@its/glowup-device/testing`     | nothing native                    | in-memory adapters for every capability                             |

Import a subpath and you need only its Expo modules: an app that reads device info never
installs `expo-camera`.

## Device info

```bash
npx expo install expo-device expo-application
```

```tsx
import { useDeviceInfo } from "@its/glowup-device/info";

function About() {
  const { model, os, deviceType, app } = useDeviceInfo();
  // "Pixel 8 · Android 15 · phone · v2.1.0 (42)"
  return (
    <Text>{`${model} · ${os.name} ${os.version} · ${deviceType} · v${app.version} (${app.build})`}</Text>
  );
}
```

| Field                                | iOS / Android                                     | Web                 |
| ------------------------------------ | ------------------------------------------------- | ------------------- |
| `platform`                           | `Platform.OS`                                     | `"web"`             |
| `model`, `manufacturer`              | from the OS                                       | from the user agent |
| `brand`                              | from the OS                                       | `null`              |
| `os.name`, `os.version`              | from the OS                                       | from the user agent |
| `deviceType`                         | `phone` / `tablet` / `desktop` / `tv` / `unknown` | from the user agent |
| `isEmulator`                         | simulator or emulator                             | `false`             |
| `app.id`, `name`, `version`, `build` | native bundle values                              | `null`              |

In **Expo Go**, `app` describes Expo Go itself, not your app: read your version from
`expo-constants` there, or use a development build.

On a **statically exported** web page the first render reports every field as unknown
(`null`, `"unknown"`, `false`) — the prerender runs in Node, which has no user agent — and
the browser's values arrive right after hydration.

## Location

Foreground only: the permission, one position, a watch.

```bash
npx expo install expo-location
```

```tsx
import {
  useCurrentPosition,
  useLocationPermission,
  useWatchPosition,
} from "@its/glowup-device/location";

function NearbyShops() {
  const permission = useLocationPermission();
  const granted = permission.status === "granted";
  const { position, error, isLoading, refresh } = useCurrentPosition({
    enabled: granted,
    maxAge: 60_000, // a fix up to a minute old is fine
  });

  if (permission.isLoading) return null;
  if (!granted) {
    return permission.canAskAgain ? (
      <Button title="Use my location" onPress={permission.request} />
    ) : (
      <Button title="Open settings" onPress={permission.openSettings} />
    );
  }
  if (permission.precision === "approximate") {
    // The user granted an approximate location only (iOS 14+, Android 12+).
  }
  // error?.code: "services-disabled" | "unavailable" | "timeout" | …
}

// Following the user while a screen is open:
const { position } = useWatchPosition({
  accuracy: "high",
  distanceInterval: 10,
});
```

- **The hooks never prompt.** Only `useLocationPermission().request()` shows the OS prompt;
  without the permission, `useCurrentPosition` and `useWatchPosition` end in a
  `permission-denied` error. Every component calling `useLocationPermission()` shares one
  state, and it is re-read when the app returns to the foreground.
- **Errors** are `LocationError`s with a `code`: `permission-denied`, `services-disabled`
  (location is off for the whole device), `unavailable`, `timeout`, `unsupported`.
- **`useCurrentPosition`** reads on mount (`enabled`, default true) and on `refresh()`. It
  times out after `timeout` ms (default 15000: expo-location has no timeout of its own on
  native). With `maxAge` it first accepts a cached fix that recent, without waking the GPS.
- **Web** uses `navigator.geolocation` directly. It needs a secure context (HTTPS or
  localhost), cannot tell disabled services from a missing fix (both are `unavailable`) and
  does not report precision (`null`).

## Camera

A preview with no controls of its own — draw yours as its children — plus photos, video
(iOS and Android) and barcode / QR scanning.

```bash
npx expo install expo-camera
```

```tsx
import { useRef } from "react";
import {
  CameraView,
  useCameraPermission,
  type CameraHandle,
} from "@its/glowup-device/camera";

function TicketScanner({ onTicket }: { onTicket: (code: string) => void }) {
  const permission = useCameraPermission();
  if (permission.status !== "granted") {
    return <Button title="Allow the camera" onPress={permission.request} />;
  }
  return (
    <CameraView
      style={{ flex: 1 }}
      onBarcodeScanned={(barcode) => onTicket(barcode.data)}
      // barcodeTypes defaults to ["qr"]; list others explicitly
    />
  );
}

function Recorder() {
  const camera = useRef<CameraHandle>(null);
  const permission = useCameraPermission({ microphone: true }); // sound in videos
  const record = async () => {
    const video = await camera.current?.recordVideo({ maxDuration: 30 }); // default 60 s
    // video.uri: a cache file; move it to keep it
  };
  return (
    <CameraView ref={camera} mode="video" style={{ flex: 1 }}>
      {/* your controls: record, camera.current?.stopRecording(), takePicture() */}
    </CameraView>
  );
}
```

- **`CameraView` never asks for the permission**: gate it on `useCameraPermission()`, whose
  `status` is also where an unsupported platform shows (`"unsupported"`).
- **`useCameraPermission({ microphone: true })`** asks for the camera, then — only once it is
  granted — the microphone; `status` is the weaker of the two. Without the microphone, record
  with `mute`.
- **Captures** go through the ref: `takePicture({ quality, base64 })` (no base64 unless
  asked: it is megabytes of string in JS memory), `recordVideo({ maxDuration, maxFileSize })`
  (needs `mode="video"`; resolves on `stopRecording()` or a limit), `stopRecording()`.
  Results are files in the cache directory. Errors are `CameraError`s with a `code`:
  `permission-denied`, `unavailable`, `not-ready` (capture before `onReady`),
  `invalid-mode`, `capture-failed`, `unsupported`.
- **Scanning** is on while `onBarcodeScanned` is set. The same code is reported once per
  `scanInterval` (default 1000 ms), because scanners fire on every frame the code stays in
  view. `type` is normalised (`"qr"`, `"ean13"`, …, or `"unknown"` with `rawType`).
- **`active={false}`** pauses the preview without unmounting it: do it when the screen loses
  focus.
- **Web**: preview, pictures (`uri` is a data URI) and scanning (`BarcodeDetector`, or a
  bundled polyfill) work over HTTPS; **video recording does not** — `recordVideo()` rejects
  with `unsupported`, and `microphone: true` is ignored. A statically exported page mounts the
  preview after hydration.

## Network

The connection, kept live. One platform subscription is shared by every component that asks,
and closed when the last one unmounts.

```bash
npx expo install @react-native-community/netinfo
```

```tsx
import { useIsOnline, useNetwork } from "@its/glowup-device/network";

function SyncBanner() {
  const online = useIsOnline(); // true / false, or null while unknown
  if (online === false)
    return <Banner message="You are offline: changes sync later." />;
  return null;
}

function UploadButton() {
  const { isExpensive, type } = useNetwork();
  // Hold back on a metered connection.
  return (
    <Button disabled={isExpensive === true}>{`Upload over ${type}`}</Button>
  );
}
```

- **`null` means unknown, never "no".** Every field starts `null` (and `isLoading` true) until
  the platform's first answer, and stays `null` where the platform cannot tell.
- **`isConnected`** says a network interface is up; **`isInternetReachable`** says the internet
  answers. `useIsOnline()` prefers the second and falls back to the first.
- **iOS and Android** use netinfo, which probes reachability itself (tune its URL with
  `NetInfo.configure()`; the adapter reads netinfo's global instance).
- **Web** reads `navigator.onLine`, the `online` / `offline` events and the Network Information
  API where there is one (Chromium: `type`, `saveData`). A browser cannot know whether the
  internet answers without a request of its own, so `isInternetReachable` is `null` while online.
  netinfo's own web build is not used: it probes `HEAD /` on the page's origin every minute and
  counts anything but a 200 as offline, which is wrong for an app served under a subpath.

## Battery

Level, charging state and Low Power Mode, kept live (one shared subscription, like network).

```bash
npx expo install expo-battery
```

```tsx
import { useBattery } from "@its/glowup-device/battery";

function SyncSettings() {
  const { level, charging, lowPowerMode } = useBattery();
  // Defer the heavy sync on a low battery that is not charging.
  const defer =
    lowPowerMode === true ||
    (charging === "unplugged" && level !== null && level < 0.2);
  return <Text>{defer ? "Sync paused to save battery" : "Syncing"}</Text>;
}
```

- **`isAvailable`** is false where there is nothing to read: a simulator, a browser without
  the Battery Status API. `level` (0 to 1) and `lowPowerMode` are `null` when unknown;
  `charging` is `"unknown" | "unplugged" | "charging" | "full"`.
- **iOS and Android** use expo-battery. `lowPowerMode` is iOS Low Power Mode or Android
  Battery Saver.
- **Web** reads the Battery Status API directly (Chromium only; Firefox and Safari report
  `isAvailable: false`). A desktop on mains power reads as `full`. `lowPowerMode` is always
  `null`: no browser exposes it. expo-battery's web build is not used: its change listeners
  throw in a browser and it reports Low Power Mode as `false` where it cannot know.

## Keep awake

Keep the screen on while a component is mounted: a scanner, a turn-by-turn screen, a recipe.

```bash
npx expo install expo-keep-awake
```

```tsx
import { useKeepAwake } from "@its/glowup-device/keep-awake";

function ScannerScreen() {
  useKeepAwake();
  return <CameraView mode="scan" />;
}

function Upload({ busy }: { busy: boolean }) {
  useKeepAwake({ enabled: busy }); // only while the upload runs
  return <LinearProgress indeterminate={busy} />;
}
```

- **Each mounted hook holds its own tag**, so the screen sleeps again only once the last one
  lets go.
- **Imperative use.** In React, drive it with `enabled`. Outside React, call the adapter for
  the platform yourself (`expoKeepAwakeAdapter` / `webKeepAwakeAdapter`, `activate(tag)` /
  `deactivate(tag)`); `DeviceAdaptersProvider` does not reach that code.
- **Web** holds a Screen Wake Lock (a secure context; every current browser). The browser drops
  the lock whenever the tab is hidden, and the adapter takes it again when the tab shows.
  `useKeepAwakeSupport()` says whether it can work here (false while a static page hydrates).
  expo-keep-awake's web build is not used: it never re-acquires after a tab switch, and a
  deactivation that beats the pending request leaks the lock.

## Orientation

The interface orientation, kept live, and locks that last as long as the component that asks.

```bash
npx expo install expo-screen-orientation
```

```tsx
import {
  useOrientation,
  useOrientationLock,
} from "@its/glowup-device/orientation";

function Gallery() {
  const { isLandscape } = useOrientation();
  return <Grid columns={isLandscape ? 4 : 2} />;
}

function VideoPlayer() {
  const { error } = useOrientationLock("landscape"); // until unmount
  return <Video fullscreen hint={error ? "Rotate your phone" : undefined} />;
}
```

- **The interface, not the device.** `orientation` is how the app is drawn
  (`portrait-up | portrait-down | landscape-left | landscape-right | unknown`): an app held in
  portrait reads portrait whichever way the phone is turned. Left and right follow iOS's names,
  on every platform.
- **Locks:** `any | portrait | landscape | landscape-left | landscape-right`. `portrait` is
  upright only (iPhones without a home button refuse upside down, and with it the whole lock).
- **Scoped and stacked.** A lock holds while its component is mounted (and `enabled`). The most
  recent wins; when it lets go the previous one applies again, and after the last one the
  orientation goes back to **the app's own configuration** (app.json `orientation`), not to
  "anything goes": expo-screen-orientation's `unlockAsync()` would let a portrait-only app
  rotate, so the adapter saves the app's lock before the first one and restores it.
- **Errors are state.** A refused lock sets `error` (`OrientationError`, code `unsupported` or
  `failed`); nothing is thrown.
- **iPad:** iOS ignores orientation locks while the app supports multitasking (Split View, Slide
  Over). Set `ios.requireFullScreen: true` in app.json for locks to apply there.
- **Web** reads `screen.orientation` directly. Reading works in every current browser;
  **locking almost never does**: only mobile Chromium in fullscreen allows it. Desktop Chromium
  has the API and refuses every lock (`NotSupportedError`), so `useOrientationLockSupport()`
  only says whether the API exists; the lock's `error` (`code: "unsupported"`) is the real
  answer. expo-screen-orientation's web build is not used: its unlock calls `lock("natural")`,
  a lock that also rejects outside fullscreen.

## Haptics

Haptic feedback, and the bridge to `@its/glowup-ui`'s controls.

```bash
npx expo install expo-haptics
```

```tsx
import { hapticFeedback, useHaptics } from "@its/glowup-device/haptics";

// Every Glowup button, switch, radio, chip and stepped slider answers with the
// platform's own feedback:
<ThemeProvider onInteractionFeedback={hapticFeedback}>
  <App />
</ThemeProvider>;

function SaveButton() {
  const haptics = useHaptics();
  const save = async () => {
    const ok = await submit();
    haptics.notification(ok ? "success" : "error");
  };
  return <Button onPress={save}>Save</Button>;
}
```

- **`useHaptics()`** → `{ isSupported, impact(style?), notification(type), selection(),
interaction(kind) }`. Every call resolves, never rejects, and does nothing where unsupported;
  the functions are stable across renders.
- **`hapticFeedback(kind)`** plays `interaction(kind)` on the default adapter, ready for
  `onInteractionFeedback`. It does not see `DeviceAdaptersProvider`: to route through a provided
  adapter, pass `useHaptics().interaction` instead. The kinds (`press`, `toggle`, `selection`,
  `longPress`) are the same strings as `@its/glowup-ui`'s; neither package imports the other.
- **iOS:** press and toggle are a light impact, selection is the selection tick, long press a
  medium impact.
- **Android:** interactions go through `View.performHapticFeedback` (`VIRTUAL_KEY`,
  `CONTEXT_CLICK`, `CLOCK_TICK`, `LONG_PRESS`), which honours the user's "touch feedback"
  setting and exists on every API level. The explicit `impact`, `notification` and `selection`
  use the vibrator (expo-haptics), which does not.
- **Web:** nothing. Browsers have no haptics API; expo-haptics' web build buzzes
  `navigator.vibrate` (Android Chrome) or clicks a hidden `<input switch>` on iOS Safari. Pass
  your own adapter if you want that.

## Config plugin

The package's plugin configures the native projects for the capabilities you list, through
each Expo module's own plugin:

```ts
// app.config.ts
plugins: [
  [
    "@its/glowup-device",
    {
      location: { whenInUsePermission: "Shows the shops near you." },
      camera: {
        cameraPermission: "Scans the QR code on your ticket.",
        // Only to record sound with videos:
        microphonePermission: "Records your voice in video reviews.",
        recordAudio: true,
      },
    },
  ],
],
```

- **Location** sets the iOS purpose strings to your text (also the "Always" ones, which
  expo-location's binary needs present; the package never asks for Always) and adds Android's
  coarse and fine location permissions only — no background location, no foreground service.
- **Camera** sets the camera purpose string and Android's `CAMERA`. `recordAudio: true` adds
  `RECORD_AUDIO` and makes the microphone text required (iOS always carries one, as
  expo-camera's plugin does; without `recordAudio` the app never asks).
  `barcodeScanner: false` leaves the scanning libraries out of the build.
- A capability you do not list is not configured, and its Expo module is not loaded.
- **Write a real purpose string.** Without one the plugin uses a generic text and warns:
  App Store review rejects purpose strings that do not say why the app needs the data.
- Expo Go ignores config plugins; you need it for development builds and production.

## Swapping an adapter

Every capability reads its hardware through an adapter, and the Expo one is the default.
`DeviceAdaptersProvider` replaces any of them for its subtree (nested providers inherit what
they do not set):

```tsx
import { DeviceAdaptersProvider } from "@its/glowup-device";

<DeviceAdaptersProvider adapters={{ info: myDeviceInfoAdapter }}>
  <App />
</DeviceAdaptersProvider>;
```

## Testing

`@its/glowup-device/testing` ships in-memory adapters, so tests depend on this package's
contract rather than on mocks of Expo modules:

```tsx
import { DeviceAdaptersProvider } from "@its/glowup-device";
import { createMockDeviceInfoAdapter } from "@its/glowup-device/testing";

render(
  <DeviceAdaptersProvider
    adapters={{ info: createMockDeviceInfoAdapter({ deviceType: "tablet" }) }}
  >
    <Screen />
  </DeviceAdaptersProvider>,
);
```

`MOCK_DEVICE_INFO` is the default answer (an iPhone); overrides merge `os` and `app` field by
field.

`createMockLocationAdapter()` starts undetermined and grants on `request()`; drive it from the
test (create one per test: permission state is shared per adapter):

```tsx
const location = createMockLocationAdapter({ permission: "granted" });
render(
  <DeviceAdaptersProvider adapters={{ location }}>
    <MapScreen />
  </DeviceAdaptersProvider>,
);
location.emit(buildPosition({ latitude: 45.46, longitude: 9.19 })); // to every watch
location.fail("unavailable");
location.setPosition("pending"); // getCurrentPosition never settles: test the timeout
```

`createMockCameraAdapter()` renders a plain `View` (`testID="mock-camera-preview"`) and
captures without hardware:

```tsx
const camera = createMockCameraAdapter({ camera: "granted" });
render(
  <DeviceAdaptersProvider adapters={{ camera }}>
    <TicketScanner onTicket={onTicket} />
  </DeviceAdaptersProvider>,
);
camera.scan({ data: "TICKET-42" }); // reaches onBarcodeScanned if "qr" is scanned for
camera.preview?.facing; // the props CameraView handed the preview
camera.finishRecording(); // ends a recordVideo() with MOCK_VIDEO
```

`createMockNetworkAdapter()` starts online on Wi-Fi (`MOCK_NETWORK`); `setState(OFFLINE_NETWORK)`
notifies every listening component, as a platform event would.

`createMockBatteryAdapter()` starts at 80 % unplugged (`MOCK_BATTERY`); `setStatus({ level: 0.1 })`
notifies every listening component. `createMockKeepAwakeAdapter()` records the active tags:
assert on `isAwake` (`{ supported: false }` stands in for a browser without the API).

`createMockOrientationAdapter()` starts in `portrait-up`; a lock rotates it to match, as a device
would, and `calls` records every lock and unlock (`"unlock"`). `{ lockable: false }` stands in
for a browser that refuses every lock; `setOrientation("landscape-left")` rotates it by hand.

`createMockHapticsAdapter()` records every haptic in `events` (`{ type: "interaction", kind:
"press" }`, …); `clear()` empties it.
