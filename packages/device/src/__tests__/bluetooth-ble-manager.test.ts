/**
 * The adapter on react-native-ble-manager, against a fake of its module.
 * Each test loads a fresh copy (`jest.isolateModules`): the adapter keeps
 * the loaded module and the one `start()` per process at module scope.
 */
import { PermissionsAndroid, Platform } from "react-native";

import type * as BleManagerModule from "../bluetooth/bleManager";
import type { BluetoothError } from "../bluetooth/errors";
import type * as SystemSheetModule from "../core/systemSheet";

type StateListener = (event: { state: string }) => void;

const mockStateListeners = new Set<StateListener>();
const mockBle = {
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
