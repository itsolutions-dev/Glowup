import { Linking } from "react-native";

import { useDeviceAdapter } from "../core/adapters";
import {
  createLiveStore,
  useLiveValue,
  type LiveStore,
} from "../core/liveStore";
import { UNKNOWN, UNSUPPORTED } from "../core/permissions";
import {
  createPermissionStore,
  usePermissionSnapshot,
  type PermissionStore,
} from "../core/permissionStore";
import type { PermissionState } from "../core/types";
import { bleManagerAdapter } from "./bleManager";
import { BluetoothError } from "./errors";
import type { BluetoothAdapter, BluetoothState } from "./types";

export function useBluetoothAdapter(): BluetoothAdapter {
  return useDeviceAdapter("bluetooth") ?? bleManagerAdapter;
}

// One radio store and one permission store per adapter.
const stateStores = new WeakMap<BluetoothAdapter, LiveStore<BluetoothState>>();
const permissionStores = new WeakMap<
  BluetoothAdapter,
  PermissionStore<PermissionState>
>();

export function getStateStore(
  adapter: BluetoothAdapter,
): LiveStore<BluetoothState> {
  let store = stateStores.get(adapter);
  if (!store) {
    store = createLiveStore<BluetoothState>({
      isSupported: () => adapter.isSupported(),
      read: () => adapter.getState(),
      subscribe: (listener) => adapter.subscribeState(listener),
      unsupported: "unsupported",
    });
    stateStores.set(adapter, store);
  }
  return store;
}

export function getPermissionStore(
  adapter: BluetoothAdapter,
): PermissionStore<PermissionState> {
  let store = permissionStores.get(adapter);
  if (!store) {
    store = createPermissionStore({
      isSupported: () => adapter.isSupported(),
      read: () => adapter.getPermission(),
      async request() {
        const state = await adapter.requestPermission();
        // On iOS the request is what starts the radio's reports.
        getStateStore(adapter)
          .refresh()
          .catch(() => {});
        return state;
      },
      unsupported: UNSUPPORTED,
      unknown: UNKNOWN,
    });
    permissionStores.set(adapter, store);
  }
  return store;
}

/**
 * Support, then the permission, then the radio: what every operation on a
 * device needs. Rejects with the `BluetoothError` that says which is missing;
 * never prompts.
 */
export async function ensureBluetoothReady(
  adapter: BluetoothAdapter,
): Promise<void> {
  if (!adapter.isSupported()) throw new BluetoothError("unsupported");
  const permission = await getPermissionStore(adapter).refresh();
  if (permission.status === "unsupported") {
    throw new BluetoothError("unsupported");
  }
  if (permission.status !== "granted") {
    throw new BluetoothError(
      "permission-denied",
      permission.status === "undetermined"
        ? "The Bluetooth permission was not asked for yet: call request() from useBluetoothPermission() (on iOS, once in every launch: it shows nothing after the first answer)."
        : undefined,
    );
  }
  const state = await getStateStore(adapter).refresh();
  if (state === "unsupported") throw new BluetoothError("unsupported");
  if (state === "unauthorized") throw new BluetoothError("permission-denied");
  if (state !== "on") throw new BluetoothError("powered-off");
}

export interface UseBluetoothState {
  /** `unknown` until the first answer, and on iOS until the permission was asked for. */
  state: BluetoothState;
  isLoading: boolean;
  /** Whether `enable()` can ask the user to switch Bluetooth on (Android). */
  canEnable: boolean;
  /**
   * Shows Android's "turn on Bluetooth?" dialog. Resolves `true` when the
   * user accepted, `false` when they refused. Rejects with `unsupported` on
   * iOS and the web, and `permission-denied` without the permission
   * (Android 12 and later need it for the dialog).
   */
  enable: () => Promise<boolean>;
  /** Reads the state again; every component using the hook updates. */
  refresh: () => Promise<BluetoothState>;
}

/**
 * The Bluetooth radio, kept live: one platform subscription is shared by
 * every component that asks and closed when the last one unmounts.
 */
export function useBluetoothState(): UseBluetoothState {
  const adapter = useBluetoothAdapter();
  const store = getStateStore(adapter);
  const state = useLiveValue(store);

  return {
    state: state ?? "unknown",
    isLoading: state === null,
    canEnable: adapter.canEnable(),
    async enable() {
      if (!adapter.canEnable()) {
        throw new BluetoothError(
          "unsupported",
          "Only Android lets an app ask for Bluetooth to be switched on: tell the user where to switch it on.",
        );
      }
      const permission = await getPermissionStore(adapter).refresh();
      if (permission.status !== "granted") {
        throw new BluetoothError("permission-denied");
      }
      return adapter.enable();
    },
    refresh: store.refresh,
  };
}

export interface UseBluetoothPermission extends PermissionState {
  /** True until the first read answers. */
  isLoading: boolean;
  /**
   * Shows the system prompt when it can, and resolves with the answer. On
   * iOS, call it whenever a Bluetooth screen opens: the permission cannot be
   * read until it ran in this launch, and it shows nothing after the first
   * answer.
   */
  request: () => Promise<PermissionState>;
  refresh: () => Promise<PermissionState>;
  /** Opens the app's page in the system settings. */
  openSettings: () => Promise<void>;
}

/**
 * The Bluetooth permission (Android 12 and later: nearby devices; Android 11
 * and earlier: location), shared by every component that asks: a request
 * made in one updates them all.
 */
export function useBluetoothPermission(): UseBluetoothPermission {
  const store = getPermissionStore(useBluetoothAdapter());
  const state = usePermissionSnapshot(store);

  return {
    ...(state ?? UNKNOWN),
    isLoading: state === null,
    request: store.request,
    refresh: store.refresh,
    openSettings: () => Linking.openSettings(),
  };
}
