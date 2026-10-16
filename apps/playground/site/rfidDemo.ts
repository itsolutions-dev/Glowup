import type { RfidAdapter, RfidReadOnceRequest } from "@its/glowup-device/rfid";
import { createMockRfidAdapter } from "@its/glowup-device/testing";

/**
 * A simulated handheld reader for the RFID page: no vendor ships with the
 * site (each one is a native module and its SDK), so the page runs on the
 * package's in-memory adapter, driven by a timer. A search finds two readers,
 * a scan hears eight tags at their own distance, a single read hears the
 * nearest, and a search's signal rises and falls as if the reader were
 * swept towards the tag and away.
 */

export const DEMO_READERS = [
  { id: "0C:23:69:00:00:01", name: "IH40 · aisle 3", rssi: -48 },
  { id: "0C:23:69:00:00:02", name: "IH40 · back office", rssi: -71 },
];

/** EPC, TID and how loud the tag is where it sits (dBm). */
const TAGS = [
  ["3034257BF7194E4000001A85", "E2806894200040100765A1C3", -36],
  ["3034257BF7194E4000001A86", "E2806894200040100765A1C4", -44],
  ["3034257BF7194E4000001A87", "E2806894200040100765A1C5", -49],
  ["3034257BF7194E4000001A88", "E2806894200040100765A1C6", -55],
  ["3034257BF7194E4000001A89", "E2806894200040100765A1C7", -58],
  ["E28011700000020A4C7B12F0", "E2801170200030ECC48408F9", -63],
  ["E28011700000020A4C7B12F1", "E2801170200030ECC48408FA", -67],
  ["E28011700000020A4C7B12F2", "E2801170200030ECC48408FB", -72],
] as const;

export const DEMO_TAGS = TAGS.map(([epc]) => epc);

const TICK = 200;

const jitter = (spread: number) => Math.round((Math.random() - 0.5) * spread);

export function createRfidDemo(): RfidAdapter {
  const mock = createMockRfidAdapter({
    vendor: "simulated",
    readers: DEMO_READERS,
    proximityBounds: { near: -30, far: -70 },
    battery: 76,
  });
  let timer: ReturnType<typeof setInterval> | null = null;
  let reading: RfidReadOnceRequest | null = null;
  let sweep = 0;

  /** Some of the tags, as a reader hears a batch: not every tag every time. */
  function batch(tid: boolean) {
    return TAGS.filter(() => Math.random() < 0.6).map(
      ([epc, tagTid, rssi]) => ({
        epc,
        rssi: rssi + jitter(6),
        antenna: 1,
        ...(tid && { tid: tagTid }),
      }),
    );
  }

  function tick() {
    if (mock.isDiscovering) {
      for (const reader of DEMO_READERS) {
        mock.discover({ ...reader, rssi: reader.rssi + jitter(6) });
      }
    }
    const inventory = mock.inventory;
    if (inventory) mock.emitTags(batch(inventory.tid));
    if (reading) mock.emitTags(batch(reading.tid));
    if (mock.locating) {
      // About eight seconds from far to near and back.
      sweep += TICK / 1_000;
      const nearness = (1 - Math.cos((sweep * Math.PI) / 4)) / 2;
      if (Math.random() < 0.85) {
        mock.emitLocate(Math.round(-74 + 48 * nearness) + jitter(4));
      }
    }
    const idle =
      !mock.isDiscovering && !inventory && !reading && !mock.locating;
    if (idle && timer) {
      clearInterval(timer);
      timer = null;
    }
  }

  function run() {
    timer ??= setInterval(tick, TICK);
  }

  return {
    ...mock,
    async startDiscovery(handlers) {
      await mock.startDiscovery!(handlers);
      run();
    },
    async startInventory(request, handlers) {
      await mock.startInventory(request, handlers);
      run();
    },
    async startLocate(epc, handlers) {
      await mock.startLocate!(epc, handlers);
      sweep = 0;
      run();
    },
    async readOnce(request) {
      reading = request;
      run();
      try {
        return await mock.readOnce!(request);
      } finally {
        reading = null;
      }
    },
  };
}

/** Presses the simulated reader's trigger, and releases it after `holdMs`. */
export function pullDemoTrigger(adapter: RfidAdapter, holdMs = 2_000) {
  const mock = adapter as RfidAdapter & {
    pressTrigger?: (pressed?: boolean) => void;
  };
  mock.pressTrigger?.(true);
  setTimeout(() => mock.pressTrigger?.(false), holdMs);
}
