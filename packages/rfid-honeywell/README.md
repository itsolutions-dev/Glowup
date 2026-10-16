# @its/rfid-honeywell

Honeywell RFID readers (the IH40 over Bluetooth, through the Honeywell RFID SDK v1.1.0) behind
[`@its/glowup-device/rfid`](../device/README.md#rfid). The screens use `/rfid`'s hooks; this package
is the one line that picks the vendor.

> **Status: spike (phase 35).** Private, not published. The adapter passes the contract's
> conformance kit against a faked native module; the Kotlin module compiles against the SDK but
> has not run on a reader yet. `apps/rfid-diagnostics` is the app the team runs on a CT40 + IH40
> to confirm it.

## The SDKs are yours to supply

The SDK's licence lets it travel only inside an app's build, so this package does not ship it.
Download `honeywell_rfid_sdk_v1.1.0.aar` from Honeywell's support portal and keep it out of git.

The RFID SDK also needs Honeywell's Data Collection SDK, `DataCollection.aar`. Its `RfidService`
sets up its USB transport on every bind, and that transport loads `com.honeywell.aidc`. Without
the AAR the app crashes with `NoClassDefFoundError: com/honeywell/aidc/AidcManager$CreatedCallback`
as soon as it binds the service, even over Bluetooth. Take `DataCollection.aar` from the
`app/libs` folder of the RFID SDK's sample app, which ships the two together (1.97.00.0060 there),
or from the Honeywell Mobility SDK for Android. Keep it out of git too.

Point the config plugin at both:

```ts
// app.config.ts
plugins: [
  [
    "@its/rfid-honeywell",
    {
      aarPath: "./honeywell/honeywell_rfid_sdk_v1.1.0.aar",
      dataCollectionAarPath: "./honeywell/DataCollection.aar",
    },
  ],
],
```

At prebuild the plugin:

- copies the two AARs into a Maven repository inside `android/` and declares it for their groups
  only;
- raises `minSdkVersion` to 26, the SDK's;
- declares the Bluetooth permissions: `BLUETOOTH_SCAN` (`neverForLocation`) and
  `BLUETOOTH_CONNECT` from Android 12, and `ACCESS_FINE_LOCATION` capped at Android 11, which a
  reader search needs there. An app that uses location itself lists this plugin **before**
  `expo-location`, so the uncapped declaration wins.

It needs a development build (`npx expo run:android`); Expo Go and iOS read `unsupported`.

## Use

```tsx
import { DeviceAdaptersProvider } from "@its/glowup-device";
import { getHoneywellRfidAdapter } from "@its/rfid-honeywell";

<DeviceAdaptersProvider adapters={{ rfid: getHoneywellRfidAdapter() }}>
  <App />
</DeviceAdaptersProvider>;
```

Everything else is `@its/glowup-device/rfid`: `useRfidReader`, `useRfidInventory`,
`useRfidLocate`, `useRfidSingleRead`, `useRfidTrigger`, `useRfidReaderDiscovery`.

- **Honeywell hosts only.** The licence binds apps embedding the SDK to Honeywell hardware, so the
  adapter reads `unsupported` on another brand's device and never starts the SDK there. Build one
  app per vendor.
- **Every capability is native:** the reader's own single read (`syncRead`; with a TID, a short
  read window, as `syncRead` cannot return one) and tag finder (it
  beeps faster as the tag nears), the trigger, the battery, the reader's identity, and a reader
  search (a Bluetooth scan in the module: the SDK has none). An IH40 is found only while no host
  is connected to it: connected, it stops advertising.
- **Units:** RSSI in dBm as the reader reports it; power converted from the SDK's centi-dBm (5–30
  dBm); the beeper's `MUTE` / `LOW` / `MEDIUM` / `HIGH` as `off` / `low` / `medium` / `high`.

`createHoneywellRfidAdapter(options)` builds another one: `discoveryFilter: false` reports every
named device in a search, `proximityBounds` changes the default -30 / -70 dBm (measured on an IH40: about -25 with the tag against the
reader, -71 the weakest heard).
