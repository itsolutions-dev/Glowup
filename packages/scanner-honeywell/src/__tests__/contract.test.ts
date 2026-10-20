/**
 * The Honeywell adapter against the contract's conformance kit, over the
 * faked native module: what `@its/glowup-device/scanner` requires of every
 * vendor before it ships.
 */
import { describeBarcodeScannerAdapterContract } from "@its/glowup-device/testing";

import { createHoneywellBarcodeScannerAdapter } from "../adapter";
import { createFakeHoneywellScanner } from "./fakeNative";

describeBarcodeScannerAdapterContract(
  { describe, it },
  () => {
    const native = createFakeHoneywellScanner();
    const adapter = createHoneywellBarcodeScannerAdapter({
      native,
      manufacturer: () => "Honeywell",
    });
    return {
      adapter,
      emitRead: ({ data, type }) => {
        native.decode(type, data);
      },
      pressTrigger: (pressed) => native.pressTrigger(pressed),
      takeAway: () => native.takeAway(),
    };
  },
  { name: "Honeywell adapter: BarcodeScannerAdapter contract" },
);
