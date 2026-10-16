import type { PermissionState, PermissionStatus } from "../core/types";
import { RfidError, type RfidErrorCode } from "../rfid/errors";
import {
  RFID_CONTRACT_VERSION,
  type RfidAdapter,
  type RfidConnection,
  type RfidConnectionState,
  type RfidDiscoveredReader,
  type RfidDiscoveryHandlers,
  type RfidInventoryHandlers,
  type RfidInventoryRequest,
  type RfidLocateHandlers,
  type RfidProximityBounds,
  type RfidSettings,
  type RfidTagRead,
} from "../rfid/types";

/** A read the mock reports: only the EPC is needed. */
export type MockTagRead = Partial<RfidTagRead> & { epc: string };

/** Which optional parts of the contract the mock implements. All true by default. */
export interface MockRfidCapabilities {
  /** `startLocate` / `stopLocate`: false makes the engine emulate the locate. */
  locate?: boolean;
  /** `readOnce`: false makes the engine emulate the single read. */
  readOnce?: boolean;
  trigger?: boolean;
  discovery?: boolean;
  battery?: boolean;
  readerInfo?: boolean;
  tid?: boolean;
}

export interface MockRfidOptions {
  /** `false` behaves like a platform without the vendor's SDK. Default true. */
  supported?: boolean;
  /** Default `"undetermined"`. */
  permission?: PermissionStatus;
  /** What `requestPermission()` turns an askable permission into. Default `"granted"`. */
  requestResult?: "granted" | "denied";
  /** Default `"mock"`. */
  vendor?: string;
  /** Default `RFID_CONTRACT_VERSION`: set another to test the version check. */
  contractVersion?: number;
  capabilities?: MockRfidCapabilities;
  /** The readers that connect, and that a discovery finds. Default one. */
  readers?: Partial<RfidDiscoveredReader>[];
  /** Default near -35, far -75 dBm. */
  proximityBounds?: RfidProximityBounds;
  /** Default 5–30 dBm. */
  powerRange?: { min: number; max: number };
  settings?: Partial<RfidSettings>;
  /** Default 80. */
  battery?: number | null;
}

export interface MockRfidAdapter extends RfidAdapter {
  setPermission(
    status: PermissionStatus,
    options?: { canAskAgain?: boolean },
  ): void;
  /** How many times `requestPermission()` was called. */
  readonly requestCount: number;

  readonly connection: RfidConnection;
  /** How many connections were attempted. */
  readonly connectCount: number;
  /** Makes the next `connect()` reject. */
  failNextConnect(error: RfidError | RfidErrorCode): void;
  /** Makes the next `connect()` never settle, as a reader that is off. */
  holdNextConnect(): void;
  /**
   * Drops the link, as a reader out of range: a running inventory or locate
   * stops with `disconnected`. The mock then reads `reconnecting` (the
   * default) until `reconnect()`, or `disconnected` with `reconnect: false`.
   */
  dropConnection(options?: { reconnect?: boolean }): void;
  /** Ends a `reconnecting` state: the reader is back. */
  reconnect(): void;

  /**
   * Reports tags as the reader would: to a running inventory, to a running
   * native locate (the searched EPC's signal), and otherwise to the next
   * `readOnce()`. EPCs may be given in any case: the mock uppercases them,
   * as an adapter must.
   */
  emitTags(tags: MockTagRead[]): void;
  /**
   * Reports the searched tag's signal (dBm) to a running native locate;
   * dropped (returns false) when none runs, as the reader would.
   */
  emitLocate(rssi: number): boolean;
  /** Ends the running inventory or locate with a failure. */
  failRead(error: RfidError | RfidErrorCode): void;
  /** Makes the next inventory, locate or single read reject. */
  failNextStart(error: RfidError | RfidErrorCode): void;
  /** The running inventory's request; `null` when none runs. */
  readonly inventory: RfidInventoryRequest | null;
  /** The EPC a native locate searches; `null` when none runs. */
  readonly locating: string | null;
  /** How many inventories were started. */
  readonly inventoryCount: number;
  /** How many native single reads ran. */
  readonly readOnceCount: number;

  /** Presses (default) or releases the trigger, as the user would. */
  pressTrigger(pressed?: boolean): void;
  /** Active trigger subscriptions: the hooks share one per adapter. */
  readonly triggerSubscriberCount: number;

  /** Reports a reader to a running discovery; throws when none runs. */
  discover(reader?: Partial<RfidDiscoveredReader>): void;
  readonly isDiscovering: boolean;

  setBattery(level: number | null): void;
  readonly settings: RfidSettings;
}

function toError(error: RfidError | RfidErrorCode): RfidError {
  return typeof error === "string" ? new RfidError(error) : error;
}

function toPermission(
  status: PermissionStatus,
  canAskAgain?: boolean,
): PermissionState {
  return { status, canAskAgain: canAskAgain ?? status === "undetermined" };
}

const DEFAULT_READER: RfidDiscoveredReader = {
  id: "00:11:22:33:44:55",
  name: "Mock RFID reader",
  rssi: -55,
};

function toRead(tag: MockTagRead): RfidTagRead {
  return {
    rssi: -55,
    readCount: 1,
    timestamp: Date.now(),
    ...tag,
    // As every adapter must: the contract's EPC and TID are uppercase.
    epc: tag.epc.toUpperCase(),
    ...(tag.tid !== undefined && { tid: tag.tid.toUpperCase() }),
  };
}

/**
 * An in-memory `RfidAdapter`. Inject it with
 * `<DeviceAdaptersProvider adapters={{ rfid: adapter }}>` and drive it from
 * the test: `adapter.emitTags([{ epc: "E200…", rssi: -48 }])`. The hooks
 * share state per adapter, so create one per test.
 */
export function createMockRfidAdapter(
  options: MockRfidOptions = {},
): MockRfidAdapter {
  const supported = options.supported ?? true;
  const requestResult = options.requestResult ?? "granted";
  const capabilities = {
    locate: true,
    readOnce: true,
    trigger: true,
    discovery: true,
    battery: true,
    readerInfo: true,
    tid: true,
    ...options.capabilities,
  };
  const readers: RfidDiscoveredReader[] = (
    options.readers ?? [DEFAULT_READER]
  ).map((reader, index) => ({
    id: reader.id ?? `00:11:22:33:44:${String(index + 55).padStart(2, "0")}`,
    name: reader.name === undefined ? DEFAULT_READER.name : reader.name,
    rssi: reader.rssi === undefined ? DEFAULT_READER.rssi : reader.rssi,
  }));
  const powerRange = options.powerRange ?? { min: 5, max: 30 };

  let permission = toPermission(
    supported ? (options.permission ?? "undetermined") : "unsupported",
  );
  let requestCount = 0;
  let connection: RfidConnection = { state: "disconnected", readerId: null };
  const connectionListeners = new Set<(connection: RfidConnection) => void>();
  let nextConnect: RfidError | "hold" | null = null;
  let connectCount = 0;
  let inventory: {
    request: RfidInventoryRequest;
    handlers: RfidInventoryHandlers;
  } | null = null;
  let locate: { epc: string; handlers: RfidLocateHandlers } | null = null;
  let nextStartError: RfidError | null = null;
  let inventoryCount = 0;
  let readOnceCount = 0;
  let pendingReads: RfidTagRead[] = [];
  let readOnceCollector: RfidTagRead[] | null = null;
  const triggerListeners = new Set<(pressed: boolean) => void>();
  let discovery: RfidDiscoveryHandlers | null = null;
  let battery = options.battery === undefined ? 80 : options.battery;
  let settings: RfidSettings = {
    power: powerRange.max,
    session: 1,
    beeperVolume: "medium",
    region: "EU",
    ...options.settings,
  };

  function setConnection(state: RfidConnectionState, readerId: string | null) {
    connection = { state, readerId };
    [...connectionListeners].forEach((listener) => listener({ ...connection }));
  }

  function requireConnected() {
    if (connection.state !== "connected") {
      throw new RfidError("not-connected");
    }
  }

  function takeStartError() {
    if (nextStartError) {
      const error = nextStartError;
      nextStartError = null;
      throw error;
    }
  }

  /** Ends the running inventory or locate, telling its handlers. */
  function endReads(error: RfidError | null) {
    const running = inventory?.handlers ?? locate?.handlers;
    inventory = null;
    locate = null;
    running?.onStop(error);
  }

  const adapter: MockRfidAdapter = {
    contractVersion: options.contractVersion ?? RFID_CONTRACT_VERSION,
    vendor: options.vendor ?? "mock",
    supportsTid: capabilities.tid,
    proximityBounds: options.proximityBounds ?? { near: -35, far: -75 },
    powerRange,
    isSupported: () => supported,
    getPermission: async () => ({ ...permission }),
    async requestPermission() {
      requestCount++;
      if (permission.status !== "granted" && permission.canAskAgain) {
        permission = toPermission(requestResult, false);
      }
      return { ...permission };
    },

    connect(readerId) {
      connectCount++;
      const next = nextConnect;
      nextConnect = null;
      if (connection.state !== "disconnected") {
        endReads(new RfidError("disconnected"));
      }
      setConnection("connecting", readerId);
      if (next === "hold") return new Promise<void>(() => {});
      if (next || !readers.some((reader) => reader.id === readerId)) {
        setConnection("disconnected", null);
        return Promise.reject(
          next ?? new RfidError("failed", `No reader ${readerId} answered.`),
        );
      }
      setConnection("connected", readerId);
      return Promise.resolve();
    },
    async disconnect() {
      endReads(null);
      if (connection.state !== "disconnected") {
        setConnection("disconnected", null);
      }
    },
    getConnection: async () => ({ ...connection }),
    subscribeConnection(listener) {
      connectionListeners.add(listener);
      return () => {
        connectionListeners.delete(listener);
      };
    },

    async startInventory(request, handlers) {
      requireConnected();
      takeStartError();
      if (inventory || locate) {
        throw new Error(
          "MockRfidAdapter: startInventory() while a mode runs. The engine stops it first.",
        );
      }
      inventoryCount++;
      inventory = { request: { ...request }, handlers };
    },
    async stopInventory() {
      inventory = null;
    },

    async getSettings() {
      requireConnected();
      return { ...settings };
    },
    async setSettings(patch) {
      requireConnected();
      settings = { ...settings, ...patch };
      return { ...settings };
    },

    setPermission(status, { canAskAgain } = {}) {
      permission = toPermission(status, canAskAgain);
    },
    get requestCount() {
      return requestCount;
    },
    get connection() {
      return { ...connection };
    },
    get connectCount() {
      return connectCount;
    },
    failNextConnect(error) {
      nextConnect = toError(error);
    },
    holdNextConnect() {
      nextConnect = "hold";
    },
    dropConnection({ reconnect = true } = {}) {
      const readerId = connection.readerId;
      endReads(new RfidError("disconnected"));
      setConnection(
        reconnect ? "reconnecting" : "disconnected",
        reconnect ? readerId : null,
      );
    },
    reconnect() {
      if (connection.state === "reconnecting") {
        setConnection("connected", connection.readerId);
      }
    },

    emitTags(tags) {
      const reads = tags.map(toRead);
      if (inventory) {
        inventory.handlers.onTags(reads);
      } else if (locate) {
        const { epc, handlers } = locate;
        for (const read of reads) {
          if (read.epc.toUpperCase() === epc) handlers.onValue(read.rssi);
        }
      } else if (readOnceCollector) {
        readOnceCollector.push(...reads);
      } else {
        pendingReads.push(...reads);
      }
    },
    emitLocate(rssi) {
      if (!locate) return false;
      locate.handlers.onValue(rssi);
      return true;
    },
    failRead(error) {
      endReads(toError(error));
    },
    failNextStart(error) {
      nextStartError = toError(error);
    },
    get inventory() {
      return inventory ? { ...inventory.request } : null;
    },
    get locating() {
      return locate?.epc ?? null;
    },
    get inventoryCount() {
      return inventoryCount;
    },
    get readOnceCount() {
      return readOnceCount;
    },

    pressTrigger(pressed = true) {
      [...triggerListeners].forEach((listener) => listener(pressed));
    },
    get triggerSubscriberCount() {
      return triggerListeners.size;
    },

    discover(reader = {}) {
      if (!discovery) {
        throw new Error("MockRfidAdapter: discover() while no discovery runs.");
      }
      discovery.onReader({
        id: reader.id ?? readers[0]?.id ?? DEFAULT_READER.id,
        name: reader.name === undefined ? DEFAULT_READER.name : reader.name,
        rssi: reader.rssi === undefined ? DEFAULT_READER.rssi : reader.rssi,
      });
    },
    get isDiscovering() {
      return discovery !== null;
    },

    setBattery(level) {
      battery = level;
    },
    get settings() {
      return { ...settings };
    },
  };

  // Assigned after the literal: what the engine checks with `in` / truthiness
  // must be absent, not undefined-valued, for a capability turned off.
  if (capabilities.readOnce) {
    adapter.readOnce = async (request) => {
      requireConnected();
      takeStartError();
      readOnceCount++;
      const collected = pendingReads;
      pendingReads = [];
      readOnceCollector = collected;
      await new Promise((resolve) => setTimeout(resolve, request.window));
      readOnceCollector = null;
      return collected;
    };
  }
  if (capabilities.locate) {
    adapter.startLocate = async (epc, handlers) => {
      requireConnected();
      takeStartError();
      if (inventory || locate) {
        throw new Error(
          "MockRfidAdapter: startLocate() while a mode runs. The engine stops it first.",
        );
      }
      locate = { epc, handlers };
    };
    adapter.stopLocate = async () => {
      locate = null;
    };
  }
  if (capabilities.trigger) {
    adapter.subscribeTrigger = (listener) => {
      triggerListeners.add(listener);
      return () => {
        triggerListeners.delete(listener);
      };
    };
  }
  if (capabilities.discovery) {
    adapter.startDiscovery = async (handlers) => {
      discovery = handlers;
    };
    adapter.stopDiscovery = async () => {
      discovery = null;
    };
  }
  if (capabilities.battery) {
    adapter.getBatteryLevel = async () => {
      requireConnected();
      return battery;
    };
  }
  if (capabilities.readerInfo) {
    adapter.getReaderInfo = async () => {
      requireConnected();
      const reader = readers.find((r) => r.id === connection.readerId);
      return {
        id: connection.readerId!,
        name: reader?.name ?? null,
        model: "Mock",
        serialNumber: "MOCK-0001",
        firmwareVersion: "1.0.0",
      };
    };
  }
  return adapter;
}
