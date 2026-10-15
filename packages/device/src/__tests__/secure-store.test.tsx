import { act, renderHook, waitFor } from "@testing-library/react-native";
import * as ExpoSecureStore from "expo-secure-store";
import type { ReactNode } from "react";
import { AppState, Platform } from "react-native";
import { renderToString } from "react-dom/server";

import { DeviceAdaptersProvider } from "..";
import { useBiometrics } from "../biometrics";
import {
  expoSecureStoreAdapter,
  isSecureStoreError,
  SecureStoreError,
  useSecureStore,
  useSecureValue,
  type SecureStoreAdapter,
} from "../secure-store";
import { toSecureStoreError } from "../secure-store/errors";
import {
  createMockBiometricsAdapter,
  createMockSecureStoreAdapter,
} from "../testing";

jest.mock("expo-local-authentication", () => ({ SecurityLevel: { NONE: 0 } }));
jest.mock("expo-secure-store", () => ({
  AFTER_FIRST_UNLOCK: 0,
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 1,
  WHEN_UNLOCKED: 5,
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 6,
  getItemAsync: jest.fn(async () => "token"),
  setItemAsync: jest.fn(async () => {}),
  deleteItemAsync: jest.fn(async () => {}),
}));

const native = jest.mocked(ExpoSecureStore);
const originalOS = Platform.OS;

beforeEach(() => jest.clearAllMocks());
afterEach(() => {
  Platform.OS = originalOS;
});

function wrapperFor(adapter: SecureStoreAdapter) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <DeviceAdaptersProvider adapters={{ secureStore: adapter }}>
        {children}
      </DeviceAdaptersProvider>
    );
  };
}

const LOCKED = new Error("User interaction is not allowed.");

describe("expoSecureStoreAdapter", () => {
  it("reads and deletes under the service", async () => {
    await expect(
      expoSecureStoreAdapter.getItem("token", { service: "auth" }),
    ).resolves.toBe("token");
    await expoSecureStoreAdapter.deleteItem("token", { service: "auth" });
    expect(native.getItemAsync).toHaveBeenCalledWith("token", {
      keychainService: "auth",
    });
    expect(native.deleteItemAsync).toHaveBeenCalledWith("token", {
      keychainService: "auth",
    });
  });

  it.each([
    [{}, 6],
    [{ thisDeviceOnly: false }, 5],
    [{ accessible: "after-first-unlock" }, 1],
    [{ accessible: "after-first-unlock", thisDeviceOnly: false }, 0],
  ] as const)("writes %j as accessibility %i", async (options, constant) => {
    await expoSecureStoreAdapter.setItem("token", "v", options);
    expect(native.setItemAsync).toHaveBeenCalledWith("token", "v", {
      keychainService: undefined,
      keychainAccessible: constant,
    });
  });

  it("replaces an iOS item, so its accessibility is the one asked for", async () => {
    Platform.OS = "ios";
    await expoSecureStoreAdapter.setItem("token", "v", { service: "auth" });
    expect(native.deleteItemAsync).toHaveBeenCalledWith("token", {
      keychainService: "auth",
    });
    expect(native.deleteItemAsync.mock.invocationCallOrder[0]).toBeLessThan(
      native.setItemAsync.mock.invocationCallOrder[0],
    );
  });

  it("writes an Android item in place", async () => {
    Platform.OS = "android";
    await expoSecureStoreAdapter.setItem("token", "v", {});
    expect(native.deleteItemAsync).not.toHaveBeenCalled();
  });
});

describe("errors", () => {
  it("maps iOS's interaction-not-allowed to locked", () => {
    expect(toSecureStoreError(LOCKED).code).toBe("locked");
    expect(toSecureStoreError(new Error("I/O error.")).code).toBe("failed");
    const own = new SecureStoreError("invalid-key");
    expect(toSecureStoreError(own)).toBe(own);
    expect(isSecureStoreError(own)).toBe(true);
    expect(isSecureStoreError(new Error("x"))).toBe(false);
  });
});

describe("useSecureStore", () => {
  it("reads, writes and removes through the adapter", async () => {
    const secureStore = createMockSecureStoreAdapter();
    const { result } = await renderHook(() => useSecureStore(), {
      wrapper: wrapperFor(secureStore),
    });
    expect(result.current.isSupported).toBe(true);
    await result.current.set("token", "abc", { service: "auth" });
    expect(secureStore.items.get("auth/token")).toBe("abc");
    expect(secureStore.writes).toEqual([
      { key: "token", options: { service: "auth" } },
    ]);
    await expect(
      result.current.get("token", { service: "auth" }),
    ).resolves.toBe("abc");
    await expect(result.current.get("token")).resolves.toBeNull();
    await result.current.remove("token", { service: "auth" });
    expect(secureStore.items.size).toBe(0);
  });

  it.each(["", "a b", "a/b", "ü"])(
    "rejects the key %j before reaching the adapter",
    async (key) => {
      const secureStore = createMockSecureStoreAdapter();
      const getItem = jest.spyOn(secureStore, "getItem");
      const { result } = await renderHook(() => useSecureStore(), {
        wrapper: wrapperFor(secureStore),
      });
      await expect(result.current.get(key)).rejects.toMatchObject({
        name: "SecureStoreError",
        code: "invalid-key",
      });
      expect(getItem).not.toHaveBeenCalled();
    },
  );

  it("rejects a value that is not a string", async () => {
    const secureStore = createMockSecureStoreAdapter();
    const { result } = await renderHook(() => useSecureStore(), {
      wrapper: wrapperFor(secureStore),
    });
    await expect(
      result.current.set("a", 42 as unknown as string),
    ).rejects.toMatchObject({ code: "invalid-value" });
    expect(secureStore.writes).toHaveLength(0);
  });

  it("rejects unsupported without reaching the adapter", async () => {
    const secureStore = createMockSecureStoreAdapter({ supported: false });
    const setItem = jest.spyOn(secureStore, "setItem");
    const { result } = await renderHook(() => useSecureStore(), {
      wrapper: wrapperFor(secureStore),
    });
    expect(result.current.isSupported).toBe(false);
    await expect(result.current.set("a", "b")).rejects.toMatchObject({
      code: "unsupported",
    });
    expect(setItem).not.toHaveBeenCalled();
  });

  it("turns the platform's failures into SecureStoreError", async () => {
    const secureStore = createMockSecureStoreAdapter();
    const { result } = await renderHook(() => useSecureStore(), {
      wrapper: wrapperFor(secureStore),
    });
    secureStore.failNext(LOCKED);
    await expect(result.current.get("a")).rejects.toMatchObject({
      name: "SecureStoreError",
      code: "locked",
    });
    secureStore.failNext(new Error("Disk full"));
    await expect(result.current.set("a", "b")).rejects.toMatchObject({
      code: "failed",
      message: "Disk full",
    });
  });

  it("stores JSON", async () => {
    const secureStore = createMockSecureStoreAdapter({
      items: { "/broken": "{" },
    });
    const { result } = await renderHook(() => useSecureStore(), {
      wrapper: wrapperFor(secureStore),
    });
    await result.current.setJSON("session", { id: 7, scopes: ["a"] });
    await expect(result.current.getJSON("session")).resolves.toEqual({
      id: 7,
      scopes: ["a"],
    });
    await expect(result.current.getJSON("missing")).resolves.toBeNull();
    await expect(result.current.getJSON("broken")).rejects.toMatchObject({
      code: "invalid-value",
    });
    await expect(
      result.current.setJSON("nothing", undefined),
    ).rejects.toMatchObject({ code: "invalid-value" });
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;
    await expect(
      result.current.setJSON("cyclic", cyclic),
    ).rejects.toMatchObject({ code: "invalid-value" });
  });

  it("keeps its functions across renders", async () => {
    const secureStore = createMockSecureStoreAdapter();
    const { result, rerender } = await renderHook(() => useSecureStore(), {
      wrapper: wrapperFor(secureStore),
    });
    const first = result.current;
    await rerender({});
    expect(result.current).toBe(first);
  });
});

describe("useSecureValue", () => {
  it("loads the item, or null when there is none", async () => {
    const secureStore = createMockSecureStoreAdapter({
      items: { "/token": "abc" },
    });
    const wrapper = wrapperFor(secureStore);
    const token = await renderHook(() => useSecureValue("token"), { wrapper });
    const other = await renderHook(() => useSecureValue("other"), { wrapper });
    await waitFor(() => expect(token.result.current.isLoading).toBe(false));
    expect(token.result.current).toMatchObject({ value: "abc", error: null });
    await waitFor(() => expect(other.result.current.isLoading).toBe(false));
    expect(other.result.current.value).toBeNull();
  });

  it("shares one item between readers, and takes the package's writes", async () => {
    const secureStore = createMockSecureStoreAdapter();
    const getItem = jest.spyOn(secureStore, "getItem");
    const wrapper = wrapperFor(secureStore);
    const a = await renderHook(
      () => useSecureValue("token", { service: "auth" }),
      { wrapper },
    );
    const b = await renderHook(
      () => useSecureValue("token", { service: "auth" }),
      { wrapper },
    );
    const otherService = await renderHook(() => useSecureValue("token"), {
      wrapper,
    });
    const store = await renderHook(() => useSecureStore(), { wrapper });
    await waitFor(() => expect(b.result.current.isLoading).toBe(false));
    expect(getItem).toHaveBeenCalledTimes(2); // once per service

    await act(() => a.result.current.set("abc"));
    expect(b.result.current.value).toBe("abc");
    expect(otherService.result.current.value).toBeNull();

    await act(() =>
      store.result.current.set("token", "def", { service: "auth" }),
    );
    expect(a.result.current.value).toBe("def");
    await act(() => b.result.current.remove());
    expect(a.result.current.value).toBeNull();
    expect(secureStore.items.has("auth/token")).toBe(false);
  });

  it("writes with its options", async () => {
    const secureStore = createMockSecureStoreAdapter();
    const { result } = await renderHook(
      () =>
        useSecureValue("token", {
          service: "auth",
          accessible: "after-first-unlock",
          thisDeviceOnly: false,
        }),
      { wrapper: wrapperFor(secureStore) },
    );
    await act(() => result.current.set("abc"));
    expect(secureStore.writes[0].options).toEqual({
      service: "auth",
      accessible: "after-first-unlock",
      thisDeviceOnly: false,
    });
  });

  it("reports a failed read and tries again in the foreground", async () => {
    let listeners: ((state: string) => void)[] = [];
    const original = AppState.addEventListener;
    AppState.addEventListener = ((_type: string, listener: never) => {
      listeners.push(listener);
      return {
        remove: () => {
          listeners = listeners.filter((l) => l !== listener);
        },
      };
    }) as never;

    const secureStore = createMockSecureStoreAdapter({
      items: { "/token": "abc" },
    });
    const getItem = jest.spyOn(secureStore, "getItem");
    secureStore.failNext(LOCKED);
    const { result } = await renderHook(() => useSecureValue("token"), {
      wrapper: wrapperFor(secureStore),
    });
    await waitFor(() => expect(result.current.error?.code).toBe("locked"));
    expect(result.current.value).toBeNull();

    await act(async () => listeners.forEach((listener) => listener("active")));
    await waitFor(() => expect(result.current.value).toBe("abc"));
    expect(result.current.error).toBeNull();
    // Read: no more reads on the next returns.
    const reads = getItem.mock.calls.length;
    await act(async () => listeners.forEach((listener) => listener("active")));
    expect(getItem).toHaveBeenCalledTimes(reads);
    AppState.addEventListener = original;
  });

  it("keeps a write made while a read is still running", async () => {
    let answer!: (value: string | null) => void;
    const secureStore = createMockSecureStoreAdapter();
    jest.spyOn(secureStore, "getItem").mockImplementation(
      () =>
        new Promise((resolve) => {
          answer = resolve;
        }),
    );
    const { result } = await renderHook(() => useSecureValue("token"), {
      wrapper: wrapperFor(secureStore),
    });
    await act(() => result.current.set("new"));
    await act(async () => answer("stale"));
    expect(result.current.value).toBe("new");
  });

  it("reports unsupported", async () => {
    const secureStore = createMockSecureStoreAdapter({ supported: false });
    const { result } = await renderHook(() => useSecureValue("token"), {
      wrapper: wrapperFor(secureStore),
    });
    await waitFor(() => expect(result.current.error?.code).toBe("unsupported"));
  });

  it("prerenders as loading, without reading", () => {
    const secureStore = createMockSecureStoreAdapter();
    const getItem = jest.spyOn(secureStore, "getItem");
    function Probe() {
      const token = useSecureValue("token");
      const store = useSecureStore();
      return <>{`${token.isLoading}|${token.value}|${store.isSupported}`}</>;
    }
    const html = renderToString(
      <DeviceAdaptersProvider adapters={{ secureStore }}>
        <Probe />
      </DeviceAdaptersProvider>,
    );
    expect(html).toBe("true|null|false");
    expect(getItem).not.toHaveBeenCalled();
  });
});

const PROMPT = { prompt: "Unlock your wallet", service: "auth" };
const DERIVED = "glowup.protected.auth.token";

describe("expoSecureStoreAdapter, protected items", () => {
  it("reads with the prompt, under the derived service", async () => {
    await expoSecureStoreAdapter.getProtectedItem("token", {
      service: DERIVED,
      prompt: "Unlock",
    });
    expect(native.getItemAsync).toHaveBeenCalledWith("token", {
      keychainService: DERIVED,
      requireAuthentication: true,
      authenticationPrompt: "Unlock",
    });
  });

  it("writes a fresh item on iOS, in place on Android", async () => {
    Platform.OS = "ios";
    await expoSecureStoreAdapter.setProtectedItem("token", "v", {
      service: DERIVED,
      prompt: "Unlock",
    });
    expect(native.deleteItemAsync).toHaveBeenCalledWith("token", {
      keychainService: DERIVED,
    });
    expect(native.setItemAsync).toHaveBeenCalledWith("token", "v", {
      keychainService: DERIVED,
      requireAuthentication: true,
      authenticationPrompt: "Unlock",
      keychainAccessible: 6,
    });
    jest.clearAllMocks();
    Platform.OS = "android";
    await expoSecureStoreAdapter.setProtectedItem("token", "v", {
      service: DERIVED,
      prompt: "Unlock",
    });
    expect(native.deleteItemAsync).not.toHaveBeenCalled();
  });

  it.each([
    [
      "Could not Authenticate the user: User canceled the authentication. Cancel",
      "cancelled",
    ],
    ["User canceled the operation.", "cancelled"],
    [
      "Could not Authenticate the user: Authentication is already in progress",
      "busy",
    ],
    ["Could not Authenticate the user: Lockout. Too many attempts", "lockout"],
    ["Could not Authenticate the user: Lockout permanent. x", "lockout"],
    [
      "Could not Authenticate the user: No biometrics are currently enrolled",
      "unavailable",
    ],
    [
      "Could not Authenticate the user: No hardware available for biometric authentication.",
      "unavailable",
    ],
    [
      "You must set `NSFaceIDUsageDescription` in your Info.plist file to use the `requireAuthentication` option",
      "unavailable",
    ],
    ["User interaction is not allowed.", "locked"],
  ])("normalises %j to %s", async (message, status) => {
    native.getItemAsync.mockRejectedValueOnce(new Error(message));
    await expect(
      expoSecureStoreAdapter.getProtectedItem("token", {
        service: DERIVED,
        prompt: "Unlock",
      }),
    ).rejects.toMatchObject({ name: "ProtectedAccessError", status });
  });

  it("leaves an unknown failure as it is", async () => {
    const error = new Error("I/O error.");
    native.setItemAsync.mockRejectedValueOnce(error);
    await expect(
      expoSecureStoreAdapter.setProtectedItem("token", "v", {
        service: DERIVED,
        prompt: "Unlock",
      }),
    ).rejects.toBe(error);
  });
});

describe("useSecureStore, protected items", () => {
  async function setup(adapter = createMockSecureStoreAdapter()) {
    const { result } = await renderHook(() => useSecureStore(), {
      wrapper: wrapperFor(adapter),
    });
    return { secureStore: adapter, store: () => result.current };
  }

  it("writes and reads through the prompt, apart from plain items", async () => {
    const { secureStore, store } = await setup();
    await expect(store().setProtected("token", "abc", PROMPT)).resolves.toEqual(
      { status: "ok" },
    );
    await expect(store().getProtected("token", PROMPT)).resolves.toEqual({
      status: "ok",
      value: "abc",
    });
    expect(secureStore.prompts).toEqual([
      "Unlock your wallet",
      "Unlock your wallet",
    ]);
    expect(secureStore.protectedItems.get(`${DERIVED}/token`)).toBe("abc");
    // A service per item, and the marker beside it.
    expect(secureStore.items.get(`${DERIVED}/glowup-protected-marker`)).toBe(
      "1",
    );
    await expect(store().get("token", { service: "auth" })).resolves.toBeNull();
  });

  it("reads an empty value as a value", async () => {
    const { store } = await setup();
    await store().setProtected("token", "", PROMPT);
    await expect(store().getProtected("token", PROMPT)).resolves.toEqual({
      status: "ok",
      value: "",
    });
  });

  it("tells an invalidated item from a missing one", async () => {
    const { secureStore, store } = await setup();
    await expect(store().getProtected("token", PROMPT)).resolves.toEqual({
      status: "missing",
    });
    await store().setProtected("token", "abc", PROMPT);
    secureStore.invalidate();
    await expect(store().getProtected("token", PROMPT)).resolves.toEqual({
      status: "invalidated",
    });
    // Written again, it reads again.
    await store().setProtected("token", "def", PROMPT);
    await expect(store().getProtected("token", PROMPT)).resolves.toEqual({
      status: "ok",
      value: "def",
    });
  });

  it("removes the item and its marker, without a prompt", async () => {
    const { secureStore, store } = await setup();
    await store().setProtected("token", "abc", PROMPT);
    await store().removeProtected("token", { service: "auth" });
    expect(secureStore.items.size).toBe(0);
    expect(secureStore.protectedItems.size).toBe(0);
    expect(secureStore.prompts).toHaveLength(1);
    await expect(store().getProtected("token", PROMPT)).resolves.toEqual({
      status: "missing",
    });
  });

  it.each(["cancelled", "lockout", "unavailable"] as const)(
    "resolves a prompt's %s",
    async (status) => {
      const { secureStore, store } = await setup();
      secureStore.denyNext(status);
      await expect(store().getProtected("token", PROMPT)).resolves.toEqual({
        status,
        detail: status,
      });
      secureStore.denyNext(status);
      await expect(
        store().setProtected("token", "abc", PROMPT),
      ).resolves.toMatchObject({ status });
      // A failed write leaves no marker behind.
      expect(secureStore.items.size).toBe(0);
    },
  );

  it("resolves locked and failed from the platform's other errors", async () => {
    const { secureStore, store } = await setup();
    secureStore.failNext(LOCKED);
    await expect(store().getProtected("token", PROMPT)).resolves.toMatchObject({
      status: "locked",
    });
    secureStore.failNext(new Error("I/O error."));
    await expect(store().getProtected("token", PROMPT)).resolves.toEqual({
      status: "failed",
      detail: "I/O error.",
    });
  });

  it("keeps the item when only its marker cannot be written", async () => {
    const secureStore = createMockSecureStoreAdapter();
    jest
      .spyOn(secureStore, "setItem")
      .mockRejectedValueOnce(new Error("Disk full"));
    const { store } = await setup(secureStore);
    await expect(store().setProtected("token", "abc", PROMPT)).resolves.toEqual(
      { status: "ok" },
    );
    await expect(store().getProtected("token", PROMPT)).resolves.toMatchObject({
      status: "ok",
    });
  });

  it("rejects an invalid key or an empty prompt before any prompt", async () => {
    const { secureStore, store } = await setup();
    await expect(store().getProtected("a b", PROMPT)).rejects.toMatchObject({
      code: "invalid-key",
    });
    await expect(
      store().setProtected("token", "abc", { prompt: "" }),
    ).rejects.toThrow("non-empty prompt");
    await expect(
      store().setProtected("token", 1 as unknown as string, PROMPT),
    ).rejects.toMatchObject({ code: "invalid-value" });
    expect(secureStore.prompts).toHaveLength(0);
  });

  it("answers unsupported on web", async () => {
    const { store } = await setup(
      createMockSecureStoreAdapter({ supported: false }),
    );
    await expect(store().getProtected("token", PROMPT)).resolves.toEqual({
      status: "unsupported",
    });
    await expect(store().setProtected("token", "abc", PROMPT)).resolves.toEqual(
      { status: "unsupported" },
    );
  });

  it("shares one prompt with /biometrics: the second caller is busy", async () => {
    const secureStore = createMockSecureStoreAdapter();
    const biometrics = createMockBiometricsAdapter({ manual: true });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <DeviceAdaptersProvider adapters={{ secureStore, biometrics }}>
        {children}
      </DeviceAdaptersProvider>
    );
    const { result } = await renderHook(
      () => ({ store: useSecureStore(), biometrics: useBiometrics() }),
      { wrapper },
    );
    let pending!: Promise<unknown>;
    await act(async () => {
      pending = result.current.biometrics.authenticate({
        promptMessage: "Unlock",
        cancelLabel: "Cancel",
      });
    });
    await expect(
      result.current.store.getProtected("token", PROMPT),
    ).resolves.toEqual({ status: "busy" });
    expect(secureStore.prompts).toHaveLength(0);

    await act(async () => biometrics.resolve());
    await pending;
    // And the other way round.
    let read!: (value: string | null) => void;
    jest.spyOn(secureStore, "getProtectedItem").mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          read = resolve;
        }),
    );
    let reading!: Promise<unknown>;
    await act(async () => {
      reading = result.current.store.getProtected("token", PROMPT);
    });
    expect(result.current.biometrics.isAuthenticating).toBe(true);
    await expect(
      result.current.biometrics.authenticate({
        promptMessage: "Unlock",
        cancelLabel: "Cancel",
      }),
    ).resolves.toEqual({ success: false, error: "busy" });
    await act(async () => read("abc"));
    await expect(reading).resolves.toEqual({ status: "ok", value: "abc" });
  });
});
