# @its/glowup-device

Headless device hardware for Expo apps: location, camera (photo, video, barcode and QR
scanning), network, battery, keep-awake, screen orientation, haptics, biometrics, secure storage, motion and environment sensors, the photo and video
picker, saving to the photo library and device info, each
behind an adapter the app can replace.

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
npx expo install expo-local-authentication      # /biometrics
npx expo install expo-secure-store              # /secure-store
npx expo install expo-sensors                   # /sensors
npx expo install expo-image-picker              # /media-picker
npx expo install expo-media-library             # /media-library
npx expo install expo-location expo-task-manager # /background-location
npx expo install react-native-ble-manager       # /bluetooth
```

Expo SDK 57 or later. The design and its trade-offs are recorded in the
[plan](https://github.com/itsolutions-dev/Glowup/blob/master/docs/device-package-plan.md); the
[documentation site](https://itsolutions-dev.github.io/Glowup/device) runs every capability.

## Entry points

| Import                                   | Needs                                | Exports                                                                                                                                |
| ---------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `@its/glowup-device`                     | nothing native                       | `DeviceAdaptersProvider`, `PermissionState`                                                                                            |
| `@its/glowup-device/info`                | `expo-device`, `expo-application`    | `useDeviceInfo`                                                                                                                        |
| `@its/glowup-device/location`            | `expo-location`                      | `useLocationPermission`, `useCurrentPosition`, `useWatchPosition`, `useHeading`, `useGeocoder`                                         |
| `@its/glowup-device/camera`              | `expo-camera`                        | `CameraView`, `useCameraPermission`                                                                                                    |
| `@its/glowup-device/network`             | `@react-native-community/netinfo`    | `useNetwork`, `useIsOnline`                                                                                                            |
| `@its/glowup-device/battery`             | `expo-battery`                       | `useBattery`                                                                                                                           |
| `@its/glowup-device/keep-awake`          | `expo-keep-awake`                    | `useKeepAwake`, `useKeepAwakeSupport`                                                                                                  |
| `@its/glowup-device/orientation`         | `expo-screen-orientation`            | `useOrientation`, `useOrientationLock`, `useOrientationLockSupport`                                                                    |
| `@its/glowup-device/haptics`             | `expo-haptics`                       | `useHaptics`, `hapticFeedback`                                                                                                         |
| `@its/glowup-device/biometrics`          | `expo-local-authentication`          | `useBiometrics`, `useAppLock`                                                                                                          |
| `@its/glowup-device/secure-store`        | `expo-secure-store`                  | `useSecureStore`, `useSecureValue`, `SecureStoreError`                                                                                 |
| `@its/glowup-device/sensors`             | `expo-sensors`                       | `useAccelerometer` and the other sensors, `useDeviceMotion`, `useDeviceOrientation`, `useSensorPermission`                             |
| `@its/glowup-device/media-picker`        | `expo-image-picker`                  | `useMediaPicker`                                                                                                                       |
| `@its/glowup-device/media-library`       | `expo-media-library`                 | `useMediaLibrary`                                                                                                                      |
| `@its/glowup-device/background-location` | `expo-location`, `expo-task-manager` | `defineLocationTask`, `useBackgroundLocation`, `defineGeofenceTask`, `useGeofencing`, `useBackgroundLocationPermission`                |
| `@its/glowup-device/bluetooth`           | `react-native-ble-manager`           | `useBluetoothState`, `useBluetoothPermission`, `useBluetoothScan`, `useBluetoothDevice`, `useBluetoothNotifications`, `BluetoothError` |
| `@its/glowup-device/rfid`                | a vendor package (`@its/rfid-*`)     | `useRfidReader`, `useRfidInventory`, `useRfidLocate`, `useRfidSingleRead`, `useRfidTrigger`, `RfidAdapter`, `RfidError`                |
| `@its/glowup-device/testing`             | nothing native                       | in-memory adapters for every capability                                                                                                |

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

Foreground only: the permission, one position, a watch, the compass, geocoding.

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

### Compass

```tsx
import { useHeading } from "@its/glowup-device/location";

function CompassNeedle() {
  const { heading, error } = useHeading(); // { enabled } pauses it
  if (error) return null; // "permission-denied" | "unsupported" | "unavailable"
  if (!heading) return <Spinner />;
  const degrees = heading.trueHeading ?? heading.magneticHeading;
  return (
    <Needle rotation={-degrees} calibrate={heading.accuracy === "unreliable"} />
  );
}
```

- **Where the top edge of the device points**, in degrees from 0 up to 360: `magneticHeading`
  always, `trueHeading` (geographic north) or `null` while the platform cannot compute it
  (Android needs a position to take the declination from). `accuracy` is `high`, `medium`,
  `low` or `unreliable` (time to calibrate). Android does not adjust for the display's rotation
  and reports a change of about 2° or more.
- **It needs the location permission** (not the location services: the compass is the
  magnetometer) and never prompts: without it the hook ends in `permission-denied`.
- **One native watch** for every component that reads it (Android keeps a single one), stopped
  while the app is in the background and closed with the last reader. A failure reaches every
  reader; the watch reopens when a component subscribes again.
- **No compass:** iOS reports `unavailable`; an Android device without a magnetometer never
  emits, so `heading` stays `null`. The web is `unsupported`, and so is an adapter without the
  optional `watchHeading` method.

### Geocoding

```tsx
import { useGeocoder } from "@its/glowup-device/location";

function AddressSearch() {
  const geocoder = useGeocoder();
  if (!geocoder.isSupported) return null; // the web, unless you supply a provider

  const search = async (text: string) => {
    try {
      const places = await geocoder.geocode(text); // [] when nothing matches
      // places[0]: { latitude, longitude, accuracy }
    } catch (error) {
      // LocationError: "permission-denied" (Android), "unavailable", "timeout", "unsupported"
    }
  };

  // The other way, from a position:
  // const [address] = await geocoder.reverseGeocode(position.coords);
  // address?.city, address?.street, address?.formattedAddress (Android) …
}
```

- **The platform's own geocoder:** Apple's on iOS, `android.location.Geocoder` on Android. Not a
  search box: one result on Android, a few on iOS, and Apple limits the request rate, so
  debounce what the user types. Nothing is cached.
- **Android needs the location permission** (iOS does not): without it a call rejects with
  `permission-denied`; ask with `useLocationPermission().request()`. It also refuses while the
  app is in the background (`unavailable`) and has no geocoder at all without Google Play
  services (`unsupported`).
- **Nothing found is `[]`**, never an error. Network failures and Apple's throttling are both
  `unavailable` (iOS reports them as one error). A call rejects with `timeout` after
  `{ timeout }` ms (default 15000); an empty address or a point off the globe throws a
  `TypeError` / `RangeError` before anything is sent.
- **Addresses** have the same parts on both platforms, `null` where unknown: `timezone` is iOS
  only, `formattedAddress` Android only, and Android's `name` is often just the street number.
  `accuracy` (metres) is iOS only.
- **The web has no geocoder** (expo's web build answers `[]`, which would read as "nothing
  found"). Supply your own provider, on the web or everywhere, as a `GeocoderAdapter`:

```tsx
import { Platform } from "react-native";
import { DeviceAdaptersProvider } from "@its/glowup-device";
import {
  expoGeocoderAdapter,
  LocationError,
  type GeocoderAdapter,
} from "@its/glowup-device/location";

const myGeocoder: GeocoderAdapter = {
  isSupported: () => true,
  async geocode(address) {
    const response = await fetch(
      `https://geo.example.com/search?q=${encodeURIComponent(address)}`,
    );
    if (!response.ok)
      throw new LocationError("unavailable", `HTTP ${response.status}`);
    const hits: { lat: number; lon: number }[] = await response.json();
    return hits.map(({ lat, lon }) => ({
      latitude: lat,
      longitude: lon,
      accuracy: null,
    }));
  },
  async reverseGeocode({ latitude, longitude }) {
    // The same, into GeocodedAddress objects (every part, null where unknown).
    return [];
  },
};

<DeviceAdaptersProvider
  adapters={{
    geocoder: Platform.OS === "web" ? myGeocoder : expoGeocoderAdapter,
  }}
>
  <App />
</DeviceAdaptersProvider>;
```

Any other error the adapter throws reaches the app as `unavailable`.

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

## Biometrics

A local gate: the device owner proves they are present with a fingerprint, a face or the
device passcode before the app shows something.

```bash
npx expo install expo-local-authentication
```

```tsx
import { useBiometrics } from "@its/glowup-device/biometrics";

function RevealCard({ onReveal }: { onReveal(): void }) {
  const biometrics = useBiometrics();
  const reveal = async () => {
    const result = await biometrics.authenticate({
      promptMessage: "Mostra i dati della carta",
      cancelLabel: "Annulla",
    });
    if (result.success) onReveal();
    else if (result.error === "lockout")
      showMessage("Sblocca il telefono e riprova.");
  };
  return (
    <Button onPress={reveal} disabled={biometrics.level === "none"}>
      Mostra
    </Button>
  );
}
```

- **It is not authentication.** `success: true` says someone who can unlock this phone is
  holding it; it proves nothing to a server, and a rooted device can skip it. To protect a
  secret with biometrics, keep it in the keychain/keystore, not behind this gate.
- **`useBiometrics()`** → the status (`hasHardware`, `isEnrolled`, `types`: `fingerprint` /
  `face` / `iris`, `level`: `none` / `passcode` / `biometric-weak` / `biometric-strong`),
  `isSupported`, `isLoading`, `isAuthenticating`, `authenticate(options)` and `cancel()`. The
  status is read again when the app returns to the foreground (the user may have enrolled a
  finger in the settings).
- **`authenticate()` resolves with the outcome and never rejects for one:** a cancel is not an
  exception. `{ success: false, error }` with `error` one of `cancelled`, `fallback`, `lockout`,
  `not-enrolled`, `unavailable`, `busy`, `unsupported`, `failed`, plus a `detail` for logs. It
  rejects only on a programming error (an empty `promptMessage` or `cancelLabel`).
- **Labels are required.** `promptMessage` and `cancelLabel` have English defaults in
  expo-local-authentication, which an app in another language would show.
- **One prompt at a time, across the package.** While one is open, another `authenticate()`
  (from any component) or a protected secure-store item resolves `busy` at once: Android would
  answer `app_cancel` and iOS would stack a second evaluation. `cancel()` dismisses it on Android; iOS has no such API.
- **Fallback.** `fallback: "passcode"` (default) offers the device PIN, pattern or password
  when biometrics fail or are missing, so `success` does not say a biometric was used.
  `fallback: "none"` is biometrics only: the iOS "Enter Password" button resolves `fallback`,
  and a user in `lockout` stays locked out, so the app needs its own way in.
- **Android strength.** `strength: "weak"` (default) admits class 2 biometrics such as a
  camera-based face unlock; `"strong"` only class 3. AndroidX cannot combine `strong` with the
  passcode on Android 9 and 10 (and expo-local-authentication hangs when asked to), so there
  `strong` prompts for biometrics only.
- **Face ID** needs a purpose string (`biometrics.faceIDPermission` in the config plugin).
  Without it iOS does not fail: it quietly falls back to the passcode, or resolves
  `unavailable` with `fallback: "none"`. In development the package warns once.
- **Web:** unsupported (`isSupported` false, `authenticate()` resolves `unsupported`).

### App lock

`useAppLock()` decides when the whole app is locked; the app draws the lock screen.

```tsx
import { useAppLock } from "@its/glowup-device/biometrics";

function Root() {
  const [lockEnabled] = useSetting("appLock"); // the app's own preference
  const lock = useAppLock({
    enabled: lockEnabled,
    relockAfter: 0,
    prompt: { promptMessage: "Sblocca l'app", cancelLabel: "Annulla" },
  });
  if (lock.isLocked) {
    return <LockScreen onUnlock={lock.unlock} busy={lock.isAuthenticating} />;
  }
  return <App />;
}
```

- **When it locks:** at a cold start (until `unlock()` succeeds) and when the app comes back
  from the background after `relockAfter` ms (default `0`: as soon as it leaves), or on `lock()`.
  The time is measured from the `background` event, since timers do not run there.
- **`inactive` never locks.** Face ID's own prompt takes the app through it, as do the control
  centre and an incoming call banner.
- **A trip to the background caused by a prompt does not count** (Android pauses the app behind
  the device-credential screen), so a successful unlock does not lock again. The other side of
  it: a user who leaves the app while a prompt is open finds it unlocked if it was.
- **On Android** a permission dialog, a share sheet or another library's picker also sends the
  app to the background: with `relockAfter: 0` the user unlocks again on return. Give it a few
  seconds if your app opens them. `/media-picker`'s picker does not count, like a prompt.
- **One lock for the whole app.** Every component calling `useAppLock` shares it; the strictest
  options win (enabled if any is, the shortest `relockAfter`, `stay-locked` if any asks). While
  the status loads, `isLocked` is true: nothing shows behind a lock that is still deciding (and
  a statically exported page renders locked).
- **`promptOnLock: true`** shows the prompt by itself when the app locks and is in the
  foreground, at most once per lock: a cancel is not asked again until the next lock.
  Default false: the lock screen has an unlock button.
- **A device with nothing to authenticate with** (no lock screen; with `prompt.fallback:
"none"`, no enrolled biometrics) cannot be unlocked. `whenUnavailable: "unlock"` (default)
  leaves the app open, with `isLockable` false so it can say so; `"stay-locked"` keeps it shut,
  for apps that must not run unprotected.
- **Turning it on from a settings screen:** call `unlock()` first and save the setting on
  success. The lock state survives `enabled: false`, so enabling it without that would lock the
  app at once if it was never unlocked.
- Not covered: hiding the content in the iOS app switcher's snapshot (taken on `inactive`,
  which the Face ID prompt also triggers).

## Secure store

Small secrets — tokens, keys — in the Keychain on iOS and in Keystore-encrypted storage on
Android.

```bash
npx expo install expo-secure-store
```

```tsx
import {
  useSecureStore,
  useSecureValue,
} from "@its/glowup-device/secure-store";

function SessionGate() {
  const token = useSecureValue("token", { service: "auth" });
  if (token.isLoading) return <Spinner />;
  return token.value ? <Home /> : <SignIn onToken={token.set} />;
}

async function signOut(store: ReturnType<typeof useSecureStore>) {
  await store.remove("token", { service: "auth" }); // every reader sees null
}
```

- **`useSecureStore()`** → `{ isSupported, get, set, remove, getJSON, setJSON }`, stable across
  renders. Every function rejects with a `SecureStoreError` whose `code` is `invalid-key`,
  `invalid-value`, `locked`, `unsupported` or `failed` (`isSecureStoreError()` checks it).
- **`useSecureValue(key, options?)`** → `{ value, isLoading, error, set, remove }`. One read per
  key and service, shared by every component; a write through the package (either hook)
  reaches every reader at once. A failed read is tried again when the app returns to the
  foreground. It never shows a prompt.
- **Keys** contain only letters, digits, `.`, `-` and `_`. **Values** are strings; the JSON
  helpers serialise for you.
- **`service`** is a namespace: an item is read under the service it was written with.
- **iOS accessibility** (applied when writing): `accessible: "when-unlocked"` (default) can be
  read only while the device is unlocked, so a background task gets `locked`;
  `"after-first-unlock"` can be read while locked, once the device has been unlocked since boot.
  `thisDeviceOnly: true` (default; expo's is false) keeps the item out of backups and device
  migration. To make sure an existing item takes the options asked for, iOS writes delete it
  first (expo's update would keep the old accessibility): a crash between the two loses it.
- **The iOS Keychain outlives the app:** an item is still there after the app is deleted and
  installed again; on Android it goes with the app. To start clean after a reinstall, keep a
  "first run" flag in ordinary storage (it does not survive) and remove your items when it is
  missing.
- **Web:** unsupported, with no `localStorage` fallback (any script on the origin could read
  it). Provide your own adapter if that trade-off is yours to make.

### Protected items

An item only the enrolled biometrics open: reading it shows the system prompt. This is what
binds a secret to biometrics, which `/biometrics` alone cannot do.

```tsx
const store = useSecureStore();

const saved = await store.setProtected("refreshToken", token, {
  prompt: "Ricorda l'accesso con Face ID",
  service: "auth",
});

const read = await store.getProtected("refreshToken", {
  prompt: "Accedi con Face ID",
  service: "auth",
});
switch (read.status) {
  case "ok":
    return signInWith(read.value);
  case "invalidated": // a finger or a face was added or removed since
    return askToSignInAgain("Le tue biometrie sono cambiate: accedi di nuovo.");
  case "missing":
  case "cancelled":
    return showPasswordForm();
  default:
    return showPasswordForm(read.status); // lockout, unavailable, locked, busy, failed
}
```

- **Every outcome resolves** as `{ status }`: `ok` (with `value`), `missing`, `invalidated`,
  `cancelled`, `lockout`, `unavailable`, `locked`, `busy`, `unsupported`, `failed` (with the
  platform's message in `detail`). It rejects only on an invalid key or value and an empty
  `prompt` (required: expo-secure-store shows a blank title on Android without one).
  `removeProtected()` shows no prompt and rejects like `remove()`.
- **`invalidated`.** Both platforms destroy a protected item when the enrolled biometrics change,
  and both report it as "no item". The package writes a plain marker beside each protected
  item, so a read that finds the marker but no item says `invalidated` rather than `missing`.
- **Biometrics only, no passcode.** iOS uses the current biometry set; Android requires class 3
  (strong) biometrics. A device without enrolled biometrics gets `unavailable`: keep a way in
  that does not depend on them.
- **When the prompt shows:** iOS asks to read, not to write; Android asks for both, the first
  write included.
- **A service per item.** Each protected item lives under a service derived from `service` and
  its key: on Android, writing an item again after it was invalidated deletes every protected
  item sharing its service, which must not take other secrets with it. (Items written with
  expo-secure-store directly are therefore not found here.)
- **One prompt at a time**, shared with `/biometrics`: while one is open, a protected call
  resolves `busy` without reaching the platform, and `useAppLock` does not count a trip to the
  background it causes.
- **Android's outcomes are read from text:** expo-secure-store throws them as English messages
  with no code. The package matches its 57.0.4 messages; one it does not know resolves `failed`
  with the message in `detail`.
- **Face ID** needs its purpose string: `secureStore.faceIDPermission` in the config plugin (or
  the `biometrics` one). Without it, writing a protected item resolves `unavailable`.

## Sensors

Accelerometer, gyroscope, magnetometer, barometer, light sensor, device motion and how the
device is held, in the same units and axes on every platform.

```bash
npx expo install expo-sensors
```

```tsx
import { useAccelerometer } from "@its/glowup-device/sensors";

function LevelIndicator({ visible }: { visible: boolean }) {
  // Listens only while the indicator is on screen.
  const { isAvailable, reading } = useAccelerometer({ enabled: visible });
  if (isAvailable === false) return <Text>No accelerometer</Text>;
  if (!reading) return null;
  const flat = Math.abs(reading.z) > 9.6; // m/s², lying face up: z ≈ +9.81
  return <Text>{flat ? "Level" : "Tilted"}</Text>;
}
```

- **One set of units**, whatever expo-sensors sends: acceleration in m/s² including gravity
  (iOS's raw values are inverted, so a phone lying face up reads `z ≈ +9.81` everywhere),
  rotation rate in rad/s, magnetic field in µT, pressure in hPa, light in lux. `x`, `y`, `z`
  are the device's axes: right of the screen, its top, out of it. `timestamp` is in ms on a
  monotonic clock: compare two readings of one sensor, never a reading with `Date.now()`.
- **`interval`** is the most often a reading arrives, in ms; the default is 200
  (`DEFAULT_SENSOR_INTERVAL`), the fastest Android 12 and later deliver without the
  `HIGH_SAMPLING_RATE_SENSORS` permission. Readers of one sensor share one platform
  subscription running at the fastest interval asked for; each gets its own rate. The iOS
  barometer has no rate to set.
- **Battery:** a sensor runs only while a reader is mounted and `enabled`, and pauses while the
  app is in the background (iOS would keep it running). Below Android 12 expo-sensors runs
  every sensor at full speed and drops readings in software, so the interval does not save
  power there: only switching the sensor off does.
- **`useSensorListener(sensor, onReading, options)`** calls back without re-rendering: for
  rates a render per reading cannot follow (animations, games). The value hooks re-render
  once per reading.
- **`isAvailable`** is `null` until known (and while a static page hydrates), then whether the
  device has the sensor. A sensor that is not there is never opened.
- **Platforms:** the light sensor is Android only; the barometer's `relativeAltitude` iOS only
  (`null` on Android).
- **Web** reads the accelerometer and gyroscope from the DeviceMotion events (HTTPS only);
  the magnetometer, barometer and light sensor are unavailable. expo-sensors' web build is not
  used: it sends orientation angles as the accelerometer and acceleration as the gyroscope.
  iOS Safari sends nothing until the user grants motion access.

### Device motion and orientation

```tsx
import {
  useDeviceMotion,
  useDeviceOrientation,
} from "@its/glowup-device/sensors";

const { reading } = useDeviceMotion({ interval: 50 });
// reading.acceleration: the user's, gravity removed; reading.gravity; reading.rotationRate

const { orientation } = useDeviceOrientation();
// "portrait-up" | "portrait-down" | "landscape-left" | "landscape-right" | "face-up" | "face-down"
```

- **`useDeviceMotion`** is the platform's sensor fusion: the acceleration the user gives the
  device apart from gravity, and the rotation rate, in the units above. It needs a gyroscope;
  on Android, every sensor the fusion uses. There is no attitude: expo's iOS and Android
  angles start from axes 90° apart, and the web has none. Read tilt from `gravity`; a compass
  heading belongs to location.
- **`useDeviceOrientation`** is how the device is held, whatever the interface does: a
  portrait-locked app still reads `landscape-left` when the phone is turned (useful to rotate a
  camera's controls). Its landscape sides are named as `/orientation` names the interface
  orientation the app would take. It needs only the accelerometer, re-renders only when the
  answer changes and keeps its previous answer while the phone is tilted halfway (35°–55°
  from an axis) or shaken.

### Motion permission

```tsx
import { useBarometer, useSensorPermission } from "@its/glowup-device/sensors";

function Altimeter() {
  const permission = useSensorPermission("barometer");
  const { reading } = useBarometer();
  if (permission.status === "undetermined") {
    // On the web, call request() directly from the press handler.
    return <Button onPress={permission.request}>Allow motion data</Button>;
  }
  return <Text>{reading ? `${reading.pressure.toFixed(1)} hPa` : "…"}</Text>;
}
```

- **Which sensors need it:** iOS's barometer (Motion & Fitness) and, in iOS Safari, the
  accelerometer, gyroscope and device motion. Everywhere else `useSensorPermission` reads
  `granted` with `isRequired: false`, without asking the platform.
- **The sensor hooks never prompt.** A sensor that needs the permission opens once it is
  granted and reads nothing until then; it is read again when the app returns to the
  foreground.
- **Refused:** once `canAskAgain` is false only the system settings turn it back on:
  `openSettings()` opens the app's page there (native only).
- **On the web, `request()` must run in the user's gesture:** Safari refuses it otherwise. The
  package calls Safari synchronously, so pass `request` as the press handler or call it before
  any `await`. Safari cannot be asked what it answered: a page reload forgets it.
- **iOS needs `NSMotionUsageDescription`** (the config plugin's `sensors.motionPermission`):
  expo-sensors' permission check crashes the app without it.

## Media picker

The system photo and video picker. No permission on any platform: iOS shows `PHPicker`, Android
its Photo Picker, the web a file dialog.

```bash
npx expo install expo-image-picker
```

```tsx
import { useMediaPicker } from "@its/glowup-device/media-picker";

function AvatarButton() {
  const { pick, isPicking } = useMediaPicker();
  return (
    <Button
      disabled={isPicking}
      // On the web, straight from the press: a browser opens its dialog only in the gesture.
      onPress={async () => {
        const result = await pick({ edit: true, aspect: [1, 1], quality: 0.8 });
        if (result.status === "picked") upload(result.assets[0]);
      }}
    >
      Change photo
    </Button>
  );
}
```

- **Options:** `mediaTypes` (`["image"]` by default, `"video"` too), `multiple` with `limit`
  (0: the platform's maximum), `edit` (the crop screen, one item only: iOS crops a square,
  Android to `aspect`), `quality` (0 to 1, native) and `exif` (native). Invalid combinations
  reject with a `TypeError` before anything opens (`edit` with `multiple`, `limit` without
  `multiple`, `edit` with `exif`: iOS would ask for full photo library access just to read it).
- **Every outcome resolves:** `{ status: "picked", assets }`, `cancelled`, `busy` (another pick
  is open; expo would otherwise leave the first one unanswered on iOS), `unsupported` (a static
  page in Node) or `failed` with a `detail` for logs.
- **Each asset:** `uri`, `type` (`"image"` or `"video"`), `width`, `height`, `mimeType`,
  `fileName`, `fileSize` (bytes), `duration` (ms, videos), `assetId` (the library's id, `null` on
  the web) and `exif`. On native `uri` is a copy in the app's cache, which the app deletes when
  done; on the web it is a `blob:` URL and `file` is the `File`, ready for `FormData`.
- **Android can stop the app behind the picker** on a low-memory device. Call
  `getPendingResult()` once at start-up to receive what the user picked meanwhile (`null`
  elsewhere).
- **The app lock** (`useAppLock`) does not lock on the way back from the picker, although Android
  sends the app to the background behind it.
- **Web:** the dialog cannot be capped, so `limit` keeps the first files, and files of another
  type (the dialog's "All files") are skipped. A browser that never tells when its dialog was
  dismissed leaves the pick open until the next one, which settles it as `cancelled`.

## Media library

Saving a photo or video to the device's photo library: a picture from `CameraView`, an edited
image, a downloaded file.

```bash
npx expo install expo-media-library
```

```tsx
import { useMediaLibrary } from "@its/glowup-device/media-library";

function SaveButton({ uri }: { uri: string }) {
  const library = useMediaLibrary();
  if (!library.isSupported) return null; // the web has no photo library
  if (library.status === "denied") {
    return (
      <Button onPress={library.openSettings}>Allow saving in Settings</Button>
    );
  }
  return (
    <Button
      onPress={async () => {
        const result = await library.save(uri); // asks the first time
        if (result.status === "saved") toast("Saved to Photos");
      }}
    >
      Save to Photos
    </Button>
  );
}
```

- **`save(uri)`** takes a local `file://` URI, as the camera and the picker return, and keeps
  the file as it is (no re-encoding). It resolves `{ status: "saved", assetId }`, `denied`,
  `unsupported` or `failed` with a `detail` for logs; a missing URI rejects with a `TypeError`.
- **The permission:** iOS asks for add-only access (the app can add but never read), Android
  10 and earlier for storage. `save()` asks by itself the first time, so call it from the
  user's action; once refused it answers `denied` without a prompt, and `openSettings()` is the
  way back. Android 11 and later save without asking: there the permission reads `granted` with
  `isRequired: false`.
- **No reading:** browsing the library, albums and "limited" access are not part of this
  package; picking goes through `/media-picker`, which needs no permission at all.
- **Web:** unsupported (`isSupported: false`). The web build never loads expo-media-library,
  whose default entry throws at import in a browser.

## Background location

Positions that keep coming while the app is in the background: a trip, a delivery round, a
run. They go to a **task** defined at module scope, not to a component, because the platform
may deliver them with no React tree at all (iOS relaunches the app, Android runs it headless).

```bash
npx expo install expo-location expo-task-manager
```

It needs a development build and `backgroundLocation` in the [config plugin](#config-plugin);
the web has none.

```tsx
// tasks.ts: imported by the app's entry file, before anything renders.
import { defineLocationTask } from "@its/glowup-device/background-location";

defineLocationTask("trip", async (event) => {
  if (event.type === "positions")
    await saveTrip(event.positions); // oldest first
  else log(event.error); // a LocationError
});
```

```tsx
import { useLocationPermission } from "@its/glowup-device/location";
import { useBackgroundLocation } from "@its/glowup-device/background-location";

function TripButton() {
  const permission = useLocationPermission();
  const trip = useBackgroundLocation("trip");
  if (!trip.isSupported) return null;
  if (permission.status !== "granted") {
    return <Button onPress={permission.request}>Use my location</Button>;
  }
  return trip.isRunning ? (
    <Button onPress={trip.stop}>Stop recording</Button>
  ) : (
    <Button
      onPress={() =>
        trip.start({
          accuracy: "high",
          distanceInterval: 20,
          // Android: a notification while it runs, and no background permission needed.
          foregroundService: {
            title: "Recording your trip",
            body: "Tap to open",
          },
        })
      }
    >
      Record my trip
    </Button>
  );
}
```

- **With Expo Router**, import the tasks from your own entry file, before the router's:
  `"main": "./index.ts"` in `package.json`, and in `index.ts` `import "./tasks";` then
  `import "expo-router/entry";`. A task defined in a route or in `_layout` is missing when the
  platform runs it without the UI, and expo then unregisters it.
- **`defineLocationTask(name, handler)`** at module scope, once per name (a second call replaces
  the handler). The handler receives `{ type: "positions", positions }` (several at once when
  batching) or `{ type: "error", error }` (iOS: `permission-denied` when the permission is taken
  away, otherwise `unavailable`). Return the promise of its work: the platform waits for it.
- **`useBackgroundLocation(name)`**: `start(options)`, `stop()`, `isRunning` (`null` until read)
  and `isSupported`. The updates **outlive the app**: they keep running after the component
  unmounts and after the app restarts, until `stop()`. `isRunning` is read again on every return
  to the foreground, since the system may have stopped them.
- **`start()` never prompts.** It rejects with `permission-denied` until the foreground
  permission is granted, with `services-disabled` while location is off, and with `unsupported`
  on the web or in a build without the plugin's `backgroundLocation`. Invalid options throw a
  `TypeError` before anything starts; a name no `defineLocationTask` defined throws an `Error`.
- **Android: the foreground service or the background permission.** `foregroundService` is
  required, so the choice is written at every call. `{ title, body, color?, stopWithApp? }` runs
  a foreground service with that notification: the foreground permission suffices, but it can
  only start while the app is in the foreground (`unavailable` otherwise). `false` runs plain
  background updates, which need the background permission and a Google Play declaration. The
  plugin's `backgroundLocation.mode` must match (`"foreground-service"`, the default, or
  `"background"`).
- **Options:** `accuracy`, `distanceInterval`, `timeInterval` (Android), `batchInterval` /
  `batchDistance` (hold positions back and deliver them together, to save battery),
  `activityType`, `showsIndicator` (the blue status bar pill; with "While Using" alone iOS shows
  it anyway) and `pausesAutomatically` on iOS. The last one
  defaults to `false`: expo's iOS default is `true`, whatever its docs say, and paused updates
  resume only when the user moves again.
- **iOS** needs only the foreground ("While Using") permission to keep updates going that started
  in the foreground. "Always" is what lets it relaunch a terminated app to deliver them.

### Geofencing

Entering and leaving circular regions (a site, a depot, a customer's address), reported to a
task even when the app is not running.

```tsx
// tasks.ts, next to defineLocationTask
import { defineGeofenceTask } from "@its/glowup-device/background-location";

defineGeofenceTask("sites", async (event) => {
  if (event.type === "enter") await clockIn(event.region.id);
  else if (event.type === "exit") await clockOut(event.region.id);
  else log(event.error);
});
```

```tsx
const sites = useGeofencing("sites");

await sites.start([
  { id: "hq", latitude: 45.4642, longitude: 9.19, radius: 150 },
  {
    id: "depot",
    latitude: 45.51,
    longitude: 9.23,
    radius: 200,
    notifyOnExit: false,
  },
]);
```

- **It needs the background permission on both platforms** ("Always" on iOS, "Allow all the
  time" on Android), after the foreground one: `start()` rejects with `permission-denied`
  until both are granted, and never prompts (`useBackgroundLocationPermission` asks).
- **Every region reports where the device already is** when monitoring starts: `enter` when
  inside, `exit` when outside. Treat the first event of a region as its state, not as a move.
- **`id` is required and unique**: events carry it back (expo would otherwise make up a random
  one). `notifyOnEnter` / `notifyOnExit` turn a transition off; the package also drops the
  events iOS sends for a transition that was turned off (it reports a region's state without
  looking at the flags, and expo's iOS code reads the enter flag under another name).
- **The limit is the app's**: 20 regions on iOS, 100 on Android, shared by every name.
  `start()` refuses more with a `RangeError` (iOS would drop the extra ones silently);
  `limit` tells which. Calling `start()` again replaces the regions of that name.
- **Radius:** both platforms work best from about 100 m (Android recommends 100–150 m);
  smaller circles fire late, or not at all. Events are not instant either: allow a few minutes,
  more with the device still or the screen off.
- The regions **outlive the app**, like the updates: `isRunning`, read on mount and on every
  return to the foreground, and `stop()`.

### Background permission

```tsx
import { useBackgroundLocationPermission } from "@its/glowup-device/background-location";

const always = useBackgroundLocationPermission();
// always.status, always.canAskAgain, always.request(), always.openSettings()
```

- `request()` does nothing until the foreground permission is granted: ask for that first.
- iOS shows the "Change to Always Allow" prompt once per install; afterwards `request()` resolves
  `denied` without a prompt. Before it is asked in a launch, iOS reads `undetermined`, even if the
  user answered on an earlier launch.
- Android 11 and later open the app's settings page instead of a dialog. The app goes to the
  background meanwhile, which `useAppLock` does not count.
- The state is read again whenever the app returns to the foreground.

## Bluetooth

Bluetooth Low Energy with the phone as the central (the GATT client): the radio, the
permission, scanning, connections, reads, writes and notifications. It runs on
`react-native-ble-manager`, so it needs a development build and the plugin's `bluetooth` key.
On the web and in Expo Go every hook reads `unsupported`: the native module is loaded on first
use, never at import, so importing the subpath there does not crash.

Not covered: Bluetooth Classic (iOS opens it to MFi hardware only), the peripheral role (the
phone advertising), and anything in the background.

### Radio and permission

```tsx
import {
  useBluetoothPermission,
  useBluetoothState,
} from "@its/glowup-device/bluetooth";

const permission = useBluetoothPermission();
const radio = useBluetoothState();

useEffect(() => {
  // On iOS, ask whenever a Bluetooth screen opens: see below.
  permission.request();
}, []);

if (radio.state === "off" && radio.canEnable) {
  // Android's "Turn on Bluetooth?" dialog; resolves false when the user refuses.
  await radio.enable();
}
```

- **iOS** cannot read the permission without the risk of showing the prompt, so it reads
  `undetermined` until `request()` ran in this launch, even when the user answered on an earlier
  one. The prompt shows once per install; afterwards `request()` answers at once with no UI, so
  call it when a screen that needs Bluetooth opens. The radio's state is `unknown` until then.
- **Android 12 and later** ask for "Nearby devices" (`BLUETOOTH_SCAN` and `BLUETOOTH_CONNECT`);
  Android 11 and earlier for the precise location, which scans need there. Android tells that
  the user chose "Don't ask again" only in a request's answer: until a request in this launch, a
  refused permission reads `undetermined` (and a request then answers `denied` with
  `canAskAgain: false`, without a dialog).
- `state` is `unknown`, `unsupported`, `unauthorized` (iOS only), `off` or `on`. Android's
  "turning on" and "turning off" read `off`.
- `enable()` exists on Android only (`canEnable`), and needs the permission. iOS gives apps no
  way to switch Bluetooth on: tell the user where to.
- Errors are `BluetoothError`s (`isBluetoothError()`), with a `code`: `unsupported`,
  `permission-denied`, `powered-off`, `timeout`, `not-connected`, `disconnected` or `failed`.

### Scanning

```tsx
import { useBluetoothScan } from "@its/glowup-device/bluetooth";

const scan = useBluetoothScan();

await scan.start({ services: ["180D"], timeout: 10_000 }); // heart rate monitors, 10 s
scan.devices; // [{ id, name, rssi, advertisement, firstSeen, lastSeen }], once each
scan.isScanning;
scan.error; // why the scan could not start or stopped early
await scan.stop();
```

- **One scan per app**, as the platform has one: every component using the hook shares it and
  its list, a `start()` anywhere replaces it (and empties the list), and it stops when the last
  of them unmounts.
- `start()` checks the permission and the radio first, never prompts, and rejects with the
  `BluetoothError` that stops it (`permission-denied`, `powered-off`, `unsupported`). Bad options
  are a `TypeError` / `RangeError` before anything starts.
- `services` filters on the platform (fewer wake-ups): only devices advertising one of them.
  Without it every device around shows, which is what you want to discover a device that
  advertises no service.
- `timeout` (default 10 s; `0` until `stop()`) ends the scan and keeps the list.
- Each device is listed once, with its latest signal (`rssi`, dBm) and advertisement; the list
  renders at most every 250 ms, however fast devices advertise. `advertisement` carries the
  local name, the service UUIDs, the service data (Eddystone), the manufacturer data
  (`companyId` and bytes), the advertised transmit power and whether it accepts connections.
- It **pauses in the background** and resumes on return for the time it had left; it ends with
  `powered-off` when the radio goes off.
- **Android** silently returns nothing to an app that starts more than five scans in 30
  seconds; the adapter counts the starts and delays the sixth until it is allowed (the scan
  reads `isScanning` meanwhile). Android 11 and earlier also find nothing while the location
  services are off, and say nothing about it.
- A device's `id` is a per-app UUID on iOS and its MAC address on Android: stable on this phone
  for this app, meaningless anywhere else. iOS hides Apple's iBeacon frames from apps.

### Connecting and GATT

```tsx
import {
  BLUETOOTH_CHARACTERISTICS,
  BLUETOOTH_SERVICES,
  encodeUtf8,
  readBatteryLevel,
  readDeviceInformation,
  useBluetoothDevice,
} from "@its/glowup-device/bluetooth";

const device = useBluetoothDevice(id); // the id a scan reported

await device.connect(); // connects and discovers the services (10 s timeout)
device.status; // "disconnected" | "connecting" | "connected" | "disconnecting"
device.services; // [{ uuid, characteristics: [{ uuid, service, properties }] }]

const level = await device.read("180F", "2A19"); // Uint8Array
await device.write("FFE0", "FFE1", Uint8Array.from([0x01]));
await readBatteryLevel(device); // 0–100
await readDeviceInformation(device); // { manufacturerName, modelNumber, serialNumber, … }

// Serial over BLE (Nordic UART): write lines, read them with useBluetoothNotifications.
await device.write(
  BLUETOOTH_SERVICES.nordicUart,
  BLUETOOTH_CHARACTERISTICS.nordicUartRx,
  encodeUtf8("STATUS\n"),
);
```

- **One connection per device**, shared by every component using its id. Nothing connects until
  `connect()`, which checks the permission and the radio first (never prompts), joins an attempt
  already running and resolves at once when connected. iOS never gives up on a connection by
  itself, so `connect({ timeout })` (default 10 s; `0` waits forever) cancels the attempt.
- The connection closes when the last component using the device unmounts, unless that one set
  `useBluetoothDevice(id, { disconnectOnUnmount: false })`, which keeps it open for the rest of
  the app until `disconnect()`.
- A dropped connection (the device out of range, switched off) reads `disconnected` with
  `error.code === "disconnected"`; there is no automatic reconnection: call `connect()` again.
  `disconnect()` the app asked for leaves `error` at `null`.
- `read`, `write`, `requestMtu`, `readRssi` and `bond` need a connection (`not-connected`
  otherwise) and give up after 10 s (`timeout`; the platform's own request is not cancelled).
  UUIDs may be short (`"2A19"`) or 128-bit.
- `write()` waits for the device's acknowledgement when the characteristic allows it, and writes
  without response when that is all it allows; `{ withResponse }` decides otherwise. A value
  longer than one write carries (MTU − 3 bytes: 20 by default) goes as several consecutive
  writes, which is what serial over BLE expects. `requestMtu(247)` asks Android for more room
  (iOS negotiates its own, and the call reports it).
- `bond()` pairs on Android (`canBond`); iOS pairs by itself when a characteristic needs
  encryption.
- The profiles the package reads are Device Information (`0x180A`) and Battery (`0x180F`);
  `decodeUtf8` / `encodeUtf8` and `parseBatteryLevel` help with the rest.

### Notifications

```tsx
import { useBluetoothNotifications } from "@its/glowup-device/bluetooth";

const heartRate = useBluetoothNotifications(id, "180D", "2A37", (value) => {
  setBpm(value[0] & 0x01 ? value[1] | (value[2] << 8) : value[1]);
});
heartRate.isActive; // on, on the device
heartRate.error; // why the device refused
```

- Components reading the same characteristic share one subscription on the device, on while at
  least one of them is mounted (`{ enabled: false }` leaves it). Indications work the same way.
- It turns on once the device is connected and again after every reconnection; it never connects
  by itself.
- The callback can change between renders: the latest one is called.

### UUIDs

iOS reports a SIG-assigned UUID in its short form (`180D`), Android in its 128-bit form, so raw
strings never compare across platforms. Every UUID the package hands out is lowercase 128-bit,
and every UUID it takes may be either:

```ts
toBluetoothUuid("180D"); // "0000180d-0000-1000-8000-00805f9b34fb"
shortBluetoothUuid("0000180d-0000-1000-8000-00805f9b34fb"); // "180d"
```

### Beacons and location

The plugin's `neverForLocation` (default `true`) tells Android 12 and later that scans never
locate the user: no location permission is needed, and Android may leave beacons out of the
results. For beacon-based presence set it to `false` and give the hooks an adapter that asks for
location too:

```tsx
import { createBleManagerAdapter } from "@its/glowup-device/bluetooth";

const bluetooth = createBleManagerAdapter({ neverForLocation: false });

<DeviceAdaptersProvider adapters={{ bluetooth }}>
  <App />
</DeviceAdaptersProvider>;
```

## RFID

`@its/glowup-device/rfid` is UHF RFID behind one contract: the screens use its hooks, and a
vendor package implements `RfidAdapter` for its readers. Changing vendor changes the package
installed and one line of the provider, never a screen. It ships no vendor and no native code;
without an adapter every hook reads `unsupported`.

```tsx
import { DeviceAdaptersProvider } from "@its/glowup-device";
import { honeywellRfidAdapter } from "@its/rfid-honeywell"; // a vendor package

<DeviceAdaptersProvider adapters={{ rfid: honeywellRfidAdapter }}>
  <App />
</DeviceAdaptersProvider>;
```

An app that ships several vendors picks at run time with
`firstSupportedRfidAdapter([honeywellRfidAdapter, zebraRfidAdapter])`.

The contract fixes the units, so every vendor reads the same: RSSI and transmit power in dBm,
times in ms since the epoch, EPC and TID as uppercase hex. `proximity` (0–1) comes from the
smoothed RSSI between the adapter's `proximityBounds` (calibratable per call); it ranks tags and
guides a search, and is never metres.

### The reader

```tsx
import { useRfidPermission, useRfidReader } from "@its/glowup-device/rfid";

const permission = useRfidPermission(); // the link's (Honeywell: Bluetooth)
const reader = useRfidReader();

await permission.request();
await reader.connect("0C:23:69:19:AA:12"); // resolves once the reader is ready
reader.state; // "disconnected" | "connecting" | "connected" | "reconnecting"
reader.capabilities; // { locate: "native", singleRead: "native", trigger: true, … }
await reader.setSettings({ power: 20, session: 1 }); // dBm, within reader.powerRange
await reader.getBatteryLevel(); // 0–100, or null
```

- The connection outlives the component, until `disconnect()`. After a drop the adapter
  reconnects by itself (`reconnecting`); the modes need `connected`.
- `connect()` checks the permission and never prompts; it gives up after 20 s (`timeout`).
  `reader.error` keeps the latest failure until a connect succeeds.
- `isSupported` is false without an adapter, on a platform the vendor does not support, or when
  the adapter implements another contract version (`incompatible-adapter`): update the vendor
  package or this one.

### Multiple scan

```tsx
import { useRfidInventory } from "@its/glowup-device/rfid";

const inventory = useRfidInventory();
await inventory.start(); // { tid, proximity, sort, forgetAfter, duration }
inventory.tags; // [{ epc, rssi, averageRssi, proximity, readCount, lastSeen, … }], nearest first
await inventory.stop();
```

- Each tag once, merged by EPC, rendered at most every 250 ms (the first at once).
- `sort: "first-seen"` keeps a steady order for a list to pick from; `forgetAfter: 3000` drops
  tags out of range; `duration` stops by itself.

### Single search

```tsx
import { useRfidLocate } from "@its/glowup-device/rfid";

const locate = useRfidLocate();
await locate.start("E280 1170 0000 0212 0FD4 A0F1"); // separators and case ignored
locate.proximity; // 0–1: drive a gauge
locate.isInRange; // false once the tag is silent for 2 s
```

It uses the reader's own tag finder when the adapter has one (`capabilities.locate:
"native"`: the reader also beeps faster as the tag nears), an inventory filtered by the EPC
otherwise.

### Single read

```tsx
import { useRfidSingleRead } from "@its/glowup-device/rfid";

const single = useRfidSingleRead();
const tag = await single.read(); // the nearest tag after 500 ms (`window`), or null
```

### One mode at a time

An inventory, a search and a single read share the reader: starting one ends the running one
(the last start wins; a replaced `read()` rejects with `cancelled`). The running mode also ends
when the app goes to the background, when the reader drops (`disconnected`), and, for the
inventory and the search, when no component reads it any more.

### The trigger

```tsx
import { useRfidInventory, useRfidTrigger } from "@its/glowup-device/rfid";

const inventory = useRfidInventory();
useRfidTrigger({
  onPress: () => inventory.start().catch(() => {}), // the failure is in inventory.error
  onRelease: () => inventory.stop(),
});
```

While a component uses the hook, the reader hands its trigger to the app (`capabilities.trigger`);
it gets it back when the last one unmounts.

### Choosing a reader

`useRfidReaderDiscovery()` lists the readers nearby when the adapter can search
(`capabilities.discovery`); otherwise connect by a known id.

### Writing a vendor adapter

A vendor package implements `RfidAdapter` (`import type` from this subpath; `RfidError` at run
time, with `@its/glowup-device` as a peer):

- Only the primitives are required: the permission, `connect` / `disconnect` / the connection,
  `startInventory` / `stopInventory` and the settings. The optional methods (`readOnce`,
  `startLocate` / `stopLocate`, `subscribeTrigger`, discovery, battery, reader info) become
  `capabilities`; the engine emulates the single read and the search without them.
- Convert to the contract's units, and declare `contractVersion` as a number literal (importing
  `RFID_CONTRACT_VERSION` would always match and hide a mismatch).
- Fail with `RfidError`s: `not-connected` before a connection, `disconnected` in `onStop` when
  the link drops. `onStop` is only for a mode that ends by itself, never after a stop.
- Pass the conformance kit, below.

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
      biometrics: { faceIDPermission: "Unlocks your saved cards." },
      secureStore: true,
      sensors: { motionPermission: "Counts the floors you climb." },
      mediaPicker: true,
      mediaLibrary: { savePermission: "Saves your edited photos." },
      backgroundLocation: {
        mode: "foreground-service", // "background", or "none" to geofence only
        geofencing: true,
        alwaysPermission: "Records your trip while the app is closed.",
      },
      bluetooth: { permission: "Reads your heart rate monitor." },
    },
  ],
],
```

- **Location** sets the iOS purpose strings to your text (also the "Always" ones, which
  expo-location's binary needs present; without `backgroundLocation` the package never asks for
  Always) and adds Android's coarse and fine location permissions only — no background location,
  no foreground service.
- **Background location** needs `location` too. It adds iOS's `location` background mode, the
  "Always" purpose strings (`alwaysPermission`) and, on Android, the permissions of its `mode`:
  `FOREGROUND_SERVICE` and `FOREGROUND_SERVICE_LOCATION` for `"foreground-service"` (the
  default), `ACCESS_BACKGROUND_LOCATION` for `"background"`, never both. `geofencing: true`
  adds `ACCESS_BACKGROUND_LOCATION` whatever the mode, and `mode: "none"` leaves out the
  continuous updates' permissions for an app that only geofences. It removes the `fetch`
  background mode expo-task-manager's plugin adds, which nothing here uses and App Review asks
  about, unless the app declares it or uses expo-background-fetch / expo-background-task. Do not
  list expo-task-manager before this plugin: its `fetch` would stay (the plugin warns).
- **Camera** sets the camera purpose string and Android's `CAMERA`. `recordAudio: true` adds
  `RECORD_AUDIO` and makes the microphone text required (iOS always carries one, as
  expo-camera's plugin does; without `recordAudio` the app never asks).
  `barcodeScanner: false` leaves the scanning libraries out of the build.
- **Biometrics** sets Face ID's purpose string and adds Android's `USE_BIOMETRIC` (and the
  deprecated `USE_FINGERPRINT`, which expo-local-authentication's plugin still adds).
- **Secure store** leaves the store out of Android's Auto Backup (expo-secure-store's rules:
  a restored item could not be decrypted, its key never leaves the device);
  `androidBackupRules: false` leaves the backup rules to you. On iOS it writes Face ID's purpose
  string for protected items: `faceIDPermission`, or the `biometrics` one when both are listed.
- **Sensors** sets the Motion & Fitness purpose string, which the iOS barometer needs
  (`motionPermission: false` leaves it out for an app that never reads the barometer, which then
  reads `denied` there), and removes Android's `ACTIVITY_RECOGNITION`, which expo-sensors adds for
  a pedometer this package does not expose. `highSamplingRate: true` adds
  `HIGH_SAMPLING_RATE_SENSORS`, without which Android 12 and later deliver no faster than every
  200 ms. Unlisted, prebuild still applies expo-sensors' own plugin with its English text.
- **Media picker** removes Android's `CAMERA`, which expo-image-picker's manifest declares for
  a camera capture this package does not expose, and `RECORD_AUDIO`, which its plugin adds,
  unless `camera` is listed and uses them. iOS keeps expo's photo library, camera and microphone
  purpose strings: picking never shows them, but expo-image-picker's binary references those APIs
  and App Store Connect flags a binary that does so without them.
- **Media library** sets the add-only purpose string, which the save prompt shows (iOS
  crashes on that prompt without it), and removes Android's `READ_MEDIA_IMAGES`,
  `READ_MEDIA_VIDEO`, `READ_MEDIA_AUDIO`, `READ_MEDIA_VISUAL_USER_SELECTED` and
  `ACCESS_MEDIA_LOCATION`. expo-media-library adds them for reading the library, which saving
  does not need, and Google Play accepts them only from apps whose core feature is browsing
  photos. Prebuild applies expo-media-library's plugin even when it is not listed, so list
  `mediaLibrary` whenever the module is installed.
- **Bluetooth** goes through react-native-ble-manager's plugin. It sets the Bluetooth purpose
  string (`permission`), without which the radio cannot start on iOS, and adds Android's
  `BLUETOOTH_SCAN` and `BLUETOOTH_CONNECT`, plus the location permissions for Android 11 and
  earlier, whose scans need them. `neverForLocation` (default `true`, where ble-manager's own
  default is `false`) flags the scan permission as never used for location and caps the
  location permissions at Android 11; `false` keeps them for scans that locate the user
  (beacons). Listed beside `location`, the location permissions are declared once, uncapped.
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
location.emitHeading({ magneticHeading: 90 }); // to the compass
location.failHeading("unavailable");
```

`createMockLocationAdapter({ heading: false })` has no compass, as on the web.

`createMockBackgroundLocationAdapter()` starts with the foreground permission granted and the
background one undetermined; `deliver()` runs the handler `defineLocationTask` registered, as the
platform would:

```tsx
defineLocationTask("trip", handler); // as in the app
const backgroundLocation = createMockBackgroundLocationAdapter();
render(
  <DeviceAdaptersProvider adapters={{ backgroundLocation }}>
    <TripButton />
  </DeviceAdaptersProvider>,
);
// …press "Record my trip", then:
expect(backgroundLocation.running.get("trip")).toMatchObject({
  accuracy: "high",
});
await backgroundLocation.deliver("trip", [buildPosition({ latitude: 45.46 })]);
await backgroundLocation.deliverError("trip", "permission-denied");
backgroundLocation.stopBySystem("trip"); // as a revoked permission would
backgroundLocation.failNextStart("unavailable");
```

`deliver()` throws while nothing runs under that name: the platform would deliver nothing.
Geofencing works the same way:

```tsx
defineGeofenceTask("sites", handler);
const backgroundLocation = createMockBackgroundLocationAdapter({
  permission: "granted", // geofencing needs the background permission
  geofenceLimit: 20, // the default, iOS's
});
// …start watching through the UI, then:
expect(backgroundLocation.geofences.get("sites")).toHaveLength(2);
await backgroundLocation.deliverGeofence("sites", "enter", "hq");
await backgroundLocation.deliverGeofenceError("sites", "services-disabled");
```

`createMockGeocoderAdapter()` answers one place and one address in Rome until told otherwise:

```tsx
const geocoder = createMockGeocoderAdapter();
render(
  <DeviceAdaptersProvider adapters={{ geocoder }}>
    <AddressSearch />
  </DeviceAdaptersProvider>,
);
geocoder.setGeocode([
  buildGeocodedLocation({ latitude: 45.46, longitude: 9.19 }),
]);
geocoder.setGeocode([]); // nothing found
geocoder.setReverseGeocode("unavailable"); // or a LocationError, or "pending"
expect(geocoder.geocodeCalls).toEqual(["Milano"]);
```

`createMockGeocoderAdapter({ supported: false })` has no geocoder, as on the web.

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

`createMockBiometricsAdapter()` starts with Face ID enrolled (`MOCK_BIOMETRICS`) and answers every
prompt with `{ success: true }`; `setResult({ success: false, error: "lockout" })` changes the
answer, `setStatus({ isEnrolled: false })` notifies every listening component, and `calls`
records each prompt's options. `{ manual: true }` keeps a prompt open until `resolve()` or
`cancel()`, to test what the app shows meanwhile.

`createMockSecureStoreAdapter({ items: { "auth/token": "abc" } })` keeps items in memory by
`"<service>/<key>"` (`"/<key>"` without a service); `writes` records each write's options and
`failNext(error)` makes the next call reject, as a locked device would. Protected items live in
`protectedItems` and record their prompt texts in `prompts`; `denyNext("cancelled")` ends the
next prompt with that outcome, and `invalidate()` destroys every protected item as a change of
enrolled biometrics would.

`createMockSensorsAdapter()` has every sensor (`{ available: { light: false } }` removes one);
`emit("accelerometer", { x: 0, y: 0, z: 9.81 })` sends a reading to every listening component,
its timestamp advancing by the sensor's interval unless given. `intervals` holds the rate the
package asked for and `isActive("gyroscope")` whether it is listening. `{ gated: ["barometer"],
permission: "undetermined" }` makes a sensor wait for the motion permission; a request answers
`requestAnswer` (default `"granted"`), `setPermission("denied")` changes it as the settings would
and `permissionRequests` counts the prompts.

`createMockMediaPickerAdapter()` answers every pick with one image (`buildPickedMedia()`, which
also builds videos: `buildPickedMedia({ type: "video" })`); `respondWith({ status: "cancelled" })`
changes the answer and `requests` records each pick's checked options. `holdNext()` keeps the next
pick open until `close(result?)`, meanwhile another resolves `busy`; `{ pending }` or
`setPending()` sets what `getPendingResult()` answers once.

`createMockMediaLibraryAdapter()` needs the permission (`{ gated: false }` stands in for
Android 11+) and starts undetermined; a request answers `requestAnswer` (default `"granted"`),
`setPermission("denied")` changes it as the settings would and `permissionRequests` counts the
prompts. `saved` lists every saved URI; `failNext(detail?)` makes the next save fail.

`createMockBluetoothAdapter()` has the radio on and the permission undetermined; a request
answers `requestResult` (default `"granted"`). `setState("off")` changes the radio for every
listening component, `setPermission("denied")` changes the permission as the settings would, and
`requestCount` / `enableCount` count the prompts and the "turn on" dialogs (`enableResult:
"refuse"` answers them no; `canEnable: false` stands in for iOS). `{ supported: false }` behaves
like the web or Expo Go. Once a scan runs, `discover({ id, name, rssi, advertisement })` reports
a device to it (`buildBluetoothDevice()` fills the rest; a device the scan's services filter out
is dropped, as the platform would); `failScan("failed")` ends it, `failNextScan()` makes the next
start reject, and `scanning` holds the running scan's services.

For GATT, give the mock the devices' services (`gatt: { [id]: [{ uuid: "180F", characteristics:
[{ uuid: "2A19", properties: { notify: true }, value: [87] }] }] }`, or `setGatt()`); only `read`
is allowed unless `properties` says otherwise. `notify(id, service, characteristic, value)`
sends a value while notifications are on, `disconnectBySystem(id)` drops a connection,
`holdNextConnect()` leaves the next connection pending (to test the timeout),
`failNextConnect()` / `failNextGatt()` make the next call reject, and `connected`, `notifying`,
`writes` and `bonded` record what the app did. `{ bond: false }` has no `bond()`, as on iOS;
`maxMtu` (default 247) caps `requestMtu()`.

`createMockRfidAdapter()` has one reader (`00:11:22:33:44:55`), the permission undetermined (a
request answers `requestResult`, default `"granted"`) and every optional part of the contract;
`capabilities: { locate: false, readOnce: false, … }` leaves parts out, so the engine's
emulations run. Once connected, `emitTags([{ epc, rssi }])` reports tags to the running
inventory, to a native search (the searched EPC's signal) or to the next single read;
`emitLocate(rssi)` and `pressTrigger(pressed)` drive the search and the trigger,
`dropConnection()` / `reconnect()` the link, and `failNextConnect()`, `holdNextConnect()`,
`failNextStart()` and `failRead()` the failures. `inventory`, `locating`, `connection`,
`settings` and the counters record what the app did; `contractVersion` tests the version check.

`describeRfidAdapterContract()` is the suite every vendor adapter passes before it ships: units,
connection states, stop semantics, errors and the optional parts. A vendor package runs it with
its native module faked; the drivers speak the contract's units and the harness turns them into
the vendor's:

```ts
import { describeRfidAdapterContract } from "@its/glowup-device/testing";

describeRfidAdapterContract({ describe, it }, () => {
  const native = createFakeNativeModule();
  return {
    adapter: createVendorRfidAdapter(native), // supported, permission granted
    readerId: "0C:23:69:19:AA:12",
    emitTags: (tags) => native.emitTagRead(tags.map(toVendorRead)),
    dropConnection: () => native.emitDisconnected(),
    emitLocate: (rssi) => native.emitFindingTag(toVendorRssi(rssi)),
    pressTrigger: (pressed) => native.emitTrigger(pressed),
  };
});
```

It uses real timers and its own assertions, so it needs no Jest globals beyond the two passed.
