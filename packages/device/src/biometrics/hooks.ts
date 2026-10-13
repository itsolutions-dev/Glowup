import { useCallback, useSyncExternalStore } from "react";
import { AppState, Platform } from "react-native";

import { useDeviceAdapter } from "../core/adapters";
import {
  createLiveStore,
  useLiveValue,
  type LiveStore,
} from "../core/liveStore";
import type { Unsubscribe } from "../core/types";
import { expoBiometricsAdapter } from "./expo";
import { UNAVAILABLE_BIOMETRICS } from "./status";
import type {
  AuthenticateOptions,
  BiometricResult,
  BiometricStatus,
  BiometricsAdapter,
} from "./types";
import { webBiometricsAdapter } from "./web";

const defaultBiometricsAdapter =
  Platform.OS === "web" ? webBiometricsAdapter : expoBiometricsAdapter;

const UNSUPPORTED: BiometricResult = { success: false, error: "unsupported" };
const BUSY: BiometricResult = { success: false, error: "busy" };

const stores = new WeakMap<BiometricsAdapter, LiveStore<BiometricStatus>>();

/**
 * The status, read on first use and again whenever the app returns to the
 * foreground: the user may have enrolled a finger in the settings meanwhile.
 */
function getStore(adapter: BiometricsAdapter): LiveStore<BiometricStatus> {
  let store = stores.get(adapter);
  if (!store) {
    // The store compares shallowly: keep the last `types` array while its
    // contents are equal, or every foreground would re-render the listeners.
    let lastTypes: BiometricStatus["types"] = [];
    const stable = (status: BiometricStatus): BiometricStatus => {
      const same =
        status.types.length === lastTypes.length &&
        status.types.every((type, index) => type === lastTypes[index]);
      if (same) return { ...status, types: lastTypes };
      lastTypes = status.types;
      return status;
    };
    const read = () => adapter.getStatus().then(stable);
    store = createLiveStore({
      isSupported: () => adapter.isSupported(),
      read,
      subscribe(listener) {
        const subscription = AppState.addEventListener("change", (next) => {
          if (next === "active") read().then(listener, () => {});
        });
        const stop = adapter.subscribe?.((status) => listener(stable(status)));
        return () => {
          subscription.remove();
          stop?.();
        };
      },
      unsupported: UNAVAILABLE_BIOMETRICS,
    });
    stores.set(adapter, store);
  }
  return store;
}

interface Session {
  isRunning(): boolean;
  subscribe(listener: () => void): Unsubscribe;
  run(call: () => Promise<BiometricResult>): Promise<BiometricResult>;
}

const sessions = new WeakMap<BiometricsAdapter, Session>();

/**
 * One prompt at a time per adapter, whichever component asks: Android
 * answers a second call with `app_cancel` and iOS starts a second
 * evaluation, so a double tap must be refused here, as `busy`.
 */
function getSession(adapter: BiometricsAdapter): Session {
  let session = sessions.get(adapter);
  if (!session) {
    let running = false;
    const listeners = new Set<() => void>();
    const set = (next: boolean) => {
      running = next;
      listeners.forEach((listener) => listener());
    };
    session = {
      isRunning: () => running,
      subscribe(listener) {
        listeners.add(listener);
        return () => {
          listeners.delete(listener);
        };
      },
      async run(call) {
        if (running) return BUSY;
        set(true);
        try {
          return await call();
        } finally {
          set(false);
        }
      },
    };
    sessions.set(adapter, session);
  }
  return session;
}

function assertLabel(name: string, value: unknown): void {
  if (typeof value !== "string" || value.length === 0) {
    throw new TypeError(
      `authenticate(): ${name} must be a non-empty string (the platform default is English).`,
    );
  }
}

export interface UseBiometrics extends BiometricStatus {
  /** False on web, and while a statically exported page hydrates. */
  isSupported: boolean;
  /** True until the first status answer (every field reads absent). */
  isLoading: boolean;
  /** A prompt is open, from this component or any other. */
  isAuthenticating: boolean;
  /**
   * Shows the system prompt. Resolves with the outcome, never rejects for
   * one (a cancel is an outcome); rejects only on a programming error, an
   * empty `promptMessage` or `cancelLabel`. While a prompt is open another
   * call resolves `busy` at once.
   */
  authenticate(options: AuthenticateOptions): Promise<BiometricResult>;
  /** Dismisses the open prompt (Android; iOS cannot), which then resolves `cancelled`. */
  cancel(): Promise<void>;
}

const getServerFalse = () => false;
const subscribeNothing = () => () => {};

/**
 * Local authentication: the device owner proves they are present with a
 * fingerprint, a face or (by default) the device passcode. A gate in the
 * app, not authentication to a server: a rooted device can skip it, and the
 * result proves nothing to a backend.
 */
export function useBiometrics(): UseBiometrics {
  const adapter = useDeviceAdapter("biometrics") ?? defaultBiometricsAdapter;
  const store = getStore(adapter);
  const session = getSession(adapter);
  const status = useLiveValue(store);
  const getSupport = useCallback(() => adapter.isSupported(), [adapter]);
  const isSupported = useSyncExternalStore(
    subscribeNothing,
    getSupport,
    getServerFalse,
  );
  const isAuthenticating = useSyncExternalStore(
    session.subscribe,
    session.isRunning,
    getServerFalse,
  );

  const authenticate = useCallback(
    async (options: AuthenticateOptions): Promise<BiometricResult> => {
      assertLabel("promptMessage", options.promptMessage);
      assertLabel("cancelLabel", options.cancelLabel);
      if (!adapter.isSupported()) return UNSUPPORTED;
      return session.run(async () => {
        const result = await adapter
          .authenticate(options)
          .catch((error: unknown): BiometricResult => ({
            success: false,
            error: "failed",
            detail: error instanceof Error ? error.message : String(error),
          }));
        // The prompt found what the status may not show yet.
        if (
          !result.success &&
          (result.error === "not-enrolled" || result.error === "unavailable")
        ) {
          store.refresh().catch(() => {});
        }
        return result;
      });
    },
    [adapter, session, store],
  );

  const cancel = useCallback(
    () => (adapter.isSupported() ? adapter.cancel() : Promise.resolve()),
    [adapter],
  );

  return {
    ...(status ?? UNAVAILABLE_BIOMETRICS),
    isSupported,
    isLoading: status === null,
    isAuthenticating,
    authenticate,
    cancel,
  };
}
