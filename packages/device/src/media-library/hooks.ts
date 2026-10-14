import { useCallback, useSyncExternalStore } from "react";
import { Linking, Platform } from "react-native";

import { useDeviceAdapter } from "../core/adapters";
import {
  createPermissionStore,
  usePermissionSnapshot,
  type PermissionStore,
} from "../core/permissionStore";
import { UNKNOWN, UNSUPPORTED } from "../core/permissions";
import type { PermissionState } from "../core/types";
import { expoMediaLibraryAdapter } from "./expo";
import type { MediaLibraryAdapter, SaveResult } from "./types";
import { webMediaLibraryAdapter } from "./web";

const defaultMediaLibraryAdapter =
  Platform.OS === "web" ? webMediaLibraryAdapter : expoMediaLibraryAdapter;

const GRANTED: PermissionState = { status: "granted", canAskAgain: false };
const DENIED: SaveResult = { status: "denied" };
const UNSUPPORTED_SAVE: SaveResult = { status: "unsupported" };

const stores = new WeakMap<
  MediaLibraryAdapter,
  PermissionStore<PermissionState>
>();

function getPermissionStore(
  adapter: MediaLibraryAdapter,
): PermissionStore<PermissionState> {
  let store = stores.get(adapter);
  if (!store) {
    store = createPermissionStore({
      isSupported: () => adapter.isSupported(),
      read: () => adapter.getPermission(),
      request: () => adapter.requestPermission(),
      unsupported: UNSUPPORTED,
      unknown: UNKNOWN,
    });
    stores.set(adapter, store);
  }
  return store;
}

function toFailure(error: unknown): SaveResult {
  return { status: "failed", detail: String(error) };
}

const subscribeNothing = () => () => {};
const getServerValue = () => null;
const openSettings = () => Linking.openSettings();

export interface UseMediaLibrary extends PermissionState {
  /** `null` while a static page hydrates; `false` on the web. */
  isSupported: boolean | null;
  /**
   * Whether saving needs a permission here: iOS's add-only access, and
   * Android's storage permission before Android 11. Where it does not, the
   * permission reads `granted`. `null` while a static page hydrates.
   */
  isRequired: boolean | null;
  /** True until the first read answers. */
  isLoading: boolean;
  /** Shows the system prompt. `save()` does it by itself when needed. */
  request: () => Promise<PermissionState>;
  /** Re-reads it. The hook already does when the app returns to the foreground. */
  refresh: () => Promise<PermissionState>;
  /** Opens this app's page in the system settings, where a refusal is undone. */
  openSettings: () => Promise<void>;
  /**
   * Saves a local image or video (a `file://` URI, as the camera and the
   * picker return) to the device's photo library. Asks for the permission
   * first if it has never been asked (call it from the user's action);
   * resolves `denied` without a prompt once it was refused. Resolves every
   * outcome; rejects with a `TypeError` only for a missing URI.
   */
  save: (uri: string) => Promise<SaveResult>;
}

/** The device's photo library, `@its/glowup-device/media-library`. */
export function useMediaLibrary(): UseMediaLibrary {
  const adapter =
    useDeviceAdapter("mediaLibrary") ?? defaultMediaLibraryAdapter;
  const store = getPermissionStore(adapter);

  const getSupport = useCallback(() => adapter.isSupported(), [adapter]);
  const isSupported = useSyncExternalStore(
    subscribeNothing,
    getSupport,
    getServerValue,
  );
  const getRequired = useCallback(
    () => adapter.isSupported() && adapter.requiresPermission(),
    [adapter],
  );
  const isRequired = useSyncExternalStore(
    subscribeNothing,
    getRequired,
    getServerValue,
  );
  const state = usePermissionSnapshot(isRequired ? store : null);

  const save = useCallback(
    async (uri: string): Promise<SaveResult> => {
      if (typeof uri !== "string" || uri.length === 0) {
        throw new TypeError(
          "useMediaLibrary().save(): uri must be a non-empty string.",
        );
      }
      if (!adapter.isSupported()) return UNSUPPORTED_SAVE;
      if (adapter.requiresPermission()) {
        let permission = await store.refresh();
        if (permission.status !== "granted" && permission.canAskAgain) {
          permission = await store.request();
        }
        if (permission.status !== "granted") return DENIED;
      }
      try {
        return await adapter.save(uri);
      } catch (error) {
        return toFailure(error);
      }
    },
    [adapter, store],
  );

  const shared = { isSupported, isRequired, openSettings, save };
  if (isSupported === false) {
    return {
      ...UNSUPPORTED,
      ...shared,
      isLoading: false,
      request: async () => UNSUPPORTED,
      refresh: async () => UNSUPPORTED,
    };
  }
  if (isRequired === false) {
    return {
      ...GRANTED,
      ...shared,
      isLoading: false,
      request: async () => GRANTED,
      refresh: async () => GRANTED,
    };
  }
  return {
    ...(state ?? UNKNOWN),
    ...shared,
    isLoading: state === null,
    request: store.request,
    refresh: store.refresh,
  };
}
