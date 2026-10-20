# packages/rfid-zebra — the Zebra RFID vendor package

Roadmap, the Zebra SDK's facts and the decisions: `docs/device-package-plan.md`, "Zebra (RFD40)".
The package has the Honeywell package's shape on purpose (`packages/rfid-honeywell/CLAUDE.md`):
keep the two alike unless the SDK forces a difference, and say which in the plan.

- **Private until phase Z2** (`"private": true`, version `0.0.0`): `changeset publish` would
  publish it otherwise. It already builds and validates (`npm run build`,
  `validate-package`); the root `build`, `ci.yml`, `release.yml` and `examples/consumer` name it
  when it goes public, with its own trusted publisher on npmjs.com and a changeset to `0.1.0`.
- **It implements `@its/glowup-device/rfid` and nothing else**, as the Honeywell package:
  `/rfid` and `/testing` only (ESLint), mapped to the device package's `src` in `tsconfig.json`
  and Jest, cleared in `tsconfig.build.json`.
- **The SDK never enters the repository.** Zebra's RFID SDK for Android comes from its support
  portal (`Zebra_RFIDAPI3_SDK_2.0.5.297.zip`), not a public repository. The module depends on
  `com.zebra.rfid:rfidapi3lib:2.0.5.297`, which the config plugin (`app.plugin.js`) puts in a
  Maven repository inside the app's `android/` from the app's `aarPath` (the root `.gitignore`
  ignores `rfidapi3*.aar` and `zebra-rfid-repository/`). Only `rfidapi3lib`: the zip's
  `rfidapi3ziotcllrplib` is the same API plus LLRP for fixed readers, and the two clash. A
  local AAR has no POM, so the module declares the one library the SDK uses undeclared
  (`androidx.localbroadcastmanager`). The SDK's minimum is Android 10 (`minSdkVersion` 29), its
  manifest declares the location for every version (the plugin caps it at Android 11 with
  `tools:node="replace"`), and it refers to Qualcomm's `com.qti.qrs.qc_sdk` for readers built
  into hosts (declared optional, as Zebra's sample does). It has no native code.
- **The Kotlin module** (`android/…/ZebraRfidModule.kt`) keeps the SDK's units (peak RSSI,
  power as an index into the reader's table, the SDK's volume names) and the adapter
  (`src/adapter.ts`) converts them. The SDK's `connect()`, `disconnect()` and reader list block:
  they run on the module's `link` thread (connect, reconnection, discovery polls) or on Expo's
  module queue, never under `lock`; reads arrive on SDK threads and are batched to JavaScript
  every 100 ms from `worker`. A `generation` counter, raised by every `connect()` and
  `disconnect()`, lets a late attempt close what it opened. It reaches **paired** readers only
  (`Readers` over `ENUM_TRANSPORT.BLUETOOTH`): `connect(id)` takes the address or the name the
  reader is paired under, and discovery polls the SDK's list every 3 s (no RSSI). It reconnects
  by itself after `DISCONNECTION_EVENT` (1, 3, 5, then every 10 s; at once on
  `RFIDReaderAppeared`). TIDs come from a TID-bank access (`TagAccess.readEvent`), stopped with
  `stopAccess()`; the locate is `TagLocationing.Perform`, its value the searched tag's peak RSSI,
  with the SDK's relative distance (0–100) in the diagnostics only (plan decision Z3). There is
  no `readOnce`: the engine emulates the single read. Tag times are the arrival time. Every
  native change raises `NATIVE_REVISION` in the Kotlin and `ZEBRA_NATIVE_REVISION` in
  `src/native.ts` together.
- **Checking the Kotlin**: as for Honeywell, with Gradle's bundled `kotlinc` against the AAR's
  `classes.jar` (and its `libs/rfidserviceapi.jar`), stubs of the few Android classes it uses and
  of Expo's DSL. A real build runs on a developer's machine.
- **No host check.** The RFD40 Premium pairs with any Android device and the SDK checks no
  brand, so `isSupported()` needs Android and the linked module only.
- **Tests** run on `jest-expo/android` over `src/__tests__/fakeNative.ts`, a JavaScript copy of
  the Kotlin module's behaviour, and the conformance kit twice (`contract.test.ts`: with the
  native search and without). Keep the fake in step with the Kotlin.
