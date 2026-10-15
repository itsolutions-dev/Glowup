import type { BluetoothAdapter, BluetoothState } from "../bluetooth/types";
import type { PermissionState, PermissionStatus } from "../core/types";

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

    setState(next) {
      state = next;
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
  };
  return adapter;
}
