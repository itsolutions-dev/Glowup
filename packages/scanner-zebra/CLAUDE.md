# packages/scanner-zebra — the Zebra barcode scanner vendor package

Roadmap, DataWedge's facts and the decisions: `docs/device-package-plan.md`, "Zebra (TC22) — the
barcode scanner's second vendor". The package has `packages/scanner-honeywell`'s shape on purpose:
keep the two alike unless DataWedge forces a difference, and say which in the plan.

- **Private until phase ZB3** (`"private": true`, version `0.0.0`): `changeset publish` would
  publish it otherwise. It already builds and validates (`npm run build`, `validate-package`);
  the root `build`, `ci.yml`, `release.yml` and `examples/consumer` name it when it goes public,
  with its own trusted publisher on npmjs.com and a changeset to `0.1.0`.
- **It implements `@its/glowup-device/scanner` and nothing else**: `/scanner` and `/testing`
  only (ESLint), mapped to the device package's `src` in `tsconfig.json` and Jest, cleared in
  `tsconfig.build.json`.
- **No SDK and no config plugin.** DataWedge is driven by broadcast intents
  (`com.symbol.datawedge.api.ACTION`), so the module has no dependency. The only manifest entry,
  `<queries>` for `com.symbol.datawedge`, is in the module's own `AndroidManifest.xml`, which the
  manifest merger carries into the app. Zebra's Scanner SDK for Android (`com.zebra.scannercontrol`)
  is for external Bluetooth / USB scanners on other brands' hosts, not this; the root
  `.gitignore` keeps its AAR out anyway.
- **The Kotlin module** (`android/…/ZebraScannerModule.kt`) is thin on purpose: JavaScript sends
  DataWedge's own parameter names and string values (`src/convert.ts`, `toOpenConfig`), where
  the mapping is tested. `open()` (on the module's `worker` thread) checks once per process that
  DataWedge answers and is enabled, sets the app's profile up once per process and set of data
  parameters (create if missing with the app's package and every activity, then barcode input,
  intent output as a broadcast to `<package>.GLOWUP_SCAN`, keystroke and data formatting off),
  registers for the `SCANNER_STATUS` and `PROFILE_SWITCH` notifications, checks the **active**
  profile is the app's (from the notifications once they come, else `GET_ACTIVE_PROFILE`;
  `SWITCH_TO_PROFILE` once if not, then `ERR_UNAVAILABLE`), enables the barcode input, then
  writes the claim's decoders in the stored profile with `SET_CONFIG` and puts every other key it
  ever wrote back to the profile's own value. Those originals are read with `GET_CONFIG` before
  the first write of a key and kept in `SharedPreferences` (`expo.modules.scannerzebra.originals`,
  `<profile>/<key>`), so a restart or a crash finds them. A value already written in this process
  is not written again: each `SET_CONFIG` reloads the profile. **`PLUGIN_CONFIG` is always an
  `ArrayList`** (DataWedge 15 ignored a single `Bundle`: "expected ArrayList" in its log), and
  **every barcode `PARAM_LIST` names its scanner** (`scanner_selection` `auto`, the default
  scanner's configuration): without one DataWedge answers SUCCESS and applies nothing, on a TC22
  that lists ten scanners. `SWITCH_SCANNER_PARAMS` is not used: it changed no decoder on the TC22
  (it would need `scanner_selection_by_identifier` too; plan, "Phase ZB2"). Each DataWedge answer takes about 0.5 s (measured), so `open()` asks as little as it
  can. `close()` sends `DISABLE_PLUGIN` only while the app is in front and DataWedge on its
  profile: those commands act on the active profile, which in the background is another app's.
  Whether the app is in front comes from Android (`ActivityManager.getMyMemoryState`), not from
  Expo's activity events, which stayed on "background" on the TC22. A command waits for its
  result (`COMMAND_IDENTIFIER`, `SEND_RESULT` `true`, or `COMPLETE_RESULT` for `SET_CONFIG`;
  5 s) on `worker`; the receiver (exported: DataWedge is another app) runs on its own `events`
  thread and completes it, so nothing waits on the thread that answers. Reads are sent only while
  open. A `PROFILE_SWITCH` to another profile closes with `ERR_UNAVAILABLE` only if the app is
  still in front a second later (DataWedge names the launcher's profile as Home is pressed).
  Every native change raises `NATIVE_REVISION` in the Kotlin and `ZEBRA_SCANNER_NATIVE_REVISION`
  in `src/native.ts` together.
- **Checking the Kotlin.** Gradle's bundled `kotlinc` against stubs of the Android classes it
  uses (`Context`, `Intent`, `IntentFilter`, `BroadcastReceiver`, `Bundle`, `PackageManager`,
  `Build`, `Handler`, `HandlerThread`, `SharedPreferences`, `ActivityManager`) and of Expo's DSL. A real build runs on a developer's
  machine.
- **No trigger events**: DataWedge reports scanner statuses, not presses, so the adapter has no
  `onTrigger` and the conformance harness no `pressTrigger`. No AIM id and no decode time: the
  type comes from the label type (`LABEL_TYPES`), the timestamp is the arrival.
- **Host check.** `isSupported()` needs Android, the linked module, a Zebra manufacturer and
  DataWedge installed. `requireZebraHost: false` exists for a lab test only.
- **Tests** run on `jest-expo/android` over `src/__tests__/fakeNative.ts`, a JavaScript copy of
  the Kotlin module's behaviour and of DataWedge's (the stored profile, the kept originals across
  a restart, a read only for an enabled decoder, UPC digits by the profile's settings), including the
  conformance kit (`contract.test.ts`). Keep the fake in step with the Kotlin.
