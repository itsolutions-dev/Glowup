# packages/scanner-honeywell — the Honeywell barcode scanner vendor package

Roadmap, the Data Collection SDK's facts and the decisions: `docs/device-package-plan.md`,
"v0.12 — barcode scanner". The package has the RFID vendor packages' shape on purpose
(`packages/rfid-honeywell/CLAUDE.md`): keep them alike unless the SDK forces a difference, and
say which in the plan.

- **Private until phase C3** (`"private": true`, version `0.0.0`): `changeset publish` would
  publish it otherwise. It already builds and validates (`npm run build`, `validate-package`);
  the root `build`, `ci.yml`, `release.yml` and `examples/consumer` name it when it goes public,
  with its own trusted publisher on npmjs.com and a changeset to `0.1.0`.
- **It implements `@its/glowup-device/scanner` and nothing else**: `/scanner` and `/testing`
  only (ESLint), mapped to the device package's `src` in `tsconfig.json` and Jest, cleared in
  `tsconfig.build.json`.
- **The SDK never enters the repository.** The module depends on
  `com.honeywell.aidc:datacollection:1.97.00.0060`, which the config plugin (`app.plugin.js`)
  puts in a Maven repository inside the app's `android/` from the app's `dataCollectionAarPath`
  (the root `.gitignore` ignores `DataCollection*.aar` and `honeywell-scanner-repository/`).
  `@its/rfid-honeywell` depends on the same coordinate (plan C5): keep the two versions equal;
  `apps/rfid-diagnostics`' test fails when they differ. The SDK has no native code and its
  manifest declares the service's permission; the plugin adds nothing to the manifest.
- **The Kotlin module** (`android/…/HoneywellScannerModule.kt`) is thin on purpose: JavaScript
  sends the SDK's own property keys (`src/convert.ts`, `toOpenProperties`), where the mapping is
  tested; the module sets them, remembers what each key held before it first changed it, and puts
  back the keys a later `open()` leaves out (a request without symbologies keeps the device's
  settings). `open()` binds the service once (`AidcManager.create`, 10 s timeout), creates the
  internal imager's reader once with its listeners, sets the properties, then claims;
  `close()` releases (the reader stays for the next claim). Reads, triggers and the claim taken
  back (`onClose`, `ERR_UNAVAILABLE`) are sent only while claimed. It leaves the app's lifecycle
  to the engine (it releases in the background through `close()`). Every native change raises
  `NATIVE_REVISION` in the Kotlin and `HONEYWELL_SCANNER_NATIVE_REVISION` in `src/native.ts`
  together.
- **Checking the Kotlin.** As for the RFID packages: Gradle's bundled `kotlinc` against the AAR's
  `classes.jar`, stubs of the few Android classes it uses (`Context`, `Handler`,
  `HandlerThread`, `Looper`, plus `Parcelable`, `Parcel`, `Point`, `Bitmap` and
  `ServiceConnection` for the SDK's signatures) and of Expo's DSL. A real build runs on a
  developer's machine.
- **No wedge in the app** (measured): after a release the wedge types into other apps, never into
  this one, likely because the `AidcManager` and the reader stay open. Documented, not fixed
  (plan C2: reads go through `onScan` only); closing them on release is the way back if that
  decision changes.
- **Host check.** `isSupported()` needs Android, the linked module and a Honeywell manufacturer.
  `requireHoneywellHost: false` exists for a lab test only.
- **Tests** run on `jest-expo/android` over `src/__tests__/fakeNative.ts`, a JavaScript copy of
  the Kotlin module's behaviour and of the service's (a read arrives only for an enabled
  symbology), including the conformance kit (`contract.test.ts`). Keep the fake in step with the
  Kotlin when either changes.
