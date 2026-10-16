import type { Unsubscribe } from "../core/types";
import { isRfidError, type RfidError } from "../rfid/errors";
import {
  RFID_CONTRACT_VERSION,
  type RfidAdapter,
  type RfidConnection,
  type RfidTagRead,
} from "../rfid/types";

/** The test functions the kit registers with: Jest's, or another runner's. */
export interface RfidContractTestApi {
  describe(name: string, body: () => void): void;
  it(name: string, body: () => Promise<void>, timeout?: number): void;
}

/**
 * A vendor adapter over its native module faked: what the kit drives. The
 * drivers speak the contract's units, and the harness turns them into what
 * the vendor's SDK would send (Honeywell: centi-dBm, its own EPC case), so
 * the kit checks the adapter's conversion.
 */
export interface RfidContractHarness {
  /** Supported, with the permission granted, and disconnected. */
  adapter: RfidAdapter;
  /** A reader `connect()` reaches. */
  readerId: string;
  /**
   * The reader reports these tags: to the running inventory or native
   * locate, or, when none runs, on the next `readOnce()`.
   */
  emitTags(tags: RfidTagRead[]): void | Promise<void>;
  /** The link drops, as a reader out of range. */
  dropConnection(): void | Promise<void>;
  /** The native locate reports a signal, in dBm. Needed with `startLocate`. */
  emitLocate?(rssi: number): void | Promise<void>;
  /** The user presses or releases the trigger. Needed with `subscribeTrigger`. */
  pressTrigger?(pressed: boolean): void | Promise<void>;
  /** Runs after each test, pass or fail. */
  teardown?(): void | Promise<void>;
}

export interface RfidContractOptions {
  /** The suite's name. Default `"RfidAdapter contract"`. */
  name?: string;
  /** How long an awaited event may take, in ms. Default 2000. */
  timeout?: number;
}

const EPC = "E2801170000002120FD4A0F1";
const OTHER_EPC = "E2801170000002120FD4A0F2";
const TID = "E2801170200052E5";
const HEX = /^[0-9A-F]+$/;
// What a vendor's conversion may round away, in dBm.
const DBM_TOLERANCE = 1;

class ContractViolation extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RfidContractViolation";
  }
}

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new ContractViolation(message);
}

function near(actual: number, expected: number): boolean {
  return Math.abs(actual - expected) <= DBM_TOLERANCE;
}

const pause = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Waits for `condition`, on real timers: the kit does not assume Jest's fake ones. */
async function waitFor(
  condition: () => boolean,
  timeout: number,
  message: string,
): Promise<void> {
  const end = Date.now() + timeout;
  while (!condition()) {
    check(Date.now() < end, `${message} (waited ${timeout} ms)`);
    await pause(5);
  }
}

async function rejection(
  run: () => Promise<unknown>,
): Promise<unknown | undefined> {
  try {
    await run();
  } catch (error) {
    return error;
  }
  return undefined;
}

function describeError(error: unknown): string {
  return isRfidError(error)
    ? `RfidError(${error.code})`
    : error instanceof Error
      ? `${error.name}: ${error.message}`
      : String(error);
}

function checkRead(read: RfidTagRead, where: string) {
  check(
    typeof read.epc === "string" && HEX.test(read.epc),
    `${where}: epc must be uppercase hex, got ${JSON.stringify(read.epc)}.`,
  );
  check(
    typeof read.rssi === "number" && Number.isFinite(read.rssi),
    `${where}: rssi must be a finite number of dBm, got ${String(read.rssi)}.`,
  );
  check(
    read.readCount === undefined ||
      (Number.isInteger(read.readCount) && read.readCount >= 1),
    `${where}: readCount must be a whole number of 1 or more, got ${String(read.readCount)}.`,
  );
  check(
    read.antenna === undefined ||
      (Number.isInteger(read.antenna) && read.antenna >= 0),
    `${where}: antenna must be a port number, got ${String(read.antenna)}.`,
  );
  check(
    read.timestamp === undefined ||
      (Number.isFinite(read.timestamp) && read.timestamp > 1e12),
    `${where}: timestamp must be ms since the epoch, got ${String(read.timestamp)}.`,
  );
  check(
    read.tid === undefined || HEX.test(read.tid),
    `${where}: tid must be uppercase hex, got ${JSON.stringify(read.tid)}.`,
  );
}

/**
 * The suite every vendor adapter must pass before it ships: the contract's
 * units, connection states, stop semantics, errors and optional parts. Run
 * it in the vendor package's tests with its native module faked:
 *
 * ```ts
 * describeRfidAdapterContract({ describe, it }, () => {
 *   const native = createFakeHoneywellModule();
 *   return {
 *     adapter: createHoneywellRfidAdapter(native),
 *     readerId: "0C:23:69:19:AA:12",
 *     emitTags: (tags) => native.emitTagRead(tags.map(toHoneywellRead)),
 *     dropConnection: () => native.emitDisconnected(),
 *   };
 * });
 * ```
 *
 * It uses real timers and its own assertions, so it runs under any runner.
 */
export function describeRfidAdapterContract(
  api: RfidContractTestApi,
  setup: () => RfidContractHarness | Promise<RfidContractHarness>,
  options: RfidContractOptions = {},
): void {
  const timeout = options.timeout ?? 2_000;
  const testTimeout = timeout * 4;

  /** Runs `body` on a fresh harness, then tears it down. */
  function test(
    name: string,
    body: (harness: RfidContractHarness) => Promise<void>,
  ) {
    api.it(
      name,
      async () => {
        const harness = await setup();
        try {
          await body(harness);
        } finally {
          await harness.teardown?.();
        }
      },
      testTimeout,
    );
  }

  async function connected(harness: RfidContractHarness) {
    await harness.adapter.connect(harness.readerId);
    const link = await harness.adapter.getConnection();
    check(
      link.state === "connected",
      `connect() resolved but getConnection() reads "${link.state}": it must resolve once the reader is ready.`,
    );
  }

  /** Starts an inventory that records what it hears. */
  async function inventory(harness: RfidContractHarness, tid = false) {
    const heard: RfidTagRead[] = [];
    const stops: (RfidError | null)[] = [];
    await harness.adapter.startInventory(
      { tid },
      {
        onTags: (reads) => heard.push(...reads),
        onStop: (error) => stops.push(error),
      },
    );
    return { heard, stops };
  }

  api.describe(options.name ?? "RfidAdapter contract", () => {
    test("declares the contract it implements", async ({ adapter }) => {
      check(
        adapter.contractVersion === RFID_CONTRACT_VERSION,
        `contractVersion is ${String(adapter.contractVersion)}, this kit checks version ${RFID_CONTRACT_VERSION}. Declare it as a number literal, never by importing RFID_CONTRACT_VERSION: the check must compare the version the adapter was written for.`,
      );
      check(
        typeof adapter.vendor === "string" && adapter.vendor.length > 0,
        "vendor must name who made the reader.",
      );
      check(
        typeof adapter.supportsTid === "boolean",
        "supportsTid must be a boolean.",
      );
      const { near: nearBound, far } = adapter.proximityBounds;
      check(
        Number.isFinite(nearBound) && Number.isFinite(far) && nearBound > far,
        `proximityBounds.near must be a stronger (higher) dBm than far, got near ${String(nearBound)} and far ${String(far)}.`,
      );
      const { min, max } = adapter.powerRange;
      check(
        Number.isFinite(min) && Number.isFinite(max) && min < max,
        `powerRange must be a dBm range, got ${String(min)}–${String(max)}.`,
      );
      check(
        max <= 40,
        `powerRange.max is ${max}: transmit power is dBm in the contract (no handheld goes past about 33 dBm).`,
      );
      check(
        !adapter.startLocate === !adapter.stopLocate,
        "startLocate and stopLocate come together, or neither.",
      );
      check(
        !adapter.startDiscovery === !adapter.stopDiscovery,
        "startDiscovery and stopDiscovery come together, or neither.",
      );
    });

    test("is supported, with the permission granted, in the harness", async ({
      adapter,
    }) => {
      check(
        adapter.isSupported(),
        "isSupported() must be true in the harness.",
      );
      const permission = await adapter.getPermission();
      check(
        permission.status === "granted" &&
          typeof permission.canAskAgain === "boolean",
        `getPermission() must read granted in the harness, got ${JSON.stringify(permission)}.`,
      );
    });

    test("connects, reports the connection and disconnects", async (harness) => {
      const { adapter, readerId } = harness;
      const initial = await adapter.getConnection();
      check(
        initial.state === "disconnected" && initial.readerId === null,
        `getConnection() must read disconnected with a null readerId before connect(), got ${JSON.stringify(initial)}.`,
      );
      const heard: RfidConnection[] = [];
      const unsubscribe: Unsubscribe = adapter.subscribeConnection(
        (connection) => heard.push(connection),
      );
      try {
        await connected(harness);
        const link = await adapter.getConnection();
        check(
          link.readerId === readerId,
          `getConnection().readerId must be the reader connected to (${readerId}), got ${String(link.readerId)}.`,
        );
        await waitFor(
          () => heard.some((c) => c.state === "connected"),
          timeout,
          "subscribeConnection() never reported connected",
        );
        await adapter.disconnect();
        const after = await adapter.getConnection();
        check(
          after.state === "disconnected" && after.readerId === null,
          `After disconnect(), getConnection() must read disconnected with a null readerId, got ${JSON.stringify(after)}.`,
        );
        await waitFor(
          () => heard[heard.length - 1]?.state === "disconnected",
          timeout,
          "subscribeConnection() never reported disconnected",
        );
      } finally {
        unsubscribe();
      }
      const count = heard.length;
      await adapter.connect(readerId);
      await pause(50);
      check(
        heard.length === count,
        "subscribeConnection() kept calling its listener after the unsubscribe.",
      );
      await adapter.disconnect();
    });

    test("rejects an inventory without a reader with not-connected", async ({
      adapter,
    }) => {
      const error = await rejection(() =>
        adapter.startInventory(
          { tid: false },
          { onTags: () => {}, onStop: () => {} },
        ),
      );
      check(
        isRfidError(error) && error.code === "not-connected",
        `startInventory() without a connection must reject with RfidError("not-connected"), got ${error === undefined ? "a resolve" : describeError(error)}.`,
      );
    });

    test("reports an inventory's tags in the contract's units", async (harness) => {
      await connected(harness);
      const { heard } = await inventory(harness);
      await harness.emitTags([
        {
          epc: EPC,
          rssi: -48,
          antenna: 1,
          readCount: 2,
          timestamp: Date.now(),
        },
        { epc: OTHER_EPC, rssi: -71 },
      ]);
      await waitFor(
        () =>
          heard.some((r) => r.epc === EPC) &&
          heard.some((r) => r.epc === OTHER_EPC),
        timeout,
        `onTags() never reported both tags (heard ${JSON.stringify(heard.map((r) => r.epc))})`,
      );
      heard.forEach((read, index) => checkRead(read, `onTags() read ${index}`));
      const first = heard.find((r) => r.epc === EPC)!;
      const second = heard.find((r) => r.epc === OTHER_EPC)!;
      check(
        near(first.rssi, -48) && near(second.rssi, -71),
        `rssi must be dBm: sent -48 and -71, got ${first.rssi} and ${second.rssi}.`,
      );
      await harness.adapter.stopInventory();
    });

    test("stops an inventory: no read and no onStop after stopInventory()", async (harness) => {
      await connected(harness);
      const { heard, stops } = await inventory(harness);
      await harness.adapter.stopInventory();
      const count = heard.length;
      await harness.emitTags([{ epc: EPC, rssi: -50 }]);
      await pause(100);
      check(
        heard.length === count,
        "onTags() was called after stopInventory() resolved.",
      );
      check(
        stops.length === 0,
        "onStop() was called after stopInventory(): it is only for an inventory that ends by itself.",
      );
      const again = await inventory(harness);
      await harness.emitTags([{ epc: EPC, rssi: -50 }]);
      await waitFor(
        () => again.heard.length > 0,
        timeout,
        "An inventory started after a stop reported nothing",
      );
      await harness.adapter.stopInventory();
    });

    test("ends an inventory with disconnected when the reader drops", async (harness) => {
      await connected(harness);
      const { stops } = await inventory(harness);
      await harness.dropConnection();
      await waitFor(
        () => stops.length > 0,
        timeout,
        "onStop() was never called after the link dropped",
      );
      const [error] = stops;
      check(
        isRfidError(error) && error.code === "disconnected",
        `onStop() after a drop must carry RfidError("disconnected"), got ${describeError(error)}.`,
      );
      const link = await harness.adapter.getConnection();
      check(
        link.state !== "connected",
        "getConnection() still reads connected after the link dropped.",
      );
      await harness.adapter.disconnect();
    });

    test("reads TIDs when it says it can", async (harness) => {
      if (!harness.adapter.supportsTid) return;
      await connected(harness);
      const { heard } = await inventory(harness, true);
      await harness.emitTags([{ epc: EPC, rssi: -50, tid: TID }]);
      await waitFor(
        () => heard.some((r) => r.tid !== undefined),
        timeout,
        "An inventory with tid: true never reported a TID",
      );
      const read = heard.find((r) => r.tid !== undefined)!;
      checkRead(read, "onTags() read with a TID");
      check(read.tid === TID, `tid: sent ${TID}, got ${String(read.tid)}.`);
      await harness.adapter.stopInventory();
    });

    test("reads and writes the settings in the contract's units", async (harness) => {
      const { adapter } = harness;
      await connected(harness);
      const settings = await adapter.getSettings();
      const { min, max } = adapter.powerRange;
      check(
        settings.power >= min - DBM_TOLERANCE &&
          settings.power <= max + DBM_TOLERANCE,
        `getSettings().power must be dBm within powerRange (${min}–${max}), got ${settings.power}.`,
      );
      check(
        [0, 1, 2, 3].includes(settings.session),
        `getSettings().session must be 0–3, got ${String(settings.session)}.`,
      );
      check(
        settings.beeperVolume === null ||
          ["off", "low", "medium", "high"].includes(settings.beeperVolume),
        `getSettings().beeperVolume must be off, low, medium, high or null, got ${String(settings.beeperVolume)}.`,
      );
      check(
        settings.region === null || typeof settings.region === "string",
        "getSettings().region must be a string or null.",
      );
      const written = await adapter.setSettings({ power: min, session: 2 });
      check(
        near(written.power, min) && written.session === 2,
        `setSettings({ power: ${min}, session: 2 }) answered power ${written.power} and session ${String(written.session)}.`,
      );
      const read = await adapter.getSettings();
      check(
        near(read.power, min) && read.session === 2,
        `getSettings() after setSettings() reads power ${read.power} and session ${String(read.session)}.`,
      );
      await adapter.setSettings({
        power: settings.power,
        session: settings.session,
      });
    });

    test("locates one tag natively, in dBm, until stopLocate()", async (harness) => {
      const { adapter } = harness;
      if (!adapter.startLocate || !adapter.stopLocate) return;
      check(
        harness.emitLocate,
        "The adapter has startLocate(): the harness needs emitLocate() to check it.",
      );
      await connected(harness);
      const values: number[] = [];
      const stops: (RfidError | null)[] = [];
      await adapter.startLocate(EPC, {
        onValue: (rssi) => values.push(rssi),
        onStop: (error) => stops.push(error),
      });
      await harness.emitLocate(-52);
      await waitFor(
        () => values.length > 0,
        timeout,
        "onValue() never reported the located tag",
      );
      check(
        near(values[0]!, -52),
        `onValue() must report dBm: sent -52, got ${values[0]}.`,
      );
      await adapter.stopLocate();
      const count = values.length;
      await harness.emitLocate(-40);
      await pause(100);
      check(
        values.length === count,
        "onValue() was called after stopLocate() resolved.",
      );
      check(stops.length === 0, "onStop() was called after stopLocate().");
    });

    test("reads once for a window", async (harness) => {
      const { adapter } = harness;
      if (!adapter.readOnce) return;
      await connected(harness);
      await harness.emitTags([{ epc: EPC, rssi: -45 }]);
      const reads = await adapter.readOnce({ window: 100, tid: false });
      check(
        Array.isArray(reads),
        "readOnce() must resolve with an array of reads.",
      );
      reads.forEach((read, index) =>
        checkRead(read, `readOnce() read ${index}`),
      );
      const read = reads.find((r) => r.epc === EPC);
      check(read, `readOnce() did not return the tag in front of it (${EPC}).`);
      check(
        near(read.rssi, -45),
        `readOnce() rssi: sent -45, got ${read.rssi}.`,
      );
    });

    test("hands the trigger over while subscribed", async (harness) => {
      const { adapter } = harness;
      if (!adapter.subscribeTrigger) return;
      check(
        harness.pressTrigger,
        "The adapter has subscribeTrigger(): the harness needs pressTrigger() to check it.",
      );
      await connected(harness);
      const presses: boolean[] = [];
      const unsubscribe = adapter.subscribeTrigger((pressed) =>
        presses.push(pressed),
      );
      await harness.pressTrigger(true);
      await harness.pressTrigger(false);
      await waitFor(
        () => presses.length >= 2,
        timeout,
        "subscribeTrigger() did not report a press and a release",
      );
      check(
        presses[0] === true && presses[1] === false,
        `The trigger must report true then false, got ${JSON.stringify(presses)}.`,
      );
      unsubscribe();
      await harness.pressTrigger(true);
      await pause(50);
      check(
        presses.length === 2,
        "subscribeTrigger() kept calling its listener after the unsubscribe.",
      );
    });

    test("reports the battery and the reader's identity when it can", async (harness) => {
      const { adapter, readerId } = harness;
      await connected(harness);
      if (adapter.getBatteryLevel) {
        const level = await adapter.getBatteryLevel();
        check(
          level === null || (level >= 0 && level <= 100),
          `getBatteryLevel() must be 0–100 or null, got ${String(level)}.`,
        );
      }
      if (adapter.getReaderInfo) {
        const info = await adapter.getReaderInfo();
        check(
          info.id === readerId,
          `getReaderInfo().id must be the reader connected to (${readerId}), got ${info.id}.`,
        );
      }
    });
  });
}
