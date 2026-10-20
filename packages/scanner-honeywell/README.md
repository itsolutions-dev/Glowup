# @its/scanner-honeywell

The imager of Honeywell mobile computers (the CT40 and the others the Data Collection SDK
reaches) behind
[`@its/glowup-device/scanner`](https://github.com/itsolutions-dev/Glowup/tree/master/packages/device#barcode-scanner).
The screens use `/scanner`'s `useBarcodeScanner`; this package is the one line that picks the
vendor.

**Private until phase C3.** It builds and its tests pass, but it has not run on a CT40 yet:
`apps/rfid-diagnostics` (the "Barcode scanner" screen) is the app that measures it.

It needs `@its/glowup-device` (`/scanner`) and an Expo development build for Android.

## The SDK is yours to supply

Honeywell's Data Collection SDK (`com.honeywell.aidc`, `DataCollection.aar`, 1.97.00.0060) is not
on a public repository, and its licence lets it travel only inside an app's build, so this package
does not ship it. Take it from the Honeywell Mobility SDK for Android, or from the `app/libs`
folder of the RFID SDK's sample app. Keep it out of git.

```ts
// app.config.ts
plugins: [
  ["@its/scanner-honeywell", { dataCollectionAarPath: "./honeywell/DataCollection.aar" }],
],
```

At prebuild the plugin copies the AAR into a Maven repository inside `android/` and declares it
for its group only. The SDK's own manifest brings the scanner service's permission
(`com.honeywell.decode.permission.DECODE`).

**With `@its/rfid-honeywell`** (the IH40 on the same CT40): both depend on the same
`com.honeywell.aidc:datacollection:1.97.00.0060`, so Gradle resolves it once. Point both plugins'
`dataCollectionAarPath` at the same file.

It needs a development build (`npx expo run:android`); Expo Go and iOS read `unsupported`.

## Use

```tsx
import { DeviceAdaptersProvider } from "@its/glowup-device";
import { getHoneywellBarcodeScannerAdapter } from "@its/scanner-honeywell";

<DeviceAdaptersProvider
  adapters={{ barcodeScanner: getHoneywellBarcodeScannerAdapter() }}
>
  <App />
</DeviceAdaptersProvider>;
```

Everything else is `@its/glowup-device/scanner`: `useBarcodeScanner({ onScan, symbologies })`
holds the imager while the screen is mounted and the app in the foreground, and hands each read to
`onScan`, which confirms by itself.

- **Honeywell hosts only.** The adapter reads `unsupported` on another brand's device and never
  starts the SDK there.
- **The trigger.** By default the scanner service decodes on the trigger (its `autoControl`), the
  IH40's included when it is in barcode mode. `triggerControl: "client"` makes the module aim,
  light and decode on each trigger event instead, for a trigger the service reports but does not
  decode on. `softwareTrigger` is the on-screen scan button.
- **Symbologies.** Every `BarcodeType`: `symbologies: ["qr", "code128", "ean13", "datamatrix"]`
  turns those on and every other the SDK has off, for this app's claim only; `null` keeps the
  device's settings. Code 128 includes GS1-128, read as Code 128 and not parsed.
- **The text as decoded.** On every claim the adapter clears the wedge's prefix, suffix and
  symbology id, and turns off a scan's intents, browser launch and EZConfig, for this app only.
  The type comes from the AIM id (`]Q1`); UPC-A and UPC-E, which share EAN-13's `]E0`, from
  Honeywell's code id.

`createHoneywellBarcodeScannerAdapter(options)` builds another one: `triggerControl`,
`requireHoneywellHost: false` (a lab test only), `native` (a fake, in tests).
