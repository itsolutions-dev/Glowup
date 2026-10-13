import {
  createPermissionStore,
  type PermissionStore,
} from "../core/permissionStore";
import type { LocationAdapter, LocationPermissionState } from "./types";

export const UNSUPPORTED_LOCATION: LocationPermissionState = {
  status: "unsupported",
  canAskAgain: false,
  precision: null,
};

export const UNKNOWN_LOCATION: LocationPermissionState = {
  status: "undetermined",
  canAskAgain: true,
  precision: null,
};

// One store per adapter, so every component sees the same answer.
const stores = new WeakMap<
  LocationAdapter,
  PermissionStore<LocationPermissionState>
>();

export function getPermissionStore(
  adapter: LocationAdapter,
): PermissionStore<LocationPermissionState> {
  let store = stores.get(adapter);
  if (!store) {
    store = createPermissionStore({
      isSupported: () => adapter.isSupported(),
      read: () => adapter.getPermission(),
      request: () => adapter.requestPermission(),
      unsupported: UNSUPPORTED_LOCATION,
      unknown: UNKNOWN_LOCATION,
    });
    stores.set(adapter, store);
  }
  return store;
}
