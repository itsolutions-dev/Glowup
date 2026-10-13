# @its/glowup-device

Headless device hardware for Expo apps: location, camera (photo, video, barcode and QR
scanning) and device info, each behind an adapter the app can replace.

> **Work in progress — not published yet.** The entry points exist but are empty until
> their phase lands. See [`docs/device-package-plan.md`](../../docs/device-package-plan.md).

## Entry points

| Import                        | Needs                             | Status   |
| ----------------------------- | --------------------------------- | -------- |
| `@its/glowup-device`          | nothing native                    | types    |
| `@its/glowup-device/info`     | `expo-device`, `expo-application` | reserved |
| `@its/glowup-device/location` | `expo-location`                   | reserved |
| `@its/glowup-device/camera`   | `expo-camera`                     | reserved |
| `@its/glowup-device/testing`  | nothing native                    | reserved |

Import a subpath and you need only its Expo modules: an app that reads device info never
installs `expo-camera`.
