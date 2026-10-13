import * as Battery from "expo-battery";

import { expoBatteryAdapter } from "../battery/expo";
import { webBatteryAdapter } from "../battery/web";

jest.mock("expo-battery", () => ({
  BatteryState: { UNKNOWN: 0, UNPLUGGED: 1, CHARGING: 2, FULL: 3 },
  isAvailableAsync: jest.fn(),
  getBatteryLevelAsync: jest.fn(),
  getBatteryStateAsync: jest.fn(),
  isLowPowerModeEnabledAsync: jest.fn(),
  addBatteryLevelListener: jest.fn(),
  addBatteryStateListener: jest.fn(),
  addLowPowerModeListener: jest.fn(),
}));

// The web adapter reads `hasDOM()`, false under the native jest preset.
jest.mock("../core/support", () => ({
  ...jest.requireActual("../core/support"),
  hasDOM: () => true,
}));

const battery = jest.mocked(Battery);
const flush = () => new Promise((resolve) => setImmediate(resolve));

describe("expoBatteryAdapter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    battery.isAvailableAsync.mockResolvedValue(true);
    battery.getBatteryLevelAsync.mockResolvedValue(0.42);
    battery.getBatteryStateAsync.mockResolvedValue(
      Battery.BatteryState.CHARGING,
    );
    battery.isLowPowerModeEnabledAsync.mockResolvedValue(false);
  });

  it("reads the whole status", async () => {
    expect(await expoBatteryAdapter.getStatus()).toEqual({
      isAvailable: true,
      level: 0.42,
      charging: "charging",
      lowPowerMode: false,
    });
  });

  it("reports an unreadable level (-1) as null", async () => {
    battery.getBatteryLevelAsync.mockResolvedValue(-1);
    battery.getBatteryStateAsync.mockResolvedValue(
      Battery.BatteryState.UNKNOWN,
    );
    expect(await expoBatteryAdapter.getStatus()).toMatchObject({
      level: null,
      charging: "unknown",
    });
  });

  it("reads nothing more when there is no battery", async () => {
    battery.isAvailableAsync.mockResolvedValue(false);
    expect(await expoBatteryAdapter.getStatus()).toEqual({
      isAvailable: false,
      level: null,
      charging: "unknown",
      lowPowerMode: null,
    });
    expect(battery.getBatteryLevelAsync).not.toHaveBeenCalled();
  });

  describe("subscribe", () => {
    let handlers: {
      level: (e: { batteryLevel: number }) => void;
      state: (e: { batteryState: Battery.BatteryState }) => void;
      power: (e: { lowPowerMode: boolean }) => void;
    };
    let removed: string[];

    beforeEach(() => {
      removed = [];
      handlers = {} as never;
      battery.addBatteryLevelListener.mockImplementation((h) => {
        handlers.level = h;
        return { remove: () => removed.push("level") };
      });
      battery.addBatteryStateListener.mockImplementation((h) => {
        handlers.state = h;
        return { remove: () => removed.push("state") };
      });
      battery.addLowPowerModeListener.mockImplementation((h) => {
        handlers.power = h;
        return { remove: () => removed.push("power") };
      });
    });

    it("merges each event into the whole status", async () => {
      const listener = jest.fn();
      const stop = expoBatteryAdapter.subscribe(listener);
      await flush();
      expect(listener).toHaveBeenLastCalledWith(
        expect.objectContaining({ level: 0.42, charging: "charging" }),
      );
      handlers.state({ batteryState: Battery.BatteryState.FULL });
      handlers.level({ batteryLevel: 1 });
      handlers.power({ lowPowerMode: true });
      expect(listener).toHaveBeenLastCalledWith({
        isAvailable: true,
        level: 1,
        charging: "full",
        lowPowerMode: true,
      });
      stop();
      expect(removed.sort()).toEqual(["level", "power", "state"]);
    });

    it("keeps an event that arrives before the first read", async () => {
      const listener = jest.fn();
      const stop = expoBatteryAdapter.subscribe(listener);
      handlers.level({ batteryLevel: 0.41 });
      expect(listener).not.toHaveBeenCalled();
      await flush();
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenLastCalledWith(
        expect.objectContaining({ level: 0.41 }),
      );
      stop();
    });

    it("stays silent once unsubscribed", async () => {
      const listener = jest.fn();
      expoBatteryAdapter.subscribe(listener)();
      await flush();
      handlers.level({ batteryLevel: 0.1 });
      expect(listener).not.toHaveBeenCalled();
    });
  });
});

describe("webBatteryAdapter", () => {
  const originalNavigator = globalThis.navigator;
  let manager: {
    level: number;
    charging: boolean;
    listeners: Record<string, (() => void)[]>;
    addEventListener: (type: string, fn: () => void) => void;
    removeEventListener: (type: string, fn: () => void) => void;
  };
  let resolveBattery: () => void;

  beforeEach(() => {
    manager = {
      level: 0.5,
      charging: false,
      listeners: {},
      addEventListener(type, fn) {
        (this.listeners[type] ??= []).push(fn);
      },
      removeEventListener(type, fn) {
        this.listeners[type] = (this.listeners[type] ?? []).filter(
          (f) => f !== fn,
        );
      },
    };
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: {
        getBattery: () =>
          new Promise((resolve) => {
            resolveBattery = () => resolve(manager);
          }),
      },
    });
  });
  afterAll(() => {
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: originalNavigator,
    });
  });

  it("is supported only with the Battery Status API", () => {
    expect(webBatteryAdapter.isSupported()).toBe(true);
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: {},
    });
    expect(webBatteryAdapter.isSupported()).toBe(false);
  });

  it("maps the manager, Low Power Mode unknown", async () => {
    manager.charging = true;
    const status = webBatteryAdapter.getStatus();
    resolveBattery();
    expect(await status).toEqual({
      isAvailable: true,
      level: 0.5,
      charging: "charging",
      lowPowerMode: null,
    });
  });

  it("reads a charging battery at 100% as full", async () => {
    manager.charging = true;
    manager.level = 1;
    const status = webBatteryAdapter.getStatus();
    resolveBattery();
    expect((await status).charging).toBe("full");
  });

  it("follows level and charging events, then lets go of them", async () => {
    const listener = jest.fn();
    const stop = webBatteryAdapter.subscribe(listener);
    resolveBattery();
    await flush();
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ level: 0.5, charging: "unplugged" }),
    );
    manager.level = 0.49;
    manager.listeners.levelchange.forEach((fn) => fn());
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ level: 0.49 }),
    );
    manager.charging = true;
    manager.listeners.chargingchange.forEach((fn) => fn());
    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({ charging: "charging" }),
    );
    stop();
    expect(manager.listeners.levelchange).toHaveLength(0);
    expect(manager.listeners.chargingchange).toHaveLength(0);
  });

  it("never attaches when unsubscribed before getBattery resolves", async () => {
    const listener = jest.fn();
    webBatteryAdapter.subscribe(listener)();
    resolveBattery();
    await flush();
    expect(manager.listeners.levelchange).toBeUndefined();
    expect(listener).not.toHaveBeenCalled();
  });
});
