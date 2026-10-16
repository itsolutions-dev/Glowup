---
"@its/glowup-device": minor
---

Add `@its/glowup-device/rfid`: UHF RFID handheld readers behind one vendor-neutral contract. No
native code and no default adapter: a vendor package implements `RfidAdapter` (the first is
`@its/rfid-honeywell`) and the app passes it to `DeviceAdaptersProvider` as `rfid`; without one,
everything reads `unsupported`.

- The contract's units are fixed: RSSI and power in dBm, times in ms, EPC and TID in uppercase
  hex. `RFID_CONTRACT_VERSION` guards against a vendor built for another version
  (`incompatible-adapter`); the capabilities are read from the methods the adapter implements.
- `useRfidReader`: connection (resolves once the reader is ready, outlives the components,
  `reconnecting` while the vendor restores it), settings, battery, reader info.
  `useRfidPermission` reads and asks the vendor's permission; nothing prompts by itself.
- `useRfidInventory`: the multiple scan, one entry per EPC, RSSI smoothed and turned into a
  proximity (0–1) between the adapter's near and far bounds, nearest first, optional TIDs,
  `forgetAfter` and `duration`.
- `useRfidSingleRead`: the strongest tag in a short window (500 ms by default), with its TID on
  request; the reader's own single read where the vendor has one.
- `useRfidLocate`: the search for one tag, its proximity and signal, out of range after 2 s of
  silence; the reader's own tag finder where the vendor has one.
- `useRfidTrigger` (the reader's trigger, with any mode) and `useRfidReaderDiscovery` (readers
  nearby, for a picker).
- One mode at a time per reader: a new one stops the previous one first; the app going to the
  background or the link dropping ends it.
- `/testing`: `createMockRfidAdapter()` and `describeRfidAdapterContract()`, the suite every
  vendor package runs against its adapter.
