/**
 * The Zebra adapter against the contract's conformance kit, over the faked
 * native module and DataWedge: what `@its/glowup-device/scanner` requires of
 * every vendor before it ships. DataWedge reports no trigger presses, so the
 * harness has no `pressTrigger`.
 */
import { describeBarcodeScannerAdapterContract } from "@its/glowup-device/testing";

import { createZebraBarcodeScannerAdapter } from "../adapter";
import { createFakeDataWedge } from "./fakeNative";

describeBarcodeScannerAdapterContract(
  { describe, it },
  () => {
    const native = createFakeDataWedge();
    const adapter = createZebraBarcodeScannerAdapter({
      native,
      manufacturer: () => "Zebra Technologies",
    });
    return {
      adapter,
      emitRead: ({ data, type }) => {
        native.decode(type, data);
      },
      takeAway: () => native.takeAway(),
    };
  },
  { name: "Zebra adapter: BarcodeScannerAdapter contract" },
);
