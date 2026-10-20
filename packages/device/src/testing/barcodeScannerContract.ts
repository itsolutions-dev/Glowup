import {
  aimToBarcodeType,
  BARCODE_TYPES,
  type BarcodeType,
} from "../core/barcodes";
import {
  isBarcodeScannerError,
  type BarcodeScannerError,
} from "../scanner/errors";
import {
  BARCODE_SCANNER_CONTRACT_VERSION,
  type BarcodeScannerAdapter,
  type BarcodeScannerHandlers,
  type BarcodeScannerRead,
} from "../scanner/types";

/** The test functions the kit registers with: Jest's, or another runner's. */
export interface BarcodeScannerContractTestApi {
  describe(name: string, body: () => void): void;
  it(name: string, body: () => Promise<void>, timeout?: number): void;
}

/**
 * A vendor adapter over its native module faked: what the kit drives. The
 * drivers speak the contract's terms, and the harness turns them into what
 * the vendor's SDK would send (Honeywell: its code id and AIM id), so the
 * kit checks the adapter's conversion.
 */
export interface BarcodeScannerContractHarness {
  /** Supported, and closed. */
  adapter: BarcodeScannerAdapter;
  /** The imager decodes this code; the kit calls it only while open. */
  emitRead(read: { data: string; type: BarcodeType }): void | Promise<void>;
  /** The user presses or releases the hardware trigger, when the SDK reports it. */
  pressTrigger?(pressed: boolean): void | Promise<void>;
  /** Another app claims the scanner, when the SDK reports it. */
  takeAway?(): void | Promise<void>;
  /** Runs after each test, pass or fail. */
  teardown?(): void | Promise<void>;
}

export interface BarcodeScannerContractOptions {
  /** The suite's name. Default `"BarcodeScannerAdapter contract"`. */
  name?: string;
  /** How long an awaited event may take, in ms. Default 2000. */
  timeout?: number;
}

const EAN = "8001234567890";
// Non-ASCII text: the adapter must pass on what the SDK decoded, charset applied.
const TEXT = "Città · 品番 42 ✓";

class ContractViolation extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BarcodeScannerContractViolation";
  }
}

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new ContractViolation(message);
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
  return isBarcodeScannerError(error)
    ? `BarcodeScannerError(${error.code})`
    : error instanceof Error
      ? `${error.name}: ${error.message}`
      : String(error);
}

function checkRead(read: BarcodeScannerRead, expected: BarcodeType) {
  check(
    typeof read.rawType === "string" && read.rawType.length > 0,
    `onRead(): rawType must name the vendor's symbology id, got ${JSON.stringify(read.rawType)}.`,
  );
  check(
    read.aimId === null ||
      (typeof read.aimId === "string" && /^\][A-Za-z0-9]/.test(read.aimId)),
    `onRead(): aimId must be an ISO/IEC 15424 identifier ("]C0") or null, got ${JSON.stringify(read.aimId)}.`,
  );
  check(
    read.type === undefined ||
      read.type === "unknown" ||
      BARCODE_TYPES.includes(read.type),
    `onRead(): type must be a BarcodeType, got ${JSON.stringify(read.type)}.`,
  );
  const type = read.type ?? aimToBarcodeType(read.aimId);
  check(
    type === expected,
    `onRead(): a ${expected} read as ${type}: give its AIM id, or type when the AIM id cannot say.`,
  );
  check(
    read.timestamp === undefined ||
      (Number.isFinite(read.timestamp) && read.timestamp > 1e12),
    `onRead(): timestamp must be ms since the epoch, got ${String(read.timestamp)}.`,
  );
}

interface Recorder {
  handlers: BarcodeScannerHandlers;
  reads: BarcodeScannerRead[];
  presses: boolean[];
  closes: (BarcodeScannerError | null)[];
}

function record(): Recorder {
  const recorder: Recorder = {
    reads: [],
    presses: [],
    closes: [],
    handlers: {
      onRead: (read) => recorder.reads.push(read),
      onTrigger: (pressed) => recorder.presses.push(pressed),
      onClose: (error) => recorder.closes.push(error),
    },
  };
  return recorder;
}

/**
 * The suite every vendor adapter must pass before it ships: the contract's
 * terms, open / close semantics, reads delivered once and the optional
 * parts. Run it in the vendor package's tests with its native module faked:
 *
 * ```ts
 * describeBarcodeScannerAdapterContract({ describe, it }, () => {
 *   const native = createFakeHoneywellScanner();
 *   return {
 *     adapter: createHoneywellBarcodeScannerAdapter(native),
 *     emitRead: (read) => native.emitBarcode(toHoneywellEvent(read)),
 *   };
 * });
 * ```
 *
 * It uses real timers and its own assertions, so it runs under any runner.
 */
export function describeBarcodeScannerAdapterContract(
  api: BarcodeScannerContractTestApi,
  setup: () =>
    BarcodeScannerContractHarness | Promise<BarcodeScannerContractHarness>,
  options: BarcodeScannerContractOptions = {},
): void {
  const timeout = options.timeout ?? 2_000;
  const testTimeout = timeout * 4;

  function test(
    name: string,
    body: (harness: BarcodeScannerContractHarness) => Promise<void>,
  ) {
    api.it(
      name,
      async () => {
        const harness = await setup();
        try {
          await body(harness);
        } finally {
          await harness.adapter.close().catch(() => {});
          await harness.teardown?.();
        }
      },
      testTimeout,
    );
  }

  /** A type the scanner decodes: EAN-13 when it can, else its first. */
  const typeOf = (adapter: BarcodeScannerAdapter): BarcodeType =>
    adapter.symbologies.includes("ean13") ? "ean13" : adapter.symbologies[0]!;

  async function readOnce(
    harness: BarcodeScannerContractHarness,
    recorder: Recorder,
    data: string,
    type: BarcodeType,
  ) {
    const before = recorder.reads.length;
    await harness.emitRead({ data, type });
    await waitFor(
      () => recorder.reads.length > before,
      timeout,
      `onRead() was not called for a ${type} decoded while open`,
    );
    // A second delivery of the same decode would come right behind it.
    await pause(50);
    check(
      recorder.reads.length === before + 1,
      `One decode reached onRead() ${recorder.reads.length - before} times: register the SDK's listener once per claim.`,
    );
    return recorder.reads[before]!;
  }

  api.describe(options.name ?? "BarcodeScannerAdapter contract", () => {
    test("declares the contract it implements", async ({ adapter }) => {
      check(
        adapter.contractVersion === BARCODE_SCANNER_CONTRACT_VERSION,
        `contractVersion is ${String(adapter.contractVersion)}, this kit checks version ${BARCODE_SCANNER_CONTRACT_VERSION}. Declare it as a number literal, never by importing BARCODE_SCANNER_CONTRACT_VERSION: the check must compare the version the adapter was written for.`,
      );
      check(
        typeof adapter.vendor === "string" && adapter.vendor.length > 0,
        "vendor must name who made the scanner.",
      );
      check(
        Array.isArray(adapter.symbologies) && adapter.symbologies.length > 0,
        "symbologies must list what open() can turn on.",
      );
      for (const type of adapter.symbologies) {
        check(
          BARCODE_TYPES.includes(type),
          `symbologies holds ${JSON.stringify(type)}, which is not a BarcodeType.`,
        );
      }
      check(
        new Set(adapter.symbologies).size === adapter.symbologies.length,
        "symbologies must not repeat a type.",
      );
      check(
        adapter.isSupported() === true,
        "isSupported() must answer true, synchronously, where the harness runs.",
      );
    });

    test("delivers each decode once, its text intact", async (harness) => {
      const recorder = record();
      await harness.adapter.open({ symbologies: null }, recorder.handlers);
      const type = typeOf(harness.adapter);
      const read = await readOnce(harness, recorder, EAN, type);
      check(
        read.data === EAN,
        `onRead() reported ${JSON.stringify(read.data)} for ${JSON.stringify(EAN)}: pass the decoded text on unchanged (no prefix, suffix or trimming).`,
      );
      checkRead(read, type);
      if (harness.adapter.symbologies.includes("qr")) {
        const text = await readOnce(harness, recorder, TEXT, "qr");
        check(
          text.data === TEXT,
          `onRead() reported ${JSON.stringify(text.data)} for ${JSON.stringify(TEXT)}: decode with the charset the SDK reports.`,
        );
        checkRead(text, "qr");
      }
      check(
        recorder.closes.length === 0,
        "onClose() was called while the scanner stayed open.",
      );
    });

    test("applies a new request while open, keeping one delivery", async (harness) => {
      const { adapter } = harness;
      const recorder = record();
      await adapter.open({ symbologies: null }, recorder.handlers);
      const type = typeOf(adapter);
      await adapter.open({ symbologies: [type] }, recorder.handlers);
      await readOnce(harness, recorder, EAN, type);
      await adapter.open(
        { symbologies: adapter.symbologies },
        recorder.handlers,
      );
      await readOnce(harness, recorder, EAN, type);
    });

    test("stops reading on close(), and close() is safe to repeat", async (harness) => {
      const { adapter } = harness;
      const recorder = record();
      await adapter.open({ symbologies: null }, recorder.handlers);
      await adapter.close();
      await harness.emitRead({ data: EAN, type: typeOf(adapter) });
      await pause(50);
      check(
        recorder.reads.length === 0,
        "onRead() was called after close() resolved.",
      );
      check(
        recorder.closes.length === 0,
        "onClose() reports a close the app did not ask for: close() must not call it.",
      );
      const failure = await rejection(() => adapter.close());
      check(
        failure === undefined,
        `close() on a closed scanner must resolve, got ${describeError(failure)}.`,
      );
    });

    test("opens again after close()", async (harness) => {
      const { adapter } = harness;
      const first = record();
      await adapter.open({ symbologies: null }, first.handlers);
      await adapter.close();
      const second = record();
      await adapter.open({ symbologies: null }, second.handlers);
      await readOnce(harness, second, EAN, typeOf(adapter));
      check(
        first.reads.length === 0,
        "A read after reopening reached the handlers of the earlier open().",
      );
    });

    test("needs the scanner open for the software trigger", async ({
      adapter,
    }) => {
      if (!adapter.softwareTrigger) return;
      const failure = await rejection(() => adapter.softwareTrigger!(true));
      check(
        isBarcodeScannerError(failure) && failure.code === "not-open",
        `softwareTrigger() on a closed scanner must reject with BarcodeScannerError(not-open), got ${failure === undefined ? "a resolve" : describeError(failure)}.`,
      );
      await adapter.open({ symbologies: null }, record().handlers);
      await adapter.softwareTrigger(true);
      await adapter.softwareTrigger(false);
    });

    test("reports the hardware trigger while open", async (harness) => {
      if (!harness.pressTrigger) return;
      const recorder = record();
      await harness.adapter.open({ symbologies: null }, recorder.handlers);
      await harness.pressTrigger(true);
      await harness.pressTrigger(false);
      await waitFor(
        () => recorder.presses.length >= 2,
        timeout,
        "onTrigger() did not report a press and a release",
      );
      check(
        recorder.presses[0] === true && recorder.presses[1] === false,
        `The trigger must report true then false, got ${JSON.stringify(recorder.presses)}.`,
      );
      await harness.adapter.close();
      await harness.pressTrigger(true);
      await pause(50);
      check(
        recorder.presses.length === 2,
        "onTrigger() was called after close() resolved.",
      );
    });

    test("reports a scanner another app takes", async (harness) => {
      if (!harness.takeAway) return;
      const { adapter } = harness;
      const recorder = record();
      await adapter.open({ symbologies: null }, recorder.handlers);
      await harness.takeAway();
      await waitFor(
        () => recorder.closes.length > 0,
        timeout,
        "onClose() was not called when another app took the scanner",
      );
      const [error] = recorder.closes;
      check(
        isBarcodeScannerError(error) && error.code === "unavailable",
        `onClose() must report BarcodeScannerError(unavailable), got ${describeError(error)}.`,
      );
      const again = record();
      await adapter.open({ symbologies: null }, again.handlers);
      await readOnce(harness, again, EAN, typeOf(adapter));
    });

    test("reports its identity when it can", async ({ adapter }) => {
      if (!adapter.getScannerInfo) return;
      await adapter.open({ symbologies: null }, record().handlers);
      const info = await adapter.getScannerInfo();
      for (const key of [
        "name",
        "model",
        "serialNumber",
        "firmwareVersion",
      ] as const) {
        check(
          info[key] === null || typeof info[key] === "string",
          `getScannerInfo().${key} must be a string or null, got ${JSON.stringify(info[key])}.`,
        );
      }
    });
  });
}
