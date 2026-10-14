import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { AppState } from "react-native";
import { renderToString } from "react-dom/server";

import { DeviceAdaptersProvider } from "..";
import {
  DEFAULT_SENSOR_INTERVAL,
  useAccelerometer,
  useBarometer,
  useDeviceMotion,
  useDeviceOrientation,
  useSensorPermission,
  useGyroscope,
  useLightSensor,
  useMagnetometer,
  useSensorAvailability,
  useSensorListener,
  type SensorsAdapter,
} from "../sensors";
import {
  classifyOrientation,
  type DeviceOrientation,
} from "../sensors/deviceOrientation";
import { getSensorStream } from "../sensors/stream";
import {
  createMockSensorsAdapter,
  type MockReading,
  type MockSensorsAdapter,
} from "../testing";

jest.mock("expo-sensors", () => ({}));

// jest-expo's AppState.addEventListener is a jest.fn: swap it for one that
// lets the test move the app between states.
let appStateListeners: ((state: string) => void)[] = [];
const originalAddEventListener = AppState.addEventListener;
const originalCurrentState = AppState.currentState;

beforeEach(() => {
  appStateListeners = [];
  AppState.currentState = "active";
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
  AppState.currentState = originalCurrentState;
  jest.restoreAllMocks();
});

async function moveTo(...states: string[]) {
  for (const state of states) {
    await act(async () => appStateListeners.forEach((l) => l(state)));
  }
}

function wrapperFor(adapter: SensorsAdapter) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <DeviceAdaptersProvider adapters={{ sensors: adapter }}>
        {children}
      </DeviceAdaptersProvider>
    );
  };
}

const FLAT = { x: 0, y: 0, z: 9.81 };

async function emit(
  adapter: MockSensorsAdapter,
  ...readings: MockReading<"accelerometer">[]
) {
  await act(async () => {
    readings.forEach((reading) => adapter.emit("accelerometer", reading));
  });
}

describe("useAccelerometer", () => {
  it("reads the sensor at the default interval once it is known to exist", async () => {
    const adapter = createMockSensorsAdapter();
    const renders: unknown[] = [];
    const { result } = await renderHook(
      () => {
        const sensor = useAccelerometer();
        renders.push(sensor);
        return sensor;
      },
      { wrapper: wrapperFor(adapter) },
    );
    expect(renders[0]).toEqual({ isAvailable: null, reading: null });
    await waitFor(() => expect(adapter.isActive("accelerometer")).toBe(true));
    expect(result.current.isAvailable).toBe(true);
    expect(adapter.intervals.accelerometer).toBe(DEFAULT_SENSOR_INTERVAL);
    expect(DEFAULT_SENSOR_INTERVAL).toBe(200);

    await emit(adapter, { ...FLAT, timestamp: 1000 });
    expect(result.current.reading).toEqual({ ...FLAT, timestamp: 1000 });
  });

  it("never opens a sensor the device lacks", async () => {
    const adapter = createMockSensorsAdapter({
      available: { accelerometer: false },
    });
    const subscribe = jest.spyOn(adapter, "subscribe");
    const setInterval = jest.spyOn(adapter, "setInterval");
    const { result } = await renderHook(() => useAccelerometer(), {
      wrapper: wrapperFor(adapter),
    });
    await waitFor(() => expect(result.current.isAvailable).toBe(false));
    expect(subscribe).not.toHaveBeenCalled();
    expect(setInterval).not.toHaveBeenCalled();
    // Nor does it follow the app state for nothing.
    expect(appStateListeners).toHaveLength(0);
  });

  it("is unavailable on an unsupported platform without asking the adapter", async () => {
    const adapter = createMockSensorsAdapter({ supported: false });
    const isAvailable = jest.spyOn(adapter, "isAvailable");
    const { result } = await renderHook(() => useAccelerometer(), {
      wrapper: wrapperFor(adapter),
    });
    await waitFor(() => expect(result.current.isAvailable).toBe(false));
    expect(isAvailable).not.toHaveBeenCalled();
  });

  it("treats a failed availability check as unavailable", async () => {
    const adapter = createMockSensorsAdapter();
    jest.spyOn(adapter, "isAvailable").mockRejectedValue(new Error("boom"));
    const { result } = await renderHook(() => useAccelerometer(), {
      wrapper: wrapperFor(adapter),
    });
    await waitFor(() => expect(result.current.isAvailable).toBe(false));
    expect(adapter.isActive("accelerometer")).toBe(false);
  });

  it("listens only while enabled, and keeps the last reading", async () => {
    const adapter = createMockSensorsAdapter();
    const { result, rerender } = await renderHook(
      ({ enabled }: { enabled: boolean }) => useAccelerometer({ enabled }),
      { wrapper: wrapperFor(adapter), initialProps: { enabled: false } },
    );
    await waitFor(() => expect(result.current.isAvailable).toBe(true));
    expect(adapter.isActive("accelerometer")).toBe(false);

    await rerender({ enabled: true });
    await waitFor(() => expect(adapter.isActive("accelerometer")).toBe(true));
    await emit(adapter, { ...FLAT, timestamp: 10 });

    await rerender({ enabled: false });
    expect(adapter.isActive("accelerometer")).toBe(false);
    expect(result.current.reading).toEqual({ ...FLAT, timestamp: 10 });
  });

  it("asks the adapter once per sensor, however many readers", async () => {
    const adapter = createMockSensorsAdapter();
    const isAvailable = jest.spyOn(adapter, "isAvailable");
    const { result } = await renderHook(
      () => [useAccelerometer(), useAccelerometer(), useGyroscope()],
      { wrapper: wrapperFor(adapter) },
    );
    await waitFor(() =>
      expect(result.current.every((sensor) => sensor.isAvailable)).toBe(true),
    );
    expect(isAvailable.mock.calls).toEqual([["accelerometer"], ["gyroscope"]]);
  });

  it("rejects an interval that is not a number of milliseconds", async () => {
    const adapter = createMockSensorsAdapter();
    jest.spyOn(console, "error").mockImplementation(() => {});
    for (const interval of [-1, Number.NaN, Infinity, "100" as never]) {
      await expect(
        renderHook(() => useAccelerometer({ interval }), {
          wrapper: wrapperFor(adapter),
        }),
      ).rejects.toThrow(TypeError);
    }
  });
});

describe("one stream per sensor", () => {
  it("runs at the fastest interval and throttles each reader to its own", async () => {
    const adapter = createMockSensorsAdapter();
    const subscribe = jest.spyOn(adapter, "subscribe");
    const fast: number[] = [];
    const slow: number[] = [];
    await renderHook(
      () => {
        useSensorListener("accelerometer", (r) => fast.push(r.timestamp), {
          interval: 100,
        });
        useSensorListener("accelerometer", (r) => slow.push(r.timestamp), {
          interval: 500,
        });
      },
      { wrapper: wrapperFor(adapter) },
    );
    await waitFor(() => expect(adapter.isActive("accelerometer")).toBe(true));
    expect(subscribe).toHaveBeenCalledTimes(1);
    expect(adapter.intervals.accelerometer).toBe(100);

    // 95 ms is within the 10% tolerance of 100; 440 is not within 500's.
    await emit(
      adapter,
      ...[0, 95, 200, 300, 440, 500, 600, 1000].map((timestamp) => ({
        ...FLAT,
        timestamp,
      })),
    );
    // 500 is 60 ms after 440: too early for the 100 ms reader.
    expect(fast).toEqual([0, 95, 200, 300, 440, 600, 1000]);
    expect(slow).toEqual([0, 500, 1000]);
  });

  it("slows down when the fastest reader leaves and closes with the last", async () => {
    const adapter = createMockSensorsAdapter();
    const fast = await renderHook(() => useAccelerometer({ interval: 50 }), {
      wrapper: wrapperFor(adapter),
    });
    const slow = await renderHook(() => useAccelerometer({ interval: 300 }), {
      wrapper: wrapperFor(adapter),
    });
    await waitFor(() => expect(adapter.intervals.accelerometer).toBe(50));

    await fast.unmount();
    expect(adapter.intervals.accelerometer).toBe(300);
    expect(adapter.isActive("accelerometer")).toBe(true);

    await slow.unmount();
    expect(adapter.isActive("accelerometer")).toBe(false);
    expect(appStateListeners).toHaveLength(0);
  });

  it("changes the interval without subscribing again", async () => {
    const adapter = createMockSensorsAdapter();
    const subscribe = jest.spyOn(adapter, "subscribe");
    const { rerender } = await renderHook(
      ({ interval }: { interval: number }) => useAccelerometer({ interval }),
      { wrapper: wrapperFor(adapter), initialProps: { interval: 200 } },
    );
    await waitFor(() => expect(adapter.isActive("accelerometer")).toBe(true));

    await rerender({ interval: 20 });
    expect(adapter.intervals.accelerometer).toBe(20);
    expect(subscribe).toHaveBeenCalledTimes(1);
  });

  it("keeps running when one reader replaces another in the same commit", async () => {
    const adapter = createMockSensorsAdapter();
    const subscribe = jest.spyOn(adapter, "subscribe");
    const { rerender } = await renderHook(
      ({ first }: { first: boolean }) => {
        useAccelerometer({ enabled: first, interval: 100 });
        useAccelerometer({ enabled: !first, interval: 300 });
      },
      { wrapper: wrapperFor(adapter), initialProps: { first: true } },
    );
    await waitFor(() => expect(adapter.isActive("accelerometer")).toBe(true));

    await rerender({ first: false });
    await act(async () => {});
    expect(adapter.isActive("accelerometer")).toBe(true);
    expect(adapter.intervals.accelerometer).toBe(300);
    expect(subscribe).toHaveBeenCalledTimes(1);
  });

  it("keeps the sensors of one adapter apart", async () => {
    const adapter = createMockSensorsAdapter();
    const { result } = await renderHook(
      () => ({
        gyroscope: useGyroscope({ interval: 0 }),
        magnetometer: useMagnetometer({ interval: 0 }),
        barometer: useBarometer({ interval: 0 }),
        light: useLightSensor({ interval: 0 }),
      }),
      { wrapper: wrapperFor(adapter) },
    );
    await waitFor(() => expect(adapter.isActive("light")).toBe(true));
    await act(async () => {
      adapter.emit("gyroscope", { x: 1, y: 2, z: 3 });
      adapter.emit("magnetometer", { x: 20, y: 0, z: -40 });
      adapter.emit("barometer", { pressure: 1013.25, relativeAltitude: null });
      adapter.emit("light", { illuminance: 320 });
    });
    expect(result.current.gyroscope.reading).toEqual({
      x: 1,
      y: 2,
      z: 3,
      timestamp: 0,
    });
    expect(result.current.magnetometer.reading?.z).toBe(-40);
    expect(result.current.barometer.reading?.pressure).toBe(1013.25);
    expect(result.current.light.reading?.illuminance).toBe(320);
    expect(adapter.isActive("accelerometer")).toBe(false);
  });

  it("keeps a stream per adapter", async () => {
    const first = createMockSensorsAdapter();
    const second = createMockSensorsAdapter();
    await renderHook(() => useAccelerometer({ interval: 40 }), {
      wrapper: wrapperFor(first),
    });
    await renderHook(() => useAccelerometer({ interval: 400 }), {
      wrapper: wrapperFor(second),
    });
    await waitFor(() => expect(second.isActive("accelerometer")).toBe(true));
    expect(first.intervals.accelerometer).toBe(40);
    expect(second.intervals.accelerometer).toBe(400);
  });

  it("skips a reader that an earlier one removed during the same reading", async () => {
    const adapter = createMockSensorsAdapter();
    const stream = getSensorStream(adapter, "accelerometer");
    const second = jest.fn();
    let removeSecond = () => {};
    const removeFirst = stream.subscribe(0, () => removeSecond());
    removeSecond = stream.subscribe(0, second);
    await waitFor(() => expect(adapter.isActive("accelerometer")).toBe(true));

    adapter.emit("accelerometer", { ...FLAT, timestamp: 5 });
    expect(second).not.toHaveBeenCalled();
    removeFirst();
    await waitFor(() => expect(adapter.isActive("accelerometer")).toBe(false));
  });
});

describe("useSensorListener", () => {
  it("calls the latest callback without re-rendering or subscribing again", async () => {
    const adapter = createMockSensorsAdapter();
    const subscribe = jest.spyOn(adapter, "subscribe");
    let renders = 0;
    const calls: string[] = [];
    const { rerender } = await renderHook(
      ({ name }: { name: string }) => {
        renders++;
        return useSensorListener("gyroscope", () => calls.push(name), {
          interval: 0,
        });
      },
      { wrapper: wrapperFor(adapter), initialProps: { name: "first" } },
    );
    await waitFor(() => expect(adapter.isActive("gyroscope")).toBe(true));
    await rerender({ name: "second" });
    const before = renders;

    await act(async () => {
      adapter.emit("gyroscope", { x: 0, y: 0, z: 1 });
      adapter.emit("gyroscope", { x: 0, y: 0, z: 2 });
    });
    expect(calls).toEqual(["second", "second"]);
    expect(renders).toBe(before);
    expect(subscribe).toHaveBeenCalledTimes(1);
  });

  it("reports availability", async () => {
    const adapter = createMockSensorsAdapter({ available: { light: false } });
    const { result } = await renderHook(
      () => [
        useSensorListener("light", () => {}).isAvailable,
        useSensorAvailability("barometer"),
      ],
      { wrapper: wrapperFor(adapter) },
    );
    await waitFor(() => expect(result.current).toEqual([false, true]));
  });
});

describe("in the background", () => {
  it("stops on background, ignores inactive and starts again on active", async () => {
    const adapter = createMockSensorsAdapter();
    const setInterval = jest.spyOn(adapter, "setInterval");
    const { result } = await renderHook(
      () => useAccelerometer({ interval: 100 }),
      {
        wrapper: wrapperFor(adapter),
      },
    );
    await waitFor(() => expect(adapter.isActive("accelerometer")).toBe(true));

    await moveTo("inactive");
    expect(adapter.isActive("accelerometer")).toBe(true);

    await moveTo("background");
    expect(adapter.isActive("accelerometer")).toBe(false);

    await moveTo("inactive");
    expect(adapter.isActive("accelerometer")).toBe(false);

    await moveTo("active");
    expect(adapter.isActive("accelerometer")).toBe(true);
    // The interval is set again before the sensor reopens.
    expect(setInterval).toHaveBeenCalledTimes(2);
    expect(setInterval).toHaveBeenLastCalledWith("accelerometer", 100);

    await emit(adapter, { ...FLAT, timestamp: 50_000 });
    expect(result.current.reading?.timestamp).toBe(50_000);
  });

  it("waits for the foreground when it starts in the background", async () => {
    AppState.currentState = "background";
    const adapter = createMockSensorsAdapter();
    const { result } = await renderHook(() => useAccelerometer(), {
      wrapper: wrapperFor(adapter),
    });
    await waitFor(() => expect(result.current.isAvailable).toBe(true));
    expect(adapter.isActive("accelerometer")).toBe(false);

    await moveTo("active");
    expect(adapter.isActive("accelerometer")).toBe(true);
  });

  it("does not reopen after the last reader left in the background", async () => {
    const adapter = createMockSensorsAdapter();
    const { unmount } = await renderHook(() => useAccelerometer(), {
      wrapper: wrapperFor(adapter),
    });
    await waitFor(() => expect(adapter.isActive("accelerometer")).toBe(true));
    await moveTo("background");
    await unmount();
    expect(appStateListeners).toHaveLength(0);
    expect(adapter.isActive("accelerometer")).toBe(false);
  });
});

describe("useDeviceMotion", () => {
  it("reads the fused motion", async () => {
    const adapter = createMockSensorsAdapter();
    const { result } = await renderHook(() => useDeviceMotion(), {
      wrapper: wrapperFor(adapter),
    });
    await waitFor(() => expect(adapter.isActive("deviceMotion")).toBe(true));
    const motion = {
      acceleration: { x: 0.5, y: 0, z: 0 },
      gravity: FLAT,
      rotationRate: { x: 0, y: 0, z: 1 },
    };
    await act(async () => adapter.emit("deviceMotion", motion));
    expect(result.current.reading).toEqual({ ...motion, timestamp: 200 });
  });
});

describe("motion permission", () => {
  const barometer = { pressure: 1000, relativeAltitude: 0 };

  it("opens a gated sensor only once the permission is granted", async () => {
    const adapter = createMockSensorsAdapter({ gated: ["barometer"] });
    const { result } = await renderHook(
      () => ({
        reading: useBarometer().reading,
        permission: useSensorPermission("barometer"),
      }),
      { wrapper: wrapperFor(adapter) },
    );
    await waitFor(() =>
      expect(result.current.permission.status).toBe("undetermined"),
    );
    expect(result.current.permission).toMatchObject({
      isRequired: true,
      isLoading: false,
      canAskAgain: true,
    });
    expect(adapter.isActive("barometer")).toBe(false);
    // Reading it never prompts.
    expect(adapter.permissionRequests).toBe(0);

    await act(async () => {
      await result.current.permission.request();
    });
    expect(result.current.permission.status).toBe("granted");
    expect(adapter.isActive("barometer")).toBe(true);
    await act(async () => adapter.emit("barometer", barometer));
    expect(result.current.reading?.pressure).toBe(1000);
  });

  it("prompts synchronously, inside the press that asked", async () => {
    const adapter = createMockSensorsAdapter({ gated: ["accelerometer"] });
    const { result } = await renderHook(
      () => useSensorPermission("accelerometer"),
      { wrapper: wrapperFor(adapter) },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      const pending = result.current.request();
      // Before any await: Safari grants only inside the gesture.
      expect(adapter.permissionRequests).toBe(1);
      await pending;
    });
  });

  it("never opens a gated sensor that was denied", async () => {
    const adapter = createMockSensorsAdapter({
      gated: ["barometer"],
      requestAnswer: "denied",
    });
    const { result } = await renderHook(
      () => {
        useBarometer();
        return useSensorPermission("barometer");
      },
      { wrapper: wrapperFor(adapter) },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await act(async () => {
      await result.current.request();
    });
    expect(result.current).toMatchObject({
      status: "denied",
      canAskAgain: false,
    });
    expect(adapter.isActive("barometer")).toBe(false);
  });

  it("stops when the permission is revoked in the settings", async () => {
    const adapter = createMockSensorsAdapter({
      gated: ["barometer"],
      permission: "granted",
    });
    await renderHook(() => useBarometer(), { wrapper: wrapperFor(adapter) });
    await waitFor(() => expect(adapter.isActive("barometer")).toBe(true));

    adapter.setPermission("denied");
    await moveTo("background", "active");
    await waitFor(() => expect(adapter.isActive("barometer")).toBe(false));
  });

  it("reads no permission for a sensor that needs none", async () => {
    const adapter = createMockSensorsAdapter({ gated: ["barometer"] });
    const getPermission = jest.spyOn(adapter, "getPermission");
    const { result } = await renderHook(
      () => ({
        reading: useAccelerometer({ interval: 0 }),
        permission: useSensorPermission("accelerometer"),
      }),
      { wrapper: wrapperFor(adapter) },
    );
    await waitFor(() => expect(adapter.isActive("accelerometer")).toBe(true));
    expect(result.current.permission).toMatchObject({
      status: "granted",
      isRequired: false,
      isLoading: false,
    });
    await expect(result.current.permission.request()).resolves.toEqual({
      status: "granted",
      canAskAgain: false,
    });
    expect(getPermission).not.toHaveBeenCalled();
    expect(adapter.permissionRequests).toBe(0);
  });
});

describe("useDeviceOrientation", () => {
  const G = 9.81;

  it("follows how the device is held, re-rendering only on a change", async () => {
    const adapter = createMockSensorsAdapter();
    let renders = 0;
    const { result } = await renderHook(
      () => {
        renders++;
        return useDeviceOrientation();
      },
      { wrapper: wrapperFor(adapter) },
    );
    await waitFor(() => expect(adapter.isActive("accelerometer")).toBe(true));
    expect(result.current).toEqual({ isAvailable: true, orientation: null });

    await emit(adapter, { x: 0, y: G, z: 0 });
    expect(result.current.orientation).toBe("portrait-up");
    const before = renders;
    await emit(adapter, { x: 0.3, y: G, z: 0.2 });
    expect(renders).toBe(before);

    await emit(adapter, { x: G, y: 0, z: 0 });
    expect(result.current.orientation).toBe("landscape-right");
  });
});

describe("classifyOrientation", () => {
  const G = 9.81;
  const at = (x: number, y: number, z: number) => ({ x, y, z, timestamp: 0 });
  const tilt = (degrees: number) => {
    const r = (degrees * Math.PI) / 180;
    // From face up towards portrait-up.
    return at(0, G * Math.sin(r), G * Math.cos(r));
  };

  it.each<[string, ReturnType<typeof at>, DeviceOrientation]>([
    ["lying face up", at(0, 0, G), "face-up"],
    ["lying face down", at(0, 0, -G), "face-down"],
    ["upright", at(0, G, 0), "portrait-up"],
    ["upside down", at(0, -G, 0), "portrait-down"],
    ["on its left edge (right edge up)", at(G, 0, 0), "landscape-right"],
    ["on its right edge", at(-G, 0, 0), "landscape-left"],
  ])("reads %s", (_name, reading, expected) => {
    expect(classifyOrientation(reading, null)).toBe(expected);
  });

  it("enters within 35° of an axis and keeps the previous answer between", () => {
    expect(classifyOrientation(tilt(30), null)).toBe("face-up");
    expect(classifyOrientation(tilt(45), "face-up")).toBe("face-up");
    expect(classifyOrientation(tilt(45), "portrait-up")).toBe("portrait-up");
    expect(classifyOrientation(tilt(45), null)).toBeNull();
    expect(classifyOrientation(tilt(60), "face-up")).toBe("portrait-up");
  });

  it("ignores a shaken device", () => {
    expect(classifyOrientation(at(0, 0, 2 * G), "portrait-up")).toBe(
      "portrait-up",
    );
    expect(classifyOrientation(at(0, 0, 0.3 * G), "portrait-up")).toBe(
      "portrait-up",
    );
  });
});

describe("the mock", () => {
  it("advances the timestamp by the interval and sends nothing while stopped", async () => {
    const adapter = createMockSensorsAdapter();
    const seen: number[] = [];
    adapter.emit("accelerometer", FLAT);
    const stop = adapter.subscribe("accelerometer", (r) =>
      seen.push(r.timestamp),
    );
    adapter.setInterval("accelerometer", 250);
    adapter.emit("accelerometer", FLAT);
    adapter.emit("accelerometer", FLAT);
    adapter.emit("accelerometer", { ...FLAT, timestamp: 2000 });
    stop();
    adapter.emit("accelerometer", FLAT);
    expect(seen).toEqual([250, 500, 2000]);
    expect(adapter.isActive("accelerometer")).toBe(false);
    await expect(adapter.isAvailable("light")).resolves.toBe(true);
  });

  it("keeps a refusal: a request does not ask again", async () => {
    const adapter = createMockSensorsAdapter({ permission: "denied" });
    await expect(adapter.requestPermission()).resolves.toEqual({
      status: "denied",
      canAskAgain: false,
    });
    expect(adapter.permissionRequests).toBe(1);
  });
});

describe("static export", () => {
  it("renders unknown availability and no reading on the server", () => {
    const adapter = createMockSensorsAdapter();
    const isAvailable = jest.spyOn(adapter, "isAvailable");
    let seen: unknown;
    function Probe() {
      seen = useAccelerometer();
      return null;
    }
    renderToString(
      <DeviceAdaptersProvider adapters={{ sensors: adapter }}>
        <Probe />
      </DeviceAdaptersProvider>,
    );
    expect(seen).toEqual({ isAvailable: null, reading: null });
    expect(isAvailable).not.toHaveBeenCalled();
  });

  it("renders the permission as loading on the server", () => {
    const adapter = createMockSensorsAdapter({ gated: ["barometer"] });
    const getPermission = jest.spyOn(adapter, "getPermission");
    let seen: unknown;
    function Probe() {
      seen = useSensorPermission("accelerometer");
      return null;
    }
    renderToString(
      <DeviceAdaptersProvider adapters={{ sensors: adapter }}>
        <Probe />
      </DeviceAdaptersProvider>,
    );
    expect(seen).toMatchObject({
      status: "undetermined",
      isRequired: null,
      isLoading: true,
    });
    expect(getPermission).not.toHaveBeenCalled();
  });
});
