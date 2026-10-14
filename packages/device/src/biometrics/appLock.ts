import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useSyncExternalStore,
} from "react";
import { AppState, type AppStateStatus } from "react-native";

import type { Unsubscribe } from "../core/types";
import { promptSession, type PromptSession } from "../core/promptSession";
import { systemSheet, type SystemSheet } from "../core/systemSheet";
import { useBiometrics, useBiometricsAdapter } from "./hooks";
import type {
  AuthenticateOptions,
  BiometricResult,
  BiometricsAdapter,
} from "./types";

interface Registration {
  enabled: boolean;
  relockAfter: number;
  stayLocked: boolean;
}

/** What every mounted `useAppLock` asked for, the strictest winning. */
interface LockConfig {
  enabled: boolean;
  relockAfter: number;
  stayLocked: boolean;
}

interface LockState {
  locked: boolean;
  /** Bumped by every lock: an automatic prompt is owed once per lock. */
  lockId: number;
  /** False while the app is in the background. */
  isActive: boolean;
  config: LockConfig;
}

interface AppLockStore {
  getSnapshot(): LockState;
  subscribe(listener: () => void): Unsubscribe;
  /** Adds a hook's options; the returned function removes them. */
  register(id: string, registration: Registration): () => void;
  lock(): void;
  unlock(): void;
  /** True once per lock: the caller may show the automatic prompt. */
  claimPrompt(lockId: number): boolean;
}

const NO_CONFIG: LockConfig = {
  enabled: false,
  relockAfter: Infinity,
  stayLocked: false,
};

// Cold start: locked until the owner proves they are there.
const INITIAL_STATE: LockState = {
  locked: true,
  lockId: 1,
  isActive: true,
  config: NO_CONFIG,
};

function sameConfig(a: LockConfig, b: LockConfig): boolean {
  return (
    a.enabled === b.enabled &&
    a.relockAfter === b.relockAfter &&
    a.stayLocked === b.stayLocked
  );
}

function createAppLockStore(
  session: PromptSession,
  sheet: SystemSheet,
): AppLockStore {
  let state = INITIAL_STATE;
  let backgroundAt: number | null = null;
  let promptedLockId = 0;
  let subscription: { remove(): void } | null = null;
  const registrations = new Map<string, Registration>();
  const listeners = new Set<() => void>();

  function set(patch: Partial<LockState>) {
    const next = { ...state, ...patch };
    if (
      next.locked === state.locked &&
      next.lockId === state.lockId &&
      next.isActive === state.isActive &&
      sameConfig(next.config, state.config)
    ) {
      return;
    }
    state = next;
    listeners.forEach((listener) => listener());
  }

  function effectiveConfig(): LockConfig {
    let config = NO_CONFIG;
    for (const registration of registrations.values()) {
      if (!registration.enabled) continue;
      config = {
        enabled: true,
        relockAfter: Math.min(config.relockAfter, registration.relockAfter),
        stayLocked: config.stayLocked || registration.stayLocked,
      };
    }
    return config;
  }

  // "inactive" is ignored on purpose: Face ID's own prompt goes through it,
  // and locking there would lock the app again behind the prompt.
  function onAppStateChange(next: AppStateStatus) {
    if (next === "background") {
      // A prompt can take the app to the background (Android pauses the
      // activity behind the device-credential screen), and so can a system
      // sheet such as the media picker: such a trip never counts, or a
      // successful unlock (or a picked photo) would lock the app again.
      backgroundAt = session.isRunning() || sheet.isOpen() ? null : Date.now();
      set({ isActive: false });
    } else if (next === "active") {
      const since = backgroundAt;
      backgroundAt = null;
      const { enabled, relockAfter } = state.config;
      const relock =
        enabled && since !== null && Date.now() - since >= relockAfter;
      set(
        relock
          ? { isActive: true, locked: true, lockId: state.lockId + 1 }
          : { isActive: true },
      );
    }
  }

  return {
    getSnapshot: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    register(id, registration) {
      if (!subscription) {
        subscription = AppState.addEventListener("change", onAppStateChange);
        set({ isActive: AppState.currentState !== "background" });
      }
      registrations.set(id, registration);
      set({ config: effectiveConfig() });
      return () => {
        registrations.delete(id);
        if (registrations.size === 0) {
          subscription?.remove();
          subscription = null;
          backgroundAt = null;
        }
        set({ config: effectiveConfig() });
      };
    },
    lock: () => set({ locked: true, lockId: state.lockId + 1 }),
    unlock: () => set({ locked: false }),
    claimPrompt(lockId) {
      if (promptedLockId === lockId) return false;
      promptedLockId = lockId;
      return true;
    },
  };
}

const lockStores = new WeakMap<BiometricsAdapter, AppLockStore>();

function getLockStore(adapter: BiometricsAdapter): AppLockStore {
  let store = lockStores.get(adapter);
  if (!store) {
    store = createAppLockStore(promptSession, systemSheet);
    lockStores.set(adapter, store);
  }
  return store;
}

const getServerState = () => INITIAL_STATE;

export interface AppLockOptions {
  /** Default true. A disabled lock never locks; `unlock()` still prompts. */
  enabled?: boolean;
  /**
   * How long the app may stay in the background before it locks, in ms.
   * Default 0: as soon as it leaves. On Android a permission dialog, a share
   * sheet or another app's picker also sends the app to the background; the
   * package's own prompts and `/media-picker` do not count.
   */
  relockAfter?: number;
  /** The prompt `unlock()` shows. */
  prompt: AuthenticateOptions;
  /**
   * Show the prompt by itself when the app locks (and at a cold start).
   * Default false: the app shows its lock screen with an unlock button.
   * Never more than once per lock, so a cancel is not asked again until the
   * next one.
   */
  promptOnLock?: boolean;
  /**
   * What a device with nothing to authenticate with does (no lock screen,
   * or no biometrics with `prompt.fallback: "none"`). `unlock` (default):
   * the lock opens, since it could never close again; `isLockable` says it
   * protects nothing. `stay-locked`: it stays shut; tell the user why.
   */
  whenUnavailable?: "unlock" | "stay-locked";
}

export interface UseAppLock {
  /**
   * True at a cold start and after a trip to the background longer than
   * `relockAfter`, until `unlock()` succeeds. Also true while the status
   * loads (and in a statically exported page's HTML).
   */
  isLocked: boolean;
  /** The device can prompt for this lock's `prompt`. */
  isLockable: boolean;
  /** The biometric status is not known yet. */
  isLoading: boolean;
  /** A prompt is open (this lock's or any other). */
  isAuthenticating: boolean;
  /** Shows the prompt; the lock opens on success. */
  unlock(): Promise<BiometricResult>;
  lock(): void;
}

/**
 * A lock over the whole app, opened by the device owner. Every component
 * that calls it shares one state; the strictest options win (enabled if any
 * is, the shortest `relockAfter`, `stay-locked` if any asks). It decides
 * when the app is locked; drawing the lock screen is the app's job.
 */
export function useAppLock({
  enabled = true,
  relockAfter = 0,
  prompt,
  promptOnLock = false,
  whenUnavailable = "unlock",
}: AppLockOptions): UseAppLock {
  const adapter = useBiometricsAdapter();
  const store = getLockStore(adapter);
  const biometrics = useBiometrics();
  const state = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    getServerState,
  );
  const id = useId();

  useEffect(
    () =>
      store.register(id, {
        enabled,
        relockAfter,
        stayLocked: whenUnavailable === "stay-locked",
      }),
    [store, id, enabled, relockAfter, whenUnavailable],
  );

  // The prompt is usually an inline literal: read the latest one when
  // unlocking instead of making `unlock` change identity every render.
  const promptRef = useRef(prompt);
  useEffect(() => {
    promptRef.current = prompt;
  });

  const { authenticate } = biometrics;
  const unlock = useCallback(async () => {
    const result = await authenticate(promptRef.current);
    if (result.success) store.unlock();
    return result;
  }, [authenticate, store]);
  const lock = useCallback(() => store.lock(), [store]);

  const isLoading = biometrics.isLoading;
  const isLockable =
    biometrics.isSupported &&
    !isLoading &&
    (prompt.fallback === "none"
      ? biometrics.isEnrolled
      : biometrics.level !== "none");
  const isEnabled = enabled || state.config.enabled;
  const stayLocked =
    whenUnavailable === "stay-locked" || state.config.stayLocked;
  const isLocked =
    isEnabled && state.locked && (isLoading || isLockable || stayLocked);

  const { isActive, lockId } = state;
  useEffect(() => {
    if (!promptOnLock || !isLocked || !isLockable || !isActive) return;
    if (!store.claimPrompt(lockId)) return;
    unlock().catch((error: unknown) => console.error(error));
  }, [promptOnLock, isLocked, isLockable, isActive, lockId, store, unlock]);

  return {
    isLocked,
    isLockable,
    isLoading,
    isAuthenticating: biometrics.isAuthenticating,
    unlock,
    lock,
  };
}
