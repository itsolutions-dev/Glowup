# @its/scanner-zebra

The imager of Zebra mobile computers (the TC22 and the others DataWedge runs on) behind
[`@its/glowup-device/scanner`](https://github.com/itsolutions-dev/Glowup/tree/master/packages/device#barcode-scanner).
The screens use `/scanner`'s `useBarcodeScanner`; this package is the one line that picks the
vendor.

It has run on a TC22 (Android 15, DataWedge 15.0.96): the label types, the symbologies, the
profile, the background and the software trigger, as the plan's "Phase ZB2 — measured on the
TC22" lists. `apps/rfid-diagnostics` in the repository (the "Barcode scanner" screen of a Zebra
build) is the app that measured it.

```sh
npm install @its/scanner-zebra
```

It needs `@its/glowup-device` (`/scanner`) and an Expo development build for Android: no config
plugin and nothing to supply.

## No SDK

The package drives **DataWedge**, the scanning service on every Zebra mobile computer, through
its intent API: no EMDK, no AAR, no config plugin. Its Android manifest declares DataWedge's
package among the app's `<queries>` (Android 11 and later see another package only so), and the
manifest merger carries it into the app's.

Zebra's _Scanner SDK for Android_ (`com.zebra.scannercontrol`) is something else: it drives
Zebra's Bluetooth and USB scanners from other brands' devices, and is not approved for Zebra's
own mobile computers.

It needs a development build (`npx expo run:android`); Expo Go and iOS read `unsupported`.

## Use

```tsx
import { DeviceAdaptersProvider } from "@its/glowup-device";
import { getZebraBarcodeScannerAdapter } from "@its/scanner-zebra";

<DeviceAdaptersProvider
  adapters={{ barcodeScanner: getZebraBarcodeScannerAdapter() }}
>
  <App />
</DeviceAdaptersProvider>;
```

Everything else is `@its/glowup-device/scanner`: `useBarcodeScanner({ onScan, symbologies })`
holds the imager while the screen is mounted and the app in the foreground, and hands each read
to `onScan`, which confirms by itself.

- **The app's own DataWedge profile.** On the first `open()` the package creates a profile
  named after the app's package (`profileName` changes it), associated with every activity of
  the app: barcode input on, intent output on (a broadcast to the app), keystroke output and data
  formatting off. It stays on the device, like any DataWedge profile. Other apps keep their
  profiles, so the keyboard wedge works in them as before; in this app reads go through
  `onScan` only. If a device manager (StageNow, an MDM) already pushes a profile for the app,
  this one conflicts with it: name it, or leave the app's scanning to that profile.
- **Zebra hosts with DataWedge only.** The adapter reads `unsupported` on another brand's
  device or without DataWedge, and never sends an intent there.
- **The trigger.** DataWedge decodes on the hardware trigger by itself and reports no presses,
  so `isTriggerPressed` stays `false`. `softwareTrigger` is the on-screen scan button
  (`SOFT_SCAN_TRIGGER`).
- **Symbologies.** Every `BarcodeType`: `symbologies: ["qr", "code128", "ean13", "datamatrix"]`
  turns those on and every other DataWedge decoder off, written in the app's profile
  (`SET_CONFIG`, for the default scanner's configuration);
  `null` puts back the profile's own decoders, as they were before the package first wrote
  them (kept on the device, so a restart or a crash does not lose them). A decoder changed by
  hand in DataWedge after that is overwritten by the next `null`. Code 128 includes GS1-128,
  read as Code 128 and not parsed.
- **The text as decoded.** The profile decodes in UTF-8 and sends every digit of a UPC (its
  check digit and its number system). DataWedge sends no AIM id and no decode time: the type
  comes from its label type (`LABEL-TYPE-QRCODE`, kept as `rawType`), the time is the read's
  arrival.
- **Another app in front.** If DataWedge leaves the profile for another app's while this one stays
  in front, the scanner closes with `unavailable` (the screen's Retry opens it again); going to
  the background is not that.

`createZebraBarcodeScannerAdapter(options)` builds another one: `profileName`,
`requireZebraHost: false` (a lab test only), `native` (a fake, in tests).
