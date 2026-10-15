import { act, renderHook } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { AppState } from "react-native";

import { DeviceAdaptersProvider } from "..";
import {
  DEFAULT_SCAN_TIMEOUT,
  useBluetoothScan,
  type UseBluetoothScan,
} from "../bluetooth";
import {
  buildBluetoothDevice,
  createMockBluetoothAdapter,
  type MockBluetoothOptions,
} from "../testing";

const HEART_RATE = "0000180d-0000-1000-8000-00805f9b34fb";

// jest-expo's AppState.addEventListener is a jest.fn: swap it for one that
// lets the test move the app between states.
let appStateListeners: ((state: string) => void)[] = [];
const originalAddEventListener = AppState.addEventListener;

beforeEach(() => {
  jest.useFakeTimers({ now: 1_000_000 });
  appStateListeners = [];
  AppState.addEventListener = ((_type: string, listener: never) => {
    appStateListeners.push(listener);
    return {
      remove: () => {
        appStateListeners = appStateListeners.filter((l) => l !== listener);
      },
    };
  }) as never;
});

afterEach(() => {
  AppState.addEventListener = originalAddEventListener;
  jest.useRealTimers();
});

async function moveTo(...states: string[]) {
  for (const state of states) {
    await act(async () => appStateListeners.forEach((l) => l(state)));
  }
}

async function advance(ms: number) {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });
}

async function setup(options: MockBluetoothOptions = {}) {
  const adapter = createMockBluetoothAdapter({
    permission: "granted",
    ...options,
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <DeviceAdaptersProvider adapters={{ bluetooth: adapter }}>
      {children}
    </DeviceAdaptersProvider>
  );
  const hook = await renderHook(() => useBluetoothScan(), { wrapper });
  return { adapter, wrapper, ...hook };
}

async function start(
  result: { current: UseBluetoothScan },
  options?: Parameters<UseBluetoothScan["start"]>[0],
) {
  await act(async () => {
    await result.current.start(options);
  });
}

describe("useBluetoothScan", () => {
  it("scans, and lists each device once with its latest signal", async () => {
    const { adapter, result } = await setup();
    expect(result.current).toMatchObject({
      devices: [],
      isScanning: false,
      error: null,
    });
    await start(result);
    expect(result.current.isScanning).toBe(true);
    expect(adapter.scanning).toEqual({ services: [] });

    await act(async () => {
      adapter.discover({ id: "a", name: "Scale", rssi: -70 });
    });
    expect(result.current.devices).toEqual([
      expect.objectContaining({
        id: "a",
        name: "Scale",
        rssi: -70,
        firstSeen: 1_000_000,
        lastSeen: 1_000_000,
      }),
    ]);

    await advance(1000);
    await act(async () => {
      // A scan response may come without the name.
      adapter.discover({ id: "a", name: null, rssi: -50 });
      adapter.discover({ id: "b", name: "Clock" });
    });
    await advance(SCAN_WINDOW);
    expect(result.current.devices).toEqual([
      expect.objectContaining({
        id: "a",
        name: "Scale",
        rssi: -50,
        firstSeen: 1_000_000,
        lastSeen: 1_001_000,
      }),
      expect.objectContaining({ id: "b", name: "Clock" }),
    ]);
  });

  it("renders a burst of advertisements at most every 250 ms", async () => {
    const { adapter, result } = await setup();
    await start(result);
    await act(async () => {
      adapter.discover({ id: "a" });
    });
    expect(result.current.devices).toHaveLength(1);
    await act(async () => {
      adapter.discover({ id: "b" });
      adapter.discover({ id: "c" });
    });
    expect(result.current.devices).toHaveLength(1);
    await advance(249);
    expect(result.current.devices).toHaveLength(1);
    await advance(1);
    expect(result.current.devices).toHaveLength(3);
  });

  it("asks the platform for the services, in the package's form", async () => {
    const { adapter, result } = await setup();
    await start(result, { services: ["180D", "0x180d", HEART_RATE] });
    expect(adapter.scanning).toEqual({ services: [HEART_RATE] });
    await act(async () => {
      expect(adapter.discover({ id: "scale" })).toBe(false);
      expect(
        adapter.discover({
          id: "hrm",
          advertisement: { serviceUuids: ["180D"] },
        }),
      ).toBe(true);
    });
    expect(result.current.devices.map((d) => d.id)).toEqual(["hrm"]);
  });

  it("stops after its timeout, keeping the list", async () => {
    const { adapter, result } = await setup();
    await start(result);
    await act(async () => {
      adapter.discover();
    });
    await advance(DEFAULT_SCAN_TIMEOUT - 1);
    expect(result.current.isScanning).toBe(true);
    await advance(1);
    expect(result.current.isScanning).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.devices).toHaveLength(1);
    expect(adapter.scanning).toBeNull();
  });

  it("scans until stopped with timeout 0", async () => {
    const { adapter, result } = await setup();
    await start(result, { timeout: 0 });
    await advance(10 * 60_000);
    expect(result.current.isScanning).toBe(true);
    await act(async () => {
      await result.current.stop();
    });
    expect(result.current.isScanning).toBe(false);
    expect(adapter.scanning).toBeNull();
  });

  it("starts over on a new start, and clear() empties the list", async () => {
    const { adapter, result } = await setup();
    await start(result);
    await act(async () => {
      adapter.discover({ id: "a" });
    });
    await start(result, { services: ["180F"] });
    expect(result.current.devices).toEqual([]);
    expect(adapter.scanCount).toBe(2);
    await act(async () => {
      adapter.discover({ id: "b", advertisement: { serviceUuids: ["180F"] } });
    });
    expect(result.current.devices).toHaveLength(1);
    await act(async () => result.current.clear());
    expect(result.current.devices).toEqual([]);
    expect(result.current.isScanning).toBe(true);
  });

  it("does not scan without the permission, and says why", async () => {
    const { adapter, result } = await setup({ permission: "undetermined" });
    await act(async () => {
      await expect(result.current.start()).rejects.toMatchObject({
        name: "BluetoothError",
        code: "permission-denied",
      });
    });
    expect(result.current.isScanning).toBe(false);
    expect(result.current.error?.code).toBe("permission-denied");
    expect(adapter.scanCount).toBe(0);
    expect(adapter.requestCount).toBe(0);
  });

  it.each<[MockBluetoothOptions, string]>([
    [{ state: "off" }, "powered-off"],
    [{ supported: false }, "unsupported"],
  ])("refuses to scan with %j", async (options, code) => {
    const { adapter, result } = await setup(options);
    await act(async () => {
      await expect(result.current.start()).rejects.toMatchObject({ code });
    });
    expect(adapter.scanCount).toBe(0);
  });

  it("reports a scan the platform refused to start", async () => {
    const { adapter, result } = await setup();
    adapter.failNextScan("failed");
    await act(async () => {
      await expect(result.current.start()).rejects.toMatchObject({
        code: "failed",
      });
    });
    expect(result.current).toMatchObject({ isScanning: false });
    expect(result.current.error?.code).toBe("failed");
  });

  it("wraps what is not a BluetoothError", async () => {
    const { adapter, result } = await setup();
    jest.spyOn(adapter, "startScan").mockRejectedValueOnce("native says no");
    await act(async () => {
      await expect(result.current.start()).rejects.toMatchObject({
        name: "BluetoothError",
        code: "failed",
        message: "native says no",
      });
    });
  });

  it("ends with the platform's failure", async () => {
    const { adapter, result } = await setup();
    await start(result);
    await act(async () => {
      adapter.discover();
    });
    await act(async () => adapter.failScan("failed"));
    expect(result.current.isScanning).toBe(false);
    expect(result.current.error?.code).toBe("failed");
    expect(result.current.devices).toHaveLength(1);
  });

  it("ends when the radio goes off", async () => {
    const { adapter, result } = await setup();
    await start(result);
    await act(async () => adapter.setState("off"));
    expect(result.current.isScanning).toBe(false);
    expect(result.current.error?.code).toBe("powered-off");
  });

  it("ends when iOS takes the permission away", async () => {
    const { adapter, result } = await setup();
    await start(result);
    await act(async () => adapter.setState("unauthorized"));
    expect(result.current.error?.code).toBe("permission-denied");
  });

  it("pauses in the background and resumes for the time it had left", async () => {
    const { adapter, result } = await setup();
    await start(result);
    await advance(4000);
    await moveTo("inactive");
    expect(adapter.scanning).not.toBeNull();
    await moveTo("background");
    expect(adapter.scanning).toBeNull();
    // Time in the background does not count.
    await advance(60_000);
    expect(result.current.isScanning).toBe(true);
    await moveTo("active");
    expect(adapter.scanning).not.toBeNull();
    expect(adapter.scanCount).toBe(2);
    await advance(5999);
    expect(result.current.isScanning).toBe(true);
    await advance(1);
    expect(result.current.isScanning).toBe(false);
    expect(adapter.scanning).toBeNull();
  });

  it("resumes an endless scan", async () => {
    const { adapter, result } = await setup();
    await start(result, { timeout: 0 });
    await moveTo("background", "active");
    expect(adapter.scanCount).toBe(2);
    await advance(60_000);
    expect(result.current.isScanning).toBe(true);
  });

  it("ends instead of resuming when the radio went off meanwhile", async () => {
    const { adapter, result } = await setup();
    await start(result);
    await moveTo("background");
    await act(async () => adapter.setState("off"));
    expect(result.current.isScanning).toBe(true);
    await moveTo("active");
    expect(result.current.isScanning).toBe(false);
    expect(result.current.error?.code).toBe("powered-off");
    expect(adapter.scanCount).toBe(1);
  });

  it("is shared, and stops with the last reader", async () => {
    const { adapter, wrapper, result, unmount } = await setup();
    const other = await renderHook(() => useBluetoothScan(), { wrapper });
    await start(result);
    await act(async () => {
      adapter.discover();
    });
    expect(other.result.current.devices).toHaveLength(1);
    expect(other.result.current.isScanning).toBe(true);
    // Fake timers also hold queueMicrotask, where the store checks for readers.
    await unmount();
    await act(async () => jest.runAllTicks());
    expect(adapter.scanning).not.toBeNull();
    await other.unmount();
    await act(async () => jest.runAllTicks());
    expect(adapter.scanning).toBeNull();
  });

  it("starts nothing when stopped while it checks the permission", async () => {
    const { adapter, result } = await setup();
    await act(async () => {
      const starting = result.current.start();
      await result.current.stop();
      await starting;
    });
    expect(adapter.scanCount).toBe(0);
    expect(result.current.isScanning).toBe(false);
  });

  it.each<[unknown, ErrorConstructor]>([
    [{ services: "180D" }, TypeError],
    [{ services: ["not a uuid"] }, TypeError],
    [{ timeout: -1 }, RangeError],
    [{ timeout: Number.NaN }, RangeError],
    [{ timeout: Infinity }, RangeError],
  ])("refuses %j before scanning", async (options, type) => {
    const { adapter, result } = await setup();
    await expect(result.current.start(options as never)).rejects.toThrow(type);
    expect(adapter.scanCount).toBe(0);
    expect(result.current.isScanning).toBe(false);
  });

  it("renders idle on the server", () => {
    const bluetooth = createMockBluetoothAdapter();
    const Probe = () => {
      const scan = useBluetoothScan();
      return <>{`${scan.isScanning}|${scan.devices.length}`}</>;
    };
    expect(
      renderToString(
        <DeviceAdaptersProvider adapters={{ bluetooth }}>
          <Probe />
        </DeviceAdaptersProvider>,
      ),
    ).toBe("false|0");
  });
});

describe("buildBluetoothDevice", () => {
  it("builds a heart rate monitor by default, overrides merged", () => {
    expect(buildBluetoothDevice()).toEqual({
      id: "AA:BB:CC:DD:EE:01",
      name: "HRM",
      rssi: -60,
      advertisement: {
        localName: "HRM",
        serviceUuids: [],
        serviceData: {},
        manufacturerData: null,
        txPowerLevel: null,
        isConnectable: true,
      },
    });
    expect(
      buildBluetoothDevice({
        name: null,
        advertisement: { serviceUuids: ["180D"], txPowerLevel: -4 },
      }).advertisement,
    ).toMatchObject({
      localName: null,
      serviceUuids: [HEART_RATE],
      txPowerLevel: -4,
    });
  });
});

const SCAN_WINDOW = 250;
