import {
  Accelerometer,
  Barometer,
  Gyroscope,
  LightSensor,
  Magnetometer,
} from "expo-sensors";
import { Platform } from "react-native";

import { expoSensorsAdapter } from "../sensors/expo";
import { PROBE_TIMEOUT, webSensorsAdapter } from "../sensors/web";

jest.mock("expo-sensors", () => {
  const sensor = () => {
    const listeners = new Set<(mockRaw: unknown) => void>();
    return {
      listeners,
      isAvailableAsync: jest.fn(async () => true),
      setUpdateInterval: jest.fn(),
      addListener: jest.fn((listener: (mockRaw: unknown) => void) => {
        listeners.add(listener);
        return { remove: () => listeners.delete(listener) };
      }),
    };
  };
  return {
    Accelerometer: sensor(),
    Gyroscope: sensor(),
    Magnetometer: sensor(),
    Barometer: sensor(),
    LightSensor: sensor(),
  };
});

// The web adapter reads `hasDOM()`, false under the native jest preset.
jest.mock("../core/support", () => ({
  ...jest.requireActual("../core/support"),
  hasDOM: () => true,
}));

type FakeSensor = { listeners: Set<(raw: unknown) => void> };
const send = (module: unknown, raw: unknown) =>
  (module as FakeSensor).listeners.forEach((listener) => listener(raw));

function collect(sensor: Parameters<typeof expoSensorsAdapter.subscribe>[0]) {
  const readings: unknown[] = [];
  const stop = expoSensorsAdapter.subscribe(sensor, (r) => readings.push(r));
  return { readings, stop };
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe("expoSensorsAdapter", () => {
  it("turns iOS's accelerometer into m/s², Android's sign", () => {
    jest.replaceProperty(Platform, "OS", "ios");
    const { readings, stop } = collect("accelerometer");
    send(Accelerometer, { x: 0, y: 0.5, z: -1, timestamp: 12.5 });
    stop();
    expect(readings).toEqual([
      { x: 0, y: -4.903325, z: 9.80665, timestamp: 12500 },
    ]);
    // An inverted zero is 0, not -0.
    expect(Object.is((readings[0] as { x: number }).x, 0)).toBe(true);
  });

  it("keeps Android's accelerometer sign, in m/s²", () => {
    jest.replaceProperty(Platform, "OS", "android");
    const { readings, stop } = collect("accelerometer");
    send(Accelerometer, { x: 0, y: 0, z: 1, timestamp: 2 });
    stop();
    expect(readings).toEqual([{ x: 0, y: 0, z: 9.80665, timestamp: 2000 }]);
  });

  it("passes the gyroscope and magnetometer through, with ms timestamps", () => {
    const gyroscope = collect("gyroscope");
    const magnetometer = collect("magnetometer");
    send(Gyroscope, { x: 0.1, y: -0.2, z: 3, timestamp: 1.5 });
    send(Magnetometer, { x: 20, y: -5, z: -42, timestamp: 0.25 });
    gyroscope.stop();
    magnetometer.stop();
    expect(gyroscope.readings).toEqual([
      { x: 0.1, y: -0.2, z: 3, timestamp: 1500 },
    ]);
    expect(magnetometer.readings).toEqual([
      { x: 20, y: -5, z: -42, timestamp: 250 },
    ]);
  });

  it("reads the barometer's altitude where there is one", () => {
    const { readings, stop } = collect("barometer");
    send(Barometer, { pressure: 1013.2, relativeAltitude: 1.5, timestamp: 1 });
    send(Barometer, { pressure: 1013.1, timestamp: 2 });
    stop();
    expect(readings).toEqual([
      { pressure: 1013.2, relativeAltitude: 1.5, timestamp: 1000 },
      { pressure: 1013.1, relativeAltitude: null, timestamp: 2000 },
    ]);
  });

  it("reads the light sensor", () => {
    const { readings, stop } = collect("light");
    send(LightSensor, { illuminance: 320, timestamp: 3 });
    stop();
    expect(readings).toEqual([{ illuminance: 320, timestamp: 3000 }]);
  });

  it("stops listening on unsubscribe", () => {
    const { readings, stop } = collect("gyroscope");
    stop();
    send(Gyroscope, { x: 1, y: 1, z: 1, timestamp: 1 });
    expect(readings).toEqual([]);
  });

  it("tolerates a sensor whose listener returns nothing (iOS's light stub)", () => {
    jest
      .mocked(LightSensor.addListener)
      .mockReturnValueOnce(undefined as never);
    const stop = expoSensorsAdapter.subscribe("light", () => {});
    expect(stop).not.toThrow();
  });

  it("sets a whole number of milliseconds", () => {
    expoSensorsAdapter.setInterval("accelerometer", 16.6);
    expect(Accelerometer.setUpdateInterval).toHaveBeenLastCalledWith(17);
  });

  it("answers availability, and false on a failure", async () => {
    jest.mocked(Magnetometer.isAvailableAsync).mockResolvedValueOnce(false);
    jest
      .mocked(Barometer.isAvailableAsync)
      .mockRejectedValueOnce(new Error("no module"));
    await expect(expoSensorsAdapter.isAvailable("accelerometer")).resolves.toBe(
      true,
    );
    await expect(expoSensorsAdapter.isAvailable("magnetometer")).resolves.toBe(
      false,
    );
    await expect(expoSensorsAdapter.isAvailable("barometer")).resolves.toBe(
      false,
    );
  });
});

describe("webSensorsAdapter", () => {
  type Motion = {
    timeStamp: number;
    accelerationIncludingGravity: Partial<
      Record<"x" | "y" | "z", number | null>
    > | null;
    rotationRate: Partial<
      Record<"alpha" | "beta" | "gamma", number | null>
    > | null;
  };
  let motionListeners: Set<(event: Motion) => void>;
  const fire = (event: Partial<Motion>) =>
    [...motionListeners].forEach((listener) =>
      listener({
        timeStamp: 0,
        accelerationIncludingGravity: null,
        rotationRate: null,
        ...event,
      }),
    );

  beforeEach(() => {
    motionListeners = new Set();
    // jest-expo's window has no events: give it the two calls the adapter uses.
    Object.assign(window, {
      addEventListener: (type: string, listener: never) => {
        if (type === "devicemotion") motionListeners.add(listener);
      },
      removeEventListener: (type: string, listener: never) => {
        if (type === "devicemotion") motionListeners.delete(listener);
      },
    });
    (globalThis as { DeviceMotionEvent?: unknown }).DeviceMotionEvent =
      function DeviceMotionEvent() {};
  });

  afterEach(() => {
    const target = window as Partial<Window>;
    delete target.addEventListener;
    delete target.removeEventListener;
    delete (globalThis as { DeviceMotionEvent?: unknown }).DeviceMotionEvent;
    jest.useRealTimers();
  });

  it("reads the accelerometer from accelerationIncludingGravity", () => {
    const readings: unknown[] = [];
    const stop = webSensorsAdapter.subscribe("accelerometer", (r) =>
      readings.push(r),
    );
    fire({
      timeStamp: 1234.5,
      accelerationIncludingGravity: { x: 0.1, y: 0.2, z: 9.8 },
    });
    // A browser without the data sends nulls: skipped.
    fire({ accelerationIncludingGravity: { x: null, y: null, z: null } });
    fire({ accelerationIncludingGravity: { x: 1, y: null, z: 1 } });
    stop();
    fire({ accelerationIncludingGravity: { x: 1, y: 1, z: 1 } });
    expect(readings).toEqual([{ x: 0.1, y: 0.2, z: 9.8, timestamp: 1234.5 }]);
    expect(motionListeners.size).toBe(0);
  });

  it("maps the W3C rotation rate onto the device axes, in rad/s", () => {
    const readings: { x: number; y: number; z: number }[] = [];
    const stop = webSensorsAdapter.subscribe("gyroscope", (r) =>
      readings.push(r),
    );
    // alpha turns around z, beta around x, gamma around y.
    fire({ timeStamp: 5, rotationRate: { alpha: 180, beta: 90, gamma: -45 } });
    fire({ rotationRate: null });
    stop();
    expect(readings).toHaveLength(1);
    expect(readings[0].x).toBeCloseTo(Math.PI / 2);
    expect(readings[0].y).toBeCloseTo(-Math.PI / 4);
    expect(readings[0].z).toBeCloseTo(Math.PI);
  });

  it("has no magnetometer, barometer or light sensor", async () => {
    for (const sensor of ["magnetometer", "barometer", "light"] as const) {
      await expect(webSensorsAdapter.isAvailable(sensor)).resolves.toBe(false);
      const stop = webSensorsAdapter.subscribe(sensor, () => {});
      expect(motionListeners.size).toBe(0);
      stop();
    }
  });

  it("is unavailable without DeviceMotionEvent", async () => {
    delete (globalThis as { DeviceMotionEvent?: unknown }).DeviceMotionEvent;
    const answer = webSensorsAdapter.isAvailable("accelerometer");
    // Answered without waiting for an event.
    expect(motionListeners.size).toBe(0);
    await expect(answer).resolves.toBe(false);
  });

  it("is available once an event carries the sensor's data", async () => {
    jest.useFakeTimers();
    const answer = webSensorsAdapter.isAvailable("gyroscope");
    fire({ rotationRate: { alpha: 0, beta: 0, gamma: 0 } });
    await expect(answer).resolves.toBe(true);
    expect(motionListeners.size).toBe(0);
    expect(jest.getTimerCount()).toBe(0);
  });

  it("does not take another sensor's data as proof", async () => {
    jest.useFakeTimers();
    const answer = webSensorsAdapter.isAvailable("gyroscope");
    // A laptop's browser may send an accelerometer without a gyroscope.
    fire({ accelerationIncludingGravity: { x: 0, y: 0, z: 9.8 } });
    jest.advanceTimersByTime(PROBE_TIMEOUT);
    await expect(answer).resolves.toBe(false);
  });

  it("is unavailable when no event comes in time", async () => {
    jest.useFakeTimers();
    const answer = webSensorsAdapter.isAvailable("accelerometer");
    jest.advanceTimersByTime(PROBE_TIMEOUT);
    await expect(answer).resolves.toBe(false);
    expect(motionListeners.size).toBe(0);
  });
});
