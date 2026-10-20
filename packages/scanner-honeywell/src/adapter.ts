import {
  BarcodeScannerError,
  type BarcodeScannerAdapter,
  type BarcodeScannerHandlers,
} from "@its/glowup-device/scanner";
import { Platform } from "react-native";

import {
  fromNativeError,
  fromNativeInfo,
  fromNativeRead,
  HONEYWELL_SYMBOLOGIES,
  toOpenProperties,
} from "./convert";
import {
  loadHoneywellScannerModule,
  type HoneywellScannerDiagnostic,
  type HoneywellScannerNativeModule,
  type HoneywellTriggerControl,
  type NativeProperty,
  type NativeScannerInfo,
  type NativeSubscription,
} from "./native";

export interface HoneywellBarcodeScannerAdapterOptions {
  /** The native module; the linked one by default. Tests pass a fake. */
  native?: HoneywellScannerNativeModule | null;
  /**
   * The SDK is for Honeywell hardware: off a Honeywell host the adapter
   * reads `unsupported` and never starts it. Default true; `false` only for
   * a lab test on other hardware.
   */
  requireHoneywellHost?: boolean;
  /**
   * Who decodes on a trigger press. Default `"auto"`: the scanner service
   * (the trigger works as in any app). `"client"`: the module drives each
   * press itself, for a trigger the service reports but does not decode on.
   */
  triggerControl?: HoneywellTriggerControl;
  /** The host's manufacturer; `Platform.constants.Manufacturer` by default. */
  manufacturer?: () => string | null;
}

/** Every optional part of the contract, which the SDK has. */
type HoneywellCapabilities = Required<
  Pick<BarcodeScannerAdapter, "softwareTrigger" | "getScannerInfo">
>;

/** The barcode scanner adapter, every optional part included, plus what only the diagnostics use. */
export type HoneywellBarcodeScannerAdapter = BarcodeScannerAdapter &
  HoneywellCapabilities &
  HoneywellExtras;

interface HoneywellExtras {
  /** Whether this host is Honeywell's (`Build.MANUFACTURER`). */
  isHoneywellHost(): boolean;
  /**
   * The linked module's revision: below `HONEYWELL_SCANNER_NATIVE_REVISION`
   * the app was built before a native change and needs rebuilding. `null`
   * without the module.
   */
  nativeRevision(): number | null;
  /** Applies from the next `open()`. */
  setTriggerControl(control: HoneywellTriggerControl): void;
  /** Raw SDK events (reads, triggers, the claim) while on. */
  setDiagnostics(enabled: boolean): void;
  subscribeDiagnostics(
    listener: (event: HoneywellScannerDiagnostic) => void,
  ): () => void;
  /** `BarcodeReaderInfo` as the SDK gives it, every field. */
  getRawScannerInfo(): Promise<NativeScannerInfo>;
  /** The scanners the service knows. */
  listDevices(): Promise<NativeScannerInfo[]>;
  /** Every property as the service holds it for this app's reader. */
  getAllProperties(): Promise<Record<string, NativeProperty | null>>;
}

function hostManufacturer(): string | null {
  const constants = Platform.constants as { Manufacturer?: unknown };
  return typeof constants?.Manufacturer === "string"
    ? constants.Manufacturer
    : null;
}

/**
 * The adapter for the imager of Honeywell mobile computers (the CT40)
 * through the Data Collection SDK. Pass it to `DeviceAdaptersProvider` as
 * `barcodeScanner`.
 */
export function createHoneywellBarcodeScannerAdapter(
  options: HoneywellBarcodeScannerAdapterOptions = {},
): HoneywellBarcodeScannerAdapter {
  const requireHost = options.requireHoneywellHost ?? true;
  const manufacturer = options.manufacturer ?? hostManufacturer;
  let triggerControl = options.triggerControl ?? "auto";

  const native = () =>
    options.native === undefined
      ? loadHoneywellScannerModule()
      : options.native;

  const isHoneywellHost = () =>
    (manufacturer() ?? "").toLowerCase().includes("honeywell");

  const isSupported = () =>
    Platform.OS === "android" &&
    native() !== null &&
    (!requireHost || isHoneywellHost());

  /** The module, or `unsupported` when it cannot run here. */
  function sdk(): HoneywellScannerNativeModule {
    const module = native();
    if (!module || !isSupported()) throw new BarcodeScannerError("unsupported");
    return module;
  }

  async function call<T>(
    run: (module: HoneywellScannerNativeModule) => Promise<T>,
  ) {
    try {
      return await run(sdk());
    } catch (error) {
      throw fromNativeError(error);
    }
  }

  // While open: one set of subscriptions, whatever the number of open()
  // calls, so each read reaches the handlers once; removed before close()
  // resolves, so nothing reaches them after it.
  let handlers: BarcodeScannerHandlers | null = null;
  let subscriptions: NativeSubscription[] = [];
  function clear() {
    subscriptions.forEach((subscription) => subscription.remove());
    subscriptions = [];
    handlers = null;
  }

  const adapter: HoneywellBarcodeScannerAdapter = {
    contractVersion: 1,
    vendor: "honeywell",
    symbologies: HONEYWELL_SYMBOLOGIES,

    isSupported,
    isHoneywellHost,

    async open(request, next) {
      const module = sdk();
      handlers = next;
      if (subscriptions.length === 0) {
        subscriptions = [
          module.addListener("onRead", (read) =>
            handlers?.onRead(fromNativeRead(read)),
          ),
          module.addListener("onTrigger", ({ pressed }) =>
            handlers?.onTrigger(pressed),
          ),
          module.addListener("onClose", (event) => {
            const current = handlers;
            clear();
            current?.onClose(fromNativeError(event));
          }),
        ];
      }
      try {
        await module.open(
          toOpenProperties(request.symbologies),
          triggerControl,
        );
      } catch (error) {
        clear();
        throw fromNativeError(error);
      }
    },

    async close() {
      clear();
      const module = native();
      if (!module || !isSupported()) return;
      await call((m) => m.close());
    },

    async softwareTrigger(pressed) {
      if (subscriptions.length === 0) throw new BarcodeScannerError("not-open");
      await call((module) => module.softwareTrigger(pressed));
    },

    async getScannerInfo() {
      return fromNativeInfo(await adapter.getRawScannerInfo());
    },

    getRawScannerInfo: () => call((module) => module.getScannerInfo()),
    listDevices: () => call((module) => module.listDevices()),
    getAllProperties: () => call((module) => module.getAllProperties()),

    nativeRevision() {
      return native()?.getRevision() ?? null;
    },

    setTriggerControl(control) {
      triggerControl = control;
    },

    setDiagnostics(enabled) {
      native()?.setDiagnostics(enabled);
    },

    subscribeDiagnostics(listener) {
      const module = native();
      if (!module) return () => {};
      const subscription = module.addListener("onDiagnostic", listener);
      return () => subscription.remove();
    },
  };
  return adapter;
}

let defaultAdapter: HoneywellBarcodeScannerAdapter | null = null;

/** The adapter on the linked module, with the default options. */
export function getHoneywellBarcodeScannerAdapter(): HoneywellBarcodeScannerAdapter {
  defaultAdapter ??= createHoneywellBarcodeScannerAdapter();
  return defaultAdapter;
}
