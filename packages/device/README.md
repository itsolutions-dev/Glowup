# @its/glowup-device

Headless device hardware for Expo apps: location, camera (photo, video, barcode and QR
scanning) and device info, each behind an adapter the app can replace.

> **Work in progress — not published yet.** `/info` is implemented; the other entry
> points are empty until their phase lands. See [`docs/device-package-plan.md`](../../docs/device-package-plan.md).

## Entry points

| Import                        | Needs                             | Status   |
| ----------------------------- | --------------------------------- | -------- |
| `@its/glowup-device`          | nothing native                    | provider |
| `@its/glowup-device/info`     | `expo-device`, `expo-application` | ready    |
| `@its/glowup-device/location` | `expo-location`                   | reserved |
| `@its/glowup-device/camera`   | `expo-camera`                     | reserved |
| `@its/glowup-device/testing`  | nothing native                    | info     |

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
