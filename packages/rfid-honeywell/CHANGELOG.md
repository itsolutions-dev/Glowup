# @its/rfid-honeywell

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
