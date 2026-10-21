---
"@its/rfid-honeywell": patch
---

The IH40's trigger drives the host's barcode scanner again whenever no screen holds it for RFID.
The module used to put back the trigger mode it found at connection, so an IH40 left in RFID mode
(an app ended while `useRfidTrigger` was mounted) stayed there and its trigger no longer scanned
barcodes. The module now sets `BARCODE` at connection, when the trigger is given back and at
disconnection, and `RFID` only while the trigger is handed over, without asking the SDK first
(its `getTriggerMode()` answers `RFID` whatever the mode). Native revision 4: rebuild the app.
