import { isRfidError, type RfidTagRead } from "@its/glowup-device/rfid";
import { PermissionsAndroid, Platform } from "react-native";

import { createHoneywellRfidAdapter } from "../adapter";
import { parseBatteryLevel, toRfidError } from "../convert";
import { createFakeHoneywellModule } from "./fakeNative";

const READER = "0C:23:69:19:AA:12";

function setup(options: { manufacturer?: string | null } = {}) {
  const native = createFakeHoneywellModule();
  const adapter = createHoneywellRfidAdapter({
    native,
    manufacturer: () =>
      options.manufacturer === undefined ? "Honeywell" : options.manufacturer,
  });
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
  it("runs on a Honeywell host with the module linked", () => {
    expect(setup().adapter.isSupported()).toBe(true);
    expect(setup({ manufacturer: "HONEYWELL" }).adapter.isHoneywellHost()).toBe(
      true,
    );
  });

  it("reads unsupported off Honeywell hosts (the licence binds the SDK to them)", async () => {
    const { adapter, native } = setup({ manufacturer: "samsung" });
    expect(adapter.isSupported()).toBe(false);
    expect(await codeOf(adapter.connect(READER))).toBe("unsupported");
    expect(native.getConnection().state).toBe("disconnected");
    expect(await adapter.getPermission()).toEqual({
      status: "unsupported",
      canAskAgain: false,
    });
  });

  it("can be told to run on other hosts, for a lab test", () => {
    const native = createFakeHoneywellModule();
    const adapter = createHoneywellRfidAdapter({
      native,
      manufacturer: () => "Google",
      requireHoneywellHost: false,
    });
    expect(adapter.isSupported()).toBe(true);
  });

  it("reads unsupported without the native module, and on iOS", () => {
    expect(
      createHoneywellRfidAdapter({
        native: null,
        manufacturer: () => "Honeywell",
      }).isSupported(),
    ).toBe(false);
    jest.replaceProperty(Platform, "OS", "ios");
    expect(setup().adapter.isSupported()).toBe(false);
  });

  it("declares the contract it implements", () => {
    const { adapter } = setup();
    expect(adapter).toMatchObject({
      contractVersion: 1,
      vendor: "honeywell",
      supportsTid: true,
      powerRange: { min: 5, max: 30 },
    });
  });
});

describe("units", () => {
  it("passes RSSI through as dBm and keeps the arrival time the module gave", async () => {
    const { adapter, native } = setup();
    await adapter.connect(READER);
    const heard: RfidTagRead[] = [];
    await adapter.startInventory(
      { tid: true },
      { onTags: (reads) => heard.push(...reads), onStop: () => {} },
    );
    native.emitReads([
      {
        epc: "e2801170000002120fd4a0f1",
        rssi: -61,
        readCount: 0,
        tid: "e280110520",
        timestamp: 1_700_000_000_000,
      },
      { epc: "XYZ" },
    ]);
    expect(heard).toEqual([
      {
        epc: "E2801170000002120FD4A0F1",
        rssi: -61,
        antenna: 1,
        readCount: 1,
        tid: "E280110520",
        timestamp: 1_700_000_000_000,
      },
    ]);
  });

  it("converts power to and from centi-dBm, and the volume names", async () => {
    const { adapter, native } = setup();
    await adapter.connect(READER);
    expect(await adapter.getSettings()).toEqual({
      power: 30,
      session: 1,
      beeperVolume: "medium",
      region: "Europe",
    });
    expect(
      await adapter.setSettings({
        power: 22.5,
        beeperVolume: "off",
        session: 2,
      }),
    ).toEqual({
      power: 22.5,
      session: 2,
      beeperVolume: "off",
      region: "Europe",
    });
    expect(native.settings).toEqual({
      power: 2250,
      session: 2,
      volume: "MUTE",
    });
  });

  it("parses the battery string", async () => {
    const { adapter, native } = setup();
    await adapter.connect(READER);
    expect(await adapter.getBatteryLevel()).toBe(87);
    native.battery = "";
    expect(await adapter.getBatteryLevel()).toBeNull();
    expect(parseBatteryLevel("140")).toBe(100);
    expect(parseBatteryLevel("x")).toBeNull();
  });

  it("names the reader by the id connected to, its firmware by the RFID module's", async () => {
    const { adapter } = setup();
    await adapter.connect(READER);
    expect(await adapter.getReaderInfo()).toEqual({
      id: READER,
      name: null,
      model: null,
      serialNumber: "19AA12",
      firmwareVersion: "2.1.0",
    });
  });

  it('reads the SDK\'s "Not Support!" serial number as none (the IH40 answers it)', async () => {
    const { adapter, native } = setup();
    await adapter.connect(READER);
    native.serialNumber = "Not Support!";
    expect((await adapter.getReaderInfo()).serialNumber).toBeNull();
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
    expect(code("ERR_BLUETOOTH_OFF")).toBe("failed");
    expect(toRfidError(new Error("Bluetooth is off.")).message).toBe(
      "Bluetooth is off.",
    );
  });

  it("rejects a failed start with the module's message, and leaves no listener", async () => {
    const { adapter, native } = setup();
    await adapter.connect(READER);
    const before = native.listenerCount;
    native.failNext(
      "startInventory",
      "ERR_READER",
      "The reader refused to start reading.",
    );
    await expect(
      adapter.startInventory(
        { tid: false },
        { onTags: () => {}, onStop: () => {} },
      ),
    ).rejects.toMatchObject({
      code: "failed",
      message: "The reader refused to start reading.",
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
  it("reports what the module finds, without the module's hint", async () => {
    const { adapter, native } = setup();
    const found = jest.fn();
    await adapter.startDiscovery({ onReader: found, onStop: () => {} });
    native.emitReaderFound("0C:23:69:19:AA:12", "IH40-1234", -58);
    expect(found).toHaveBeenCalledWith({
      id: "0C:23:69:19:AA:12",
      name: "IH40-1234",
      rssi: -58,
    });
    await adapter.stopDiscovery();
    native.emitReaderFound("0C:23:69:19:AA:13", "IH40-9");
    expect(found).toHaveBeenCalledTimes(1);
  });

  it("filters to Honeywell-looking readers unless told otherwise", async () => {
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
    // A check cannot tell "never ask again": the answer stays for the launch.
    expect(await adapter.getPermission()).toEqual({
      status: "denied",
      canAskAgain: false,
    });
  });

  it("asks for the precise location up to Android 11 (the CT40's), which a scan needs", async () => {
    jest.spyOn(Platform, "Version", "get").mockReturnValue(30);
    jest.spyOn(PermissionsAndroid, "check").mockResolvedValue(true);
    const request = jest
      .spyOn(PermissionsAndroid, "requestMultiple")
      .mockResolvedValue({
        "android.permission.ACCESS_FINE_LOCATION": "granted",
      } as never);
    const { adapter } = setup();
    expect(await adapter.getPermission()).toEqual({
      status: "granted",
      canAskAgain: false,
    });
    expect(await adapter.requestPermission()).toEqual({
      status: "granted",
      canAskAgain: false,
    });
    expect(request).toHaveBeenCalledWith([
      "android.permission.ACCESS_FINE_LOCATION",
    ]);
  });
});
