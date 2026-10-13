# @its/glowup-device

Headless device hardware for Expo apps: location, camera (photo, video, barcode and QR
scanning) and device info, each behind an adapter the app can replace.

> **Work in progress — not published yet.** `/info` and `/location` are implemented;
> `/camera` is empty until its phase lands. See [`docs/device-package-plan.md`](../../docs/device-package-plan.md).

## Entry points

| Import                        | Needs                             | Status         |
| ----------------------------- | --------------------------------- | -------------- |
| `@its/glowup-device`          | nothing native                    | provider       |
| `@its/glowup-device/info`     | `expo-device`, `expo-application` | ready          |
| `@its/glowup-device/location` | `expo-location`                   | ready          |
| `@its/glowup-device/camera`   | `expo-camera`                     | reserved       |
| `@its/glowup-device/testing`  | nothing native                    | info, location |

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

## Config plugin

The package's plugin configures the native projects for the capabilities you list, through
each Expo module's own plugin:

```ts
// app.config.ts
plugins: [
  [
    "@its/glowup-device",
    { location: { whenInUsePermission: "Shows the shops near you." } },
  ],
],
```

- **Location** sets the iOS purpose strings to your text (also the "Always" ones, which
  expo-location's binary needs present; the package never asks for Always) and adds Android's
  coarse and fine location permissions only — no background location, no foreground service.
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
