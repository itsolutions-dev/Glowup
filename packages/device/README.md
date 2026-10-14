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
```

Expo SDK 57 or later. The design and its trade-offs are recorded in the
[plan](https://github.com/itsolutions-dev/Glowup/blob/master/docs/device-package-plan.md); the
[documentation site](https://itsolutions-dev.github.io/Glowup/device) runs every capability.

## Entry points

| Import                             | Needs                             | Exports                                                                                                    |
| ---------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `@its/glowup-device`               | nothing native                    | `DeviceAdaptersProvider`, `PermissionState`                                                                |
| `@its/glowup-device/info`          | `expo-device`, `expo-application` | `useDeviceInfo`                                                                                            |
| `@its/glowup-device/location`      | `expo-location`                   | `useLocationPermission`, `useCurrentPosition`, `useWatchPosition`, `useHeading`, `useGeocoder`             |
| `@its/glowup-device/camera`        | `expo-camera`                     | `CameraView`, `useCameraPermission`                                                                        |
| `@its/glowup-device/network`       | `@react-native-community/netinfo` | `useNetwork`, `useIsOnline`                                                                                |
| `@its/glowup-device/battery`       | `expo-battery`                    | `useBattery`                                                                                               |
| `@its/glowup-device/keep-awake`    | `expo-keep-awake`                 | `useKeepAwake`, `useKeepAwakeSupport`                                                                      |
| `@its/glowup-device/orientation`   | `expo-screen-orientation`         | `useOrientation`, `useOrientationLock`, `useOrientationLockSupport`                                        |
| `@its/glowup-device/haptics`       | `expo-haptics`                    | `useHaptics`, `hapticFeedback`                                                                             |
| `@its/glowup-device/biometrics`    | `expo-local-authentication`       | `useBiometrics`, `useAppLock`                                                                              |
| `@its/glowup-device/secure-store`  | `expo-secure-store`               | `useSecureStore`, `useSecureValue`, `SecureStoreError`                                                     |
| `@its/glowup-device/sensors`       | `expo-sensors`                    | `useAccelerometer` and the other sensors, `useDeviceMotion`, `useDeviceOrientation`, `useSensorPermission` |
| `@its/glowup-device/media-picker`  | `expo-image-picker`               | `useMediaPicker`                                                                                           |
| `@its/glowup-device/media-library` | `expo-media-library`              | `useMediaLibrary`                                                                                          |
| `@its/glowup-device/testing`       | nothing native                    | in-memory adapters for every capability                                                                    |

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
