import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { useDeviceAdapter } from "../core/adapters";
import {
  BARCODE_TYPES,
  createScanGate,
  type BarcodeType,
} from "../core/barcodes";
import { useClientValue } from "../core/shared";
import {
  getBarcodeScannerCapabilities,
  isCompatibleBarcodeScannerAdapter,
  unsupportedBarcodeScannerAdapter,
} from "./adapter";
import {
  type BarcodeScannerState,
  getBarcodeScannerEngine,
  type ScannerHolder,
} from "./engine";
import type { BarcodeScannerError } from "./errors";
import type {
  BarcodeScannerAdapter,
  BarcodeScannerCapabilities,
  BarcodeScannerInfo,
  BarcodeScannerScan,
} from "./types";

/** How long the same code is delivered once, by default, in ms. */
export const DEFAULT_REPEAT_INTERVAL = 1000;

/** The provided adapter, or `unsupportedBarcodeScannerAdapter` without one. */
export function useBarcodeScannerAdapter(): BarcodeScannerAdapter {
  return useDeviceAdapter("barcodeScanner") ?? unsupportedBarcodeScannerAdapter;
}

export interface BarcodeScannerOptions {
  /**
   * Each read, while this hook holds the scanner. Return a promise (the
   * confirmation that submits the code) and reads are dropped until it
   * settles (`dropWhileBusy`).
   */
  onScan: (scan: BarcodeScannerScan) => unknown;
  /**
   * False releases the scanner to the hook below (or to the device). Pass a
   * screen's focus here: a stack keeps the screens behind mounted. Default true.
   */
  enabled?: boolean;
  /**
   * The symbologies to decode, every other off, from `capabilities.symbologies`;
   * `null` (default) keeps the scanner's own configuration.
   */
  symbologies?: readonly BarcodeType[] | null;
  /** Milliseconds during which the same code is delivered once; 0 delivers every read. Default 1000. */
  repeatInterval?: number;
  /** Drop reads while `onScan`'s promise is pending. Default true. */
  dropWhileBusy?: boolean;
}

export interface UseBarcodeScanner {
  /**
   * Whether the provided adapter runs here and implements this package's
   * contract version. False while a static web page prerenders: read
   * barcodes with `/camera`'s `CameraView` instead, with the same handler.
   */
  isSupported: boolean;
  /** The adapter's vendor (`"honeywell"`; `"none"` without an adapter). */
  vendor: string;
  capabilities: BarcodeScannerCapabilities;
  /** The scanner's state, whoever holds it. */
  state: BarcodeScannerState;
  /** This hook holds the open scanner: its `onScan` receives the reads. */
  isActive: boolean;
  /** Why the scanner did not open (another app holds it: `unavailable`). */
  error: BarcodeScannerError | null;
  isTriggerPressed: boolean;
  /** `onScan`'s promise is pending. */
  isBusy: boolean;
  /** An on-screen scan button: `true` on press, `false` on release. */
  softwareTrigger: (pressed: boolean) => Promise<void>;
  /** `null` when the adapter does not report it. */
  getScannerInfo: () => Promise<BarcodeScannerInfo | null>;
  /** Opens again after `error` (the other app released the scanner). */
  retry: () => void;
}

const capabilities = new WeakMap<
  BarcodeScannerAdapter,
  BarcodeScannerCapabilities
>();

function capabilitiesOf(
  adapter: BarcodeScannerAdapter,
): BarcodeScannerCapabilities {
  let found = capabilities.get(adapter);
  if (!found) {
    found = getBarcodeScannerCapabilities(adapter);
    capabilities.set(adapter, found);
  }
  return found;
}

function checkOptions(
  adapter: BarcodeScannerAdapter,
  supported: boolean,
  symbologies: readonly BarcodeType[] | null,
  repeatInterval: number,
) {
  if (
    typeof repeatInterval !== "number" ||
    !(repeatInterval >= 0) ||
    repeatInterval === Infinity
  ) {
    throw new RangeError(
      `useBarcodeScanner(): repeatInterval must be 0 or more milliseconds, got ${String(repeatInterval)}.`,
    );
  }
  if (symbologies === null) return;
  for (const type of symbologies) {
    if (!BARCODE_TYPES.includes(type)) {
      throw new RangeError(
        `useBarcodeScanner(): ${JSON.stringify(type)} is not a BarcodeType.`,
      );
    }
    // Only where it runs: elsewhere the app falls back to the camera.
    if (supported && !adapter.symbologies.includes(type)) {
      throw new RangeError(
        `useBarcodeScanner(): the ${adapter.vendor} scanner cannot decode ${type}; it takes ${adapter.symbologies.join(", ")}.`,
      );
    }
  }
}

const getFalse = () => false;
const getClosed = (): BarcodeScannerState => "closed";
const getNull = () => null;

/**
 * The device's hardware barcode scanner, held while the component is
 * mounted, `enabled` and the app is in the foreground. The latest hook to
 * hold it receives the reads; when it lets go, the one below gets them
 * back, and with none left the scanner returns to the device.
 *
 * ```tsx
 * const scanner = useBarcodeScanner({
 *   symbologies: ["qr", "code128", "ean13", "datamatrix"],
 *   onScan: (scan) => submit(scan.data),
 * });
 * ```
 */
export function useBarcodeScanner(
  options: BarcodeScannerOptions,
): UseBarcodeScanner {
  const {
    enabled = true,
    symbologies = null,
    repeatInterval = DEFAULT_REPEAT_INTERVAL,
  } = options;
  const adapter = useBarcodeScannerAdapter();
  const engine = getBarcodeScannerEngine(adapter);
  const isSupported = useClientValue(
    () => adapter.isSupported() && isCompatibleBarcodeScannerAdapter(adapter),
    false,
  );
  checkOptions(adapter, isSupported, symbologies, repeatInterval);

  const latest = useRef(options);
  useEffect(() => {
    latest.current = options;
  });

  const [gate] = useState(createScanGate);
  const [holder] = useState<ScannerHolder>(() => ({
    symbologies: null,
    onScan(scan) {
      const current = latest.current;
      gate.offer(
        scan,
        {
          repeatInterval: current.repeatInterval ?? DEFAULT_REPEAT_INTERVAL,
          dropWhileBusy: current.dropWhileBusy ?? true,
        },
        current.onScan,
      );
    },
  }));

  // An inline `symbologies={["qr"]}` is a new array every render.
  const key = symbologies === null ? null : symbologies.join(",");
  const requested = useMemo(
    () =>
      key === null ? null : key === "" ? [] : (key.split(",") as BarcodeType[]),
    [key],
  );

  // Before the hold below, so a first hold opens with these.
  useEffect(() => {
    engine.update(holder, requested);
  }, [engine, holder, requested]);

  useEffect(() => {
    if (!enabled) return;
    return engine.hold(holder);
  }, [engine, holder, enabled]);

  const state = useSyncExternalStore(
    engine.subscribe,
    engine.getState,
    getClosed,
  );
  const error = useSyncExternalStore(
    engine.subscribe,
    engine.getError,
    getNull,
  );
  const isTriggerPressed = useSyncExternalStore(
    engine.subscribe,
    engine.isTriggerPressed,
    getFalse,
  );
  const isActive = useSyncExternalStore(
    engine.subscribe,
    () => engine.getTop() === holder && engine.getState() === "open",
    getFalse,
  );
  const isBusy = useSyncExternalStore(gate.subscribe, gate.isBusy, getFalse);

  return {
    isSupported,
    vendor: adapter.vendor,
    capabilities: capabilitiesOf(adapter),
    state,
    isActive,
    error,
    isTriggerPressed,
    isBusy,
    softwareTrigger: engine.softwareTrigger,
    getScannerInfo: engine.getScannerInfo,
    retry: engine.retry,
  };
}
