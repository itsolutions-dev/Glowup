Put `rfidapi3lib-2.0.5.297.aar` here (git ignores it), from the root of Zebra's
`Zebra_RFIDAPI3_SDK_2.0.5.297.zip`, or set `ZEBRA_RFID_AAR` to its path. See `../README.md`.
The build needs it for the RFID module even when only the TC22's barcode scanner is tested;
the scanner itself needs no SDK (it drives DataWedge).
