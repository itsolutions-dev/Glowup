import { useCallback, useSyncExternalStore } from "react";
import { AppState } from "react-native";

import { useDeviceAdapter } from "../core/adapters";
import {
  createLiveStore,
  useLiveValue,
  type LiveStore,
} from "../core/liveStore";
import { promptSession } from "../core/promptSession";
import { getOrCreate, useClientValue } from "../core/shared";
import { expoBiometricsAdapter } from "./expo";
import { UNAVAILABLE_BIOMETRICS } from "./status";
import type {
  AuthenticateOptions,
  BiometricResult,
  BiometricStatus,
  BiometricsAdapter,
} from "./types";

// Unsupported on web: a WebAuthn gate needs a credential per user, which is
// the app's own authentication, not a device capability.
const defaultBiometricsAdapter = expoBiometricsAdapter;

/** The provided adapter, or the platform's default. */
export function useBiometricsAdapter(): BiometricsAdapter {
  return useDeviceAdapter("biometrics") ?? defaultBiometricsAdapter;
}

const UNSUPPORTED: BiometricResult = { success: false, error: "unsupported" };
const BUSY: BiometricResult = { success: false, error: "busy" };

const stores = new WeakMap<BiometricsAdapter, LiveStore<BiometricStatus>>();

/**
 * The status, read on first use and again whenever the app returns to the
 * foreground: the user may have enrolled a finger in the settings meanwhile.
 */
function getStore(adapter: BiometricsAdapter): LiveStore<BiometricStatus> {
  return getOrCreate(stores, adapter, () => {
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
    return createLiveStore({
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
  });
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
  /** A system prompt is open: this hook's, another component's or a protected secure-store item's. */
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

/**
 * Local authentication: the device owner proves they are present with a
 * fingerprint, a face or (by default) the device passcode. A gate in the
 * app, not authentication to a server: a rooted device can skip it, and the
 * result proves nothing to a backend.
 */
export function useBiometrics(): UseBiometrics {
  const adapter = useBiometricsAdapter();
  const store = getStore(adapter);
  const status = useLiveValue(store);
  const isSupported = useClientValue(() => adapter.isSupported(), false);
  const isAuthenticating = useSyncExternalStore(
    promptSession.subscribe,
    promptSession.isRunning,
    getServerFalse,
  );

  const authenticate = useCallback(
    async (options: AuthenticateOptions): Promise<BiometricResult> => {
      assertLabel("promptMessage", options.promptMessage);
      assertLabel("cancelLabel", options.cancelLabel);
      if (!adapter.isSupported()) return UNSUPPORTED;
      return promptSession.run(BUSY, async () => {
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
    [adapter, store],
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
