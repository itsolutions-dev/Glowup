/**
 * The Zebra adapter against the contract's conformance kit, over the faked
 * native module: what `@its/glowup-device/rfid` requires of every vendor
 * before it ships. Twice: with the reader's own search, and without it (the
 * engine's emulated one, plan decision Z3's fallback).
 */
import { describeRfidAdapterContract } from "@its/glowup-device/testing";
import { PermissionsAndroid } from "react-native";

import { createZebraRfidAdapter } from "../adapter";
import { createFakeZebraModule } from "./fakeNative";

for (const nativeLocate of [true, false]) {
  describeRfidAdapterContract(
    { describe, it },
    () => {
      jest.spyOn(PermissionsAndroid, "check").mockResolvedValue(true);
      const native = createFakeZebraModule();
      const adapter = createZebraRfidAdapter({ native, nativeLocate });
      return {
        adapter,
        readerId: "84:C6:92:12:34:56",
        emitTags: (tags) =>
          native.emitReads(
            tags.map(({ epc, rssi, antenna, readCount, tid, timestamp }) => ({
              // The SDK's own case: the adapter normalises it.
              epc: epc.toLowerCase(),
              rssi,
              antenna: antenna ?? 1,
              seenCount: readCount ?? 1,
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
    {
      name: `Zebra adapter (${nativeLocate ? "native" : "emulated"} search): RfidAdapter contract`,
    },
  );
}
