import { act, renderHook } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";

import { DeviceAdaptersProvider } from "..";
import {
  BLUETOOTH_CHARACTERISTICS,
  BLUETOOTH_SERVICES,
  decodeUtf8,
  encodeUtf8,
  parseBatteryLevel,
  readBatteryLevel,
  readDeviceInformation,
  toBluetoothUuid,
  useBluetoothDevice,
  useBluetoothNotifications,
  type UseBluetoothDeviceOptions,
} from "../bluetooth";
import {
  createMockBluetoothAdapter,
  type MockBluetoothOptions,
  type MockService,
} from "../testing";

const HRM = "AA:BB:CC:DD:EE:01";
const uuid = toBluetoothUuid;

const GATT: MockService[] = [
  {
    uuid: "180D",
    characteristics: [
      { uuid: "2A37", properties: { read: false, notify: true } },
      { uuid: "2A39", properties: { read: false, write: true } },
    ],
  },
  {
    uuid: "180F",
    characteristics: [
      { uuid: "2A19", properties: { notify: true }, value: [87] },
    ],
  },
  {
    uuid: "180A",
    characteristics: [
      { uuid: "2A29", value: encodeUtf8("Acme\0") },
      { uuid: "2A24", value: encodeUtf8("HRM-1") },
      { uuid: "2A25", properties: { read: false } },
      { uuid: "2A26", value: [] },
    ],
  },
  {
    uuid: BLUETOOTH_SERVICES.nordicUart,
    characteristics: [
      {
        uuid: BLUETOOTH_CHARACTERISTICS.nordicUartRx,
        properties: { read: false, writeWithoutResponse: true },
      },
      {
        uuid: BLUETOOTH_CHARACTERISTICS.nordicUartTx,
        properties: { read: false, notify: true },
      },
    ],
  },
];

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

function setup(options: MockBluetoothOptions = {}) {
  const adapter = createMockBluetoothAdapter({
    permission: "granted",
    gatt: { [HRM]: GATT },
    ...options,
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <DeviceAdaptersProvider adapters={{ bluetooth: adapter }}>
      {children}
    </DeviceAdaptersProvider>
  );
  const device = (options?: UseBluetoothDeviceOptions) =>
    renderHook(() => useBluetoothDevice(HRM, options), { wrapper });
  return { adapter, wrapper, device };
}

/** Runs what fake timers hold: the store's microtasks and timeouts. */
async function flush(ms = 0) {
  await act(async () => {
    jest.runAllTicks();
    await jest.advanceTimersByTimeAsync(ms);
  });
}

describe("useBluetoothDevice", () => {
  it("connects, discovers the services, and shares the connection", async () => {
    const { adapter, device } = setup();
    const { result } = await device();
    const other = await device();
    expect(result.current).toMatchObject({
      id: HRM,
      status: "disconnected",
      isConnected: false,
      services: null,
    });
    await act(async () => {
      const first = result.current.connect();
      const second = other.result.current.connect();
      await Promise.all([first, second]);
    });
    expect(adapter.connectCount).toBe(1);
    expect(result.current.isConnected).toBe(true);
    expect(other.result.current.status).toBe("connected");
    expect(result.current.services?.map((s) => s.uuid)).toEqual([
      uuid("180D"),
      uuid("180F"),
      uuid("180A"),
      BLUETOOTH_SERVICES.nordicUart,
    ]);
    expect(result.current.services?.[0].characteristics[0]).toEqual({
      uuid: uuid("2A37"),
      service: uuid("180D"),
      properties: {
        read: false,
        write: false,
        writeWithoutResponse: false,
        notify: true,
        indicate: false,
      },
    });
    await act(async () => {
      await result.current.connect();
    });
    expect(adapter.connectCount).toBe(1);
  });

  it("does not connect without the permission or the radio", async () => {
    const { adapter, device } = setup({ permission: "denied" });
    const { result } = await device();
    await act(async () => {
      await expect(result.current.connect()).rejects.toMatchObject({
        code: "permission-denied",
      });
    });
    expect(result.current).toMatchObject({ status: "disconnected" });
    expect(result.current.error?.code).toBe("permission-denied");
    expect(adapter.connectCount).toBe(0);
  });

  it("gives up after its timeout and cancels the attempt", async () => {
    const { adapter, device } = setup();
    const disconnect = jest.spyOn(adapter, "disconnect");
    adapter.holdNextConnect();
    const { result } = await device();
    let outcome: Promise<unknown> = Promise.resolve();
    await act(async () => {
      outcome = result.current.connect({ timeout: 3000 }).catch((e) => e);
    });
    await flush(2999);
    expect(result.current.status).toBe("connecting");
    await flush(1);
    await expect(outcome).resolves.toMatchObject({
      name: "BluetoothError",
      code: "timeout",
    });
    expect(result.current.status).toBe("disconnected");
    expect(result.current.error?.code).toBe("timeout");
    expect(disconnect).toHaveBeenCalledWith(HRM);
  });

  it("reports a refused connection, and connects on the next try", async () => {
    const { adapter, device } = setup();
    adapter.failNextConnect("failed");
    const { result } = await device();
    await act(async () => {
      await expect(result.current.connect()).rejects.toMatchObject({
        code: "failed",
      });
    });
    expect(result.current.error?.code).toBe("failed");
    await act(async () => {
      await result.current.connect();
    });
    expect(result.current).toMatchObject({ status: "connected", error: null });
  });

  it("refuses a bad timeout and a bad id", async () => {
    const { device, wrapper } = setup();
    const { result } = await device();
    await expect(result.current.connect({ timeout: -1 })).rejects.toThrow(
      RangeError,
    );
    jest.spyOn(console, "error").mockImplementation(() => {});
    await expect(
      renderHook(() => useBluetoothDevice(""), { wrapper }),
    ).rejects.toThrow(TypeError);
  });

  it("disconnects on request, without an error", async () => {
    const { adapter, device } = setup();
    const { result } = await device();
    await act(async () => {
      await result.current.connect();
    });
    await act(async () => {
      await result.current.disconnect();
    });
    expect(result.current).toMatchObject({
      status: "disconnected",
      error: null,
      services: null,
    });
    expect(adapter.connected.size).toBe(0);
  });

  it("reports a dropped connection", async () => {
    const { adapter, device } = setup();
    const { result } = await device();
    await act(async () => {
      await result.current.connect();
    });
    await act(async () => adapter.disconnectBySystem(HRM));
    expect(result.current.status).toBe("disconnected");
    expect(result.current.error?.code).toBe("disconnected");
  });

  it("ends an attempt that disconnect() interrupts", async () => {
    const { adapter, device } = setup();
    const { result } = await device();
    await act(async () => {
      const connecting = result.current.connect();
      await result.current.disconnect();
      await expect(connecting).rejects.toMatchObject({ code: "disconnected" });
    });
    expect(result.current.status).toBe("disconnected");
    expect(adapter.connected.size).toBe(0);
  });

  it("closes the connection when the last component unmounts", async () => {
    const { adapter, device } = setup();
    const first = await device();
    const second = await device();
    await act(async () => {
      await first.result.current.connect();
    });
    await first.unmount();
    await flush();
    expect(adapter.connected.has(HRM)).toBe(true);
    await second.unmount();
    await flush();
    expect(adapter.connected.has(HRM)).toBe(false);
  });

  it("keeps it open with disconnectOnUnmount: false", async () => {
    const { adapter, device } = setup();
    const { result, unmount } = await device({ disconnectOnUnmount: false });
    await act(async () => {
      await result.current.connect();
    });
    await unmount();
    await flush();
    expect(adapter.connected.has(HRM)).toBe(true);
    const again = await device();
    expect(again.result.current.status).toBe("connected");
  });

  it("renders disconnected on the server", () => {
    const bluetooth = createMockBluetoothAdapter();
    const Probe = () => <>{useBluetoothDevice(HRM).status}</>;
    expect(
      renderToString(
        <DeviceAdaptersProvider adapters={{ bluetooth }}>
          <Probe />
        </DeviceAdaptersProvider>,
      ),
    ).toBe("disconnected");
  });
});

describe("GATT", () => {
  async function connected(options: MockBluetoothOptions = {}) {
    const context = setup(options);
    const hook = await context.device();
    await act(async () => {
      await hook.result.current.connect();
    });
    return { ...context, ...hook };
  }

  it("reads, with SIG short UUIDs", async () => {
    const { result } = await connected();
    await expect(result.current.read("180F", "2A19")).resolves.toEqual(
      Uint8Array.from([87]),
    );
    await expect(readBatteryLevel(result.current)).resolves.toBe(87);
  });

  it("refuses GATT without a connection, and bad UUIDs before anything", async () => {
    const { device } = setup();
    const { result } = await device();
    await expect(result.current.read("180F", "2A19")).rejects.toMatchObject({
      code: "not-connected",
    });
    await expect(result.current.readRssi()).rejects.toMatchObject({
      code: "not-connected",
    });
    expect(() => result.current.read("battery", "2A19")).toThrow(TypeError);
  });

  it("writes with response where the characteristic allows it, without otherwise", async () => {
    const { adapter, result } = await connected();
    await result.current.write("180D", "2A39", [1]);
    await result.current.write(
      BLUETOOTH_SERVICES.nordicUart,
      BLUETOOTH_CHARACTERISTICS.nordicUartRx,
      encodeUtf8("BADGE 42\n"),
    );
    expect(adapter.writes).toEqual([
      {
        deviceId: HRM,
        service: uuid("180D"),
        characteristic: uuid("2A39"),
        value: Uint8Array.from([1]),
        withResponse: true,
      },
      expect.objectContaining({
        characteristic: BLUETOOTH_CHARACTERISTICS.nordicUartRx,
        value: encodeUtf8("BADGE 42\n"),
        withResponse: false,
      }),
    ]);
    await expect(
      result.current.write("180D", "2A39", [1], { withResponse: false }),
    ).rejects.toMatchObject({ code: "failed" });
  });

  it("refuses a value that is not bytes", async () => {
    const { adapter, result } = await connected();
    for (const value of ["text", [256], [1.5], [-1]]) {
      expect(() =>
        result.current.write("180D", "2A39", value as never),
      ).toThrow(TypeError);
    }
    expect(adapter.writes).toEqual([]);
  });

  it("times out a GATT call the device never answers", async () => {
    const { adapter, result } = await connected();
    jest.spyOn(adapter, "read").mockReturnValue(new Promise(() => {}));
    const outcome = result.current.read("180F", "2A19").catch((e) => e);
    await flush(10_000);
    await expect(outcome).resolves.toMatchObject({ code: "timeout" });
  });

  it("passes the device's failure on", async () => {
    const { adapter, result } = await connected();
    adapter.failNextGatt("disconnected");
    await expect(result.current.read("180F", "2A19")).rejects.toMatchObject({
      code: "disconnected",
    });
    jest.spyOn(adapter, "readRssi").mockRejectedValueOnce("native says no");
    await expect(result.current.readRssi()).rejects.toMatchObject({
      name: "BluetoothError",
      code: "failed",
    });
  });

  it("negotiates the MTU and reads the signal", async () => {
    const { result } = await connected({ maxMtu: 185 });
    await act(async () => {
      await expect(result.current.requestMtu(517)).resolves.toBe(185);
    });
    expect(result.current.mtu).toBe(185);
    await expect(result.current.readRssi()).resolves.toBe(-55);
    for (const mtu of [22, 518, 100.5]) {
      await expect(result.current.requestMtu(mtu)).rejects.toThrow(RangeError);
    }
  });

  it("bonds where the platform lets the app ask", async () => {
    const { adapter, result } = await connected();
    expect(result.current.canBond).toBe(true);
    await result.current.bond();
    expect(adapter.bonded.has(HRM)).toBe(true);
  });

  it("cannot bond on iOS", async () => {
    const { result } = await connected({ bond: false });
    expect(result.current.canBond).toBe(false);
    await expect(result.current.bond()).rejects.toMatchObject({
      code: "unsupported",
    });
  });
});

describe("useBluetoothNotifications", () => {
  const KEY = `${HRM}/${uuid("180D")}/${uuid("2A37")}`;

  function setupNotifications(options: MockBluetoothOptions = {}) {
    const context = setup(options);
    const listen = (onValue: (value: Uint8Array) => void, enabled = true) =>
      renderHook(
        (props: { enabled: boolean }) =>
          useBluetoothNotifications(HRM, "180D", "2A37", onValue, props),
        { wrapper: context.wrapper, initialProps: { enabled } },
      );
    return { ...context, listen };
  }

  it("turns on once connected, delivers values, and is shared", async () => {
    const { adapter, device, listen } = setupNotifications();
    const first = jest.fn();
    const second = jest.fn();
    const a = await listen(first);
    const b = await listen(second);
    expect(a.result.current).toEqual({ isActive: false, error: null });
    const { result } = await device();
    await act(async () => {
      await result.current.connect();
    });
    await flush();
    expect(a.result.current).toEqual({ isActive: true, error: null });
    expect(adapter.notifying).toEqual(new Set([KEY]));
    await act(async () => {
      adapter.notify(HRM, "180D", "2A37", [0x06, 72]);
    });
    expect(first).toHaveBeenCalledWith(Uint8Array.from([0x06, 72]));
    expect(second).toHaveBeenCalledTimes(1);
    expect(result.current.notifications).toEqual({
      [`${uuid("180D")}/${uuid("2A37")}`]: { isActive: true, error: null },
    });

    await a.unmount();
    await flush();
    expect(adapter.notifying.size).toBe(1);
    await b.unmount();
    await flush();
    expect(adapter.notifying.size).toBe(0);
  });

  it("turns on at once on a connected device, and off when disabled", async () => {
    const { adapter, device, listen } = setupNotifications();
    const { result } = await device();
    await act(async () => {
      await result.current.connect();
    });
    const hook = await listen(jest.fn());
    await flush();
    expect(hook.result.current.isActive).toBe(true);
    await hook.rerender({ enabled: false });
    await flush();
    expect(hook.result.current.isActive).toBe(false);
    expect(adapter.notifying.size).toBe(0);
  });

  it("turns on again after a reconnection", async () => {
    const { adapter, device, listen } = setupNotifications();
    const onValue = jest.fn();
    const hook = await listen(onValue);
    const { result } = await device();
    await act(async () => {
      await result.current.connect();
    });
    await act(async () => adapter.disconnectBySystem(HRM));
    expect(hook.result.current.isActive).toBe(false);
    await act(async () => {
      await result.current.connect();
    });
    await flush();
    expect(hook.result.current.isActive).toBe(true);
    await act(async () => {
      adapter.notify(HRM, "180D", "2A37", [1]);
    });
    expect(onValue).toHaveBeenCalledTimes(1);
  });

  it("reports a characteristic that does not notify", async () => {
    const { device, wrapper } = setupNotifications();
    const hook = await renderHook(
      () => useBluetoothNotifications(HRM, "180D", "2A39", jest.fn()),
      { wrapper },
    );
    const { result } = await device();
    await act(async () => {
      await result.current.connect();
    });
    await flush();
    expect(hook.result.current.isActive).toBe(false);
    expect(hook.result.current.error?.code).toBe("failed");
  });

  it("calls the latest callback, and every reader even when one throws", async () => {
    const { adapter, device, listen } = setupNotifications();
    const failing = jest.fn(() => {
      throw new Error("app bug");
    });
    const later = jest.fn();
    await listen(failing);
    await listen(later);
    const { result } = await device();
    await act(async () => {
      await result.current.connect();
    });
    await flush();
    expect(() => adapter.notify(HRM, "180D", "2A37", [1])).toThrow("app bug");
    expect(later).toHaveBeenCalledTimes(1);
  });

  it("stops what turned on after every reader left", async () => {
    const { adapter, device, listen } = setupNotifications();
    const { result } = await device();
    await act(async () => {
      await result.current.connect();
    });
    let release: () => void = () => {};
    jest
      .spyOn(adapter, "startNotifications")
      .mockImplementationOnce(
        () => new Promise<void>((resolve) => (release = resolve)),
      );
    const stop = jest.spyOn(adapter, "stopNotifications");
    const hook = await listen(jest.fn());
    await hook.unmount();
    await act(async () => release());
    await flush();
    expect(stop).toHaveBeenCalledWith(HRM, uuid("180D"), uuid("2A37"));
  });
});

describe("profiles", () => {
  it("reads the Device Information strings the device has", async () => {
    const context = setup();
    const { result } = await context.device();
    await act(async () => {
      await result.current.connect();
    });
    await expect(readDeviceInformation(result.current)).resolves.toEqual({
      manufacturerName: "Acme",
      modelNumber: "HRM-1",
      serialNumber: null,
      hardwareRevision: null,
      firmwareRevision: null,
      softwareRevision: null,
    });
  });

  it("needs a connection and the service", async () => {
    await expect(
      readDeviceInformation({ services: null, read: jest.fn() }),
    ).rejects.toMatchObject({ code: "not-connected" });
    await expect(
      readBatteryLevel({ services: [], read: jest.fn() }),
    ).rejects.toMatchObject({
      code: "failed",
      message: "The device has no Battery service.",
    });
  });

  it("parses the battery level", () => {
    expect(parseBatteryLevel(Uint8Array.from([100]))).toBe(100);
    expect(() => parseBatteryLevel(Uint8Array.from([101]))).toThrow(
      "Not a battery level: 101%.",
    );
    expect(() => parseBatteryLevel(new Uint8Array())).toThrow("no bytes");
  });

  it("encodes and decodes UTF-8", () => {
    const text = "Badge è 42 ✓ 🔑";
    expect(decodeUtf8(encodeUtf8(text))).toBe(text);
    expect(Array.from(encodeUtf8("è"))).toEqual([0xc3, 0xa8]);
    expect(decodeUtf8(Uint8Array.from([0x41, 0x00, 0x00]))).toBe("A");
    expect(decodeUtf8(Uint8Array.from([0x00, 0x41, 0x00]))).toBe("\0A");
    // A long run of padding followed by text: linear, not a regex backtrack.
    const padded = new Uint8Array(200_001);
    padded[200_000] = 0x41;
    expect(decodeUtf8(padded)).toHaveLength(200_001);
    expect(decodeUtf8(Uint8Array.from([0x41, 0xff, 0x42]))).toBe("A�B");
    expect(decodeUtf8(Uint8Array.from([0xe2, 0x82]))).toBe("��");
    expect(decodeUtf8(Uint8Array.from([0xed, 0xa0, 0x80]))).toBe("���");
  });
});
