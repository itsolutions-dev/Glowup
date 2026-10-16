# RFID diagnostics — the spike app

A development build that runs `@its/glowup-device/rfid` on `@its/rfid-honeywell` against a real
reader, and records what the Honeywell SDK does underneath. It is how phase 35 confirms what the
code assumes. Android only, Honeywell hosts only (the SDK's licence); not a product.

## Build it

On a machine with Android Studio (the SDK and a JDK 17):

1. Put your copies of `honeywell_rfid_sdk_v1.1.0.aar` and `DataCollection.aar` (from the
   `app/libs` folder of Honeywell's RFID sample app) in `apps/rfid-diagnostics/honeywell/`. Git
   ignores them. Or set `HONEYWELL_RFID_AAR` and `HONEYWELL_DATACOLLECTION_AAR` to their paths.
2. From the repository root: `npm install`.
3. Connect the CT40 by USB (developer options, USB debugging), then:
   `npm run android -w @its/rfid-diagnostics`.

`expo run:android` prebuilds `android/` (git ignores it), builds the debug APK, installs it and
starts Metro. A build failure here is the first thing to report.

## Run the checks

Turn the IH40 on, keep "Diagnostics" on, then work down the screen:

1. **Permission:** Request. On Android 11 it asks for location (a reader search needs it).
2. **Reader:** Search with "Only Honeywell-looking readers" **on**, then **off**. The list under
   Measurements shows what each device advertises; a ★ marks one the filter would keep. Tap the
   IH40 (or type its address) to connect. Note how long it takes. Read the battery, info and
   settings; try −1 / +1 dBm and Session.
3. **Multiple scan:** Start with a few tags at different distances; move them. Then turn on
   "Trigger drives the scan" and use the trigger. Try "Read TIDs".
4. **Single read:** with one tag close, then none, then several.
5. **Single search:** tap a tag in the list, Start, move the reader towards and away from it.
   Does the IH40 beep faster as it nears?
6. Turn the IH40 off and on again while connected: the state should go `reconnecting`, then back
   to `connected`.

## Send back

Tap **Share report** and send the JSON, with notes on what you saw or heard:

- the build result, and anything the app showed in red;
- the connection time and whether reconnection worked;
- whether the trigger reached the app, and whether it still drives the CT40's own scanner after
  the toggle is turned off;
- whether the reader beeped during the search;
- the distances the tags were at in the multiple scan (the report has the raw RSSI range).

The report answers the plan's "not verified" list: RSSI range and unit, EPC case, batch sizes,
rates and threads, the SDK's locate value beside the module's, the battery string, what the IH40
advertises.
