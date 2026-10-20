# @its/rfid-zebra

Zebra RFID readers (the RFD40 Premium over Bluetooth, through Zebra's RFID SDK for Android
2.0.5.297) behind
[`@its/glowup-device/rfid`](https://github.com/itsolutions-dev/Glowup/tree/master/packages/device#rfid).
The screens use `/rfid`'s hooks; this package is the one line that picks the vendor.

> **Not published yet.** The package is in its spike (phase Z1): it passes the contract's
> conformance kit over a faked module and compiles against the SDK, and waits for its first run
> on a real RFD40 (`apps/rfid-diagnostics`, `RFID_VENDOR=zebra`).

It needs `@its/glowup-device` (`/rfid`) and an Expo development build for Android 10 or later.

## The SDK is yours to supply

Zebra's RFID SDK for Android is not on a public repository, so this package does not ship it.
Download `Zebra_RFIDAPI3_SDK_2.0.5.297.zip` from Zebra's support portal, take
`rfidapi3lib-2.0.5.297.aar` from its root (not `rfidapi3ziotcllrplib`, which is for fixed
readers), keep it out of git and point the config plugin at it:

```ts
// app.config.ts
plugins: [["@its/rfid-zebra", { aarPath: "./zebra/rfidapi3lib-2.0.5.297.aar" }]],
```

At prebuild the plugin:

- copies the AAR into a Maven repository inside `android/` and declares it for the SDK's group
  only;
- raises `minSdkVersion` to 29, the SDK's;
- declares `BLUETOOTH_SCAN` (`neverForLocation`) and `BLUETOOTH_CONNECT` from Android 12, and
  caps at Android 11 the location the SDK's manifest declares for every version. An app that
  uses location itself lists this plugin **before** `expo-location`, so the uncapped
  declaration wins;
- declares Qualcomm's `com.qti.qrs.qc_sdk` library optional, as Zebra's sample does.

It needs a development build (`npx expo run:android`); Expo Go and iOS read `unsupported`.

## Use

```tsx
import { DeviceAdaptersProvider } from "@its/glowup-device";
import { getZebraRfidAdapter } from "@its/rfid-zebra";

<DeviceAdaptersProvider adapters={{ rfid: getZebraRfidAdapter() }}>
  <App />
</DeviceAdaptersProvider>;
```

Everything else is `@its/glowup-device/rfid`: `useRfidReader`, `useRfidInventory`,
`useRfidLocate`, `useRfidSingleRead`, `useRfidTrigger`, `useRfidReaderDiscovery`.

- **Pair the reader first.** The SDK reaches readers paired with the device (Android's
  Bluetooth settings, or a tap on the reader's NFC mark). `connect()` takes the address or the
  name it is paired under (`RFD40+_…`); `useRfidReaderDiscovery` lists the paired readers, with
  no signal strength.
- **Any Android host.** The RFD40 Premium pairs with any Android device; the adapter checks no
  brand.
- **Native:** the multiple scan (with TIDs, through a TID-bank access), the reader's own tag
  locationing (it beeps as the tag nears), the trigger, the battery, the reader's identity.
  **Emulated by the engine:** the single read (a short scan keeping the strongest tag), as the
  SDK has none.
- **Units:** RSSI in dBm as the reader reports it; power converted through the reader's own
  table of levels (in tenths of a dBm), a setting picking the nearest; the beeper's `QUIET` /
  `LOW` / `MEDIUM` / `HIGH` as `off` / `low` / `medium` / `high`. The region is read-only.
