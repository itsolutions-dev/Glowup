import {
  RfidError,
  type RfidAdapter,
  type RfidProximityBounds,
} from "@its/glowup-device/rfid";
import { Platform } from "react-native";

import {
  fromNativeReads,
  fromNativeSettings,
  parseBatteryLevel,
  toCentiDbm,
  toRfidError,
  toSdkVolume,
} from "./convert";
import {
  loadHoneywellRfidModule,
  type HoneywellDiagnostic,
  type HoneywellRfidNativeModule,
  type NativeSubscription,
} from "./native";
import { createAndroidPermissions } from "./permissions";

export interface HoneywellRfidAdapterOptions {
  /** The native module; the linked one by default. Tests pass a fake. */
  native?: HoneywellRfidNativeModule | null;
  /**
   * The licence binds apps embedding the SDK to Honeywell hardware: off a
   * Honeywell host the adapter reads `unsupported` and never starts the SDK.
   * Default true; `false` only for a lab test on other hardware.
   */
  requireHoneywellHost?: boolean;
  /**
   * Report only what looks like a Honeywell reader in a discovery (its
   * service or an IH4x name). Default true; the diagnostics turn it off to
   * see what the readers advertise.
   */
  discoveryFilter?: boolean;
  /**
   * Default near -30, far -70 dBm: on the IH40 a tag held against the reader
   * reads about -25, the weakest heard about -71 (phase 35's spike).
   */
  proximityBounds?: RfidProximityBounds;
  /** The host's manufacturer; `Platform.constants.Manufacturer` by default. */
  manufacturer?: () => string | null;
}

/** Every optional part of the contract, which the Honeywell SDK has. */
type HoneywellCapabilities = Required<
  Pick<
    RfidAdapter,
    | "readOnce"
    | "startLocate"
    | "stopLocate"
    | "subscribeTrigger"
    | "startDiscovery"
    | "stopDiscovery"
    | "getBatteryLevel"
    | "getReaderInfo"
  >
>;

/** The RFID adapter, every optional part included, plus what only the diagnostics use. */
export type HoneywellRfidAdapter = RfidAdapter &
  HoneywellCapabilities &
  HoneywellExtras;

interface HoneywellExtras {
  /** Whether this host is Honeywell's (`Build.MANUFACTURER`). */
  isHoneywellHost(): boolean;
  /**
   * The linked module's revision: below `HONEYWELL_NATIVE_REVISION` the app
   * was built before a native change and needs rebuilding. `null` without the
   * module; `1` for a module from before revisions.
   */
  nativeRevision(): number | null;
  /** Raw SDK events (reads, threads, advertisements) while on. */
  setDiagnostics(enabled: boolean): void;
  /** Whether the next discovery reports only what looks like a Honeywell reader. */
  setDiscoveryFilter(enabled: boolean): void;
  subscribeDiagnostics(
    listener: (event: HoneywellDiagnostic) => void,
  ): () => void;
}

// The SDK's antenna power range (Javadoc: 500–3000 centi-dBm).
const POWER_RANGE = { min: 5, max: 30 };

function hostManufacturer(): string | null {
  const constants = Platform.constants as { Manufacturer?: unknown };
  return typeof constants?.Manufacturer === "string"
    ? constants.Manufacturer
    : null;
}

/**
 * The adapter for Honeywell readers (IH40 over Bluetooth) through the
 * Honeywell RFID SDK v1.1.0. Pass it to `DeviceAdaptersProvider` as `rfid`.
 */
export function createHoneywellRfidAdapter(
  options: HoneywellRfidAdapterOptions = {},
): HoneywellRfidAdapter {
  const requireHost = options.requireHoneywellHost ?? true;
  let discoveryFilter = options.discoveryFilter ?? true;
  const manufacturer = options.manufacturer ?? hostManufacturer;
  const permissions = createAndroidPermissions();

  const native = () =>
    options.native === undefined ? loadHoneywellRfidModule() : options.native;

  const isHoneywellHost = () =>
    (manufacturer() ?? "").toLowerCase().includes("honeywell");

  const isSupported = () =>
    Platform.OS === "android" &&
    native() !== null &&
    (!requireHost || isHoneywellHost());

  /** The module, or `unsupported` when it cannot run here. */
  function sdk(): HoneywellRfidNativeModule {
    const module = native();
    if (!module || !isSupported()) throw new RfidError("unsupported");
    return module;
  }

  async function call<T>(
    run: (module: HoneywellRfidNativeModule) => Promise<T>,
  ) {
    try {
      return await run(sdk());
    } catch (error) {
      throw toRfidError(error);
    }
  }

  // The running mode's subscriptions: removed before its stop resolves, so
  // nothing reaches a handler after it (the contract's stop semantics).
  let modeSubscriptions: NativeSubscription[] = [];
  function clearMode() {
    modeSubscriptions.forEach((subscription) => subscription.remove());
    modeSubscriptions = [];
  }

  let discoverySubscriptions: NativeSubscription[] = [];
  function clearDiscovery() {
    discoverySubscriptions.forEach((subscription) => subscription.remove());
    discoverySubscriptions = [];
  }

  const triggerListeners = new Set<(pressed: boolean) => void>();
  let triggerSubscription: NativeSubscription | null = null;

  const adapter: HoneywellRfidAdapter = {
    contractVersion: 1,
    vendor: "honeywell",
    supportsTid: true,
    proximityBounds: options.proximityBounds ?? { near: -30, far: -70 },
    powerRange: POWER_RANGE,

    isSupported,
    isHoneywellHost,

    getPermission: () =>
      isSupported() ? permissions.read() : permissions.unsupported(),
    requestPermission: () =>
      isSupported() ? permissions.request() : permissions.unsupported(),

    connect: (readerId) => call((module) => module.connect(readerId)),

    async disconnect() {
      clearMode();
      const module = native();
      if (!module || !isSupported()) return;
      await call((m) => m.disconnect());
    },

    async getConnection() {
      const module = native();
      if (!module || !isSupported()) {
        return { state: "disconnected", readerId: null };
      }
      return module.getConnection();
    },

    subscribeConnection(listener) {
      const module = native();
      if (!module || !isSupported()) return () => {};
      const subscription = module.addListener("onConnection", (event) =>
        listener({ state: event.state, readerId: event.readerId }),
      );
      return () => subscription.remove();
    },

    async startInventory({ tid }, handlers) {
      const module = sdk();
      clearMode();
      modeSubscriptions = [
        module.addListener("onTags", ({ reads }) => {
          const converted = fromNativeReads(reads);
          if (converted.length > 0) handlers.onTags(converted);
        }),
        module.addListener("onModeStop", (event) => {
          if (event.mode !== "inventory") return;
          clearMode();
          handlers.onStop(toRfidError(event));
        }),
      ];
      try {
        await module.startInventory(tid);
      } catch (error) {
        clearMode();
        throw toRfidError(error);
      }
    },

    async stopInventory() {
      clearMode();
      const module = native();
      if (!module || !isSupported()) return;
      await call((m) => m.stopInventory());
    },

    async readOnce({ window, tid }) {
      const reads = await call((module) =>
        module.readOnce(Math.round(window), tid),
      );
      return fromNativeReads(reads);
    },

    async startLocate(epc, handlers) {
      const module = sdk();
      clearMode();
      modeSubscriptions = [
        module.addListener("onLocate", ({ rssi }) => handlers.onValue(rssi)),
        module.addListener("onModeStop", (event) => {
          if (event.mode !== "locate") return;
          clearMode();
          handlers.onStop(toRfidError(event));
        }),
      ];
      try {
        await module.startLocate(epc);
      } catch (error) {
        clearMode();
        throw toRfidError(error);
      }
    },

    async stopLocate() {
      clearMode();
      const module = native();
      if (!module || !isSupported()) return;
      await call((m) => m.stopLocate());
    },

    subscribeTrigger(listener) {
      const module = native();
      if (!module || !isSupported()) return () => {};
      triggerListeners.add(listener);
      if (!triggerSubscription) {
        triggerSubscription = module.addListener("onTrigger", ({ pressed }) =>
          triggerListeners.forEach((l) => l(pressed)),
        );
        // Applied now when connected, on every connection otherwise.
        module.setTriggerHandover(true).catch(() => {});
      }
      return () => {
        if (!triggerListeners.delete(listener) || triggerListeners.size > 0) {
          return;
        }
        triggerSubscription?.remove();
        triggerSubscription = null;
        module.setTriggerHandover(false).catch(() => {});
      };
    },

    async startDiscovery(handlers) {
      const module = sdk();
      clearDiscovery();
      discoverySubscriptions = [
        module.addListener("onReaderFound", ({ id, name, rssi }) =>
          handlers.onReader({ id, name, rssi }),
        ),
        module.addListener("onDiscoveryStop", (event) => {
          clearDiscovery();
          handlers.onStop(toRfidError(event));
        }),
      ];
      try {
        await module.startDiscovery(discoveryFilter);
      } catch (error) {
        clearDiscovery();
        throw toRfidError(error);
      }
    },

    async stopDiscovery() {
      clearDiscovery();
      const module = native();
      if (!module || !isSupported()) return;
      await call((m) => m.stopDiscovery());
    },

    async getSettings() {
      const settings = await call((module) => module.getSettings());
      return fromNativeSettings(settings, POWER_RANGE.max);
    },

    async setSettings({ power, session, beeperVolume }) {
      await call((module) =>
        module.setSettings(
          power === undefined ? null : toCentiDbm(power),
          session ?? null,
          beeperVolume === undefined ? null : toSdkVolume(beeperVolume),
        ),
      );
      return adapter.getSettings();
    },

    async getBatteryLevel() {
      return parseBatteryLevel(
        await call((module) => module.getBatteryLevel()),
      );
    },

    async getReaderInfo() {
      const info = await call((module) => module.getReaderInfo());
      const connection = await adapter.getConnection();
      return {
        id: info.id ?? connection.readerId ?? "",
        name: null,
        model: null,
        // The SDK answers "Not Support!" when the reader has no serial (IH40).
        serialNumber:
          info.serialNumber && info.serialNumber !== "Not Support!"
            ? info.serialNumber
            : null,
        firmwareVersion: info.rfidSoftware || null,
      };
    },

    nativeRevision() {
      const module = native();
      if (!module) return null;
      return typeof module.getRevision === "function"
        ? module.getRevision()
        : 1;
    },

    setDiagnostics(enabled) {
      native()?.setDiagnostics(enabled);
    },

    setDiscoveryFilter(enabled) {
      discoveryFilter = enabled;
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

let defaultAdapter: HoneywellRfidAdapter | null = null;

/** The adapter on the linked module, with the default options. */
export function getHoneywellRfidAdapter(): HoneywellRfidAdapter {
  defaultAdapter ??= createHoneywellRfidAdapter();
  return defaultAdapter;
}
