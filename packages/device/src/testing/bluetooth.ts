import { BluetoothError, type BluetoothErrorCode } from "../bluetooth/errors";
import type {
  BluetoothAdapter,
  BluetoothAdvertisement,
  BluetoothCharacteristicProperties,
  BluetoothDevice,
  BluetoothScanHandlers,
  BluetoothScanRequest,
  BluetoothService,
  BluetoothState,
  BluetoothValueEvent,
} from "../bluetooth/types";
import { toBluetoothUuid } from "../bluetooth/uuid";
import type { PermissionState, PermissionStatus } from "../core/types";

export type BluetoothDeviceOverrides = Partial<
  Omit<BluetoothDevice, "advertisement">
> & { advertisement?: Partial<BluetoothAdvertisement> };

/**
 * A device as a scan reports it: a heart rate monitor by default. Service
 * UUIDs may be given short (`"180D"`); `localName` follows `name` unless set.
 */
export function buildBluetoothDevice(
  overrides: BluetoothDeviceOverrides = {},
): BluetoothDevice {
  const name = overrides.name === undefined ? "HRM" : overrides.name;
  const advertisement = overrides.advertisement ?? {};
  return {
    id: overrides.id ?? "AA:BB:CC:DD:EE:01",
    name,
    rssi: overrides.rssi ?? -60,
    advertisement: {
      localName: name,
      serviceData: {},
      manufacturerData: null,
      txPowerLevel: null,
      isConnectable: true,
      ...advertisement,
      serviceUuids: (advertisement.serviceUuids ?? []).map(toBluetoothUuid),
    },
  };
}

/** A characteristic of a mock device; only `read` is allowed by default. */
export interface MockCharacteristic {
  uuid: string;
  properties?: Partial<BluetoothCharacteristicProperties>;
  /** What a read answers until a write changes it. Default empty. */
  value?: Uint8Array | number[];
}

export interface MockService {
  uuid: string;
  characteristics: MockCharacteristic[];
}

/** A write the app made, as the device received it. */
export interface MockWrite {
  deviceId: string;
  service: string;
  characteristic: string;
  value: Uint8Array;
  withResponse: boolean;
}

function toError(error: BluetoothError | BluetoothErrorCode): BluetoothError {
  return typeof error === "string" ? new BluetoothError(error) : error;
}

export interface MockBluetoothOptions {
  /** `false` behaves like the web or Expo Go. Default true. */
  supported?: boolean;
  /** The radio. Default `"on"`. */
  state?: BluetoothState;
  /** Default `"undetermined"`. */
  permission?: PermissionStatus;
  /** What `requestPermission()` turns an askable permission into. Default `"granted"`. */
  requestResult?: "granted" | "denied";
  /** Whether `enable()` can show a dialog, as on Android. Default true. */
  canEnable?: boolean;
  /** What the user answers to `enable()`. Default `"accept"`, which turns the radio on. */
  enableResult?: "accept" | "refuse";
  /** The GATT services of devices, by id (or later with `setGatt()`). Unknown devices connect with none. */
  gatt?: Record<string, MockService[]>;
  /** The largest MTU the devices agree to. Default 247. */
  maxMtu?: number;
  /** `false` has no `bond()`, as on iOS. Default true. */
  bond?: boolean;
}

export interface MockBluetoothAdapter extends BluetoothAdapter {
  /** Changes the radio's state and notifies every subscriber, as the platform would. */
  setState(state: BluetoothState): void;
  setPermission(
    status: PermissionStatus,
    options?: { canAskAgain?: boolean },
  ): void;
  /** Active state subscriptions: the hooks share one per adapter. */
  readonly stateSubscriberCount: number;
  /** How many times `requestPermission()` was called. */
  readonly requestCount: number;
  /** How many times `enable()` was called. */
  readonly enableCount: number;
  /**
   * Reports a device to the running scan, as an advertisement would; dropped
   * (returns false) when the scan filters by services it does not advertise.
   * Throws when no scan runs: the platform would report nothing.
   */
  discover(device?: BluetoothDeviceOverrides): boolean;
  /** Ends the running scan with a failure, as the platform would. */
  failScan(error: BluetoothError | BluetoothErrorCode): void;
  /** Makes the next `startScan()` reject. */
  failNextScan(error: BluetoothError | BluetoothErrorCode): void;
  /** The running scan's request; `null` when none runs. */
  readonly scanning: BluetoothScanRequest | null;
  /** How many scans were started. */
  readonly scanCount: number;

  /** Sets a device's services, as found by `discoverServices()`. */
  setGatt(deviceId: string, services: MockService[]): void;
  /**
   * Sends a value on a characteristic, as the device would; delivered (and
   * true) only while notifications are on for it.
   */
  notify(
    deviceId: string,
    service: string,
    characteristic: string,
    value: Uint8Array | number[],
  ): boolean;
  /** Drops a connection, as a device going out of range would. */
  disconnectBySystem(deviceId: string): void;
  /** Makes the next `connect()` reject. */
  failNextConnect(error: BluetoothError | BluetoothErrorCode): void;
  /** Makes the next `connect()` never settle, as iOS for a device that is not there. */
  holdNextConnect(): void;
  /** Makes the next read, write, notification start, MTU, RSSI or bond call reject. */
  failNextGatt(error: BluetoothError | BluetoothErrorCode): void;
  /** The connected devices. */
  readonly connected: ReadonlySet<string>;
  /** `"<device>/<service>/<characteristic>"` with notifications on. */
  readonly notifying: ReadonlySet<string>;
  /** Every write, oldest first. */
  readonly writes: readonly MockWrite[];
  /** The devices `bond()` paired with. */
  readonly bonded: ReadonlySet<string>;
  /** How many connections were attempted. */
  readonly connectCount: number;
}

// As the other mocks: only an undetermined permission can be asked by default.
function toPermission(
  status: PermissionStatus,
  canAskAgain?: boolean,
): PermissionState {
  return { status, canAskAgain: canAskAgain ?? status === "undetermined" };
}

/**
 * An in-memory `BluetoothAdapter`. Inject it with
 * `<DeviceAdaptersProvider adapters={{ bluetooth: adapter }}>` and drive it
 * from the test: `adapter.setState("off")`, `adapter.setPermission("denied")`.
 * The hooks share state per adapter, so create one per test.
 */
export function createMockBluetoothAdapter(
  options: MockBluetoothOptions = {},
): MockBluetoothAdapter {
  const supported = options.supported ?? true;
  const requestResult = options.requestResult ?? "granted";
  let state: BluetoothState = supported
    ? (options.state ?? "on")
    : "unsupported";
  let permission = toPermission(
    supported ? (options.permission ?? "undetermined") : "unsupported",
  );
  let requestCount = 0;
  let enableCount = 0;
  let scan: {
    request: BluetoothScanRequest;
    handlers: BluetoothScanHandlers;
  } | null = null;
  let nextScanError: BluetoothError | null = null;
  let scanCount = 0;
  const gatt = new Map<string, MockService[]>(
    Object.entries(options.gatt ?? {}),
  );
  const values = new Map<string, Uint8Array>();
  const connected = new Set<string>();
  const notifying = new Set<string>();
  const bonded = new Set<string>();
  const writes: MockWrite[] = [];
  const valueListeners = new Set<(event: BluetoothValueEvent) => void>();
  const disconnectListeners = new Set<(deviceId: string) => void>();
  let nextConnect: BluetoothError | "hold" | null = null;
  let nextGattError: BluetoothError | null = null;
  let connectCount = 0;

  const keyOf = (deviceId: string, service: string, characteristic: string) =>
    `${deviceId}/${toBluetoothUuid(service)}/${toBluetoothUuid(characteristic)}`;

  function services(deviceId: string): BluetoothService[] {
    return (gatt.get(deviceId) ?? []).map((service) => {
      const uuid = toBluetoothUuid(service.uuid);
      return {
        uuid,
        characteristics: service.characteristics.map((characteristic) => ({
          uuid: toBluetoothUuid(characteristic.uuid),
          service: uuid,
          properties: {
            read: true,
            write: false,
            writeWithoutResponse: false,
            notify: false,
            indicate: false,
            ...characteristic.properties,
          },
        })),
      };
    });
  }

  /** The connected device's characteristic, after any failure set for the next call. */
  function characteristicOf(
    deviceId: string,
    service: string,
    characteristic: string,
  ) {
    if (!connected.has(deviceId)) {
      throw new BluetoothError("not-connected");
    }
    takeGattError();
    const found = services(deviceId)
      .find((s) => s.uuid === service)
      ?.characteristics.find((c) => c.uuid === characteristic);
    if (!found) {
      throw new BluetoothError(
        "failed",
        `Characteristic ${characteristic} not found.`,
      );
    }
    return found;
  }

  function takeGattError() {
    if (nextGattError) {
      const error = nextGattError;
      nextGattError = null;
      throw error;
    }
  }

  function initialValue(
    deviceId: string,
    service: string,
    characteristic: string,
  ) {
    const spec = (gatt.get(deviceId) ?? [])
      .find((s) => toBluetoothUuid(s.uuid) === service)
      ?.characteristics.find((c) => toBluetoothUuid(c.uuid) === characteristic);
    return Uint8Array.from(spec?.value ?? []);
  }

  function drop(deviceId: string) {
    connected.delete(deviceId);
    for (const key of [...notifying]) {
      if (key.startsWith(`${deviceId}/`)) notifying.delete(key);
    }
    [...disconnectListeners].forEach((listener) => listener(deviceId));
  }
  const stateListeners = new Set<(state: BluetoothState) => void>();

  const adapter: MockBluetoothAdapter = {
    isSupported: () => supported,
    getState: async () => state,
    subscribeState(listener) {
      stateListeners.add(listener);
      return () => {
        stateListeners.delete(listener);
      };
    },
    canEnable: () => supported && (options.canEnable ?? true),
    async enable() {
      enableCount++;
      if (!adapter.canEnable()) {
        throw new Error(
          "MockBluetoothAdapter: enable() where canEnable() is false. The hook checks it first.",
        );
      }
      if ((options.enableResult ?? "accept") === "refuse") return false;
      adapter.setState("on");
      return true;
    },
    getPermission: async () => ({ ...permission }),
    async requestPermission() {
      requestCount++;
      if (permission.status !== "granted" && permission.canAskAgain) {
        permission = toPermission(requestResult, false);
      }
      return { ...permission };
    },
    async startScan(request, handlers) {
      if (nextScanError) {
        const error = nextScanError;
        nextScanError = null;
        throw error;
      }
      scanCount++;
      scan = { request: { services: [...request.services] }, handlers };
    },
    async stopScan() {
      scan = null;
    },

    connect(deviceId) {
      connectCount++;
      const next = nextConnect;
      nextConnect = null;
      if (next === "hold") return new Promise<void>(() => {});
      if (next) return Promise.reject(next);
      connected.add(deviceId);
      return Promise.resolve();
    },
    async disconnect(deviceId) {
      if (connected.has(deviceId)) drop(deviceId);
    },
    async discoverServices(deviceId) {
      if (!connected.has(deviceId)) throw new BluetoothError("not-connected");
      return services(deviceId);
    },
    async read(deviceId, service, characteristic) {
      const found = characteristicOf(deviceId, service, characteristic);
      if (!found.properties.read) {
        throw new BluetoothError(
          "failed",
          "The characteristic is not readable.",
        );
      }
      const key = keyOf(deviceId, service, characteristic);
      return Uint8Array.from(
        values.get(key) ?? initialValue(deviceId, service, characteristic),
      );
    },
    async write(deviceId, service, characteristic, value, { withResponse }) {
      const found = characteristicOf(deviceId, service, characteristic);
      const allowed = withResponse
        ? found.properties.write
        : found.properties.writeWithoutResponse;
      if (!allowed) {
        throw new BluetoothError(
          "failed",
          `The characteristic does not allow writes ${withResponse ? "with" : "without"} response.`,
        );
      }
      const copy = Uint8Array.from(value);
      writes.push({
        deviceId,
        service,
        characteristic,
        value: copy,
        withResponse,
      });
      values.set(keyOf(deviceId, service, characteristic), copy);
    },
    async startNotifications(deviceId, service, characteristic) {
      const found = characteristicOf(deviceId, service, characteristic);
      if (!found.properties.notify && !found.properties.indicate) {
        throw new BluetoothError(
          "failed",
          "The characteristic does not notify.",
        );
      }
      notifying.add(keyOf(deviceId, service, characteristic));
    },
    async stopNotifications(deviceId, service, characteristic) {
      notifying.delete(keyOf(deviceId, service, characteristic));
    },
    subscribeValues(listener) {
      valueListeners.add(listener);
      return () => {
        valueListeners.delete(listener);
      };
    },
    subscribeDisconnects(listener) {
      disconnectListeners.add(listener);
      return () => {
        disconnectListeners.delete(listener);
      };
    },
    async requestMtu(deviceId, mtu) {
      if (!connected.has(deviceId)) throw new BluetoothError("not-connected");
      takeGattError();
      return Math.min(mtu, options.maxMtu ?? 247);
    },
    async readRssi(deviceId) {
      if (!connected.has(deviceId)) throw new BluetoothError("not-connected");
      takeGattError();
      return -55;
    },

    setState(next) {
      state = next;
      // The radio going off ends the platform's scan.
      if (next !== "on") scan = null;
      [...stateListeners].forEach((listener) => listener(state));
    },
    setPermission(status, extra = {}) {
      permission = toPermission(status, extra.canAskAgain);
    },
    get stateSubscriberCount() {
      return stateListeners.size;
    },
    get requestCount() {
      return requestCount;
    },
    get enableCount() {
      return enableCount;
    },
    discover(device = {}) {
      if (!scan) {
        throw new Error(
          "MockBluetoothAdapter: no scan runs, so the platform would report nothing. Start one first.",
        );
      }
      const found = buildBluetoothDevice(device);
      const { services } = scan.request;
      if (
        services.length > 0 &&
        !found.advertisement.serviceUuids.some((uuid) =>
          services.includes(uuid),
        )
      ) {
        return false;
      }
      scan.handlers.onDevice(found);
      return true;
    },
    failScan(error) {
      const running = scan;
      scan = null;
      running?.handlers.onStop(toError(error));
    },
    failNextScan(error) {
      nextScanError = toError(error);
    },
    get scanning() {
      return scan ? { services: [...scan.request.services] } : null;
    },
    get scanCount() {
      return scanCount;
    },

    setGatt(deviceId, list) {
      gatt.set(deviceId, list);
    },
    notify(deviceId, service, characteristic, value) {
      const key = keyOf(deviceId, service, characteristic);
      if (!notifying.has(key)) return false;
      const event: BluetoothValueEvent = {
        deviceId,
        service: toBluetoothUuid(service),
        characteristic: toBluetoothUuid(characteristic),
        value: Uint8Array.from(value),
      };
      values.set(key, event.value);
      [...valueListeners].forEach((listener) => listener(event));
      return true;
    },
    disconnectBySystem(deviceId) {
      if (connected.has(deviceId)) drop(deviceId);
    },
    failNextConnect(error) {
      nextConnect = toError(error);
    },
    holdNextConnect() {
      nextConnect = "hold";
    },
    failNextGatt(error) {
      nextGattError = toError(error);
    },
    get connected() {
      return new Set(connected);
    },
    get notifying() {
      return new Set(notifying);
    },
    get writes() {
      return [...writes];
    },
    get bonded() {
      return new Set(bonded);
    },
    get connectCount() {
      return connectCount;
    },
  };
  // Assigned, not spread into the literal: Babel's object spread would copy
  // the getters above as values, frozen at creation.
  if (options.bond !== false) {
    adapter.bond = async (deviceId: string) => {
      if (!connected.has(deviceId)) throw new BluetoothError("not-connected");
      takeGattError();
      bonded.add(deviceId);
    };
  }
  return adapter;
}
