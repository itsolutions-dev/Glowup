# @its/rfid-honeywell

## 0.1.2

### Patch Changes

- 1995b25: The IH40's trigger drives the host's barcode scanner again whenever no screen holds it for RFID.
  The module used to put back the trigger mode it found at connection, so an IH40 left in RFID mode
  (an app ended while `useRfidTrigger` was mounted) stayed there and its trigger no longer scanned
  barcodes. The module now sets `BARCODE` at connection, when the trigger is given back and at
  disconnection, and `RFID` only while the trigger is handed over, without asking the SDK first
  (its `getTriggerMode()` answers `RFID` whatever the mode). Native revision 4: rebuild the app.

## 0.1.1

### Patch Changes

- Updated dependencies [49f39dc]
  - @its/glowup-device@0.12.0

## 0.1.0

### Minor Changes

- a3ddd7f: First release: Honeywell RFID readers (the IH40 over Bluetooth, Honeywell RFID SDK v1.1.0) behind
  `@its/glowup-device/rfid`.

  - An Android Expo module, its adapter (`getHoneywellRfidAdapter()`) and its config plugin.
  - Every optional part of the contract is native: the single read (with the TID on request), the
    tag finder (the reader beeps faster as the tag nears), the trigger, the battery, the reader's
    identity and a reader search.
  - The SDKs are the app's: the plugin takes its copies of the RFID SDK and of Honeywell's Data
    Collection SDK (`aarPath`, `dataCollectionAarPath`). Their licence keeps them out of this
    package and binds them to Honeywell hardware, so the adapter reads `unsupported` on other
    hosts.

### Patch Changes

- Updated dependencies [0104cf9]
  - @its/glowup-device@0.11.0
