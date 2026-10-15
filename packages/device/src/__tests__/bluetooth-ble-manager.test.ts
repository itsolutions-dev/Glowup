/**
 * The adapter on react-native-ble-manager, against a fake of its module.
 * Each test loads a fresh copy (`jest.isolateModules`): the adapter keeps
 * the loaded module and the one `start()` per process at module scope.
 */
import { PermissionsAndroid, Platform } from "react-native";

import type * as BleManagerModule from "../bluetooth/bleManager";
import { createStartThrottle } from "../bluetooth/throttle";
import type { BluetoothError } from "../bluetooth/errors";
import type * as SystemSheetModule from "../core/systemSheet";

type StateListener = (event: { state: string }) => void;

const mockStateListeners = new Set<StateListener>();
type Listener = (event: never) => void;

/** ble-manager's other events: discovery and the end of a scan. */
const mockEvents = {
  discover: new Set<Listener>(),
  stopScan: new Set<Listener>(),
};

function listen(set: Set<Listener>) {
  return (listener: Listener) => {
    set.add(listener);
    return { remove: () => set.delete(listener) };
  };
}

const mockBle = {
  scan: jest.fn(async (_options: object) => {}),
  stopScan: jest.fn(async () => {}),
  onDiscoverPeripheral: jest.fn(listen(mockEvents.discover)),
  onStopScan: jest.fn(listen(mockEvents.stopScan)),
  isStarted: jest.fn(async () => false),
  start: jest.fn(async (_options?: object) => {}),
  checkState: jest.fn(async () => "on"),
  enableBluetooth: jest.fn(async () => {}),
  onDidUpdateState: jest.fn((listener: StateListener) => {
    mockStateListeners.add(listener);
    return { remove: () => mockStateListeners.delete(listener) };
  }),
};

jest.mock("react-native-ble-manager", () => ({
  __esModule: true,
  default: mockBle,
}));

function emit(set: Set<Listener>, event: object) {
  [...set].forEach((listener) => listener(event as never));
}

function emitState(state: string) {
  [...mockStateListeners].forEach((listener) => listener({ state }));
}

interface Loaded {
  ble: typeof BleManagerModule;
  sheet: typeof SystemSheetModule;
  permissions: {
    check: jest.SpyInstance;
    requestMultiple: jest.SpyInstance;
  };
}

/** A fresh adapter module on `os` (and Android's API level). */
function load(os: "ios" | "android" = "ios", version = 34): Loaded {
  // react-native's index reads Platform and PermissionsAndroid through
  // getters that require them when used: after `isolateModules`, from this
  // registry. So the swap and the spies go on this registry's copies.
  jest.replaceProperty(Platform, "OS", os);
  if (os === "android") {
    jest.spyOn(Platform, "Version", "get").mockReturnValue(version);
  }
  const permissions = {
    check: jest.spyOn(PermissionsAndroid, "check"),
    requestMultiple: jest.spyOn(PermissionsAndroid, "requestMultiple"),
  };
  let loaded!: Loaded;
  jest.isolateModules(() => {
    // `doMock` outlives `isolateModules`: undo the other tests' mocks.
    jest.doMock("react-native-ble-manager", () => ({
      __esModule: true,
      default: mockBle,
    }));
    jest.dontMock("../core/support");
    loaded = {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- a fresh copy per test
      ble: require("../bluetooth/bleManager"),
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- the same registry's copy
      sheet: require("../core/systemSheet"),
      permissions,
    };
  });
  return loaded;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockStateListeners.clear();
  mockEvents.discover.clear();
  mockEvents.stopScan.clear();
  mockBle.scan.mockResolvedValue(undefined);
  let started = false;
  mockBle.isStarted.mockImplementation(async () => started);
  mockBle.start.mockImplementation(async () => {
    started = true;
  });
  mockBle.checkState.mockResolvedValue("on");
});

afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

describe("toBluetoothState", () => {
  it.each([
    ["on", "on"],
    ["off", "off"],
    ["turning_on", "off"],
    ["turning_off", "off"],
    ["unauthorized", "unauthorized"],
    ["unsupported", "unsupported"],
    ["unknown", "unknown"],
    ["resetting", "unknown"],
    [undefined, "unknown"],
  ])("reads %s as %s", (raw, state) => {
    expect(load().ble.toBluetoothState(raw)).toBe(state);
  });
});

describe("without the native module", () => {
  it("reads unsupported instead of throwing", async () => {
    jest.isolateModules(() => {
      jest.doMock("react-native-ble-manager", () => {
        throw new Error("BleManagerModule not found");
      });
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- loaded after the mock above
      const { bleManagerAdapter } = require("../bluetooth/bleManager");
      expect(bleManagerAdapter.isSupported()).toBe(false);
      expect(bleManagerAdapter.canEnable()).toBe(false);
      expect(bleManagerAdapter.subscribeState(jest.fn())).toEqual(
        expect.any(Function),
      );
      return Promise.all([
        expect(bleManagerAdapter.getState()).resolves.toBe("unsupported"),
        expect(bleManagerAdapter.getPermission()).resolves.toEqual({
          status: "unsupported",
          canAskAgain: false,
        }),
        expect(bleManagerAdapter.requestPermission()).resolves.toEqual({
          status: "unsupported",
          canAskAgain: false,
        }),
      ]);
    });
  });

  it("never loads it on the web", () => {
    jest.isolateModules(() => {
      const factory = jest.fn(() => ({ default: mockBle }));
      jest.doMock("react-native-ble-manager", factory);
      jest.doMock("../core/support", () => ({
        ...jest.requireActual("../core/support"),
        isNativePlatform: false,
      }));
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- loaded after the mocks above
      const { bleManagerAdapter } = require("../bluetooth/bleManager");
      expect(bleManagerAdapter.isSupported()).toBe(false);
      expect(factory).not.toHaveBeenCalled();
    });
  });
});

describe("iOS", () => {
  it("reads nothing before the app asked: building the manager may prompt", async () => {
    const { bleManagerAdapter } = load().ble;
    await expect(bleManagerAdapter.getPermission()).resolves.toEqual({
      status: "undetermined",
      canAskAgain: true,
    });
    await expect(bleManagerAdapter.getState()).resolves.toBe("unknown");
    const stop = bleManagerAdapter.subscribeState(jest.fn());
    stop();
    expect(mockBle.start).not.toHaveBeenCalled();
    expect(mockBle.checkState).not.toHaveBeenCalled();
  });

  it("asks by starting the manager once, without the power alert", async () => {
    const { bleManagerAdapter } = load().ble;
    mockBle.checkState.mockResolvedValue("unknown");
    const request = bleManagerAdapter.requestPermission();
    const second = bleManagerAdapter.requestPermission();
    await new Promise((resolve) => setImmediate(resolve));
    emitState("unknown");
    emitState("on");
    await expect(request).resolves.toEqual({
      status: "granted",
      canAskAgain: false,
    });
    await expect(second).resolves.toEqual({
      status: "granted",
      canAskAgain: false,
    });
    expect(mockBle.start).toHaveBeenCalledTimes(1);
    expect(mockBle.start).toHaveBeenCalledWith({ showAlert: false });
    // Settled: the request let go of its listener.
    expect(mockStateListeners.size).toBe(0);
  });

  it("answers from the current state when iOS asked before", async () => {
    const { bleManagerAdapter } = load().ble;
    mockBle.checkState.mockResolvedValue("off");
    await expect(bleManagerAdapter.requestPermission()).resolves.toEqual({
      status: "granted",
      canAskAgain: false,
    });
  });

  it.each([
    ["unauthorized", { status: "denied", canAskAgain: false }],
    ["unsupported", { status: "unsupported", canAskAgain: false }],
  ])("reads a request settling on %s", async (state, permission) => {
    const { bleManagerAdapter } = load().ble;
    mockBle.checkState.mockResolvedValue(state);
    await expect(bleManagerAdapter.requestPermission()).resolves.toEqual(
      permission,
    );
  });

  it("gives up on an unanswered prompt after a minute", async () => {
    jest.useFakeTimers();
    const { bleManagerAdapter } = load().ble;
    mockBle.checkState.mockResolvedValue("unknown");
    const request = bleManagerAdapter.requestPermission();
    await jest.advanceTimersByTimeAsync(59_999);
    let settled = false;
    request.then(() => (settled = true));
    await Promise.resolve();
    expect(settled).toBe(false);
    await jest.advanceTimersByTimeAsync(1);
    await expect(request).resolves.toEqual({
      status: "undetermined",
      canAskAgain: true,
    });
    expect(mockStateListeners.size).toBe(0);
  });

  it("reads the permission and the state once the manager exists", async () => {
    const { bleManagerAdapter } = load().ble;
    mockBle.isStarted.mockResolvedValue(true);
    mockBle.checkState.mockResolvedValue("off");
    await expect(bleManagerAdapter.getPermission()).resolves.toEqual({
      status: "granted",
      canAskAgain: false,
    });
    await expect(bleManagerAdapter.getState()).resolves.toBe("off");
    mockBle.checkState.mockResolvedValue("unauthorized");
    await expect(bleManagerAdapter.getPermission()).resolves.toEqual({
      status: "denied",
      canAskAgain: false,
    });
  });

  it("says what is missing when the build has no purpose string, and can start later", async () => {
    const { bleManagerAdapter } = load().ble;
    mockBle.start.mockRejectedValueOnce(
      "NSBluetoothAlwaysUsageDescription is not set in the infoPlist",
    );
    const failure: BluetoothError = await bleManagerAdapter
      .requestPermission()
      .catch((error) => error);
    expect(failure).toMatchObject({
      name: "BluetoothError",
      code: "unsupported",
    });
    expect(failure.message).toContain("config plugin");
    await expect(bleManagerAdapter.requestPermission()).resolves.toEqual({
      status: "granted",
      canAskAgain: false,
    });
  });

  it("cannot switch Bluetooth on", async () => {
    const { bleManagerAdapter } = load().ble;
    expect(bleManagerAdapter.canEnable()).toBe(false);
    await expect(bleManagerAdapter.enable()).rejects.toMatchObject({
      code: "unsupported",
    });
    expect(mockBle.enableBluetooth).not.toHaveBeenCalled();
  });

  it("forwards the state changes, as the package's states", () => {
    const { bleManagerAdapter } = load().ble;
    const listener = jest.fn();
    const stop = bleManagerAdapter.subscribeState(listener);
    emitState("resetting");
    emitState("off");
    stop();
    emitState("on");
    expect(listener.mock.calls).toEqual([["unknown"], ["off"]]);
  });
});

describe("Android", () => {
  const SCAN = "android.permission.BLUETOOTH_SCAN";
  const CONNECT = "android.permission.BLUETOOTH_CONNECT";
  const FINE = "android.permission.ACCESS_FINE_LOCATION";

  it("starts the manager for state changes, which never prompts there", async () => {
    const { bleManagerAdapter } = load("android").ble;
    const listener = jest.fn();
    bleManagerAdapter.subscribeState(listener);
    bleManagerAdapter.subscribeState(jest.fn());
    await new Promise((resolve) => setImmediate(resolve));
    expect(mockBle.start).toHaveBeenCalledTimes(1);
    emitState("turning_on");
    expect(listener).toHaveBeenCalledWith("off");
  });

  it("reads the state without starting", async () => {
    const { bleManagerAdapter } = load("android").ble;
    mockBle.checkState.mockResolvedValue("turning_off");
    await expect(bleManagerAdapter.getState()).resolves.toBe("off");
    expect(mockBle.start).not.toHaveBeenCalled();
  });

  it("checks the nearby devices permissions on Android 12 and later", async () => {
    const { ble, permissions } = load("android", 31);
    permissions.check.mockResolvedValue(true);
    await expect(ble.bleManagerAdapter.getPermission()).resolves.toEqual({
      status: "granted",
      canAskAgain: false,
    });
    expect(permissions.check.mock.calls).toEqual([[SCAN], [CONNECT]]);
    permissions.check.mockImplementation(async (name) => name === SCAN);
    await expect(ble.bleManagerAdapter.getPermission()).resolves.toEqual({
      status: "undetermined",
      canAskAgain: true,
    });
  });

  it("checks location on Android 11 and earlier", async () => {
    const { ble, permissions } = load("android", 30);
    permissions.check.mockResolvedValue(false);
    await ble.bleManagerAdapter.getPermission();
    expect(permissions.check.mock.calls).toEqual([[FINE]]);
  });

  it("also asks for location with neverForLocation: false", async () => {
    const { ble, permissions } = load("android", 33);
    permissions.requestMultiple.mockResolvedValue({
      [SCAN]: "granted",
      [CONNECT]: "granted",
      [FINE]: "granted",
    });
    const adapter = ble.createBleManagerAdapter({ neverForLocation: false });
    await expect(adapter.requestPermission()).resolves.toEqual({
      status: "granted",
      canAskAgain: false,
    });
    expect(permissions.requestMultiple).toHaveBeenCalledWith([
      SCAN,
      CONNECT,
      FINE,
    ]);
  });

  it("asks inside a system sheet, and remembers a refusal for this launch", async () => {
    const { ble, sheet, permissions } = load("android", 34);
    let openDuring = false;
    permissions.requestMultiple.mockImplementation(async () => {
      openDuring = sheet.systemSheet.isOpen();
      return { [SCAN]: "granted", [CONNECT]: "denied" };
    });
    permissions.check.mockResolvedValue(false);
    await expect(ble.bleManagerAdapter.requestPermission()).resolves.toEqual({
      status: "denied",
      canAskAgain: true,
    });
    expect(openDuring).toBe(true);
    await expect(ble.bleManagerAdapter.getPermission()).resolves.toEqual({
      status: "denied",
      canAskAgain: true,
    });

    permissions.requestMultiple.mockResolvedValue({
      [SCAN]: "never_ask_again",
      [CONNECT]: "granted",
    });
    await expect(ble.bleManagerAdapter.requestPermission()).resolves.toEqual({
      status: "denied",
      canAskAgain: false,
    });
    await expect(ble.bleManagerAdapter.getPermission()).resolves.toEqual({
      status: "denied",
      canAskAgain: false,
    });
    // Granted in the settings meanwhile: the check wins.
    permissions.check.mockResolvedValue(true);
    await expect(ble.bleManagerAdapter.getPermission()).resolves.toEqual({
      status: "granted",
      canAskAgain: false,
    });
  });

  it("forgets a grant once the check says otherwise", async () => {
    const { ble, permissions } = load("android", 34);
    permissions.requestMultiple.mockResolvedValue({
      [SCAN]: "granted",
      [CONNECT]: "granted",
    });
    await ble.bleManagerAdapter.requestPermission();
    // Revoked in the settings: askable again.
    permissions.check.mockResolvedValue(false);
    await expect(ble.bleManagerAdapter.getPermission()).resolves.toEqual({
      status: "undetermined",
      canAskAgain: true,
    });
  });

  it("asks to switch Bluetooth on inside a system sheet", async () => {
    const { ble, sheet } = load("android");
    let openDuring = false;
    mockBle.enableBluetooth.mockImplementation(async () => {
      openDuring = sheet.systemSheet.isOpen();
    });
    expect(ble.bleManagerAdapter.canEnable()).toBe(true);
    await expect(ble.bleManagerAdapter.enable()).resolves.toBe(true);
    expect(openDuring).toBe(true);

    mockBle.enableBluetooth.mockRejectedValueOnce("User refused to enable");
    await expect(ble.bleManagerAdapter.enable()).resolves.toBe(false);

    mockBle.enableBluetooth.mockRejectedValueOnce(
      "Current activity not available",
    );
    await expect(ble.bleManagerAdapter.enable()).rejects.toMatchObject({
      name: "BluetoothError",
      code: "failed",
      message: "Current activity not available",
    });
  });

  it("survives a start refused for want of the radio", async () => {
    const { bleManagerAdapter } = load("android").ble;
    mockBle.start.mockRejectedValueOnce("No bluetooth support");
    bleManagerAdapter.subscribeState(jest.fn());
    await new Promise((resolve) => setImmediate(resolve));
    mockBle.checkState.mockResolvedValue("unsupported");
    await expect(bleManagerAdapter.getState()).resolves.toBe("unsupported");
  });
});

describe("toBluetoothDevice", () => {
  const bytes = (values: number[]) => ({
    CDVType: "ArrayBuffer" as const,
    bytes: values,
    data: "",
  });

  it("normalises an Android advertisement", () => {
    const { toBluetoothDevice } = load().ble;
    expect(
      toBluetoothDevice({
        id: "C0:FF:EE:00:00:01",
        name: "Cached name",
        rssi: -71,
        advertising: {
          localName: "HRM",
          isConnectable: true,
          serviceUUIDs: ["180d", "6E400001-B5A3-F393-E0A9-E50E24DCCA9E", "??"],
          serviceData: { feaa: bytes([0x10, 0x00]), bad: bytes([1]) },
          manufacturerData: { "004c": bytes([2, 21, 7]) },
          manufacturerRawData: bytes([0, 0, 0, 0x4c, 2, 21, 7]),
          txPowerLevel: -2147483648,
          rawData: bytes([]),
        },
      }),
    ).toEqual({
      id: "C0:FF:EE:00:00:01",
      name: "HRM",
      rssi: -71,
      advertisement: {
        localName: "HRM",
        serviceUuids: [
          "0000180d-0000-1000-8000-00805f9b34fb",
          "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
        ],
        serviceData: {
          "0000feaa-0000-1000-8000-00805f9b34fb": Uint8Array.from([0x10, 0]),
        },
        manufacturerData: {
          companyId: 0x4c,
          data: Uint8Array.from([2, 21, 7]),
        },
        txPowerLevel: null,
        isConnectable: true,
      },
    });
  });

  it("reads an iOS advertisement with little in it", () => {
    const { toBluetoothDevice } = load().ble;
    expect(
      toBluetoothDevice({
        id: "5A3C1E2B-0000-4000-8000-000000000001",
        name: "",
        rssi: -40,
        advertising: { txPowerLevel: 4 },
      }),
    ).toEqual({
      id: "5A3C1E2B-0000-4000-8000-000000000001",
      name: null,
      rssi: -40,
      advertisement: {
        localName: null,
        serviceUuids: [],
        serviceData: {},
        manufacturerData: null,
        txPowerLevel: 4,
        isConnectable: null,
      },
    });
    expect(
      toBluetoothDevice({
        id: "x",
        name: "Known",
        rssi: -40,
        advertising: undefined as never,
      }).name,
    ).toBe("Known");
  });
});

describe("createStartThrottle", () => {
  it("lets five starts through in 30 s, then waits for the oldest to leave", () => {
    let now = 0;
    const throttle = createStartThrottle(undefined, undefined, () => now);
    for (let i = 0; i < 5; i++) {
      expect(throttle.delay()).toBe(0);
      throttle.record();
      now += 1000;
    }
    // Five starts at 0..4 s; at 5 s the sixth waits until 30.5 s.
    expect(throttle.delay()).toBe(25_500);
    now = 30_500;
    expect(throttle.delay()).toBe(0);
    throttle.record();
    expect(throttle.delay()).toBe(1000);
  });
});

describe("scanning", () => {
  const handlers = () => ({ onDevice: jest.fn(), onStop: jest.fn() });
  const PERIPHERAL = { id: "A", name: "HRM", rssi: -50, advertising: {} };

  it("scans with repeats, low latency and the services, and forwards devices", async () => {
    const { bleManagerAdapter } = load().ble;
    const on = handlers();
    await bleManagerAdapter.startScan(
      { services: ["0000180d-0000-1000-8000-00805f9b34fb"] },
      on,
    );
    expect(mockBle.scan).toHaveBeenCalledWith({
      serviceUUIDs: ["0000180d-0000-1000-8000-00805f9b34fb"],
      allowDuplicates: true,
      scanMode: 2,
    });
    emit(mockEvents.discover, PERIPHERAL);
    expect(on.onDevice).toHaveBeenCalledWith(
      expect.objectContaining({ id: "A", name: "HRM", rssi: -50 }),
    );
  });

  it("ignores the stops it asked for, and reports the platform's", async () => {
    const { bleManagerAdapter } = load().ble;
    const on = handlers();
    await bleManagerAdapter.startScan({ services: [] }, on);
    emit(mockEvents.stopScan, { status: 0 });
    emit(mockEvents.stopScan, { status: 10 });
    emit(mockEvents.stopScan, {});
    expect(on.onStop).not.toHaveBeenCalled();
    emit(mockEvents.stopScan, { status: 6 });
    expect(on.onStop).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "failed",
        message: "The app scans too frequently.",
      }),
    );
    // The session ended: nothing more reaches the handlers.
    emit(mockEvents.discover, PERIPHERAL);
    expect(on.onDevice).not.toHaveBeenCalled();
    expect(mockEvents.discover.size).toBe(0);
  });

  it.each([
    [4, "unsupported", "This device cannot scan for Bluetooth Low Energy."],
    [42, "failed", "The scan stopped (status 42)."],
  ])("reads status %d as %s", async (status, code, message) => {
    const { bleManagerAdapter } = load().ble;
    const on = handlers();
    await bleManagerAdapter.startScan({ services: [] }, on);
    emit(mockEvents.stopScan, { status });
    expect(on.onStop).toHaveBeenCalledWith(
      expect.objectContaining({ code, message }),
    );
  });

  it("replaces a running scan: the old handlers hear nothing more", async () => {
    const { bleManagerAdapter } = load().ble;
    const first = handlers();
    const second = handlers();
    await bleManagerAdapter.startScan({ services: [] }, first);
    await bleManagerAdapter.startScan({ services: [] }, second);
    emit(mockEvents.discover, PERIPHERAL);
    expect(first.onDevice).not.toHaveBeenCalled();
    expect(second.onDevice).toHaveBeenCalledTimes(1);
    expect(mockEvents.discover.size).toBe(1);
  });

  it("stops the platform's scan and lets go of its events", async () => {
    const { bleManagerAdapter } = load().ble;
    await bleManagerAdapter.stopScan();
    expect(mockBle.stopScan).not.toHaveBeenCalled();
    await bleManagerAdapter.startScan({ services: [] }, handlers());
    await bleManagerAdapter.stopScan();
    expect(mockBle.stopScan).toHaveBeenCalledTimes(1);
    expect(mockEvents.discover.size + mockEvents.stopScan.size).toBe(0);
  });

  it("gives up on a scan the platform never confirms", async () => {
    jest.useFakeTimers();
    const { bleManagerAdapter } = load().ble;
    mockBle.scan.mockReturnValue(new Promise(() => {}));
    const start = bleManagerAdapter.startScan({ services: [] }, handlers());
    const outcome = expect(start).rejects.toMatchObject({ code: "timeout" });
    await jest.advanceTimersByTimeAsync(5000);
    await outcome;
    expect(mockEvents.discover.size).toBe(0);
  });

  it("wraps the platform's refusal", async () => {
    const { bleManagerAdapter } = load().ble;
    mockBle.scan.mockRejectedValue("No BLE scanner available");
    await expect(
      bleManagerAdapter.startScan({ services: [] }, handlers()),
    ).rejects.toMatchObject({
      name: "BluetoothError",
      code: "failed",
      message: "No BLE scanner available",
    });
  });

  it("waits out Android's limit of five starts in 30 s", async () => {
    jest.useFakeTimers({ now: 0 });
    const { bleManagerAdapter } = load("android").ble;
    for (let i = 0; i < 5; i++) {
      await bleManagerAdapter.startScan({ services: [] }, handlers());
    }
    expect(mockBle.scan).toHaveBeenCalledTimes(5);
    const sixth = bleManagerAdapter.startScan({ services: [] }, handlers());
    await jest.advanceTimersByTimeAsync(30_499);
    expect(mockBle.scan).toHaveBeenCalledTimes(5);
    await jest.advanceTimersByTimeAsync(1);
    await sixth;
    expect(mockBle.scan).toHaveBeenCalledTimes(6);
  });

  it("starts nothing when stopped while it waits", async () => {
    jest.useFakeTimers({ now: 0 });
    const { bleManagerAdapter } = load("android").ble;
    for (let i = 0; i < 5; i++) {
      await bleManagerAdapter.startScan({ services: [] }, handlers());
    }
    const sixth = bleManagerAdapter.startScan({ services: [] }, handlers());
    await bleManagerAdapter.stopScan();
    await jest.advanceTimersByTimeAsync(31_000);
    await sixth;
    expect(mockBle.scan).toHaveBeenCalledTimes(5);
  });

  it("does not throttle iOS", async () => {
    const { bleManagerAdapter } = load().ble;
    for (let i = 0; i < 7; i++) {
      await bleManagerAdapter.startScan({ services: [] }, handlers());
    }
    expect(mockBle.scan).toHaveBeenCalledTimes(7);
  });
});
