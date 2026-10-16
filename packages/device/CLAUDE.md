# packages/device — the headless device hardware package

Roadmap and decisions: `docs/device-package-plan.md`. Read it before adding a capability.

- **Published** from `release.yml` like the other packages (changesets, trusted publishing).
  A user-visible change needs a changeset. `changeset publish` publishes any non-private
  package whose version is not on npm yet, so a new package must stay `"private": true`
  until it is ready to ship (this one was, through its v1 phases).
- **One subpath per capability.** `./info`, `./location`, `./camera`, `./network`, `./battery`,
  `./keep-awake`, `./orientation`, `./haptics`, `./biometrics`, `./secure-store`, `./sensors`, `./media-picker`, `./media-library`, `./background-location`, `./bluetooth`, `./rfid`, plus `./testing`. Each capability owns its native modules (`expo-device` +
  `expo-application`, `expo-location`, `expo-camera`, netinfo, `expo-battery`,
  `expo-keep-awake`, `expo-screen-orientation`, `expo-haptics`, `expo-local-authentication`, `expo-secure-store`, `expo-sensors`, `expo-image-picker`, `expo-media-library`, `expo-task-manager`, `react-native-ble-manager`), and those are **optional** peers (`peerDependenciesMeta`): Metro resolves
  every static import reachable from an entry point, so a native import is only safe inside
  the folder of the subpath that needs it. ESLint enforces it (`DEVICE_CAPABILITIES` in the
  root `eslint.config.js`): a capability cannot import another capability or another
  capability's Expo module; the root entry, `core/` and `testing/` import no native module and
  may only `import type` from a capability. Add a new Expo module to `DEVICE_CAPABILITIES`
  in the same change that adds it as a peer.
- **Adding a subpath** means four things kept in step: the `exports` entry, the node10
  fallback folder (`<name>/package.json`, which attw checks), its name in `files`, and the
  list in `src/__tests__/package-exports.test.ts` (which fails when any of them drifts).
- **Adapters.** Hooks and components talk only to a capability's adapter interface, never to
  Expo. The interface's types are the package's own: an Expo type in a public signature
  ties the API to one implementation. The Expo adapter is the default (imported by its
  subpath); an app overrides it through the provider, and `/testing` supplies in-memory
  adapters the same way — no `jest.mock` of Expo modules.
- **The provider** (`src/core/adapters.tsx`) lives in core and names each capability's adapter
  by `import type` only. A new capability adds its key to `DeviceAdapters` and to the
  provider's `useMemo` (one dependency per adapter, because `adapters` is usually an inline
  literal). Hooks read `useDeviceAdapter(key) ?? <expo default>`.
- **Static values go through `useSyncExternalStore`** with a server snapshot (see
  `info/useDeviceInfo.ts`): the web export prerenders in Node, and rendering the adapter's
  answer there would mismatch on hydration. `__tests__/info-ssr.test.tsx` pins it with
  `react-dom/server`.
- **Permissions.** Every capability reports `PermissionState` (`src/core/types.ts`).
  Expo adapters convert with `toPermissionState()`; a capability needing several
  permissions (camera + microphone) combines them with `combinePermissions()`. It is a copy
  of the notifications model on purpose: the two packages stay independent.
- **Web.** The static export prerenders in Node. Read browser globals at call time
  (`hasDOM()`), never at module scope, and keep an `isSupported` guard on every
  imperative API.
- **Location** (`src/location`): the hooks run `ensureReady()` (support → permission →
  services) before any read, so no adapter read ever prompts — on web, asking for a position
  _is_ the prompt. Only `requestPermission` may prompt. Permission state lives in one store
  per adapter, so hooks agree and a request updates them all. The web
  default is `web.ts` on `navigator.geolocation`, not expo-location's web build (see
  `docs/device-package-plan.md`, phase 3). `useCurrentPosition` derives `isLoading` from a
  request key: the React Compiler lint forbids a synchronous `setState` in an effect.
  The compass (`heading.ts`, `useHeading`) uses the optional `adapter.watchHeading` (absent
  on the web): one native watch per adapter (Android keeps one, a second steals the
  events), stopped on `background` (not `inactive`), closed with the last reader (it
  subscribes after an async permission read, so a grace period would buy nothing). It
  checks support and permission, not the services; expo's `-1` true heading becomes `null`.
  The mock assigns `watchHeading` after building the object: Babel's object spread copies
  getters as values, so a spread in a literal with getters freezes them.
  Geocoding (`geocoder.ts`, `useGeocoder`) has its own adapter key, `geocoder`
  (`GeocoderAdapter`), so an app swaps only that for its own provider. The hook validates the
  input (`TypeError` / `RangeError` before the adapter), checks support, applies a timeout
  (15 s; the native request is not cancelled) and turns anything but a `LocationError` into
  `unavailable`. No permission check: iOS needs none, Android's error maps to
  `permission-denied`, and a custom provider needs none. `expoGeocoderAdapter` is unsupported
  on the web on purpose (expo answers `[]` there, which reads as "not found"); it drops iOS
  placemarks without a location and Android's meaningless 0 accuracy, and blanks become `null`.
- **Background location** (`src/background-location`): `/location`'s positions, permission and
  `LocationError` live in `core/geo.ts`, re-exported by both subpaths (one class, so
  `instanceof` and `isLocationError` agree), because a capability may not import another. Both
  import `expo-location`: `DEVICE_CAPABILITIES` lists it for each, and a module is forbidden only
  to capabilities that do not list it. `defineLocationTask` registers the handler in `tasks.ts`
  (plain JavaScript: the hooks check a task exists before `start`, and the mock's `deliver()` runs
  it) and, on native, with expo-task-manager. The hook checks support, the task, the foreground
  permission and the services; the Android-only checks (background permission without a
  foreground service, a service started from the background) are left to expo's native code,
  which `toStartError` maps, so the hook stays platform-free. `foregroundService` is required
  (an object or `false`): the Android choice is written at every call. The Expo adapter sends
  `pausesUpdatesAutomatically: false` unless asked (expo's iOS consumer defaults it to true),
  stops only after `hasStartedLocationUpdatesAsync` (Android throws `TaskNotFoundException`), and
  runs the background request inside `systemSheet` (Android 11+ opens the settings page).
  `isRunning` is one store per adapter and name; a read that began before a `start` / `stop` is
  dropped. The plugin key `backgroundLocation` passes its flags through `withLocation`
  (expo-location's plugin runs once per prebuild) and removes task-manager's `fetch` mode with an
  Info.plist mod registered _before_ task-manager's plugin: those mods run in reverse order.
  Geofencing (`defineGeofenceTask`, `useGeofencing`) shares the subpath: `tasks.ts` keeps one
  registry for both kinds (a name is one task on the platform, so a name holds one kind) and the
  `isRunning` stores are keyed by kind and name. `start()` checks the regions (`regions.ts`:
  required unique `id`, a `RangeError` above `adapter.geofenceLimit`, 20 on iOS and 100 on
  Android), the foreground permission, the services and the background permission, which both
  platforms require. The Expo adapter sends `notifyOnEntry` beside `notifyOnEnter` (expo's iOS
  consumer reads that name), and `defineGeofenceTask`'s executor drops a transition the region
  turned off, read back through `getTaskOptionsAsync` (iOS reports determined states without
  the flags); unreadable options let the event through. Android's `hasStartedGeofencingAsync`
  throws without the background permission: the adapter reads that as not started. Android sends
  geofencing failures as a message alone (`"Geofencing not available."` is location switched
  off). The plugin's `geofencing: true` adds the background permission in any `mode`, and
  `mode: "none"` is geofencing alone.
- **Bluetooth** (`src/bluetooth`): BLE central on `react-native-ble-manager`, the package's only
  peer that is not an Expo module. Its module builds its manager at import and throws without
  the native module (Expo Go), so `bleManager.ts` requires it on first use inside a `try`
  (`loadBleManager`, never on the web) and a missing module reads `unsupported`. `start()` runs
  once per process (`ensureStarted`, after `isStarted()`): on iOS each call builds another
  central manager, and building it is what prompts, so iOS starts only from `requestPermission`
  (or when a manager already exists) and reads `undetermined` / `unknown` before; Android starts
  on the first state subscription, which never prompts (its state events need it). The power
  alert is off (`showAlert: false`). Android permissions go through React Native's
  `PermissionsAndroid` (`BLUETOOTH_SCAN` + `BLUETOOTH_CONNECT` from API 31, plus
  `ACCESS_FINE_LOCATION` with `neverForLocation: false`; `ACCESS_FINE_LOCATION` alone up to 30);
  a check cannot tell "never ask again", so the adapter keeps a request's refusal for the launch.
  Requests and `enable()` run inside `systemSheet` (another activity on Android).
  `useBluetoothState` is a live store per adapter; `useBluetoothPermission`'s request also
  refreshes it (on iOS the state starts with the request). `ensureBluetoothReady` (support →
  permission → radio `on`) is what every later operation checks, and never prompts. UUIDs go out
  lowercase 128-bit (`toBluetoothUuid`). The plugin key `bluetooth` calls ble-manager's plugin
  with `neverForLocation` defaulting to `true` (its own default is `false`), and is registered
  _before_ `location`: Android manifest mods run in reverse order, so expo-location's uncapped
  `ACCESS_FINE_LOCATION` is written first and ble-manager, which skips a declared permission,
  adds no second one capped at API 30. Its adapter test swaps `Platform` and spies
  `PermissionsAndroid` on the main registry, not the isolated one: react-native's index requires
  them in getters, at call time.
  Scanning (`scan.ts`, `useBluetoothScan`): one scan store per adapter, as the platform has one
  scan: a `start()` replaces it, every reader shares the list, and the last reader leaving stops
  it (a microtask later, as `sensors/stream.ts`). `start()` validates (`TypeError` /
  `RangeError`), runs `ensureBluetoothReady`, and only then `adapter.startScan`; a session id
  drops anything from a replaced or stopped scan. Devices are deduplicated by `id` (the name of
  a repeat without one is kept) and rendered at most every 250 ms (`SCAN_UPDATE_INTERVAL`; the
  first device after a reset shows at once). The timeout is the store's timer, not
  ble-manager's `seconds`, so the scan can pause on `background` (the adapter's scan stops) and
  resume on `active` for the time it had left; the radio store ending in `off` /
  `unauthorized` finishes it with an error. The adapter scans with `allowDuplicates` (iOS reports
  a device once otherwise, and its RSSI never moves) and Android's low-latency mode; it
  delays a start past Android's five-in-30-seconds limit (`throttle.ts`), gives up on a
  `scan()` that never calls back (Android's, with the radio off) after 5 s, ignores
  `onStopScan` statuses 0 and 10 (its own stops) and maps the others (Android's
  `ScanCallback` codes). ble-manager reports at most one manufacturer data entry, keyed by the
  company id in hex, and Android's missing transmit power as `Integer.MIN_VALUE`.
  Connections (`connection.ts`): one store per adapter, one entry per device id (shared by every
  `useBluetoothDevice` / `useBluetoothNotifications` on it), each with a `session` bumped by every
  connect and disconnect so late answers are dropped. `connect()` = `ensureBluetoothReady` →
  `adapter.connect` (with the store's timeout: iOS never times out; a timeout disconnects to
  cancel) → `discoverServices` → `connected`, then turns every registered notification on again.
  The adapter's disconnect events act only on a `connected` entry (a requested close is
  `disconnecting`, a failed attempt is `connect()`'s to report). GATT calls need `connected` and
  time out after 10 s (`GATT_TIMEOUT`). Notifications are counted per characteristic: on with
  the first reader (once connected), off with the last; one that finished turning on after its
  readers left is turned off. `hold()` counts mounted hooks; the last one leaving closes the
  connection a microtask later unless it set `disconnectOnUnmount: false`. `write()` defaults
  `withResponse` from the discovered properties. The adapter passes SIG UUIDs to ble-manager in
  their short form (`shortBluetoothUuid`: CoreBluetooth compares `CBUUID`s it built from them),
  chunks writes at MTU − 3 (ble-manager's `maxByteSize`; Android's MTU tracked per device and
  reset on connect, iOS asked via `getMaximumWriteValueLength…`), and maps ble-manager's string
  errors by their wording (`toGattError`). `bond` exists on Android only, so `canBond` is
  `typeof adapter.bond === "function"`. Profiles (`profiles.ts`): Device Information and Battery,
  UTF-8 by hand (Hermes' `TextDecoder` is not relied on), Nordic UART constants. In the mock,
  `bond` is assigned after the literal: an object spread there would freeze its getters (as the
  location mock's `watchHeading`). Jest: a lazy `require` that runs after `isolateModules` lands
  in the main registry, and Jest then serves that mock to later isolated registries, so a test
  that needs the module missing mocks `isNativePlatform` instead.
- **RFID** (`src/rfid`): a contract and its engine, no native code and no default adapter
  (`DEVICE_CAPABILITIES` lists it with no module). Vendor packages (`@its/rfid-*`) implement
  `RfidAdapter`; ADR-R1 in the plan says why. The contract's units are fixed (dBm, ms epoch,
  uppercase hex), `contractVersion` must match `RFID_CONTRACT_VERSION` (checked by
  `ensureReady`: supported → version → permission → connected) and `capabilities` are read from
  which optional methods exist (`getRfidCapabilities`), never declared. `engine.ts` keeps one
  engine per adapter: the connection (a live store over `getConnection` /
  `subscribeConnection`), the permission store, the latest connect error, and **one mode at a
  time**. A mode (`RfidMode`: `end(error)` for its own state, `stop()` for the reader's side,
  which awaits its start first) goes through `begin()`, which ends the previous one, waits for
  every earlier stop (`stopping` is a chain, so a new mode starts only on a stopped reader),
  checks readiness and only then watches `AppState` (background ends it) and the connection
  (anything but `connected` ends it with `disconnected`). `finish()` is the reader ending it
  (no stop), `stop()` the app, `complete()` a mode that reached its result, `abandon()` a
  failed `begin()`. The stores (`inventory.ts`, `singleRead.ts`, `locate.ts`) hold their
  snapshot and their current mode; the inventory and the search stop when their last reader
  leaves (a microtask later). Reads merge by normalised EPC (`tags.ts`: EMA 0.3 on the RSSI,
  proximity between the bounds), render at most every 250 ms (search: 100 ms) through
  `createThrottle` (the first at once after a reset). `read()` returns its promise before the
  work starts, so a read replaced during a native window rejects then, not when the window ends.
  The search is native (`startLocate`) or an inventory keeping the target's strongest read per
  batch; it reads out of range after 2 s of silence (an interval checks, as silence sends no
  event). Discovery and the trigger sit beside the modes: the trigger store holds one adapter
  subscription while any handler or snapshot listens. Testing: `createMockRfidAdapter()` is
  the reference adapter (optional methods assigned after the literal, so a capability turned
  off is absent, not `undefined`), and `describeRfidAdapterContract()` is the vendors' suite:
  it takes `{ describe, it }` (`/testing` needs no Jest globals), uses its own assertions and
  real timers, and `rfid-contract.test.ts` checks it fails broken adapters.
- **Permission stores** (`src/core/permissionStore.ts`): `createPermissionStore()` shares one
  permission's state between hooks (last call wins, concurrent refreshes share a read; it also
  backs `/background-location`'s `isRunning`) and
  `usePermissionSnapshot()` subscribes, reads on first use and re-reads on foreground. Each
  capability keeps its stores in a `WeakMap` keyed by adapter (camera: one per kind).
- **Camera** (`src/camera`): the adapter's `Preview` is a component (the camera is a native
  view) whose ref exposes `CameraHandle`. `CameraView` owns everything adapter-independent:
  defaults, scan dedupe (`scanInterval`), the stable `barcodeTypes` identity, the
  `invalid-mode` / `unsupported` checks and error normalisation, so an adapter only maps
  props. `isSupported()` is read through `useSyncExternalStore` with a `false` server
  snapshot (`__tests__/camera-ssr.test.tsx`): never call it during render directly. The web
  default stays expo-camera (preview, pictures and scanning work there); `supportsVideo()` is
  false on web because its `record()` only warns and returns an empty uri.
- **Live values** (`src/core/liveStore.ts`): `createLiveStore()` shares one platform
  subscription between every hook (opened by the first listener, closed by the last), skips
  shallow-equal updates (platforms re-send equal states), and `useLiveValue()` reads it with a
  `null` server snapshot for the static export. Capabilities that push changes (network,
  battery) build on it, one store per adapter in a `WeakMap`.
- **Network** (`src/network`): netinfo on native; on web `web.ts` on `navigator.onLine` and
  the Network Information API, not netinfo's web build (it probes `HEAD /` every minute and
  reads anything but 200 as offline). `isInternetReachable` is `null` on web while online:
  never report a reachability nobody checked.
- **Battery** (`src/battery`): the Expo adapter merges expo-battery's three events into one
  status (events that beat the first read are kept). On web `web.ts` on `navigator.getBattery()`,
  not expo-battery's web build (no `addListener`, Low Power Mode `false` instead of unknown).
- **Keep awake** (`src/keep-awake`): one tag per mounted `useKeepAwake` (`useId()`). On web
  `web.ts` holds the Screen Wake Lock itself, not expo-keep-awake's web build: it re-acquires on
  `visibilitychange`, sends one request per tag at a time and releases a lock granted after its
  deactivation. Its holds are module state: its test loads it with `jest.isolateModules`.
- **Orientation** (`src/orientation`): `useOrientation()` on the live store; locks go through
  `lockStack.ts`, one stack per adapter: the most recent lock wins, platform calls run one at a
  time against the stack as it is when they run (a screen replacing another never unlocks in
  between), and the last release calls `adapter.unlock()`, which means "back to the app's own
  orientation". The Expo adapter saves `getPlatformOrientationLockAsync()` before its first
  lock and restores it, because expo's `unlockAsync()` lets a portrait-only app rotate; Android's
  `SCREEN_ORIENTATION_LANDSCAPE` is 0, which `lockPlatformAsync` rejects, so it goes through
  `lockAsync(LANDSCAPE_RIGHT)`. On web `web.ts` on `screen.orientation` (expo's web unlock is
  `lock("natural")`).
- **Haptics** (`src/haptics`): `useHaptics()` swallows every failure (haptics decorate an
  action) and plays nothing where unsupported; `hapticFeedback` is the module-level bridge to
  `@its/glowup-ui`'s `ThemeProvider onInteractionFeedback` on the default adapter. Its
  `InteractionKind` repeats ui's strings instead of importing them (the packages stay
  independent). Android interactions use `performAndroidHapticsAsync` with constants every API
  level has (newer ones throw below API 30 / 34). On web the Expo adapter answers unsupported,
  so nothing plays (biometrics and secure store likewise have no web adapter).
- **Biometrics** (`src/biometrics`): a local gate, documented as such. `authenticate()` resolves
  every outcome as `{ success: false, error }` and rejects only on an empty label (both labels are
  required: expo's defaults are English). One system prompt at a time (`busy` otherwise), because
  Android answers a second call with `app_cancel` and iOS stacks one: the session is
  `core/promptSession.ts`, shared with `/secure-store`'s protected items (a capability may not
  import another, core may serve both). The Expo adapter maps
  every native string, including the ones expo's type omits (`missing_usage_description`,
  `unknown: …`), and sends `strong` + passcode as biometrics only on API 28–29 (AndroidX rejects
  the combination and expo hangs). The status is a live store re-read on `active` only: Face ID's
  prompt takes the app through `inactive`.
  `useAppLock` (`appLock.ts`) keeps one lock per adapter: `useAppLock` hooks register their
  options and the strictest wins. It locks only on `active` after a `background` older than
  `relockAfter` (never on `inactive`), and a `background` that starts while a prompt is open does
  not count: Android pauses the activity behind the device-credential screen and delivers the
  result before resuming, so the unlock would lock again. `promptOnLock` claims one prompt per
  `lockId`.
- **Secure store** (`src/secure-store`): plain values reject with `SecureStoreError` (keys and
  values are validated before the adapter; `locked` is iOS's errSecInteractionNotAllowed, matched
  on expo's message). `useSecureValue` keeps one store per adapter, service and key (last call
  wins, writes through the package reach every reader) and re-reads on `active` only after a
  failed read. The Expo adapter deletes before an iOS write because `SecItemUpdate` keeps the
  old accessibility. No `localStorage` fallback on web, on purpose. Protected items
  (`getProtected` / `setProtected` / `removeProtected`) resolve `{ status }` through the shared
  prompt session; each lives under its own derived service (`glowup.protected.<service>.<key>`:
  Android deletes every protected item of a service when one invalidated item is written again)
  with a plain marker beside it, so `null` + marker reads `invalidated`. The Expo adapter turns
  expo's English messages into `ProtectedAccessError` statuses (`PROTECTED_MESSAGES`, pinned by
  tests on 57.0.4's strings); `/testing` builds the same error by shape (it may not import it).
- **Sensors** (`src/sensors`): adapters deliver readings already normalised (SI units, device
  axes, W3C/Android signs, ms timestamps: see `types.ts`); the Expo adapter inverts iOS's
  accelerometer and scales it from g. `stream.ts` keeps one platform subscription per adapter
  and sensor: opened only after `isAvailable` answered true (asked once), run at the fastest
  interval asked for, each reader throttled to its own with a 10% tolerance, stopped on
  `background` (not `inactive`), closed a microtask after the last reader leaves so a reader
  replaced in the same commit does not restart it. On web `web.ts` on `devicemotion`, not
  expo-sensors' web build (it sends orientation angles as the accelerometer and acceleration
  as the gyroscope); availability there is a probe for an event carrying the sensor's data.
  The motion permission gates a sensor per platform (`adapter.requiresPermission`: iOS's
  barometer, iOS Safari's motion sensors): the stream opens it only once granted and never
  prompts; the permission is read for no other sensor, because expo's iOS requester crashes
  without `NSMotionUsageDescription`. `request()` must stay synchronous down to
  `DeviceMotionEvent.requestPermission()` (Safari grants only inside the gesture).
  `useDeviceOrientation` classifies gravity with a 35°/55° hysteresis and keeps its last answer
  in a ref (an updater returning the same value still renders once).
- **Media picker** (`src/media-picker`): `pick()` checks its options (`toPickRequest`, a
  `TypeError` before anything opens) and stays synchronous down to the adapter: the web opens its
  file dialog only inside the user's gesture. It runs inside core's `systemSheet`, which
  `useAppLock` reads (Android stops the app behind the picker; that background must not lock).
  One pick at a time is the adapter's job: the Expo adapter answers `busy` (expo keeps one
  picking context: a second call orphans the first promise on iOS and answers `canceled` on
  Android); the web adapter cannot know when a dialog closed without `cancel`, so a new pick
  settles the old one as `cancelled`. The web default is `web.ts` on a file input, not
  expo-image-picker's web build (durations in seconds, `selectionLimit` ignored, a pending
  promise without `cancel`). `edit` with `exif` is refused: on iOS it reads the photo library
  (PhotoKit), which prompts for full library access, with expo's generic purpose string.
- **Media library** (`src/media-library`): saving only. `expo.ts` imports expo-media-library's
  object API (`Asset.create`, which keeps the original file); `expo.web.ts` replaces it in a web
  bundle, because that entry throws at import in a browser (`requireNativeModule`). It is the
  package's only platform split: bob builds both files, Metro picks `.web.js`, and `tsc` and
  jest see `expo.ts`. Keep `expo.web.ts` free of any runtime import of `./expo` (a type import
  only). The permission is required on iOS (add-only, never asked for by `Asset.create`) and
  Android before 11 (storage); from 11 the adapter answers `granted` without calling expo, whose
  write-only request would still ask for `WRITE_EXTERNAL_STORAGE` on 11 and 12, where it grants
  nothing. `save()` refreshes the
  permission, asks only while `canAskAgain`, then saves.
- **Config plugin** (`app.plugin.js`): plain CommonJS run at prebuild. A capability's Expo
  plugin is required only when the app lists it; an unknown key throws. Each capability's
  function receives every option as a third argument (`mediaPicker` keeps `CAMERA` and
  `RECORD_AUDIO` when `camera` needs them). Its test
  (`__tests__/plugin.test.ts`) compiles the mods in introspection mode, so assert on the
  resulting Info.plist / AndroidManifest, not on the props passed along. `validate-package`
  excludes it from attw (a script, not a typed module).
- **`react` and `react-dom` are pinned dev dependencies** at the playground's versions. Without
  them, adding an Expo module whose peer is `expo` fails with ERESOLVE: npm resolves expo's
  optional `react-dom` peer to the latest release, whose `react` peer the tree cannot meet.
  Bump them with the Expo SDK, like every other native version.
- Build, `files`, source maps and `validate-package` work as in `packages/ui` (see its
  CLAUDE.md).
