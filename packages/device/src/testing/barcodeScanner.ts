import { BARCODE_TYPES, type BarcodeType } from "../core/barcodes";
import {
  BarcodeScannerError,
  type BarcodeScannerErrorCode,
} from "../scanner/errors";
import {
  BARCODE_SCANNER_CONTRACT_VERSION,
  type BarcodeScannerAdapter,
  type BarcodeScannerHandlers,
  type BarcodeScannerInfo,
  type BarcodeScannerOpenRequest,
  type BarcodeScannerRead,
} from "../scanner/types";

/** The AIM id a real scanner sends for each symbology the mock decodes. */
const AIM_IDS: Record<BarcodeType, string> = {
  aztec: "]z0",
  codabar: "]F0",
  code39: "]A0",
  code93: "]G0",
  code128: "]C0",
  datamatrix: "]d1",
  ean8: "]E4",
  ean13: "]E0",
  itf14: "]I0",
  pdf417: "]L0",
  qr: "]Q1",
  upc_a: "]E0",
  upc_e: "]E0",
};

/** A decode the mock reports: only the text is needed (a QR by default). */
export type MockBarcodeRead = Partial<Omit<BarcodeScannerRead, "type">> & {
  data: string;
  type?: BarcodeType;
};

export interface MockBarcodeScannerOptions {
  /** `false` behaves like a device without the vendor's scanner. Default true. */
  supported?: boolean;
  /** Default `"mock"`. */
  vendor?: string;
  /** Default `BARCODE_SCANNER_CONTRACT_VERSION`: set another to test the version check. */
  contractVersion?: number;
  /** What `open()` can turn on. Default every `BarcodeType`. */
  symbologies?: readonly BarcodeType[];
  /** `softwareTrigger`. Default true. */
  softwareTrigger?: boolean;
  /** `getScannerInfo`, or `null` to leave it out. Default a mock imager. */
  scannerInfo?: BarcodeScannerInfo | null;
}

export interface MockBarcodeScannerAdapter extends BarcodeScannerAdapter {
  /** Whether the app holds the scanner. */
  readonly isOpen: boolean;
  /** The request the scanner was last opened with; `null` when closed. */
  readonly request: BarcodeScannerOpenRequest | null;
  readonly openCount: number;
  readonly closeCount: number;
  /** Makes the next `open()` reject (`unavailable`: another app holds it). */
  failNextOpen(error: BarcodeScannerError | BarcodeScannerErrorCode): void;
  /** Makes the next `open()` wait until `releaseOpen()`. */
  holdNextOpen(): void;
  releaseOpen(): void;
  /**
   * Decodes a code, as the imager would: delivered only while open and, with
   * a symbology list, only for a symbology turned on. Returns whether it was.
   */
  scan(read: MockBarcodeRead): boolean;
  /** Presses (default) or releases the hardware trigger. */
  pressTrigger(pressed?: boolean): void;
  /** Another app claims the scanner: it closes with `unavailable`. */
  takeAway(error?: BarcodeScannerError | BarcodeScannerErrorCode): void;
  /** Every `softwareTrigger()` call, in order. */
  readonly softwareTriggerCalls: readonly boolean[];
}

function toError(
  error: BarcodeScannerError | BarcodeScannerErrorCode,
): BarcodeScannerError {
  return typeof error === "string" ? new BarcodeScannerError(error) : error;
}

const DEFAULT_INFO: BarcodeScannerInfo = {
  name: "Mock imager",
  model: "MOCK-1",
  serialNumber: "0000",
  firmwareVersion: "1.0",
};

/**
 * An in-memory `BarcodeScannerAdapter`. Inject it with
 * `<DeviceAdaptersProvider adapters={{ barcodeScanner: adapter }}>` and drive
 * it from the test: `adapter.scan({ data: "8001234567890", type: "ean13" })`.
 * The hooks share state per adapter, so create one per test.
 */
export function createMockBarcodeScannerAdapter(
  options: MockBarcodeScannerOptions = {},
): MockBarcodeScannerAdapter {
  const supported = options.supported ?? true;
  const symbologies = options.symbologies ?? BARCODE_TYPES;
  let handlers: BarcodeScannerHandlers | null = null;
  let request: BarcodeScannerOpenRequest | null = null;
  let openCount = 0;
  let closeCount = 0;
  let nextOpen: BarcodeScannerError | null = null;
  let holdOpen = false;
  let releaseHeld: (() => void) | null = null;
  const softwareTriggerCalls: boolean[] = [];

  const adapter: MockBarcodeScannerAdapter = {
    contractVersion:
      options.contractVersion ?? BARCODE_SCANNER_CONTRACT_VERSION,
    vendor: options.vendor ?? "mock",
    symbologies,
    isSupported: () => supported,
    async open(next, nextHandlers) {
      if (!supported) throw new BarcodeScannerError("unsupported");
      openCount++;
      if (holdOpen) {
        holdOpen = false;
        await new Promise<void>((resolve) => {
          releaseHeld = resolve;
        });
      }
      if (nextOpen) {
        const failure = nextOpen;
        nextOpen = null;
        throw failure;
      }
      request = { symbologies: next.symbologies };
      handlers = nextHandlers;
    },
    async close() {
      if (!handlers) return;
      closeCount++;
      handlers = null;
      request = null;
    },
    get isOpen() {
      return handlers !== null;
    },
    get request() {
      return request;
    },
    get openCount() {
      return openCount;
    },
    get closeCount() {
      return closeCount;
    },
    failNextOpen(error) {
      nextOpen = toError(error);
    },
    holdNextOpen() {
      holdOpen = true;
    },
    releaseOpen() {
      releaseHeld?.();
      releaseHeld = null;
    },
    scan({ type = "qr", ...read }) {
      if (!handlers || !request) return false;
      if (request.symbologies && !request.symbologies.includes(type)) {
        return false;
      }
      handlers.onRead({
        aimId: AIM_IDS[type],
        rawType: type,
        timestamp: Date.now(),
        ...read,
      });
      return true;
    },
    pressTrigger(pressed = true) {
      handlers?.onTrigger(pressed);
    },
    takeAway(error = "unavailable") {
      const current = handlers;
      handlers = null;
      request = null;
      current?.onClose(toError(error));
    },
    get softwareTriggerCalls() {
      return softwareTriggerCalls;
    },
  };
  // Assigned after the literal, so a part turned off is absent, not undefined.
  if (options.softwareTrigger ?? true) {
    adapter.softwareTrigger = async (pressed) => {
      if (!handlers) throw new BarcodeScannerError("not-open");
      softwareTriggerCalls.push(pressed);
    };
  }
  const info =
    options.scannerInfo === undefined ? DEFAULT_INFO : options.scannerInfo;
  if (info) adapter.getScannerInfo = async () => ({ ...info });
  return adapter;
}
