import { BluetoothError, type BluetoothErrorCode } from "../bluetooth/errors";
import type {
  BluetoothAdapter,
  BluetoothAdvertisement,
  BluetoothDevice,
  BluetoothScanHandlers,
  BluetoothScanRequest,
  BluetoothState,
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
  };
  return adapter;
}
