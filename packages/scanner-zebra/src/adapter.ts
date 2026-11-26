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
  toOpenConfig,
  ZEBRA_SYMBOLOGIES,
} from "./convert";
import {
  loadZebraScannerModule,
  type NativeScanner,
  type NativeScannerInfo,
  type NativeSubscription,
  type ZebraScannerDiagnostic,
  type ZebraScannerNativeModule,
} from "./native";

export interface ZebraBarcodeScannerAdapterOptions {
  /** The native module; the linked one by default. Tests pass a fake. */
  native?: ZebraScannerNativeModule | null;
  /**
   * DataWedge runs on Zebra hardware: off a Zebra host the adapter reads
   * `unsupported` and never sends it an intent. Default true; `false` only
   * for a lab test.
   */
  requireZebraHost?: boolean;
  /**
   * The DataWedge profile the package creates and associates with the app.
   * Default: the app's package name (`it.example.app`).
   */
  profileName?: string;
  /** The host's manufacturer; `Platform.constants.Manufacturer` by default. */
  manufacturer?: () => string | null;
}

/** The optional parts of the contract DataWedge has: no trigger events. */
type ZebraCapabilities = Required<
  Pick<BarcodeScannerAdapter, "softwareTrigger" | "getScannerInfo">
>;

/** The barcode scanner adapter, its optional parts, plus what only the diagnostics use. */
export type ZebraBarcodeScannerAdapter = BarcodeScannerAdapter &
  ZebraCapabilities &
  ZebraExtras;

interface ZebraExtras {
  /** Whether this host is Zebra's (`Build.MANUFACTURER`). */
  isZebraHost(): boolean;
  /** Whether DataWedge is installed; `false` without the module. */
  hasDataWedge(): boolean;
  /**
   * The linked module's revision: below `ZEBRA_SCANNER_NATIVE_REVISION` the
   * app was built before a native change and needs rebuilding. `null`
   * without the module.
   */
  nativeRevision(): number | null;
  /** Raw DataWedge traffic (commands, results, notifications, reads) while on. */
  setDiagnostics(enabled: boolean): void;
  subscribeDiagnostics(
    listener: (event: ZebraScannerDiagnostic) => void,
  ): () => void;
  /** DataWedge's version info and scanners, every field. */
  getRawScannerInfo(): Promise<NativeScannerInfo>;
  /** The scanners DataWedge lists. */
  listDevices(): Promise<NativeScanner[]>;
  /** The profile's stored barcode input parameters. */
  getAllProperties(): Promise<Record<string, string | null>>;
  /** The profile DataWedge is using now. */
  getActiveProfile(): Promise<string | null>;
}

function hostManufacturer(): string | null {
  const constants = Platform.constants as { Manufacturer?: unknown };
  return typeof constants?.Manufacturer === "string"
    ? constants.Manufacturer
    : null;
}

/**
 * The adapter for the imager of Zebra mobile computers (the TC22) through
 * DataWedge. Pass it to `DeviceAdaptersProvider` as `barcodeScanner`.
 */
export function createZebraBarcodeScannerAdapter(
  options: ZebraBarcodeScannerAdapterOptions = {},
): ZebraBarcodeScannerAdapter {
  const requireHost = options.requireZebraHost ?? true;
  const manufacturer = options.manufacturer ?? hostManufacturer;
  const profileName = options.profileName?.trim() || null;

  const native = () =>
    options.native === undefined ? loadZebraScannerModule() : options.native;

  const isZebraHost = () =>
    (manufacturer() ?? "").toLowerCase().includes("zebra");

  const hasDataWedge = () => native()?.isDataWedgeInstalled() ?? false;

  const isSupported = () =>
    Platform.OS === "android" &&
    native() !== null &&
    (!requireHost || isZebraHost()) &&
    hasDataWedge();

  /** The module, or `unsupported` when it cannot run here. */
  function dataWedge(): ZebraScannerNativeModule {
    const module = native();
    if (!module || !isSupported()) throw new BarcodeScannerError("unsupported");
    return module;
  }

  async function call<T>(
    run: (module: ZebraScannerNativeModule) => Promise<T>,
  ) {
    try {
      return await run(dataWedge());
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

  const adapter: ZebraBarcodeScannerAdapter = {
    contractVersion: 1,
    vendor: "zebra",
    symbologies: ZEBRA_SYMBOLOGIES,

    isSupported,
    isZebraHost,
    hasDataWedge,

    async open(request, next) {
      const module = dataWedge();
      handlers = next;
      if (subscriptions.length === 0) {
        subscriptions = [
          module.addListener("onRead", (read) =>
            handlers?.onRead(fromNativeRead(read)),
          ),
          module.addListener("onClose", (event) => {
            const current = handlers;
            clear();
            current?.onClose(fromNativeError(event));
          }),
        ];
      }
      try {
        await module.open(toOpenConfig(request.symbologies, profileName));
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
    listDevices: async () => (await adapter.getRawScannerInfo()).scanners,
    getAllProperties: () => call((module) => module.getProfileParams()),
    getActiveProfile: () => call((module) => module.getActiveProfile()),

    nativeRevision() {
      return native()?.getRevision() ?? null;
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

let defaultAdapter: ZebraBarcodeScannerAdapter | null = null;

/** The adapter on the linked module, with the default options. */
export function getZebraBarcodeScannerAdapter(): ZebraBarcodeScannerAdapter {
  defaultAdapter ??= createZebraBarcodeScannerAdapter();
  return defaultAdapter;
}
