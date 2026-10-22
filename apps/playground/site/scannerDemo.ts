import type {
  BarcodeScannerAdapter,
  BarcodeType,
} from "@its/glowup-device/scanner";
import { createMockBarcodeScannerAdapter } from "@its/glowup-device/testing";

/**
 * A simulated hardware scanner for the barcode scanner page: no vendor ships
 * with the site (each one is a native module and its SDK), so the page runs
 * on the package's in-memory adapter. The reader picks the label in front of
 * the imager and pulls the trigger; the scanner decodes it a moment later,
 * or ignores it when the screen did not turn its symbology on.
 */

export interface DemoLabel {
  id: string;
  name: string;
  type: BarcodeType;
  data: string;
}

/** What sits in front of the imager: a warehouse's labels. */
export const DEMO_LABELS: readonly DemoLabel[] = [
  { id: "location", name: "Shelf (QR)", type: "qr", data: "LOC:A-03-12" },
  {
    id: "pallet",
    name: "Pallet (Code 128)",
    type: "code128",
    data: "PAL-000184-2026",
  },
  {
    id: "product",
    name: "Product (EAN-13)",
    type: "ean13",
    data: "8001234567897",
  },
  {
    id: "serial",
    name: "Device (Data Matrix)",
    type: "datamatrix",
    data: "SN 22271B821E",
  },
  { id: "small", name: "Small pack (EAN-8)", type: "ean8", data: "96385074" },
  {
    id: "imported",
    name: "Imported product (UPC-A)",
    type: "upc_a",
    data: "036000291452",
  },
];

/** How long the imager takes to decode after the trigger. */
const DECODE_MS = 150;

export interface DemoDecodes {
  /** Reads the scanner sent to the app. */
  decoded: number;
  /** The last label it did not decode (closed, or its symbology off). */
  ignored: DemoLabel | null;
}

export interface ScannerDemo {
  adapter: BarcodeScannerAdapter;
  /** The label the software trigger decodes. */
  aim(label: DemoLabel): void;
  /** The hardware trigger: pressed, a decode, released. */
  pullTrigger(): Promise<void>;
  /** Another app claims the scanner. */
  takeAway(): void;
  subscribe(listener: () => void): () => void;
  getDecodes(): DemoDecodes;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function createScannerDemo(): ScannerDemo {
  const mock = createMockBarcodeScannerAdapter({
    vendor: "simulated",
    scannerInfo: {
      name: "Simulated imager",
      model: "SIM-2D",
      serialNumber: null,
      firmwareVersion: "1.0",
    },
  });
  let aimed: DemoLabel = DEMO_LABELS[0]!;
  let decodes: DemoDecodes = { decoded: 0, ignored: null };
  const listeners = new Set<() => void>();

  function decode() {
    const label = aimed;
    const sent = mock.scan({ data: label.data, type: label.type });
    decodes = sent
      ? { decoded: decodes.decoded + 1, ignored: null }
      : { ...decodes, ignored: label };
    listeners.forEach((listener) => listener());
  }

  // Built field by field: a spread would copy the mock's getters as values.
  const adapter: BarcodeScannerAdapter = {
    contractVersion: mock.contractVersion,
    vendor: mock.vendor,
    symbologies: mock.symbologies,
    isSupported: mock.isSupported,
    open: mock.open,
    close: mock.close,
    getScannerInfo: mock.getScannerInfo,
    async softwareTrigger(pressed) {
      await mock.softwareTrigger!(pressed);
      if (pressed) setTimeout(decode, DECODE_MS);
    },
  };

  return {
    adapter,
    aim(label) {
      aimed = label;
    },
    async pullTrigger() {
      mock.pressTrigger(true);
      await wait(DECODE_MS);
      decode();
      await wait(DECODE_MS);
      mock.pressTrigger(false);
    },
    takeAway() {
      mock.takeAway();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getDecodes: () => decodes,
  };
}
