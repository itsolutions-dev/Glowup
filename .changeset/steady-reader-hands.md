---
"@its/rfid-honeywell": patch
---

Native module fixes (revision 5, rebuild the app):

- A single read no longer holds back every other native call for its window: `disconnect()` and
  the barcode scanner's calls used to wait behind it.
- A search the reader refuses to start no longer leaves the module answering `busy` until the
  next disconnection.
- Tearing the module down (a reload included) hands the reader's trigger back to barcode mode,
  as `disconnect()` does.
- When the Honeywell service does not start, every pending `connect()` is rejected, not the
  first alone.
