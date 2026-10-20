import { AppState, type NativeEventSubscription } from "react-native";

import { aimToBarcodeType, type BarcodeType } from "../core/barcodes";
import { createEmitter, getOrCreate } from "../core/shared";
import type { Unsubscribe } from "../core/types";
import { isCompatibleBarcodeScannerAdapter } from "./adapter";
import { BarcodeScannerError, toBarcodeScannerError } from "./errors";
import {
  BARCODE_SCANNER_CONTRACT_VERSION,
  type BarcodeScannerAdapter,
  type BarcodeScannerHandlers,
  type BarcodeScannerInfo,
  type BarcodeScannerRead,
  type BarcodeScannerScan,
} from "./types";

/**
 * - `closed`: nobody holds the scanner, the app is in the background, it
 *   failed to open, or another app took it.
 * - `opening`: `open()` runs.
 * - `open`: decodes reach the holder on top.
 */
export type BarcodeScannerState = "closed" | "opening" | "open";

/** A mounted `useBarcodeScanner`: the latest one enabled receives the reads. */
export interface ScannerHolder {
  symbologies: readonly BarcodeType[] | null;
  onScan(scan: BarcodeScannerScan): void;
}

export interface BarcodeScannerEngine {
  adapter: BarcodeScannerAdapter;
  getState(): BarcodeScannerState;
  /** Why the scanner is not open although someone holds it; `null` otherwise. */
  getError(): BarcodeScannerError | null;
  isTriggerPressed(): boolean;
  /** The holder reads go to: the one that started holding last. */
  getTop(): ScannerHolder | null;
  subscribe(listener: () => void): Unsubscribe;
  /** The scanner stays open while anyone holds it and the app is in the foreground. */
  hold(holder: ScannerHolder): Unsubscribe;
  /** `holder` wants other symbologies: reapplied if it is on top. */
  update(
    holder: ScannerHolder,
    symbologies: readonly BarcodeType[] | null,
  ): void;
  /** Tries to open again after a failure (another app released the scanner). */
  retry(): void;
  softwareTrigger(pressed: boolean): Promise<void>;
  getScannerInfo(): Promise<BarcodeScannerInfo | null>;
}

const keyOf = (symbologies: readonly BarcodeType[] | null) =>
  symbologies === null ? null : [...symbologies].sort().join(",");

function toScan(read: BarcodeScannerRead): BarcodeScannerScan {
  return {
    data: read.data,
    type: read.type ?? aimToBarcodeType(read.aimId),
    rawType: read.rawType,
    aimId: read.aimId ?? null,
    timestamp: read.timestamp ?? Date.now(),
  };
}

function createEngine(adapter: BarcodeScannerAdapter): BarcodeScannerEngine {
  const emitter = createEmitter();
  const holders: ScannerHolder[] = [];
  let state: BarcodeScannerState = "closed";
  let error: BarcodeScannerError | null = null;
  let triggerPressed = false;
  let foreground = AppState.currentState !== "background";
  let appState: NativeEventSubscription | null = null;

  // `opened` is the adapter's side; `session` drops what an earlier opening
  // reports after it closed; `chain` runs one open or close at a time.
  let opened = false;
  let applied: string | null | undefined;
  let session = 0;
  let chain: Promise<void> = Promise.resolve();

  function set(next: {
    state?: BarcodeScannerState;
    error?: BarcodeScannerError | null;
    triggerPressed?: boolean;
  }) {
    let changed = false;
    if (next.state !== undefined && next.state !== state) {
      state = next.state;
      changed = true;
    }
    if (next.error !== undefined && next.error !== error) {
      error = next.error;
      changed = true;
    }
    if (
      next.triggerPressed !== undefined &&
      next.triggerPressed !== triggerPressed
    ) {
      triggerPressed = next.triggerPressed;
      changed = true;
    }
    if (changed) emitter.emit();
  }

  function handlersFor(id: number): BarcodeScannerHandlers {
    return {
      onRead(read) {
        if (id !== session) return;
        holders.at(-1)?.onScan(toScan(read));
      },
      onTrigger(pressed) {
        if (id !== session) return;
        set({ triggerPressed: pressed });
      },
      onClose(failure) {
        if (id !== session) return;
        session++;
        opened = false;
        applied = undefined;
        set({ state: "closed", error: failure, triggerPressed: false });
      },
    };
  }

  async function close() {
    session++;
    const wasOpen = opened || state === "opening";
    opened = false;
    applied = undefined;
    set({ state: "closed", triggerPressed: false });
    if (wasOpen) await adapter.close().catch(() => {});
  }

  async function apply() {
    const top = holders.at(-1) ?? null;
    if (!top) {
      set({ error: null });
      return close();
    }
    if (!foreground || !adapter.isSupported()) return close();
    if (!isCompatibleBarcodeScannerAdapter(adapter)) {
      await close();
      set({
        error: new BarcodeScannerError(
          "incompatible-adapter",
          `The ${adapter.vendor} barcode scanner adapter implements contract version ${String(adapter.contractVersion)}, this @its/glowup-device implements ${BARCODE_SCANNER_CONTRACT_VERSION}: install versions that match.`,
        ),
      });
      return;
    }
    const key = keyOf(top.symbologies);
    if (opened && applied === key) return;
    if (!opened) session++;
    const id = session;
    set({ state: "opening" });
    try {
      await adapter.open({ symbologies: top.symbologies }, handlersFor(id));
    } catch (failure) {
      if (id !== session) return;
      session++;
      opened = false;
      applied = undefined;
      set({ state: "closed", error: toBarcodeScannerError(failure) });
      // The adapter may hold a half-open scanner: release it.
      await adapter.close().catch(() => {});
      return;
    }
    if (id !== session) return;
    opened = true;
    applied = key;
    set({ state: "open", error: null });
  }

  function schedule() {
    chain = chain.then(apply).catch(() => {});
  }

  function watchAppState() {
    appState = AppState.addEventListener("change", (next) => {
      // Not on `inactive`: iOS passes through it for a pulled-down notification.
      const now = next !== "background";
      if (now === foreground) return;
      foreground = now;
      schedule();
    });
  }

  return {
    adapter,
    getState: () => state,
    getError: () => error,
    isTriggerPressed: () => triggerPressed,
    getTop: () => holders.at(-1) ?? null,
    subscribe: emitter.subscribe,
    hold(holder) {
      if (holders.length === 0) {
        foreground = AppState.currentState !== "background";
        watchAppState();
      }
      holders.push(holder);
      emitter.emit();
      schedule();
      return () => {
        const index = holders.lastIndexOf(holder);
        if (index === -1) return;
        holders.splice(index, 1);
        if (holders.length === 0) {
          appState?.remove();
          appState = null;
        }
        emitter.emit();
        schedule();
      };
    },
    update(holder, symbologies) {
      if (keyOf(holder.symbologies) === keyOf(symbologies)) return;
      holder.symbologies = symbologies;
      if (holders.at(-1) === holder) schedule();
    },
    retry() {
      if (holders.length > 0 && !opened) schedule();
    },
    async softwareTrigger(pressed) {
      if (!adapter.softwareTrigger) {
        throw new BarcodeScannerError(
          "unsupported",
          `The ${adapter.vendor} barcode scanner has no software trigger.`,
        );
      }
      if (!opened) {
        throw new BarcodeScannerError(
          "not-open",
          "The barcode scanner is not open: mount useBarcodeScanner with enabled, in the foreground.",
        );
      }
      try {
        await adapter.softwareTrigger(pressed);
      } catch (failure) {
        throw toBarcodeScannerError(failure);
      }
    },
    async getScannerInfo() {
      if (!adapter.getScannerInfo || !adapter.isSupported()) return null;
      try {
        return await adapter.getScannerInfo();
      } catch (failure) {
        throw toBarcodeScannerError(failure);
      }
    },
  };
}

const engines = new WeakMap<BarcodeScannerAdapter, BarcodeScannerEngine>();

/** The adapter's engine: one per adapter, shared by every hook. */
export function getBarcodeScannerEngine(
  adapter: BarcodeScannerAdapter,
): BarcodeScannerEngine {
  return getOrCreate(engines, adapter, () => createEngine(adapter));
}
