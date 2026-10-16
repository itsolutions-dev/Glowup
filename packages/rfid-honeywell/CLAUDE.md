# packages/rfid-honeywell — the Honeywell RFID vendor package

Roadmap, the Honeywell SDK's facts and its licence: `docs/device-package-plan.md`, "v0.10 — RFID".

- **It implements `@its/glowup-device/rfid` and nothing else.** It imports the device package's
  `/rfid` (types and `RfidError` at run time) and `/testing` in tests, never another subpath, the
  UI kit or an app (ESLint). The device package never imports it.
- **The SDK never enters the repository** (its licence; the root `.gitignore` ignores
  `honeywell_rfid_sdk*.aar` and the plugin's `honeywell-rfid-repository/`). The module's Gradle
  build depends on `com.honeywell.rfid:honeywell-rfid-sdk:1.1.0`, which the config plugin
  (`app.plugin.js`) puts in a Maven repository inside the app's `android/` from the app's
  `aarPath`. The SDK uses `androidx.localbroadcastmanager` without declaring it (a local AAR has
  no POM), so the module declares it.
- **The Kotlin module** (`android/…/HoneywellRfidModule.kt`) keeps the SDK's units (RSSI as
  reported, power in centi-dBm, enum names) and the adapter (`src/adapter.ts`) converts them, so
  the diagnostics see raw values. It binds the SDK's embedded `RfidService`
  (`RfidManager.create`), connects with auto-reconnect, calls `createReader()` on every
  `onDeviceConnected` and is `connected` only after `onReaderCreated(true)`. Reads arrive on SDK
  threads: every state change goes through `lock`, no blocking SDK call runs under it, and reads
  are batched to JavaScript every 100 ms from the module's `HandlerThread`. While locating, the
  SDK passes only the searched tag to `onTagRead` (matched with `String.equals` on uppercase
  hex, so the module uppercases the EPC); the module sends its RSSI as the locate value and keeps
  the SDK's own (`onReceivedFindingTag`, RSSI ÷ read count) for the diagnostics only. The tag
  time is 0 on the Bluetooth path: the arrival time replaces it. `ReaderScanner.kt` is the reader
  search (the SDK has no public one).
- **Checking the Kotlin.** No Android SDK can be downloaded in the cloud sessions
  (`dl.google.com` is refused), so the module is compiled with Gradle's bundled `kotlinc` against
  the AAR's `classes.jar`, stubs of the few Android classes it uses, and stubs of Expo's DSL
  copied from `expo-modules-core`'s signatures (the zero-argument `Function` overload included,
  or `Function("x") { … }` is ambiguous). A real build runs on a developer's machine.
- **Host check.** `isSupported()` needs Android, the linked module and a Honeywell manufacturer
  (`Platform.constants.Manufacturer`): the licence binds the SDK to Honeywell hardware.
  `requireHoneywellHost: false` exists for a lab test only.
- **Tests** run on `jest-expo/android` over `src/__tests__/fakeNative.ts`, a JavaScript copy of
  the Kotlin module's behaviour, including the conformance kit (`contract.test.ts`). Keep the
  fake in step with the Kotlin when either changes. The plugin's test compiles the manifest and
  gradle.properties mods in introspection mode and calls the file edits (`internal`) directly.
