import { act, renderHook, waitFor } from "@testing-library/react-native";
import * as LocalAuthentication from "expo-local-authentication";
import type { ReactNode } from "react";
import { AppState, Platform } from "react-native";
import { renderToString } from "react-dom/server";

import { DeviceAdaptersProvider } from "..";
import {
  expoBiometricsAdapter,
  useBiometrics,
  type AuthenticateOptions,
  type BiometricsAdapter,
} from "../biometrics";
import { createMockBiometricsAdapter, MOCK_BIOMETRICS } from "../testing";

jest.mock("expo-local-authentication", () => ({
  SecurityLevel: { NONE: 0 },
  hasHardwareAsync: jest.fn(async () => true),
  isEnrolledAsync: jest.fn(async () => true),
  supportedAuthenticationTypesAsync: jest.fn(async () => [2, 1]),
  getEnrolledLevelAsync: jest.fn(async () => 3),
  authenticateAsync: jest.fn(async () => ({ success: true })),
  cancelAuthenticate: jest.fn(async () => {}),
}));

const native = jest.mocked(LocalAuthentication);
const originalOS = Platform.OS;
const originalVersion = Object.getOwnPropertyDescriptor(Platform, "Version");

function setPlatform(os: typeof Platform.OS, version?: number) {
  Platform.OS = os;
  if (version !== undefined) {
    Object.defineProperty(Platform, "Version", {
      configurable: true,
      get: () => version,
    });
  }
}

const OPTIONS: AuthenticateOptions = {
  promptMessage: "Sblocca il portafoglio",
  cancelLabel: "Annulla",
};

beforeEach(() => jest.clearAllMocks());
afterEach(() => {
  Platform.OS = originalOS;
  if (originalVersion) {
    Object.defineProperty(Platform, "Version", originalVersion);
  }
});

function wrapperFor(adapter: BiometricsAdapter) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <DeviceAdaptersProvider adapters={{ biometrics: adapter }}>
        {children}
      </DeviceAdaptersProvider>
    );
  };
}

describe("expoBiometricsAdapter", () => {
  it("maps the status, in a fixed order of types", async () => {
    await expect(expoBiometricsAdapter.getStatus()).resolves.toEqual({
      hasHardware: true,
      isEnrolled: true,
      types: ["fingerprint", "face"],
      level: "biometric-strong",
    });
    native.getEnrolledLevelAsync.mockResolvedValueOnce(1);
    native.supportedAuthenticationTypesAsync.mockResolvedValueOnce([3]);
    await expect(expoBiometricsAdapter.getStatus()).resolves.toMatchObject({
      types: ["iris"],
      level: "passcode",
    });
  });

  it("reads what failed as absent instead of rejecting", async () => {
    native.hasHardwareAsync.mockRejectedValueOnce(new Error("x"));
    native.isEnrolledAsync.mockRejectedValueOnce(new Error("x"));
    native.supportedAuthenticationTypesAsync.mockRejectedValueOnce(
      new Error("x"),
    );
    native.getEnrolledLevelAsync.mockRejectedValueOnce(new Error("x"));
    await expect(expoBiometricsAdapter.getStatus()).resolves.toEqual({
      hasHardware: false,
      isEnrolled: false,
      types: [],
      level: "none",
    });
  });

  it("passes the options, with the passcode fallback by default", async () => {
    await expect(
      expoBiometricsAdapter.authenticate({
        ...OPTIONS,
        fallbackLabel: "Usa codice",
        subtitle: "Sub",
        description: "Desc",
      }),
    ).resolves.toEqual({ success: true });
    expect(native.authenticateAsync).toHaveBeenCalledWith({
      promptMessage: "Sblocca il portafoglio",
      cancelLabel: "Annulla",
      fallbackLabel: "Usa codice",
      promptSubtitle: "Sub",
      promptDescription: "Desc",
      disableDeviceFallback: false,
      biometricsSecurityLevel: "weak",
    });
  });

  it("prompts for biometrics only with fallback: none", async () => {
    await expoBiometricsAdapter.authenticate({ ...OPTIONS, fallback: "none" });
    expect(native.authenticateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ disableDeviceFallback: true }),
    );
  });

  it.each([
    ["android", 28, true],
    ["android", 29, true],
    ["android", 30, false],
    ["android", 26, false],
    ["ios", 17, false],
  ] as const)(
    "strong on %s %i drops the passcode fallback: %s",
    async (os, version, biometricsOnly) => {
      setPlatform(os, version);
      await expoBiometricsAdapter.authenticate({
        ...OPTIONS,
        strength: "strong",
      });
      expect(native.authenticateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          disableDeviceFallback: biometricsOnly,
          biometricsSecurityLevel: "strong",
        }),
      );
    },
  );

  it.each([
    ["user_cancel", "cancelled"],
    ["system_cancel", "cancelled"],
    ["app_cancel", "cancelled"],
    ["user_fallback", "fallback"],
    ["lockout", "lockout"],
    ["not_enrolled", "not-enrolled"],
    ["passcode_not_set", "not-enrolled"],
    ["not_available", "unavailable"],
    ["missing_usage_description", "unavailable"],
    ["authentication_failed", "failed"],
    ["timeout", "failed"],
    ["unknown: -1000, Something", "failed"],
  ])("maps %s to %s", async (nativeError, error) => {
    native.authenticateAsync.mockResolvedValueOnce({
      success: false,
      error: nativeError as LocalAuthentication.LocalAuthenticationError,
    });
    await expect(expoBiometricsAdapter.authenticate(OPTIONS)).resolves.toEqual({
      success: false,
      error,
      detail: nativeError,
    });
  });

  it("resolves failed when the module rejects", async () => {
    native.authenticateAsync.mockRejectedValueOnce(new Error("No activity"));
    await expect(expoBiometricsAdapter.authenticate(OPTIONS)).resolves.toEqual({
      success: false,
      error: "failed",
      detail: "No activity",
    });
  });

  it("warns once about a missing Face ID purpose string", async () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const result = {
      success: true,
      warning: "FaceID is available but has not been configured.",
    } as LocalAuthentication.LocalAuthenticationResult;
    native.authenticateAsync.mockResolvedValue(result);
    await expoBiometricsAdapter.authenticate(OPTIONS);
    await expoBiometricsAdapter.authenticate(OPTIONS);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("biometrics.faceIDPermission"),
    );
    native.authenticateAsync.mockResolvedValue({ success: true });
    warn.mockRestore();
  });

  it("cancels on Android only", async () => {
    setPlatform("ios");
    await expoBiometricsAdapter.cancel();
    expect(native.cancelAuthenticate).not.toHaveBeenCalled();
    setPlatform("android");
    await expoBiometricsAdapter.cancel();
    expect(native.cancelAuthenticate).toHaveBeenCalledTimes(1);
  });
});

describe("useBiometrics", () => {
  it("loads, then reports the status", async () => {
    const biometrics = createMockBiometricsAdapter();
    const { result } = await renderHook(() => useBiometrics(), {
      wrapper: wrapperFor(biometrics),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current).toMatchObject({
      ...MOCK_BIOMETRICS,
      isSupported: true,
      isAuthenticating: false,
    });
  });

  it("follows the status the adapter pushes", async () => {
    const biometrics = createMockBiometricsAdapter();
    const { result } = await renderHook(() => useBiometrics(), {
      wrapper: wrapperFor(biometrics),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => biometrics.setStatus({ isEnrolled: false }));
    expect(result.current.isEnrolled).toBe(false);
  });

  it("reads the status again when the app returns to the foreground", async () => {
    // jest-expo's AppState.addEventListener is already a jest.fn: swap it
    // rather than spy on it, since restoring a spy on a mock drops its
    // implementation for every later test.
    const listeners: ((state: string) => void)[] = [];
    const original = AppState.addEventListener;
    AppState.addEventListener = ((_type: string, listener: never) => {
      listeners.push(listener);
      return { remove: () => {} };
    }) as never;
    let enrolled = false;
    const adapter: BiometricsAdapter = {
      ...createMockBiometricsAdapter(),
      subscribe: undefined,
      getStatus: async () => ({
        ...MOCK_BIOMETRICS,
        types: ["fingerprint"],
        isEnrolled: enrolled,
      }),
    };
    const { result } = await renderHook(() => useBiometrics(), {
      wrapper: wrapperFor(adapter),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const types = result.current.types;
    expect(result.current.isEnrolled).toBe(false);

    enrolled = true;
    // iOS's own prompt takes the app through "inactive": no re-read there.
    await act(async () =>
      listeners.forEach((listener) => listener("inactive")),
    );
    expect(result.current.isEnrolled).toBe(false);
    await act(async () => listeners.forEach((listener) => listener("active")));
    expect(result.current.isEnrolled).toBe(true);
    // Equal contents keep their identity: no re-render for a re-read.
    expect(result.current.types).toBe(types);
    AppState.addEventListener = original;
  });

  it("authenticates through the adapter", async () => {
    const biometrics = createMockBiometricsAdapter();
    const { result } = await renderHook(() => useBiometrics(), {
      wrapper: wrapperFor(biometrics),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const outcome = await act(() => result.current.authenticate(OPTIONS));
    expect(outcome).toEqual({ success: true });
    expect(biometrics.calls).toEqual([OPTIONS]);
  });

  it("answers busy while a prompt is open, from any component", async () => {
    const biometrics = createMockBiometricsAdapter({ manual: true });
    const wrapper = wrapperFor(biometrics);
    const first = await renderHook(() => useBiometrics(), { wrapper });
    const second = await renderHook(() => useBiometrics(), { wrapper });

    let pending!: Promise<unknown>;
    await act(async () => {
      pending = first.result.current.authenticate(OPTIONS);
    });
    expect(first.result.current.isAuthenticating).toBe(true);
    expect(second.result.current.isAuthenticating).toBe(true);
    await expect(second.result.current.authenticate(OPTIONS)).resolves.toEqual({
      success: false,
      error: "busy",
    });
    expect(biometrics.calls).toHaveLength(1);
    expect(biometrics.isPrompting).toBe(true);

    await act(async () => biometrics.resolve());
    await expect(pending).resolves.toEqual({ success: true });
    expect(biometrics.isPrompting).toBe(false);
    expect(first.result.current.isAuthenticating).toBe(false);
    expect(second.result.current.isAuthenticating).toBe(false);
  });

  it("cancels the open prompt", async () => {
    const biometrics = createMockBiometricsAdapter({ manual: true });
    const { result } = await renderHook(() => useBiometrics(), {
      wrapper: wrapperFor(biometrics),
    });
    let pending!: Promise<unknown>;
    await act(async () => {
      pending = result.current.authenticate(OPTIONS);
    });
    await act(() => result.current.cancel());
    await expect(pending).resolves.toEqual({
      success: false,
      error: "cancelled",
    });
    expect(result.current.isAuthenticating).toBe(false);
  });

  it("answers unsupported without reaching the adapter", async () => {
    const biometrics = createMockBiometricsAdapter({ supported: false });
    const authenticate = jest.spyOn(biometrics, "authenticate");
    const { result } = await renderHook(() => useBiometrics(), {
      wrapper: wrapperFor(biometrics),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current).toMatchObject({
      isSupported: false,
      hasHardware: false,
      level: "none",
    });
    await expect(result.current.authenticate(OPTIONS)).resolves.toEqual({
      success: false,
      error: "unsupported",
    });
    expect(authenticate).not.toHaveBeenCalled();
  });

  it.each(["promptMessage", "cancelLabel"] as const)(
    "rejects an empty %s before prompting",
    async (key) => {
      const biometrics = createMockBiometricsAdapter();
      const { result } = await renderHook(() => useBiometrics(), {
        wrapper: wrapperFor(biometrics),
      });
      await expect(
        result.current.authenticate({ ...OPTIONS, [key]: "" }),
      ).rejects.toThrow(`${key} must be a non-empty string`);
      expect(biometrics.calls).toHaveLength(0);
      expect(result.current.isAuthenticating).toBe(false);
    },
  );

  it("turns an adapter's rejection into failed", async () => {
    const biometrics = createMockBiometricsAdapter();
    jest
      .spyOn(biometrics, "authenticate")
      .mockRejectedValueOnce(new Error("boom"));
    const { result } = await renderHook(() => useBiometrics(), {
      wrapper: wrapperFor(biometrics),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const failed = await act(() => result.current.authenticate(OPTIONS));
    expect(failed).toEqual({ success: false, error: "failed", detail: "boom" });
    // The session is free again.
    const next = await act(() => result.current.authenticate(OPTIONS));
    expect(next).toEqual({ success: true });
  });

  it("reads the status again after not-enrolled", async () => {
    const biometrics = createMockBiometricsAdapter({
      result: { success: false, error: "not-enrolled" },
    });
    const { result } = await renderHook(() => useBiometrics(), {
      wrapper: wrapperFor(biometrics),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    const getStatus = jest.spyOn(biometrics, "getStatus");
    await act(async () => {
      await result.current.authenticate(OPTIONS);
    });
    expect(getStatus).toHaveBeenCalledTimes(1);

    getStatus.mockClear();
    biometrics.setResult({ success: false, error: "cancelled" });
    await act(async () => {
      await result.current.authenticate(OPTIONS);
    });
    expect(getStatus).not.toHaveBeenCalled();
  });

  it("prerenders as loading and unsupported, without reading", () => {
    const biometrics = createMockBiometricsAdapter();
    const getStatus = jest.spyOn(biometrics, "getStatus");
    function Probe() {
      const state = useBiometrics();
      return (
        <>{`${state.isLoading}|${state.isSupported}|${state.isAuthenticating}|${state.level}`}</>
      );
    }
    const html = renderToString(
      <DeviceAdaptersProvider adapters={{ biometrics }}>
        <Probe />
      </DeviceAdaptersProvider>,
    );
    expect(html).toBe("true|false|false|none");
    expect(getStatus).not.toHaveBeenCalled();
  });
});
