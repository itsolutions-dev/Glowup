import { act, renderHook } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { AppState } from "react-native";

import { DeviceAdaptersProvider } from "..";
import {
  isRfidError,
  LOCATE_LOST_AFTER,
  useRfidInventory,
  useRfidLocate,
  useRfidPermission,
  useRfidReader,
  useRfidReaderDiscovery,
  useRfidSingleRead,
  useRfidTrigger,
} from "../rfid";
import { createMockRfidAdapter, type MockRfidOptions } from "../testing";

const READER = "00:11:22:33:44:55";
const EPC_A = "E2801170000002120FD4A0F1";
const EPC_B = "E2801170000002120FD4A0F2";

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

async function advance(ms: number) {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });
}

async function moveTo(state: string) {
  await act(async () => appStateListeners.forEach((l) => l(state)));
}

function useEverything() {
  return {
    reader: useRfidReader(),
    inventory: useRfidInventory(),
    single: useRfidSingleRead(),
    locate: useRfidLocate(),
  };
}

async function setup(
  options: MockRfidOptions = {},
  { connect = true }: { connect?: boolean } = {},
) {
  const adapter = createMockRfidAdapter({ permission: "granted", ...options });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <DeviceAdaptersProvider adapters={{ rfid: adapter }}>
      {children}
    </DeviceAdaptersProvider>
  );
  const hook = await renderHook(useEverything, { wrapper });
  if (connect) {
    await act(async () => {
      await hook.result.current.reader.connect(READER);
    });
  }
  return { adapter, wrapper, ...hook };
}

/** The rejection's `RfidError` code, or what else settled. */
async function codeOf(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
    return "resolved";
  } catch (error) {
    return isRfidError(error) ? error.code : String(error);
  }
}

async function settle<T>(run: () => Promise<T>): Promise<string> {
  let code = "";
  await act(async () => {
    code = await codeOf(run());
  });
  return code;
}

describe("useRfidReader", () => {
  it("reads unsupported without an adapter", async () => {
    const { result } = await renderHook(() => useRfidReader());
    expect(result.current).toMatchObject({
      isSupported: false,
      vendor: "none",
      state: "disconnected",
      readerId: null,
    });
    expect(await settle(() => result.current.connect(READER))).toBe(
      "unsupported",
    );
    expect(result.current.error?.code).toBe("unsupported");
  });

  it("refuses an adapter written for another contract version", async () => {
    const { result } = await setup({ contractVersion: 0 }, { connect: false });
    expect(result.current.reader.isSupported).toBe(false);
    expect(await settle(() => result.current.reader.connect(READER))).toBe(
      "incompatible-adapter",
    );
    expect(result.current.reader.error?.message).toMatch(
      /contract version 0, this @its\/glowup-device implements 1/,
    );
  });

  it("connects, reports the state and stays connected until disconnect()", async () => {
    const { adapter, result, unmount } = await setup();
    expect(result.current.reader).toMatchObject({
      isSupported: true,
      vendor: "mock",
      state: "connected",
      readerId: READER,
      isLoading: false,
      error: null,
    });
    // Connecting again to the same reader is a no-op.
    await act(async () => {
      await result.current.reader.connect(READER);
    });
    expect(adapter.connectCount).toBe(1);
    await unmount();
    expect(adapter.connection.state).toBe("connected");
  });

  it("checks the permission first and never prompts", async () => {
    const adapter = createMockRfidAdapter();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <DeviceAdaptersProvider adapters={{ rfid: adapter }}>
        {children}
      </DeviceAdaptersProvider>
    );
    const { result } = await renderHook(
      () => ({ reader: useRfidReader(), permission: useRfidPermission() }),
      { wrapper },
    );
    expect(await settle(() => result.current.reader.connect(READER))).toBe(
      "permission-denied",
    );
    expect(result.current.reader.error?.message).toMatch(/useRfidPermission/);
    expect(adapter.requestCount).toBe(0);

    await act(async () => {
      await result.current.permission.request();
    });
    expect(result.current.permission.status).toBe("granted");
    expect(await settle(() => result.current.reader.connect(READER))).toBe(
      "resolved",
    );
    expect(result.current.reader.error).toBeNull();
  });

  it("keeps the latest failure until a connect succeeds", async () => {
    const { adapter, result } = await setup({}, { connect: false });
    expect(await settle(() => result.current.reader.connect("AA:AA"))).toBe(
      "failed",
    );
    expect(result.current.reader.error?.message).toBe(
      "No reader AA:AA answered.",
    );
    adapter.failNextConnect("timeout");
    expect(await settle(() => result.current.reader.connect(READER))).toBe(
      "timeout",
    );
    expect(await settle(() => result.current.reader.connect(READER))).toBe(
      "resolved",
    );
    expect(result.current.reader.error).toBeNull();
  });

  it("gives up after the timeout and closes the attempt", async () => {
    const { adapter, result } = await setup({}, { connect: false });
    adapter.holdNextConnect();
    let code: Promise<string> = Promise.resolve("");
    await act(async () => {
      code = codeOf(result.current.reader.connect(READER, { timeout: 1_000 }));
    });
    expect(result.current.reader.state).toBe("connecting");
    await advance(1_000);
    expect(await code).toBe("timeout");
    expect(adapter.connection.state).toBe("disconnected");
    expect(result.current.reader.state).toBe("disconnected");
  });

  it("rejects bad arguments before touching the reader", async () => {
    const { adapter, result } = await setup({}, { connect: false });
    await expect(result.current.reader.connect("")).rejects.toThrow(TypeError);
    await expect(
      result.current.reader.connect(READER, { timeout: 0 }),
    ).rejects.toThrow(RangeError);
    expect(adapter.connectCount).toBe(0);
  });

  it("reports a drop as reconnecting, and modes wait for connected", async () => {
    const { adapter, result } = await setup();
    await act(async () => adapter.dropConnection());
    expect(result.current.reader.state).toBe("reconnecting");
    let message = "";
    await act(async () => {
      await result.current.inventory.start().catch((error: Error) => {
        message = error.message;
      });
    });
    expect(message).toBe(
      "The RFID reader is reconnecting: wait until it is connected.",
    );
    await act(async () => adapter.reconnect());
    expect(result.current.reader.state).toBe("connected");
    expect(await settle(() => result.current.inventory.start())).toBe(
      "resolved",
    );
  });

  it("reads and checks the settings in dBm", async () => {
    const { adapter, result } = await setup();
    const { reader } = result.current;
    expect(reader.powerRange).toEqual({ min: 5, max: 30 });
    expect(await reader.getSettings()).toEqual({
      power: 30,
      session: 1,
      beeperVolume: "medium",
      region: "EU",
    });
    await expect(reader.setSettings({ power: 31 })).rejects.toThrow(
      "setSettings(): power must be between 5 and 30 dBm on this reader, got 31.",
    );
    await expect(reader.setSettings({ session: 4 as never })).rejects.toThrow(
      RangeError,
    );
    await expect(
      reader.setSettings({ beeperVolume: "loud" as never }),
    ).rejects.toThrow(RangeError);
    expect(
      await reader.setSettings({ power: 20, beeperVolume: "off" }),
    ).toMatchObject({
      power: 20,
      beeperVolume: "off",
    });
    expect(adapter.settings.power).toBe(20);
  });

  it("reports the battery and the reader when the adapter can", async () => {
    const { adapter, result } = await setup();
    expect(await result.current.reader.getBatteryLevel()).toBe(80);
    adapter.setBattery(15);
    expect(await result.current.reader.getBatteryLevel()).toBe(15);
    expect(await result.current.reader.getReaderInfo()).toMatchObject({
      id: READER,
      name: "Mock RFID reader",
    });

    const bare = await setup({
      capabilities: { battery: false, readerInfo: false },
    });
    expect(await bare.result.current.reader.getBatteryLevel()).toBeNull();
    expect(await bare.result.current.reader.getReaderInfo()).toBeNull();
  });

  it("names what each adapter does natively", async () => {
    const full = await setup({}, { connect: false });
    expect(full.result.current.reader.capabilities).toEqual({
      locate: "native",
      singleRead: "native",
      tid: true,
      trigger: true,
      discovery: true,
      battery: true,
      readerInfo: true,
    });
    const bare = await setup(
      {
        capabilities: {
          locate: false,
          readOnce: false,
          trigger: false,
          discovery: false,
          battery: false,
          readerInfo: false,
          tid: false,
        },
      },
      { connect: false },
    );
    expect(bare.result.current.reader.capabilities).toEqual({
      locate: "emulated",
      singleRead: "emulated",
      tid: false,
      trigger: false,
      discovery: false,
      battery: false,
      readerInfo: false,
    });
  });

  it("stops the running mode on disconnect()", async () => {
    const { adapter, result } = await setup();
    await act(async () => {
      await result.current.inventory.start();
    });
    await act(async () => {
      await result.current.reader.disconnect();
    });
    expect(result.current.inventory.isRunning).toBe(false);
    expect(result.current.inventory.error).toBeNull();
    expect(adapter.inventory).toBeNull();
    expect(result.current.reader.state).toBe("disconnected");
  });
});

describe("useRfidInventory", () => {
  it("lists each tag once, nearest first, with its proximity", async () => {
    const { adapter, result } = await setup();
    await act(async () => {
      await result.current.inventory.start();
    });
    expect(adapter.inventory).toEqual({ tid: false });
    expect(result.current.inventory.isRunning).toBe(true);

    await act(async () =>
      adapter.emitTags([
        { epc: EPC_B.toLowerCase(), rssi: -70 },
        { epc: EPC_A, rssi: -40, antenna: 2 },
      ]),
    );
    // The first batch shows at once.
    expect(result.current.inventory.tags).toEqual([
      {
        epc: EPC_A,
        tid: null,
        rssi: -40,
        averageRssi: -40,
        proximity: 0.875,
        antenna: 2,
        readCount: 1,
        firstSeen: 1_000_000,
        lastSeen: 1_000_000,
      },
      expect.objectContaining({ epc: EPC_B, proximity: 0.125 }),
    ]);

    // Later reads merge, smoothed, and render at most every 250 ms.
    await advance(100);
    await act(async () => adapter.emitTags([{ epc: EPC_A, rssi: -60 }]));
    expect(result.current.inventory.tags[0]!.readCount).toBe(1);
    await advance(150);
    expect(result.current.inventory.tags[0]).toMatchObject({
      epc: EPC_A,
      rssi: -60,
      averageRssi: -46,
      readCount: 2,
      lastSeen: 1_000_100,
    });
  });

  it("ignores reads whose EPC is not one", async () => {
    const { adapter, result } = await setup();
    await act(async () => {
      await result.current.inventory.start();
    });
    await act(async () =>
      adapter.emitTags([{ epc: "XYZ" }, { epc: "E28" }, { epc: EPC_A }]),
    );
    expect(result.current.inventory.tags.map((t) => t.epc)).toEqual([EPC_A]);
  });

  it("sorts by first seen and uses calibrated bounds on request", async () => {
    const { adapter, result } = await setup();
    await act(async () => {
      await result.current.inventory.start({
        sort: "first-seen",
        proximity: { near: -50, far: -60 },
      });
    });
    await act(async () =>
      adapter.emitTags([
        { epc: EPC_B, rssi: -58 },
        { epc: EPC_A, rssi: -40 },
      ]),
    );
    expect(
      result.current.inventory.tags.map((t) => [t.epc, t.proximity]),
    ).toEqual([
      [EPC_B, 0.2],
      [EPC_A, 1],
    ]);
  });

  it("reads TIDs only when the adapter can", async () => {
    const { adapter, result } = await setup();
    await act(async () => {
      await result.current.inventory.start({ tid: true });
    });
    expect(adapter.inventory).toEqual({ tid: true });
    await act(async () =>
      adapter.emitTags([{ epc: EPC_A, tid: "e2801170200052e5" }]),
    );
    expect(result.current.inventory.tags[0]!.tid).toBe("E2801170200052E5");

    const bare = await setup({ capabilities: { tid: false } });
    expect(
      await settle(() => bare.result.current.inventory.start({ tid: true })),
    ).toBe("unsupported");
  });

  it("rejects bad options", async () => {
    const { result } = await setup();
    await expect(
      result.current.inventory.start({ proximity: { near: -80, far: -40 } }),
    ).rejects.toThrow(RangeError);
    await expect(
      result.current.inventory.start({ duration: -1 }),
    ).rejects.toThrow(RangeError);
    await expect(
      result.current.inventory.start({ forgetAfter: Infinity }),
    ).rejects.toThrow(RangeError);
  });

  it("stops on stop(), after its duration, and in the background", async () => {
    const { adapter, result } = await setup();
    await act(async () => {
      await result.current.inventory.start();
    });
    await act(async () => {
      await result.current.inventory.stop();
    });
    expect(adapter.inventory).toBeNull();
    expect(result.current.inventory).toMatchObject({
      isRunning: false,
      error: null,
    });

    await act(async () => {
      await result.current.inventory.start({ duration: 1_000 });
    });
    await advance(1_000);
    expect(result.current.inventory.isRunning).toBe(false);
    expect(adapter.inventory).toBeNull();

    await act(async () => {
      await result.current.inventory.start();
    });
    await moveTo("inactive");
    expect(result.current.inventory.isRunning).toBe(true);
    await moveTo("background");
    expect(result.current.inventory.isRunning).toBe(false);
    await advance(0);
    expect(adapter.inventory).toBeNull();
  });

  it("forgets tags out of range when asked", async () => {
    const { adapter, result } = await setup();
    await act(async () => {
      await result.current.inventory.start({ forgetAfter: 3_000 });
    });
    await act(async () => adapter.emitTags([{ epc: EPC_A }]));
    await advance(2_000);
    await act(async () => adapter.emitTags([{ epc: EPC_B }]));
    await advance(1_000);
    expect(result.current.inventory.tags).toHaveLength(2);
    // Swept every second: A, last heard at 0, is gone by 4000.
    await advance(1_000);
    expect(result.current.inventory.tags.map((t) => t.epc)).toEqual([EPC_B]);
  });

  it("ends with disconnected when the reader drops", async () => {
    const { adapter, result } = await setup();
    await act(async () => {
      await result.current.inventory.start();
    });
    await act(async () => adapter.dropConnection());
    expect(result.current.inventory.isRunning).toBe(false);
    expect(result.current.inventory.error?.code).toBe("disconnected");
  });

  it("ends with the reader's failure, and reports a failed start", async () => {
    const { adapter, result } = await setup();
    await act(async () => {
      await result.current.inventory.start();
    });
    await act(async () => adapter.failRead("failed"));
    expect(result.current.inventory.error?.code).toBe("failed");

    adapter.failNextStart("timeout");
    expect(await settle(() => result.current.inventory.start())).toBe(
      "timeout",
    );
    expect(result.current.inventory).toMatchObject({
      isRunning: false,
      error: expect.objectContaining({ code: "timeout" }),
    });
  });

  it("requires a connected reader", async () => {
    const { result } = await setup({}, { connect: false });
    expect(await settle(() => result.current.inventory.start())).toBe(
      "not-connected",
    );
    expect(result.current.inventory.error?.code).toBe("not-connected");
  });

  it("stops once no component reads it", async () => {
    const { adapter, result, unmount } = await setup();
    await act(async () => {
      await result.current.inventory.start();
    });
    await unmount();
    await act(async () => jest.runAllTicks());
    await advance(0);
    expect(adapter.inventory).toBeNull();
  });

  it("clears the list", async () => {
    const { adapter, result } = await setup();
    await act(async () => {
      await result.current.inventory.start();
    });
    await act(async () => adapter.emitTags([{ epc: EPC_A }]));
    await act(async () => result.current.inventory.clear());
    expect(result.current.inventory.tags).toEqual([]);
    expect(result.current.inventory.isRunning).toBe(true);
  });
});

describe("one mode at a time", () => {
  it("a locate replaces the inventory, which ends without an error", async () => {
    const { adapter, result } = await setup();
    await act(async () => {
      await result.current.inventory.start();
    });
    await act(async () => {
      await result.current.locate.start(EPC_A);
    });
    expect(result.current.inventory).toMatchObject({
      isRunning: false,
      error: null,
    });
    expect(adapter.inventory).toBeNull();
    expect(adapter.locating).toBe(EPC_A);
    expect(result.current.locate.isLocating).toBe(true);
  });

  it("the last start wins when two race", async () => {
    const { adapter, result } = await setup();
    let first: Promise<string> = Promise.resolve("");
    await act(async () => {
      first = codeOf(result.current.inventory.start());
      await result.current.locate.start(EPC_A);
    });
    expect(await first).toBe("cancelled");
    expect(adapter.inventoryCount).toBe(0);
    expect(adapter.locating).toBe(EPC_A);
  });

  it("a replaced single read rejects with cancelled", async () => {
    const { adapter, result } = await setup();
    let read: Promise<string> = Promise.resolve("");
    await act(async () => {
      read = codeOf(result.current.single.read());
    });
    let started: Promise<void> = Promise.resolve();
    await act(async () => {
      started = result.current.inventory.start();
    });
    expect(await read).toBe("cancelled");
    expect(result.current.single.error?.code).toBe("cancelled");
    // The native read finishes its window before the inventory starts.
    expect(adapter.inventory).toBeNull();
    await advance(500);
    await act(() => started);
    expect(adapter.inventory).toEqual({ tid: false });
  });
});

describe("useRfidSingleRead", () => {
  it("reads natively for the window and keeps the nearest tag", async () => {
    const { adapter, result } = await setup();
    let tag: Promise<unknown> = Promise.resolve();
    await act(async () => {
      tag = result.current.single.read({ window: 300 });
    });
    expect(result.current.single.isReading).toBe(true);
    await act(async () =>
      adapter.emitTags([
        { epc: EPC_B, rssi: -66 },
        { epc: EPC_A, rssi: -44 },
        { epc: EPC_B, rssi: -64 },
      ]),
    );
    await advance(300);
    await expect(tag).resolves.toMatchObject({ epc: EPC_A, rssi: -44 });
    expect(adapter.readOnceCount).toBe(1);
    expect(result.current.single).toMatchObject({
      isReading: false,
      tag: expect.objectContaining({ epc: EPC_A }),
      error: null,
    });
  });

  it("emulates the read with a short inventory", async () => {
    const { adapter, result } = await setup({
      capabilities: { readOnce: false },
    });
    let tag: Promise<unknown> = Promise.resolve();
    await act(async () => {
      tag = result.current.single.read();
    });
    expect(adapter.inventory).toEqual({ tid: false });
    await act(async () =>
      adapter.emitTags([
        { epc: EPC_A, rssi: -70 },
        { epc: EPC_B, rssi: -50 },
      ]),
    );
    await advance(500);
    await expect(tag).resolves.toMatchObject({ epc: EPC_B });
    expect(adapter.inventory).toBeNull();
  });

  it("resolves null when no tag answers", async () => {
    const { result } = await setup();
    let tag: Promise<unknown> = Promise.resolve("unset");
    await act(async () => {
      tag = result.current.single.read();
    });
    await advance(500);
    await expect(tag).resolves.toBeNull();
    expect(result.current.single.tag).toBeNull();
  });

  it("rejects a bad window and an unconnected reader", async () => {
    const { result } = await setup({}, { connect: false });
    await expect(result.current.single.read({ window: 0 })).rejects.toThrow(
      RangeError,
    );
    expect(await settle(() => result.current.single.read())).toBe(
      "not-connected",
    );
  });
});

describe("useRfidLocate", () => {
  it("follows one tag natively, and reads out of range when it goes quiet", async () => {
    const { adapter, result } = await setup();
    await act(async () => {
      await result.current.locate.start("e280-1170-0000-0212-0fd4-a0f1");
    });
    expect(adapter.locating).toBe(EPC_A);
    expect(result.current.locate).toMatchObject({
      epc: EPC_A,
      isLocating: true,
      isInRange: false,
      proximity: 0,
    });

    await act(async () => adapter.emitLocate(-45));
    expect(result.current.locate).toMatchObject({
      isInRange: true,
      rssi: -45,
      proximity: 0.75,
      lastSeen: 1_000_000,
    });
    await advance(100);
    await act(async () => adapter.emitLocate(-55));
    expect(result.current.locate.rssi).toBe(-50);

    await advance(LOCATE_LOST_AFTER + 500);
    expect(result.current.locate).toMatchObject({
      isLocating: true,
      isInRange: false,
      rssi: null,
      proximity: 0,
    });
    // Back in range: a new average.
    await act(async () => adapter.emitLocate(-35));
    expect(result.current.locate).toMatchObject({ rssi: -35, proximity: 1 });

    await act(async () => {
      await result.current.locate.stop();
    });
    expect(adapter.locating).toBeNull();
    expect(result.current.locate.isLocating).toBe(false);
  });

  it("emulates the search with an inventory filtered by the EPC", async () => {
    const { adapter, result } = await setup({
      capabilities: { locate: false },
    });
    await act(async () => {
      await result.current.locate.start(EPC_A);
    });
    expect(adapter.inventory).toEqual({ tid: false });
    await act(async () =>
      adapter.emitTags([
        { epc: EPC_B, rssi: -30 },
        { epc: EPC_A, rssi: -65 },
        { epc: EPC_A, rssi: -55 },
      ]),
    );
    expect(result.current.locate).toMatchObject({
      isInRange: true,
      rssi: -55,
      proximity: 0.5,
    });
  });

  it("rejects an EPC that is not one", async () => {
    const { adapter, result } = await setup();
    await expect(result.current.locate.start("E28")).rejects.toThrow(
      'useRfidLocate().start(): the EPC must be hex in whole 16-bit words (4 digits each), got "E28".',
    );
    await expect(result.current.locate.start("ZZZZ")).rejects.toThrow(
      TypeError,
    );
    expect(adapter.locating).toBeNull();
  });

  it("ends with disconnected when the reader drops", async () => {
    const { adapter, result } = await setup();
    await act(async () => {
      await result.current.locate.start(EPC_A);
    });
    await act(async () => adapter.dropConnection({ reconnect: false }));
    expect(result.current.locate).toMatchObject({
      isLocating: false,
      error: expect.objectContaining({ code: "disconnected" }),
    });
  });
});

describe("useRfidTrigger", () => {
  it("hands the trigger to the app while mounted, shared by every hook", async () => {
    const adapter = createMockRfidAdapter({ permission: "granted" });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <DeviceAdaptersProvider adapters={{ rfid: adapter }}>
        {children}
      </DeviceAdaptersProvider>
    );
    const onPress = jest.fn();
    const onRelease = jest.fn();
    const { result, unmount } = await renderHook(
      () => ({
        a: useRfidTrigger({ onPress, onRelease }),
        b: useRfidTrigger(),
      }),
      { wrapper },
    );
    expect(result.current.a.isSupported).toBe(true);
    expect(adapter.triggerSubscriberCount).toBe(1);

    await act(async () => adapter.pressTrigger());
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(result.current.b.isPressed).toBe(true);
    await act(async () => adapter.pressTrigger(false));
    expect(onRelease).toHaveBeenCalledTimes(1);
    expect(result.current.a.isPressed).toBe(false);

    await unmount();
    expect(adapter.triggerSubscriberCount).toBe(0);
  });

  it("drives a mode", async () => {
    const adapter = createMockRfidAdapter({ permission: "granted" });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <DeviceAdaptersProvider adapters={{ rfid: adapter }}>
        {children}
      </DeviceAdaptersProvider>
    );
    const { result } = await renderHook(
      () => {
        const inventory = useRfidInventory();
        useRfidTrigger({
          onPress: () => void inventory.start().catch(() => {}),
          onRelease: () => void inventory.stop(),
        });
        return { inventory, reader: useRfidReader() };
      },
      { wrapper },
    );
    await act(async () => {
      await result.current.reader.connect(READER);
    });
    await act(async () => adapter.pressTrigger());
    await advance(0);
    expect(adapter.inventory).not.toBeNull();
    await act(async () => adapter.pressTrigger(false));
    await advance(0);
    expect(adapter.inventory).toBeNull();
  });

  it("is unsupported when the adapter keeps the trigger", async () => {
    const adapter = createMockRfidAdapter({ capabilities: { trigger: false } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <DeviceAdaptersProvider adapters={{ rfid: adapter }}>
        {children}
      </DeviceAdaptersProvider>
    );
    const { result } = await renderHook(() => useRfidTrigger(), { wrapper });
    expect(result.current).toEqual({ isSupported: false, isPressed: false });
  });
});

describe("useRfidReaderDiscovery", () => {
  async function discovery(options: MockRfidOptions = {}) {
    const adapter = createMockRfidAdapter({
      permission: "granted",
      ...options,
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <DeviceAdaptersProvider adapters={{ rfid: adapter }}>
        {children}
      </DeviceAdaptersProvider>
    );
    const hook = await renderHook(() => useRfidReaderDiscovery(), { wrapper });
    return { adapter, ...hook };
  }

  it("lists the readers found, once each, until the timeout", async () => {
    const { adapter, result } = await discovery();
    await act(async () => {
      await result.current.start();
    });
    expect(adapter.isDiscovering).toBe(true);
    await act(async () => {
      adapter.discover({ id: "A", name: "IH40", rssi: -60 });
      adapter.discover({ id: "B", name: null, rssi: null });
    });
    await advance(250);
    await act(async () =>
      adapter.discover({ id: "A", name: "IH40", rssi: -50 }),
    );
    await advance(250);
    expect(result.current.readers).toEqual([
      { id: "A", name: "IH40", rssi: -50, lastSeen: 1_000_250 },
      { id: "B", name: null, rssi: null, lastSeen: 1_000_000 },
    ]);
    await advance(10_000);
    expect(result.current.isDiscovering).toBe(false);
    expect(adapter.isDiscovering).toBe(false);
  });

  it("is unsupported when the adapter cannot search", async () => {
    const { result } = await discovery({ capabilities: { discovery: false } });
    let code = "";
    await act(async () => {
      code = await codeOf(result.current.start());
    });
    expect(code).toBe("unsupported");
    expect(result.current.error?.message).toMatch(/connect by id/);
  });

  it("checks the permission, and stops in the background", async () => {
    const denied = await discovery({ permission: "denied" });
    let code = "";
    await act(async () => {
      code = await codeOf(denied.result.current.start());
    });
    expect(code).toBe("permission-denied");

    const { adapter, result } = await discovery();
    await act(async () => {
      await result.current.start({ timeout: 0 });
    });
    await moveTo("background");
    expect(result.current.isDiscovering).toBe(false);
    expect(adapter.isDiscovering).toBe(false);
  });
});

describe("static rendering", () => {
  it("renders the server snapshots", () => {
    const rfid = createMockRfidAdapter({ permission: "granted" });
    const Probe = () => {
      const reader = useRfidReader();
      const inventory = useRfidInventory();
      const single = useRfidSingleRead();
      const locate = useRfidLocate();
      const trigger = useRfidTrigger();
      const discovery = useRfidReaderDiscovery();
      return (
        <>{`${reader.isSupported}|${reader.state}|${inventory.tags.length}|${single.isReading}|${locate.proximity}|${trigger.isPressed}|${discovery.readers.length}`}</>
      );
    };
    expect(
      renderToString(
        <DeviceAdaptersProvider adapters={{ rfid }}>
          <Probe />
        </DeviceAdaptersProvider>,
      ),
    ).toBe("false|disconnected|0|false|0|false|0");
  });
});
