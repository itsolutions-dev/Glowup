import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { AppState, Platform } from "react-native";

import { useDeviceAdapter } from "../core/adapters";
import { promptSession } from "../core/promptSession";
import type { Unsubscribe } from "../core/types";
import {
  assertValidKey,
  assertValidValue,
  isProtectedAccessError,
  SecureStoreError,
  toSecureStoreError,
} from "./errors";
import { expoSecureStoreAdapter } from "./expo";
import type {
  AdapterProtectedOptions,
  ProtectedOptions,
  ProtectedReadResult,
  ProtectedWriteResult,
  SecureStoreAdapter,
  SecureStoreOptions,
} from "./types";
import { webSecureStoreAdapter } from "./web";

const defaultSecureStoreAdapter =
  Platform.OS === "web" ? webSecureStoreAdapter : expoSecureStoreAdapter;

/** What a `useSecureValue` reads. */
export type SecureValueState =
  | { status: "loading" }
  | { status: "ready"; value: string | null }
  | { status: "error"; error: SecureStoreError };

const LOADING: SecureValueState = { status: "loading" };

interface ValueStore {
  getSnapshot(): SecureValueState;
  subscribe(listener: () => void): Unsubscribe;
  /** Reads the platform again. */
  refresh(): Promise<void>;
  /** A write made through the package: every reader sees it at once. */
  set(value: string | null): void;
}

/**
 * One store per adapter, service and key, shared by every reader: a value
 * written through `useSecureStore` or a `useSecureValue` reaches them all.
 */
const registries = new WeakMap<SecureStoreAdapter, Map<string, ValueStore>>();

const storeId = (key: string, service?: string) =>
  `${service ?? ""}\u0000${key}`;

function createValueStore(
  adapter: SecureStoreAdapter,
  key: string,
  service: string | undefined,
): ValueStore {
  let state = LOADING;
  // Last call wins: a slow read must not overwrite a newer write.
  let sequence = 0;
  const listeners = new Set<() => void>();
  const emit = (next: SecureValueState) => {
    state = next;
    listeners.forEach((listener) => listener());
  };

  const refresh = async () => {
    const id = ++sequence;
    let next: SecureValueState;
    try {
      const value = adapter.isSupported()
        ? await adapter.getItem(key, { service })
        : null;
      next = adapter.isSupported()
        ? { status: "ready", value }
        : { status: "error", error: new SecureStoreError("unsupported") };
    } catch (error) {
      next = { status: "error", error: toSecureStoreError(error) };
    }
    if (id !== sequence) return;
    if (
      next.status === "ready" &&
      state.status === "ready" &&
      next.value === state.value
    ) {
      return;
    }
    emit(next);
  };

  return {
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener);
      if (listeners.size === 1 && state.status !== "ready") {
        refresh().catch(() => {});
      }
      return () => {
        listeners.delete(listener);
      };
    },
    refresh,
    set(value) {
      sequence++;
      emit({ status: "ready", value });
    },
  };
}

function getValueStore(
  adapter: SecureStoreAdapter,
  key: string,
  service: string | undefined,
): ValueStore {
  let registry = registries.get(adapter);
  if (!registry) {
    registry = new Map();
    registries.set(adapter, registry);
  }
  const id = storeId(key, service);
  let store = registry.get(id);
  if (!store) {
    store = createValueStore(adapter, key, service);
    registry.set(id, store);
  }
  return store;
}

/** Tells the readers of an item, if any, what was just written. */
function notify(
  adapter: SecureStoreAdapter,
  key: string,
  service: string | undefined,
  value: string | null,
) {
  registries.get(adapter)?.get(storeId(key, service))?.set(value);
}

export interface UseSecureStore {
  /** False on web, and while a statically exported page hydrates. */
  isSupported: boolean;
  /** `null` when there is no such item. */
  get(key: string, options?: SecureStoreOptions): Promise<string | null>;
  set(key: string, value: string, options?: SecureStoreOptions): Promise<void>;
  /** Resolves when there is no such item too. */
  remove(key: string, options?: SecureStoreOptions): Promise<void>;
  /** `get` + `JSON.parse`; an unparsable item rejects `invalid-value`. */
  getJSON<T>(key: string, options?: SecureStoreOptions): Promise<T | null>;
  /** `JSON.stringify` + `set`. */
  setJSON(
    key: string,
    value: unknown,
    options?: SecureStoreOptions,
  ): Promise<void>;
  /**
   * Reads an item only the enrolled biometrics open: shows the system
   * prompt (no passcode fallback). Resolves every outcome as `{ status }`,
   * telling `invalidated` (the biometrics changed since it was written)
   * from `missing`; rejects only on an invalid key or an empty prompt.
   */
  getProtected(
    key: string,
    options: ProtectedOptions,
  ): Promise<ProtectedReadResult>;
  /** Writes one. Android shows the prompt for it; iOS does not. */
  setProtected(
    key: string,
    value: string,
    options: ProtectedOptions,
  ): Promise<ProtectedWriteResult>;
  /** Removes one, without a prompt. Rejects like `remove`. */
  removeProtected(
    key: string,
    options?: Omit<ProtectedOptions, "prompt">,
  ): Promise<void>;
}

const getServerFalse = () => false;
const subscribeNothing = () => () => {};

function useSecureStoreAdapter(): SecureStoreAdapter {
  return useDeviceAdapter("secureStore") ?? defaultSecureStoreAdapter;
}

/**
 * Each protected item gets a service of its own: on Android, writing an
 * item again after it was invalidated deletes every protected item of its
 * service, which must not take other secrets with it.
 */
const protectedService = (key: string, service?: string) =>
  `glowup.protected.${service ?? "default"}.${key}`;

/**
 * A plain item written beside each protected one, under its service. A
 * protected read that finds nothing while the marker is there means the
 * platform destroyed the item: both platforms report that as "no item".
 */
const MARKER = "glowup-protected-marker";

const BUSY = { status: "busy" } as const;
const UNSUPPORTED = { status: "unsupported" } as const;

function assertPrompt(prompt: unknown): void {
  if (typeof prompt !== "string" || prompt.length === 0) {
    throw new TypeError(
      "Protected items need a non-empty prompt (Android shows a blank title without one).",
    );
  }
}

function toFailure(error: unknown) {
  if (isProtectedAccessError(error)) {
    return { status: error.status, detail: error.message };
  }
  const normalised = toSecureStoreError(error);
  return {
    status: normalised.code === "locked" ? "locked" : "failed",
    detail: normalised.message,
  } as const;
}

async function run<T>(call: () => Promise<T>): Promise<T> {
  try {
    return await call();
  } catch (error) {
    throw toSecureStoreError(error);
  }
}

/**
 * The secure store: the Keychain on iOS, Keystore-encrypted storage on
 * Android. Every function rejects with a `SecureStoreError` (an invalid
 * key or value, `locked`, `unsupported`, `failed`) and is stable across
 * renders.
 */
export function useSecureStore(): UseSecureStore {
  const adapter = useSecureStoreAdapter();
  const getSupport = useCallback(() => adapter.isSupported(), [adapter]);
  const isSupported = useSyncExternalStore(
    subscribeNothing,
    getSupport,
    getServerFalse,
  );

  return useMemo(() => {
    const ensureSupported = () => {
      if (!adapter.isSupported()) throw new SecureStoreError("unsupported");
    };
    const get = (key: string, options: SecureStoreOptions = {}) =>
      run(async () => {
        assertValidKey(key);
        ensureSupported();
        return adapter.getItem(key, options);
      });
    const set = (
      key: string,
      value: string,
      options: SecureStoreOptions = {},
    ) =>
      run(async () => {
        assertValidKey(key);
        assertValidValue(value);
        ensureSupported();
        await adapter.setItem(key, value, options);
        notify(adapter, key, options.service, value);
      });
    const remove = (key: string, options: SecureStoreOptions = {}) =>
      run(async () => {
        assertValidKey(key);
        ensureSupported();
        await adapter.deleteItem(key, options);
        notify(adapter, key, options.service, null);
      });
    const protectedTarget = (
      key: string,
      { prompt, service }: ProtectedOptions,
    ): AdapterProtectedOptions => {
      assertValidKey(key);
      assertPrompt(prompt);
      return { prompt, service: protectedService(key, service) };
    };
    return {
      isSupported,
      get,
      set,
      remove,
      async getProtected(key, options) {
        const target = protectedTarget(key, options);
        if (!adapter.isSupported()) return UNSUPPORTED;
        return promptSession.run<ProtectedReadResult>(BUSY, async () => {
          let value: string | null;
          try {
            value = await adapter.getProtectedItem(key, target);
          } catch (error) {
            return toFailure(error);
          }
          if (value !== null) return { status: "ok", value };
          const marker = await adapter
            .getItem(MARKER, { service: target.service })
            .catch(() => null);
          return { status: marker === null ? "missing" : "invalidated" };
        });
      },
      async setProtected(key, value, options) {
        const target = protectedTarget(key, options);
        assertValidValue(value);
        if (!adapter.isSupported()) return UNSUPPORTED;
        return promptSession.run<ProtectedWriteResult>(BUSY, async () => {
          try {
            await adapter.setProtectedItem(key, value, target);
          } catch (error) {
            return toFailure(error);
          }
          // Without the marker an invalidation reads as "missing": a lost
          // marker costs that distinction, not the item.
          await adapter
            .setItem(MARKER, "1", { service: target.service })
            .catch(() => {});
          return { status: "ok" };
        });
      },
      removeProtected: (key, options = {}) =>
        run(async () => {
          assertValidKey(key);
          ensureSupported();
          const service = protectedService(key, options.service);
          await adapter.deleteItem(key, { service });
          await adapter.deleteItem(MARKER, { service });
        }),
      async getJSON<T>(key: string, options?: SecureStoreOptions) {
        const text = await get(key, options);
        if (text === null) return null;
        try {
          return JSON.parse(text) as T;
        } catch (error) {
          throw new SecureStoreError(
            "invalid-value",
            `The item "${key}" is not JSON.`,
            error,
          );
        }
      },
      async setJSON(key: string, value: unknown, options?: SecureStoreOptions) {
        let text: string | undefined;
        try {
          text = JSON.stringify(value);
        } catch (error) {
          throw new SecureStoreError(
            "invalid-value",
            "The value cannot be serialised to JSON.",
            error,
          );
        }
        // `undefined` (a function, a symbol) is not a string: `set` rejects it.
        await set(key, text as string, options);
      },
    };
  }, [adapter, isSupported]);
}

export interface UseSecureValue {
  /** `null` while loading, when there is no item, and on an error. */
  value: string | null;
  isLoading: boolean;
  error: SecureStoreError | null;
  /** Writes the item (with these options) and updates every reader. */
  set(value: string): Promise<void>;
  remove(): Promise<void>;
}

const getServerState = () => LOADING;

/**
 * One item, read on first use and shared by every component that reads the
 * same key and service. Writes made through the package reach every reader
 * at once; a failed read is tried again when the app returns to the
 * foreground (`locked` clears once the device is unlocked).
 */
export function useSecureValue(
  key: string,
  options: SecureStoreOptions = {},
): UseSecureValue {
  assertValidKey(key);
  const adapter = useSecureStoreAdapter();
  const { service, accessible, thisDeviceOnly } = options;
  const store = getValueStore(adapter, key, service);
  const state = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    getServerState,
  );
  const secureStore = useSecureStore();

  const failed = state.status === "error";
  useEffect(() => {
    if (!failed) return;
    const subscription = AppState.addEventListener("change", (next) => {
      if (next === "active") store.refresh().catch(() => {});
    });
    return () => subscription.remove();
  }, [failed, store]);

  const set = useCallback(
    (value: string) =>
      secureStore.set(key, value, { service, accessible, thisDeviceOnly }),
    [secureStore, key, service, accessible, thisDeviceOnly],
  );
  const remove = useCallback(
    () => secureStore.remove(key, { service }),
    [secureStore, key, service],
  );

  return {
    value: state.status === "ready" ? state.value : null,
    isLoading: state.status === "loading",
    error: state.status === "error" ? state.error : null,
    set,
    remove,
  };
}
