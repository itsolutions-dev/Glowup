import {
  getRfidCapabilities,
  isRfidError,
  type RfidTagRead,
} from "@its/glowup-device/rfid";
import { PermissionsAndroid, Platform } from "react-native";

import { createZebraRfidAdapter } from "../adapter";
import {
  fromNativeSettings,
  nearestPowerIndex,
  parseBatteryLevel,
  toRfidError,
} from "../convert";
import { ZEBRA_NATIVE_REVISION } from "../native";
import { createFakeZebraModule } from "./fakeNative";

const READER = "84:C6:92:12:34:56";

function setup(options: { nativeLocate?: boolean } = {}) {
  const native = createFakeZebraModule();
  const adapter = createZebraRfidAdapter({ native, ...options });
  return { native, adapter };
}

async function codeOf(promise: Promise<unknown>) {
  try {
    await promise;
    return "resolved";
  } catch (error) {
    return isRfidError(error) ? error.code : String(error);
  }
}

afterEach(() => jest.restoreAllMocks());

describe("where it runs", () => {
  it("runs on any Android host with the module linked: the RFD40 Premium pairs with any", () => {
    jest.spyOn(Platform, "constants", "get").mockReturnValue({
      ...Platform.constants,
      Manufacturer: "samsung",
    } as typeof Platform.constants);
    expect(setup().adapter.isSupported()).toBe(true);
  });

  it("reads unsupported without the native module, and on iOS", async () => {
    const adapter = createZebraRfidAdapter({ native: null });
    expect(adapter.isSupported()).toBe(false);
    expect(await codeOf(adapter.connect(READER))).toBe("unsupported");
    expect(await adapter.getPermission()).toEqual({
      status: "unsupported",
      canAskAgain: false,
    });
    jest.replaceProperty(Platform, "OS", "ios");
    expect(setup().adapter.isSupported()).toBe(false);
  });

  it("declares the contract it implements", () => {
    const { adapter } = setup();
    expect(adapter).toMatchObject({
      contractVersion: 1,
      vendor: "zebra",
      supportsTid: true,
      powerRange: { min: 0, max: 30 },
      proximityBounds: { near: -30, far: -70 },
    });
  });

  it("reports the linked module's revision", () => {
    expect(setup().adapter.nativeRevision()).toBe(ZEBRA_NATIVE_REVISION);
    expect(
      createZebraRfidAdapter({ native: null }).nativeRevision(),
    ).toBeNull();
  });
});

describe("capabilities", () => {
  it("has no single read of its own: the engine emulates it", () => {
    const { adapter } = setup();
    expect(getRfidCapabilities(adapter)).toEqual({
      locate: "native",
      singleRead: "emulated",
      tid: true,
      trigger: true,
      discovery: true,
      battery: true,
      readerInfo: true,
    });
  });

  it("leaves the native search out when told to, and puts it back", () => {
    const { adapter } = setup({ nativeLocate: false });
    expect("startLocate" in adapter).toBe(false);
    expect(getRfidCapabilities(adapter).locate).toBe("emulated");
    adapter.setNativeLocate(true);
    expect(getRfidCapabilities(adapter).locate).toBe("native");
  });
});

describe("connection", () => {
  it("connects to a paired reader by address, in any case, or by name", async () => {
    const { adapter, native } = setup();
    await adapter.connect("84:c6:92:12:34:56");
    expect(native.getConnection()).toEqual({
      state: "connected",
      readerId: READER,
    });
    await adapter.disconnect();
    await adapter.connect("RFD40+_211545201D0011");
    expect(native.getConnection().readerId).toBe("RFD40+_211545201D0011");
  });

  it("says a reader must be paired first", async () => {
    const { adapter } = setup();
    await expect(adapter.connect("00:11:22:33:44:55")).rejects.toMatchObject({
      code: "failed",
      message: expect.stringMatching(/not a reader paired/),
    });
  });
});

describe("units", () => {
  it("normalises the EPC and TID, and takes the seen count as the read count", async () => {
    const { adapter, native } = setup();
    await adapter.connect(READER);
    const heard: RfidTagRead[] = [];
    await adapter.startInventory(
      { tid: true },
      { onTags: (reads) => heard.push(...reads), onStop: () => {} },
    );
    expect(native.readingTids).toBe(true);
    native.emitReads([
      {
        epc: "e2801170000002120fd4a0f1",
        rssi: -61,
        seenCount: 3,
        tid: "e28068942000401007656433",
        timestamp: 1_700_000_000_000,
      },
      { epc: "XYZ" },
      { epc: "E2801170000002120FD4A0F2", seenCount: 0 },
    ]);
    expect(heard).toEqual([
      {
        epc: "E2801170000002120FD4A0F1",
        rssi: -61,
        antenna: 1,
        readCount: 3,
        tid: "E28068942000401007656433",
        timestamp: 1_700_000_000_000,
      },
      expect.objectContaining({
        epc: "E2801170000002120FD4A0F2",
        readCount: 1,
      }),
    ]);
  });

  it("converts power through the reader's table, and the volume names", async () => {
    const { adapter, native } = setup();
    await adapter.connect(READER);
    expect(await adapter.getSettings()).toEqual({
      power: 30,
      session: 0,
      beeperVolume: "high",
      region: "ETSI",
    });
    expect(
      await adapter.setSettings({
        power: 22.4,
        beeperVolume: "off",
        session: 2,
      }),
    ).toEqual({ power: 22, session: 2, beeperVolume: "off", region: "ETSI" });
    expect(native.settings).toEqual({
      powerIndex: 22,
      session: 2,
      volume: "QUIET",
    });
  });

  it("picks the nearest level of a table that is not 1 dBm apart", () => {
    expect(nearestPowerIndex([100, 150, 200, 270], 23)).toBe(2);
    expect(nearestPowerIndex([100, 150, 200, 270], 26)).toBe(3);
    expect(nearestPowerIndex([], 20)).toBeNull();
  });

  it("keeps the reported power within powerRange, and falls back to its maximum", () => {
    const range = { min: 0, max: 30 };
    const base = { session: 1, volume: "LOW", region: null };
    expect(
      fromNativeSettings(
        { ...base, powerIndex: 1, powerLevels: [100, 320] },
        range,
      ).power,
    ).toBe(30);
    expect(
      fromNativeSettings({ ...base, powerIndex: null, powerLevels: [] }, range)
        .power,
    ).toBe(30);
  });

  it("fails a power setting when the reader reports no levels", async () => {
    const { adapter, native } = setup();
    await adapter.connect(READER);
    native.powerLevels = [];
    expect(await codeOf(adapter.setSettings({ power: 20 }))).toBe("failed");
  });

  it("reads the battery, -1 as no answer", async () => {
    const { adapter, native } = setup();
    await adapter.connect(READER);
    expect(await adapter.getBatteryLevel()).toBe(87);
    native.battery = -1;
    expect(await adapter.getBatteryLevel()).toBeNull();
    expect(parseBatteryLevel(140)).toBe(100);
    expect(parseBatteryLevel(Number.NaN)).toBeNull();
  });

  it("names the reader as it is paired, and its model, serial and firmware", async () => {
    const { adapter } = setup();
    await adapter.connect(READER);
    expect(await adapter.getReaderInfo()).toEqual({
      id: READER,
      name: "RFD40+_211545201D0011",
      model: "RFD4031-G10B700-WR",
      serialNumber: "211545201D0011",
      firmwareVersion: "PAAFLS00-005-R01",
    });
    expect(await adapter.getVersions()).toEqual({
      NGE: "PAAFLS00-005-R01",
      Bluetooth: "1.2.3",
    });
  });
});

describe("errors", () => {
  it("maps the module's codes", () => {
    const code = (native: string) =>
      toRfidError(Object.assign(new Error("m"), { code: native })).code;
    expect(code("ERR_NOT_CONNECTED")).toBe("not-connected");
    expect(code("ERR_DISCONNECTED")).toBe("disconnected");
    expect(code("ERR_PERMISSION")).toBe("permission-denied");
    expect(code("ERR_CANCELLED")).toBe("cancelled");
    expect(code("ERR_NOT_PAIRED")).toBe("failed");
    expect(code("ERR_BLUETOOTH_OFF")).toBe("failed");
  });

  it("rejects a failed start with the module's message, and leaves no listener", async () => {
    const { adapter, native } = setup();
    await adapter.connect(READER);
    const before = native.listenerCount;
    native.failNext(
      "startInventory",
      "ERR_READER",
      "The reader could not start reading.",
    );
    await expect(
      adapter.startInventory(
        { tid: false },
        { onTags: () => {}, onStop: () => {} },
      ),
    ).rejects.toMatchObject({
      code: "failed",
      message: "The reader could not start reading.",
    });
    expect(native.listenerCount).toBe(before);
  });
});

describe("the trigger", () => {
  it("is handed over while anyone listens, and given back after the last", async () => {
    const { adapter, native } = setup();
    const a = jest.fn();
    const b = jest.fn();
    const stopA = adapter.subscribeTrigger(a);
    const stopB = adapter.subscribeTrigger(b);
    await Promise.resolve();
    expect(native.triggerHandover).toBe(true);
    native.pressTrigger(true);
    expect(a).toHaveBeenCalledWith(true);
    expect(b).toHaveBeenCalledWith(true);
    stopA();
    expect(native.triggerHandover).toBe(true);
    stopB();
    await Promise.resolve();
    expect(native.triggerHandover).toBe(false);
  });
});

describe("discovery", () => {
  it("reports the paired readers the module lists, with no signal", async () => {
    const { adapter, native } = setup();
    const found = jest.fn();
    await adapter.startDiscovery({ onReader: found, onStop: () => {} });
    native.emitReaderFound(READER, "RFD40+_211545201D0011");
    expect(found).toHaveBeenCalledWith({
      id: READER,
      name: "RFD40+_211545201D0011",
      rssi: null,
    });
    await adapter.stopDiscovery();
    native.emitReaderFound("84:C6:92:12:34:57", "RFD40+_2");
    expect(found).toHaveBeenCalledTimes(1);
  });

  it("filters to Zebra-looking readers unless told otherwise", async () => {
    const { adapter, native } = setup();
    const start = jest.spyOn(native, "startDiscovery");
    await adapter.startDiscovery({ onReader: () => {}, onStop: () => {} });
    adapter.setDiscoveryFilter(false);
    await adapter.startDiscovery({ onReader: () => {}, onStop: () => {} });
    expect(start.mock.calls).toEqual([[true], [false]]);
  });
});

describe("diagnostics", () => {
  it("turns the module's raw events on and passes them through", () => {
    const { adapter, native } = setup();
    adapter.setDiagnostics(true);
    expect(native.diagnostics).toBe(true);
    const stop = adapter.subscribeDiagnostics(jest.fn());
    expect(native.listenerCount).toBe(1);
    stop();
    expect(native.listenerCount).toBe(0);
  });
});

describe("permissions", () => {
  it("asks for the nearby devices permissions from Android 12", async () => {
    jest.spyOn(Platform, "Version", "get").mockReturnValue(31);
    const check = jest
      .spyOn(PermissionsAndroid, "check")
      .mockResolvedValue(false);
    const request = jest
      .spyOn(PermissionsAndroid, "requestMultiple")
      .mockResolvedValue({
        "android.permission.BLUETOOTH_SCAN": "granted",
        "android.permission.BLUETOOTH_CONNECT": "never_ask_again",
      } as never);
    const { adapter } = setup();
    expect(await adapter.getPermission()).toEqual({
      status: "undetermined",
      canAskAgain: true,
    });
    expect(check.mock.calls.map(([p]) => p)).toEqual([
      "android.permission.BLUETOOTH_SCAN",
      "android.permission.BLUETOOTH_CONNECT",
    ]);
    expect(await adapter.requestPermission()).toEqual({
      status: "denied",
      canAskAgain: false,
    });
    expect(request).toHaveBeenCalledTimes(1);
    expect(await adapter.getPermission()).toEqual({
      status: "denied",
      canAskAgain: false,
    });
  });

  it("asks for nothing up to Android 11: paired readers need no run-time permission", async () => {
    jest.spyOn(Platform, "Version", "get").mockReturnValue(30);
    const request = jest.spyOn(PermissionsAndroid, "requestMultiple");
    const { adapter } = setup();
    expect(await adapter.getPermission()).toEqual({
      status: "granted",
      canAskAgain: false,
    });
    expect(await adapter.requestPermission()).toEqual({
      status: "granted",
      canAskAgain: false,
    });
    expect(request).not.toHaveBeenCalled();
  });
});
