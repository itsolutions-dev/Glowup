import { act, renderHook, waitFor } from "@testing-library/react-native";
import * as ExpoSecureStore from "expo-secure-store";
import type { ReactNode } from "react";
import { AppState, Platform } from "react-native";
import { renderToString } from "react-dom/server";

import { DeviceAdaptersProvider } from "..";
import {
  expoSecureStoreAdapter,
  isSecureStoreError,
  SecureStoreError,
  useSecureStore,
  useSecureValue,
  webSecureStoreAdapter,
  type SecureStoreAdapter,
} from "../secure-store";
import { toSecureStoreError } from "../secure-store/errors";
import { createMockSecureStoreAdapter } from "../testing";

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

  it("has nothing on web", async () => {
    expect(webSecureStoreAdapter.isSupported()).toBe(false);
    await expect(webSecureStoreAdapter.getItem("a", {})).rejects.toMatchObject({
      code: "unsupported",
    });
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
