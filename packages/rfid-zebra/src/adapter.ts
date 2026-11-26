import {
  RfidError,
  type RfidAdapter,
  type RfidLocateHandlers,
  type RfidProximityBounds,
} from "@its/glowup-device/rfid";
import { Platform } from "react-native";

import {
  fromNativeReads,
  fromNativeSettings,
  nearestPowerIndex,
  parseBatteryLevel,
  toRfidError,
  toSdkVolume,
} from "./convert";
import {
  loadZebraRfidModule,
  type NativeReaderInfo,
  type NativeSubscription,
  type ZebraDiagnostic,
  type ZebraRfidNativeModule,
} from "./native";
import { createAndroidPermissions } from "./permissions";

export interface ZebraRfidAdapterOptions {
  /** The native module; the linked one by default. Tests pass a fake. */
  native?: ZebraRfidNativeModule | null;
  /**
   * The search through the reader's own tag locationing
   * (`TagLocationing.Perform`, which also beeps as the tag nears), its value
   * the searched tag's RSSI. Default true; false leaves `startLocate` out, so
   * the engine emulates the search with an inventory (plan decision Z3).
   */
  nativeLocate?: boolean;
  /**
   * Report only what looks like a Zebra reader in a discovery (a name
   * starting `RFD`). Default true; the diagnostics turn it off to see every
   * paired device the SDK lists.
   */
  discoveryFilter?: boolean;
  /** Default near -30, far -70 dBm, until the RFD40 is measured (phase Z1). */
  proximityBounds?: RfidProximityBounds;
}

/** The optional parts of the contract the Zebra SDK has, the native search aside. */
type ZebraCapabilities = Required<
  Pick<
    RfidAdapter,
    | "subscribeTrigger"
    | "startDiscovery"
    | "stopDiscovery"
    | "getBatteryLevel"
    | "getReaderInfo"
  >
>;

/** The RFID adapter, plus what only the diagnostics use. */
export type ZebraRfidAdapter = RfidAdapter & ZebraCapabilities & ZebraExtras;

interface ZebraExtras {
  /**
   * The linked module's revision: below `ZEBRA_NATIVE_REVISION` the app was
   * built before a native change and needs rebuilding. `null` without the
   * module.
   */
  nativeRevision(): number | null;
  /** Raw SDK events (reads, threads, the locate's relative distance) while on. */
  setDiagnostics(enabled: boolean): void;
  /** Whether the next discovery reports only what looks like a Zebra reader. */
  setDiscoveryFilter(enabled: boolean): void;
  /**
   * Adds or removes the native search (`startLocate` / `stopLocate`), for
   * the spike's comparison with the emulated one. Only while none runs.
   */
  setNativeLocate(enabled: boolean): void;
  /** Every component's version, as the SDK names them. */
  getVersions(): Promise<NativeReaderInfo["versions"]>;
  subscribeDiagnostics(listener: (event: ZebraDiagnostic) => void): () => void;
}

// The power the contract accepts, in dBm; the reader's own table may be
// narrower, and a setting picks its nearest level.
const POWER_RANGE = { min: 0, max: 30 };

/**
 * The adapter for Zebra readers (the RFD40 Premium paired over Bluetooth)
 * through Zebra's RFID SDK for Android (API3) 2.0.5.297. Pass it to
 * `DeviceAdaptersProvider` as `rfid`.
 */
export function createZebraRfidAdapter(
  options: ZebraRfidAdapterOptions = {},
): ZebraRfidAdapter {
  let discoveryFilter = options.discoveryFilter ?? true;
  const permissions = createAndroidPermissions();

  const native = () =>
    options.native === undefined ? loadZebraRfidModule() : options.native;

  // No host check: the RFD40 Premium works with any Android device, and the
  // SDK checks none.
  const isSupported = () => Platform.OS === "android" && native() !== null;

  /** The module, or `unsupported` when it cannot run here. */
  function sdk(): ZebraRfidNativeModule {
    const module = native();
    if (!module || !isSupported()) throw new RfidError("unsupported");
    return module;
  }

  async function call<T>(run: (module: ZebraRfidNativeModule) => Promise<T>) {
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

  async function startLocate(epc: string, handlers: RfidLocateHandlers) {
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
  }

  async function stopLocate() {
    clearMode();
    const module = native();
    if (!module || !isSupported()) return;
    await call((m) => m.stopLocate());
  }

  const adapter: ZebraRfidAdapter = {
    contractVersion: 1,
    vendor: "zebra",
    supportsTid: true,
    proximityBounds: options.proximityBounds ?? { near: -30, far: -70 },
    powerRange: POWER_RANGE,

    isSupported,

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

    // No readOnce: the SDK has no single read, so the engine runs a short
    // inventory and keeps the strongest tag.

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
        module.addListener("onReaderFound", ({ id, name }) =>
          // The SDK lists paired readers: there is no signal to report.
          handlers.onReader({ id, name, rssi: null }),
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
      return fromNativeSettings(settings, POWER_RANGE);
    },

    async setSettings({ power, session, beeperVolume }) {
      let powerIndex: number | null = null;
      if (power !== undefined) {
        const { powerLevels } = await call((module) => module.getSettings());
        powerIndex = nearestPowerIndex(powerLevels, power);
        if (powerIndex === null) {
          throw new RfidError(
            "failed",
            "The reader reported no transmit power levels.",
          );
        }
      }
      await call((module) =>
        module.setSettings(
          powerIndex,
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
        name: info.name || null,
        model: info.model || null,
        serialNumber: info.serialNumber || null,
        firmwareVersion: info.firmware || null,
      };
    },

    nativeRevision() {
      const module = native();
      return module ? module.getRevision() : null;
    },

    setDiagnostics(enabled) {
      native()?.setDiagnostics(enabled);
    },

    setDiscoveryFilter(enabled) {
      discoveryFilter = enabled;
    },

    setNativeLocate(enabled) {
      if (enabled) {
        adapter.startLocate = startLocate;
        adapter.stopLocate = stopLocate;
      } else {
        // Absent, not undefined: capabilities are read from what exists.
        delete adapter.startLocate;
        delete adapter.stopLocate;
      }
    },

    async getVersions() {
      return (await call((module) => module.getReaderInfo())).versions;
    },

    subscribeDiagnostics(listener) {
      const module = native();
      if (!module) return () => {};
      const subscription = module.addListener("onDiagnostic", listener);
      return () => subscription.remove();
    },
  };
  adapter.setNativeLocate(options.nativeLocate ?? true);
  return adapter;
}

let defaultAdapter: ZebraRfidAdapter | null = null;

/** The adapter on the linked module, with the default options. */
export function getZebraRfidAdapter(): ZebraRfidAdapter {
  defaultAdapter ??= createZebraRfidAdapter();
  return defaultAdapter;
}
