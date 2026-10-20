---
"@its/glowup-device": minor
---

`/scanner`: a hardware barcode scanner (a rugged device's imager) behind one contract.
`useBarcodeScanner({ onScan, symbologies, enabled })` holds the scanner while the screen
wants it and the app is in the foreground, hands each read to `onScan` (which confirms by
itself) and drops reads while its promise is pending. No vendor ships here: a vendor package
(`@its/scanner-honeywell`, to come) implements `BarcodeScannerAdapter` and is provided as
`barcodeScanner`. `/testing` adds `createMockBarcodeScannerAdapter()` and the vendors'
conformance kit, `describeBarcodeScannerAdapterContract()`.

`/camera`: `BarcodeScan`, the shape a camera read and a hardware read share, so one handler
serves both; `CameraView` drops codes while a handler's promise is pending.
