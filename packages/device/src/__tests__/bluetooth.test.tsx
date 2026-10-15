import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { Linking } from "react-native";

import { DeviceAdaptersProvider } from "..";
import {
  BluetoothError,
  isBluetoothError,
  shortBluetoothUuid,
  toBluetoothUuid,
  useBluetoothPermission,
  useBluetoothState,
  type BluetoothAdapter,
} from "../bluetooth";
import { ensureBluetoothReady } from "../bluetooth/hooks";
import {
  createMockBluetoothAdapter,
  type MockBluetoothAdapter,
  type MockBluetoothOptions,
} from "../testing";

function setup(options: MockBluetoothOptions = {}) {
  const adapter = createMockBluetoothAdapter(options);
  const wrapper = ({ children }: { children: ReactNode }) => (
    <DeviceAdaptersProvider adapters={{ bluetooth: adapter }}>
      {children}
    </DeviceAdaptersProvider>
  );
  return { adapter, wrapper };
}

describe("toBluetoothUuid", () => {
  it.each([
    ["180D", "0000180d-0000-1000-8000-00805f9b34fb"],
    ["0x180d", "0000180d-0000-1000-8000-00805f9b34fb"],
    [" 2a37 ", "00002a37-0000-1000-8000-00805f9b34fb"],
    ["0000FE59", "0000fe59-0000-1000-8000-00805f9b34fb"],
    [
      "6E400001-B5A3-F393-E0A9-E50E24DCCA9E",
      "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
    ],
    [
      "6e400001b5a3f393e0a9e50e24dcca9e",
      "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
    ],
  ])("reads %j as %s", (input, uuid) => {
    expect(toBluetoothUuid(input)).toBe(uuid);
  });

  it.each(["", "18", "180G", "180d0", "6e400001-b5a3-f393-e0a9", "uuid"])(
    "refuses %j",
    (input) => {
      expect(() => toBluetoothUuid(input)).toThrow(TypeError);
    },
  );

  it("refuses what is not a string", () => {
    expect(() => toBluetoothUuid(0x180d as never)).toThrow(
      "expected a string, got number",
    );
  });

  it("shortens SIG numbers only", () => {
    expect(shortBluetoothUuid("0000180D-0000-1000-8000-00805F9B34FB")).toBe(
      "180d",
    );
    expect(shortBluetoothUuid("12345678")).toBe("12345678");
    expect(shortBluetoothUuid("6E400001-B5A3-F393-E0A9-E50E24DCCA9E")).toBe(
      "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
    );
  });
});

describe("BluetoothError", () => {
  it("carries a code, a default message and the cause", () => {
    const cause = new Error("native");
    const error = new BluetoothError("powered-off", undefined, cause);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Bluetooth is switched off.");
    expect((error as { cause?: unknown }).cause).toBe(cause);
    expect(isBluetoothError(error)).toBe(true);
    expect(isBluetoothError(new Error("plain"))).toBe(false);
    expect(
      isBluetoothError(
        Object.assign(new Error("x"), { name: "BluetoothError" }),
      ),
    ).toBe(false);
  });
});

describe("useBluetoothState", () => {
  it("reads the radio and follows it", async () => {
    const { adapter, wrapper } = setup({ state: "off" });
    const { result } = await renderHook(() => useBluetoothState(), { wrapper });
    await waitFor(() => expect(result.current.state).toBe("off"));
    expect(result.current.isLoading).toBe(false);
    await act(async () => adapter.setState("on"));
    expect(result.current.state).toBe("on");
  });

  it("shares one subscription, closed with the last reader", async () => {
    const { adapter, wrapper } = setup();
    const first = await renderHook(() => useBluetoothState(), { wrapper });
    const second = await renderHook(() => useBluetoothState(), { wrapper });
    await waitFor(() => expect(first.result.current.state).toBe("on"));
    expect(adapter.stateSubscriberCount).toBe(1);
    await first.unmount();
    expect(adapter.stateSubscriberCount).toBe(1);
    await second.unmount();
    expect(adapter.stateSubscriberCount).toBe(0);
  });

  it("reads unsupported without the module: the default adapter loads it lazily", async () => {
    // No provider: the default adapter, whose native module jest lacks.
    const { result } = await renderHook(() => useBluetoothState());
    await waitFor(() => expect(result.current.state).toBe("unsupported"));
    expect(result.current.canEnable).toBe(false);
    await expect(result.current.enable()).rejects.toMatchObject({
      code: "unsupported",
    });
  });

  it("asks to switch the radio on with the permission", async () => {
    const { adapter, wrapper } = setup({
      state: "off",
      permission: "granted",
    });
    const { result } = await renderHook(() => useBluetoothState(), { wrapper });
    await waitFor(() => expect(result.current.state).toBe("off"));
    expect(result.current.canEnable).toBe(true);
    await act(async () => {
      await expect(result.current.enable()).resolves.toBe(true);
    });
    expect(result.current.state).toBe("on");
    expect(adapter.enableCount).toBe(1);
  });

  it("reports a refusal", async () => {
    const { wrapper } = setup({
      state: "off",
      permission: "granted",
      enableResult: "refuse",
    });
    const { result } = await renderHook(() => useBluetoothState(), { wrapper });
    await act(async () => {
      await expect(result.current.enable()).resolves.toBe(false);
    });
    expect(result.current.state).toBe("off");
  });

  it("does not ask without the permission (Android 12 needs it for the dialog)", async () => {
    const { adapter, wrapper } = setup({ state: "off" });
    const { result } = await renderHook(() => useBluetoothState(), { wrapper });
    await expect(result.current.enable()).rejects.toMatchObject({
      name: "BluetoothError",
      code: "permission-denied",
    });
    expect(adapter.enableCount).toBe(0);
  });

  it("cannot ask where the platform has no dialog", async () => {
    const { adapter, wrapper } = setup({
      state: "off",
      permission: "granted",
      canEnable: false,
    });
    const { result } = await renderHook(() => useBluetoothState(), { wrapper });
    expect(result.current.canEnable).toBe(false);
    await expect(result.current.enable()).rejects.toMatchObject({
      code: "unsupported",
    });
    expect(adapter.enableCount).toBe(0);
  });

  it("renders unknown on the server", () => {
    const { wrapper: Wrapper } = setup();
    const Probe = () => <>{useBluetoothState().state}</>;
    expect(
      renderToString(
        <Wrapper>
          <Probe />
        </Wrapper>,
      ),
    ).toBe("unknown");
  });
});

describe("useBluetoothPermission", () => {
  it("reads, asks, and shares the answer", async () => {
    const { adapter, wrapper } = setup();
    const first = await renderHook(() => useBluetoothPermission(), { wrapper });
    const second = await renderHook(() => useBluetoothPermission(), {
      wrapper,
    });
    await waitFor(() =>
      expect(first.result.current).toMatchObject({
        status: "undetermined",
        canAskAgain: true,
        isLoading: false,
      }),
    );
    await act(async () => {
      await expect(first.result.current.request()).resolves.toEqual({
        status: "granted",
        canAskAgain: false,
      });
    });
    expect(second.result.current.status).toBe("granted");
    expect(adapter.requestCount).toBe(1);
  });

  it("reads the radio again after a request: iOS reports it only from then", async () => {
    const { adapter, wrapper } = setup({ state: "unknown" });
    const getState = jest.spyOn(adapter, "getState");
    const state = await renderHook(() => useBluetoothState(), { wrapper });
    const permission = await renderHook(() => useBluetoothPermission(), {
      wrapper,
    });
    await waitFor(() => expect(getState).toHaveBeenCalledTimes(1));
    getState.mockResolvedValue("on");
    await act(async () => {
      await permission.result.current.request();
    });
    await waitFor(() => expect(state.result.current.state).toBe("on"));
  });

  it("reads unsupported where Bluetooth is", async () => {
    const { adapter, wrapper } = setup({ supported: false });
    const { result } = await renderHook(() => useBluetoothPermission(), {
      wrapper,
    });
    await waitFor(() => expect(result.current.status).toBe("unsupported"));
    await act(async () => {
      await result.current.request();
    });
    expect(adapter.requestCount).toBe(0);
  });

  it("opens the settings", async () => {
    const open = jest.spyOn(Linking, "openSettings").mockResolvedValue();
    const { wrapper } = setup();
    const { result } = await renderHook(() => useBluetoothPermission(), {
      wrapper,
    });
    await result.current.openSettings();
    expect(open).toHaveBeenCalled();
    open.mockRestore();
  });
});

describe("ensureBluetoothReady", () => {
  const failure = (adapter: BluetoothAdapter) =>
    ensureBluetoothReady(adapter).then(
      () => null,
      (error: BluetoothError) => error,
    );

  it("passes with support, the permission and the radio on", async () => {
    await expect(
      ensureBluetoothReady(
        createMockBluetoothAdapter({ permission: "granted" }),
      ),
    ).resolves.toBeUndefined();
  });

  it.each<[string, MockBluetoothOptions, string]>([
    ["no support", { supported: false }, "unsupported"],
    ["a denied permission", { permission: "denied" }, "permission-denied"],
    ["the radio off", { permission: "granted", state: "off" }, "powered-off"],
    [
      "the radio not known",
      { permission: "granted", state: "unknown" },
      "powered-off",
    ],
    [
      "iOS refusing",
      { permission: "granted", state: "unauthorized" },
      "permission-denied",
    ],
    [
      "a device without the radio",
      { permission: "granted", state: "unsupported" },
      "unsupported",
    ],
  ])("refuses %s", async (_case, options, code) => {
    const error = await failure(createMockBluetoothAdapter(options));
    expect(isBluetoothError(error)).toBe(true);
    expect(error?.code).toBe(code);
  });

  it("says how to ask when the permission was not asked for", async () => {
    const error = await failure(createMockBluetoothAdapter());
    expect(error?.code).toBe("permission-denied");
    expect(error?.message).toContain("request()");
  });

  it("refuses a permission that reads unsupported", async () => {
    const adapter: MockBluetoothAdapter = createMockBluetoothAdapter({
      permission: "unsupported",
    });
    expect((await failure(adapter))?.code).toBe("unsupported");
  });

  it("never prompts", async () => {
    const adapter = createMockBluetoothAdapter();
    await failure(adapter);
    expect(adapter.requestCount).toBe(0);
  });
});
