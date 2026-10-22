# RFID diagnostics — the spike app

A development build that runs `@its/glowup-device/rfid` on one vendor package against a real
reader, and records what the vendor's SDK does underneath. It is how a spike confirms what the
code assumes: phase 35 for Honeywell (`@its/rfid-honeywell`), phase Z1 for Zebra
(`@its/rfid-zebra`). Its **Barcode scanner** screen does the same for
`@its/glowup-device/scanner` on the host's own imager: the CT40's (`@its/scanner-honeywell`,
phase C2) or the TC22's (`@its/scanner-zebra`, phase ZB2). The buttons at the top switch between
the two screens, one at a time (no screen reads RFID and barcodes together). Android only; not a
product.

**One build per vendor.** `RFID_VENDOR` (`honeywell`, the default, or `zebra`) picks the
vendor's config plugins and leaves the other vendor's native modules (RFID and scanner) out of
autolinking: a vendor's module does not build without its SDK. The screen shows the vendor it
runs ("Host → Vendor").

## Build it

On a machine with Android Studio (the SDK and a JDK 17):

1. Put your copy of the vendor's SDK in place (git ignores them):
   - **Honeywell:** `honeywell_rfid_sdk_v1.1.0.aar` and `DataCollection.aar` (from the `app/libs`
     folder of Honeywell's RFID sample app) in `apps/rfid-diagnostics/honeywell/`, or set
     `HONEYWELL_RFID_AAR` and `HONEYWELL_DATACOLLECTION_AAR` to their paths. Honeywell hosts only
     (the SDK's licence): the CT40. The same `DataCollection.aar` drives the barcode scanner:
     the Honeywell build links both packages.
   - **Zebra:** `rfidapi3lib-2.0.5.297.aar` (at the root of `Zebra_RFIDAPI3_SDK_2.0.5.297.zip`)
     in `apps/rfid-diagnostics/zebra/`, or set `ZEBRA_RFID_AAR` to its path. Any Android 10+
     device, paired with an RFD40 Premium. The build needs it even to test the TC22's scanner
     alone (the RFID module is in every Zebra build); the scanner needs nothing more: it drives
     DataWedge, which every Zebra device has.
2. From the repository root: `npm install`.
3. Connect the phone by USB (developer options, USB debugging), then:
   `RFID_VENDOR=zebra npm run android -w @its/rfid-diagnostics` (or `honeywell`).

`expo run:android` prebuilds `android/` (git ignores it), builds the debug APK, installs it and
starts Metro. A build failure here is the first thing to report. After a pull that changes the
Kotlin, or to switch vendor, build again: reloading Metro updates the JavaScript only, and
`expo run:android` regenerates `android/` only when the config changed (`npx expo prebuild
--clean` forces it). Host → Native module shows the module's revision, in red when the app
needs rebuilding.

## On the packed packages

The build above runs the packages' source. To check what npm would ship instead (the built
`lib/`, the `exports`, the config plugin and the Android module as the tarballs hold them), make
a copy of this app that installs the tarballs, in a directory **outside** the repository:

```bash
npm install                                          # at the repository root
npm run packed -w @its/rfid-diagnostics -- ../rfid-packed
cd ../rfid-packed
npm install
npm run type-check
RFID_VENDOR=zebra npm run android                    # or honeywell
```

The script builds the packages, packs them into `packages/`, copies the app and the SDKs from
`honeywell/` and `zebra/` when they are there (or set the variables above), and prints the
versions it packed. Then run the checks below on the copy; Host → Native module should show the
same revision as the source build.

## Run the checks: Honeywell (IH40 on a CT40)

Turn the IH40 on, keep "Diagnostics" on, then work down the screen:

1. **Permission:** Request. On Android 11 it asks for location (a reader search needs it).
2. **Reader:** Search with "Only Honeywell-looking readers" **on**, then **off**. The list under
   Measurements shows what each device advertises; a ★ marks one the filter would keep. Tap the
   IH40, type its address, or press Connect when the search found only it. Note how long it takes. Read the battery, info and
   settings; try −1 / +1 dBm and Session.
3. **Multiple scan:** Start with a few tags at different distances; move them. Then turn on
   "Trigger drives the scan" and use the trigger. Try "Read TIDs".
4. **Single read:** with one tag close, then none, then several; then again with "Read the TID"
   on: the buttons then read "Read (500 ms, TID)", the tag line shows its TID, and Measurements →
   Single reads says "TID asked" with a count of reads that carried one.
5. **Single search:** tap a tag in the list, Start, move the reader towards and away from it.
   Does the IH40 beep faster as it nears?
6. Turn the IH40 off and on again while connected: the state should go `reconnecting`, then back
   to `connected` within about 10 s of the reader being on (Measurements lists each
   `reconnectAttempt`).

## Run the checks: Zebra (RFD40 Premium)

First pair the RFD40 with the phone: Android's Bluetooth settings, or tap the phone on the
reader's NFC mark. The SDK reaches paired readers only. Keep "Diagnostics" on, then:

1. **Permission:** Request. From Android 12 it asks for nearby devices; up to Android 11 it reads
   granted at once. Note whether anything later fails for a missing permission.
2. **Reader:** Search with "Only Zebra-looking readers" **on**, then **off**: the list is what
   the SDK lists as paired (Measurements → Adverts, ★ for a name starting `RFD`). Tap the RFD40,
   or type its address or its name (`RFD40+_…`). Note how long Connect takes (Measurements:
   `connected` with its `ms`). Read the battery, info and settings: Measurements → `powerLevels`
   is the reader's power table (are the values tenths of a dBm: `300` for 30 dBm?) and
   `versions` every component's version. Try −1 / +1 dBm, Session, and note the region.
3. **Multiple scan:** as for Honeywell, with tags at different distances; the trigger; "Read
   TIDs" (the TID read is the SDK's TID-bank access: does every tag get one, and is the scan
   slower?). Note the raw RSSI range against the distances.
4. **Single read:** the engine's (a short scan keeping the strongest tag): one tag close, none,
   several; with and without the TID.
5. **Single search:** tap a tag, Start, move towards and away from it, first with "The reader's
   own search" **on**. Does the RFD40 beep faster as it nears? Measurements → Native locate reads
   says whether the searched tag's reads carry an RSSI and a relative distance (0–100). Then
   **off** (the engine's search on a scan) and compare how the bar follows the tag.
6. Switch the RFD40 off and on while connected: the state should go `reconnecting`, then back to
   `connected` (Measurements: `linkLost`, each `reconnectAttempt`, `readerAppeared`).
7. Walk out of Bluetooth range and back in, connected: same as 6.

## Run the checks: barcode scanner (CT40)

A Honeywell build (the default). Press **Barcode scanner** at the top; keep "Diagnostics" on.
Have a QR code (one with accented or non-Latin text too), a Code 128 (and a GS1-128 label if
there is one), an EAN-13, an EAN-8, a Data Matrix, and one code of another kind (a UPC-A or a
PDF417).

1. **Host:** "Scanner adapter" should read `supported`, and "State" `open · held by this screen`.
   Note anything in red.
2. **Reads:** scan each code with the side trigger. Each should appear once under "Reads
   (onScan)" with its type, AIM id and code id; the other kind should **not** appear (the first
   scope turns it off). Then turn "Only QR, Code 128, EAN-13, EAN-8, Data Matrix" off and scan it
   again: it should appear now (the device's settings). Is the non-ASCII QR's text right?
3. **Keyboard wedge:** measured on the CT40, the wedge types nothing into this app, held or
   released (other apps get it back: steps 7 and 9). Tap the "Wedge output" field and scan, with
   the scanner held and with "Hold the scanner" off: anything typed there means that changed.
4. **Repeats and a slow confirmation:** scan the same code twice quickly: the second is dropped
   within 1 s; turn "Drop the same code within 1 s" off and both arrive. Turn "Slow
   confirmation" on and scan two codes within 1.5 s: the second is dropped ("busy").
5. **Software trigger:** press and hold **Hold to scan** with a code in front of the scanner;
   release.
6. **IH40:** connect it on the RFID screen ("Trigger drives the scan" off: the module keeps it in
   barcode mode, `triggerModeApplied` in that screen's timeline), come here and pull its trigger
   with a code in front of the CT40: it should read here as the side buttons do. Measurements →
   Trigger counts the trigger events the SDK reported (none under auto control).
7. **Background:** with the scanner held, go to the home screen, scan (the wedge should have
   it: the code goes to whatever app is in front, or nowhere), then come back: State should be
   `open` again and the next scan should arrive here. Measurements' timeline lists each
   `released` / `claimed`.
8. **Info, Devices, Properties:** press each. Properties shows the keys the package sets as the
   service holds them (the symbologies, `DPR_*`, `TRIG_*`).
9. After all this, open another app with a text field and scan: the device's own settings
   should be untouched (the wedge works as before, with its suffix).

## Run the checks: barcode scanner (TC22)

A Zebra build (`RFID_VENDOR=zebra`). Press **Barcode scanner** at the top; keep "Diagnostics"
on. The same codes as for the CT40: a QR code (one with accented or non-Latin text, with and
without the UTF-8 ECI), a Code 128 (and a GS1-128 label if there is one), an EAN-13, an EAN-8,
a Data Matrix, and codes of other kinds (a UPC-A, a UPC-E). The page of test codes made for the
TC22 has them all.

1. **Host:** "Scanner adapter" should read `supported`, "Native module" revision 4, and "State"
   `open · held by this screen`. Note how long "opening" lasts the first time and on later
   openings (from revision 2 it should be under a second after the first). Note anything in
   red: a message naming another DataWedge
   profile means DataWedge did not switch to the app's (press Retry, or go to the home screen
   and back, and note which worked).
2. **The app's profile:** press **Active profile**: it should be `it.itsolutions.rfiddiagnostics`.
   Open the DataWedge app: that profile should be listed, associated with the app, with Barcode
   input on, Intent output on (action `it.itsolutions.rfiddiagnostics.GLOWUP_SCAN`, broadcast)
   and Keystroke output off. Press **Profile**: the summary lists `charset_name` and the
   decoders as DataWedge stores them.
3. **Reads:** scan each code with the side trigger. Each should appear once under "Reads
   (onScan)" with its type and `label LABEL-TYPE-…`; the UPC-A and UPC-E should **not** appear,
   and the TC22 should not beep for them (the first scope switches them off). Turn "Only QR,
   Code 128, EAN-13, EAN-8, Data Matrix" off and scan them again: they should appear now (the
   profile's settings); turn it on again and they should not. Is the non-ASCII QR's text right,
   with and without the ECI? Does the EAN-13 have 13 digits, the UPC-A 12, the UPC-E 8?
   From revision 3 the scope is written in the app's profile: with it on, DataWedge → the app's
   profile → Barcode input → Decoders shows UPC-A and UPC-E off; with it off, as they were
   before the app first wrote them.
4. **Keyboard wedge:** tap the "Wedge output" field and scan, held and with "Hold the scanner"
   off: nothing should be typed (the app's profile has no keystroke output).
5. **Repeats and a slow confirmation:** as on the CT40 (step 4 above).
6. **Software trigger:** press and hold **Hold to scan** with a code in front of the scanner;
   release.
7. **Background:** with the scanner held, go to the home screen, open an app with a text field
   (Notes) and scan: the wedge should type it there, as before. Come back: State should be
   `open` again and the next scan should arrive here, with no red error on the way (revision 1
   reported "unavailable" for the Home button; the timeline should show no `lost`). The timeline
   lists the `notification`s (`PROFILE_SWITCH`), `closed` and `opened`.
8. **Info, Devices:** press each. Info is DataWedge's version and its scanners; note the
   imager's name, identifier and firmware.
9. **Measurements → timeline:** each `command` with its `result` (from revision 2 every command
   asks for one: `SUCCESS` or `FAILURE` with its `info`). Report any `FAILURE`, and any
   `"answered":false`.
10. After all this, in Notes: the wedge works as before, with its suffix; in DataWedge,
    Profile0 is unchanged.

## Send back

Tap **Share report** and send the JSON, with notes on what you saw or heard:

- the vendor, the build result, and anything the app showed in red;
- the connection time and whether reconnection worked;
- whether the trigger reached the app, and (Honeywell) whether it still drives the CT40's own
  scanner after the toggle is turned off;
- whether the reader beeped during the search;
- (scanner) for each step above what you saw, and whether the wedge typed into the field; on
  the TC22, the DataWedge version (DataWedge → ⋮ → About) and anything the DataWedge app showed
  for the app's profile;
- the distances the tags were at in the multiple scan (the report has the raw RSSI range).

The report answers the plan's "not verified" lists: RSSI range and unit, EPC case, batch sizes,
rates and threads, the battery, the power table, the locate's values, what the reader advertises
or how it is listed.
