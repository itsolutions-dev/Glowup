/**
 * The Honeywell adapter against the contract's conformance kit, over the
 * faked native module: what `@its/glowup-device/rfid` requires of every
 * vendor before it ships.
 */
import { describeRfidAdapterContract } from "@its/glowup-device/testing";
import { PermissionsAndroid } from "react-native";

import { createHoneywellRfidAdapter } from "../adapter";
import { createFakeHoneywellModule } from "./fakeNative";

describeRfidAdapterContract(
  { describe, it },
  () => {
    jest.spyOn(PermissionsAndroid, "check").mockResolvedValue(true);
    const native = createFakeHoneywellModule();
    const adapter = createHoneywellRfidAdapter({
      native,
      manufacturer: () => "Honeywell",
    });
    return {
      adapter,
      readerId: "0C:23:69:19:AA:12",
      emitTags: (tags) =>
        native.emitReads(
          tags.map(({ epc, rssi, antenna, readCount, tid, timestamp }) => ({
            epc,
            rssi,
            antenna: antenna ?? 1,
            readCount: readCount ?? 1,
            tid: tid ?? null,
            timestamp: timestamp ?? Date.now(),
          })),
        ),
      dropConnection: () => native.dropConnection(),
      emitLocate: (rssi) => native.emitLocate(rssi),
      pressTrigger: (pressed) => native.pressTrigger(pressed),
      teardown: () => {
        jest.restoreAllMocks();
      },
    };
  },
  { name: "Honeywell adapter: RfidAdapter contract" },
);
