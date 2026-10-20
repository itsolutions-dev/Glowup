# RFID diagnostics — the spike app

A development build that runs `@its/glowup-device/rfid` on one vendor package against a real
reader, and records what the vendor's SDK does underneath. It is how a spike confirms what the
code assumes: phase 35 for Honeywell (`@its/rfid-honeywell`), phase Z1 for Zebra
(`@its/rfid-zebra`). Android only; not a product.

**One build per vendor.** `RFID_VENDOR` (`honeywell`, the default, or `zebra`) picks the
vendor's config plugin and leaves the other vendor's native module out of autolinking: a vendor's
module does not build without its SDK. The screen shows the vendor it runs ("Host → Vendor").

## Build it

On a machine with Android Studio (the SDK and a JDK 17):

1. Put your copy of the vendor's SDK in place (git ignores them):
   - **Honeywell:** `honeywell_rfid_sdk_v1.1.0.aar` and `DataCollection.aar` (from the `app/libs`
     folder of Honeywell's RFID sample app) in `apps/rfid-diagnostics/honeywell/`, or set
     `HONEYWELL_RFID_AAR` and `HONEYWELL_DATACOLLECTION_AAR` to their paths. Honeywell hosts only
     (the SDK's licence): the CT40.
   - **Zebra:** `rfidapi3lib-2.0.5.297.aar` (at the root of `Zebra_RFIDAPI3_SDK_2.0.5.297.zip`)
     in `apps/rfid-diagnostics/zebra/`, or set `ZEBRA_RFID_AAR` to its path. Any Android 10+
     device, paired with an RFD40 Premium.
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

## Send back

Tap **Share report** and send the JSON, with notes on what you saw or heard:

- the vendor, the build result, and anything the app showed in red;
- the connection time and whether reconnection worked;
- whether the trigger reached the app, and (Honeywell) whether it still drives the CT40's own
  scanner after the toggle is turned off;
- whether the reader beeped during the search;
- the distances the tags were at in the multiple scan (the report has the raw RSSI range).

The report answers the plan's "not verified" lists: RSSI range and unit, EPC case, batch sizes,
rates and threads, the battery, the power table, the locate's values, what the reader advertises
or how it is listed.
