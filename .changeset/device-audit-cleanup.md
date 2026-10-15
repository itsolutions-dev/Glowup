---
"@its/glowup-device": minor
---

Removes exports that duplicated what the package already does by itself. Hooks and default
behaviour are unchanged.

Removed exports:

- `webHapticsAdapter` (`/haptics`), `webBiometricsAdapter` (`/biometrics`) and
  `webSecureStoreAdapter` (`/secure-store`). The Expo adapters answer `isSupported()` false on
  the web and every hook checks it first, so nothing plays, authenticates or stores there, as
  before. An app that passed one of them to `DeviceAdaptersProvider` can drop it.
- `createExpoMediaLibraryAdapter` and `createWebMediaLibraryAdapter` (`/media-library`): the
  adapters hold no state. Use `expoMediaLibraryAdapter` / `webMediaLibraryAdapter`.
- `createExpoMediaPickerAdapter` and `createWebMediaPickerAdapter` (`/media-picker`): use
  `expoMediaPickerAdapter` / `webMediaPickerAdapter`.

Internally, the stores, listener sets, client-only reads and error classes share one
implementation in `core`.
