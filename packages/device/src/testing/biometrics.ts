import type {
  AuthenticateOptions,
  BiometricResult,
  BiometricStatus,
  BiometricsAdapter,
} from "../biometrics/types";

/** An iPhone with Face ID enrolled. */
export const MOCK_BIOMETRICS: BiometricStatus = {
  hasHardware: true,
  isEnrolled: true,
  types: ["face"],
  level: "biometric-strong",
};

export interface MockBiometricsOptions {
  supported?: boolean;
  status?: Partial<BiometricStatus>;
  /** What every prompt answers. Default `{ success: true }`. */
  result?: BiometricResult;
  /**
   * Leave prompts open until `resolve()` (or `cancel()`), to test what an
   * app shows meanwhile. Default false: they answer at once.
   */
  manual?: boolean;
}

export interface MockBiometricsAdapter extends BiometricsAdapter {
  /** The options of every prompt shown, in order. */
  readonly calls: readonly AuthenticateOptions[];
  /** Whether a manual prompt is waiting for `resolve()`. */
  readonly isPrompting: boolean;
  /** Answers the open manual prompt (default: the configured result). */
  resolve(result?: BiometricResult): void;
  setStatus(status: Partial<BiometricStatus>): void;
  setResult(result: BiometricResult): void;
}

/**
 * An in-memory `BiometricsAdapter`. Inject it with
 * `<DeviceAdaptersProvider adapters={{ biometrics }}>`.
 */
export function createMockBiometricsAdapter({
  supported = true,
  status: initialStatus,
  result: initialResult = { success: true },
  manual = false,
}: MockBiometricsOptions = {}): MockBiometricsAdapter {
  let status: BiometricStatus = { ...MOCK_BIOMETRICS, ...initialStatus };
  let result = initialResult;
  let pending: ((result: BiometricResult) => void) | null = null;
  const calls: AuthenticateOptions[] = [];
  const listeners = new Set<(status: BiometricStatus) => void>();

  const settle = (answer: BiometricResult) => {
    const done = pending;
    pending = null;
    done?.(answer);
  };

  return {
    isSupported: () => supported,
    getStatus: async () => status,
    authenticate(options) {
      calls.push(options);
      if (!manual) return Promise.resolve(result);
      return new Promise((resolve) => {
        pending = resolve;
      });
    },
    async cancel() {
      settle({ success: false, error: "cancelled" });
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    get calls() {
      return calls;
    },
    get isPrompting() {
      return pending !== null;
    },
    resolve(answer = result) {
      settle(answer);
    },
    setStatus(next) {
      status = { ...status, ...next };
      listeners.forEach((listener) => listener(status));
    },
    setResult(next) {
      result = next;
    },
  };
}
