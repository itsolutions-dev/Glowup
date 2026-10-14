import {
  Accelerometer,
  Barometer,
  DeviceMotion,
  Gyroscope,
  LightSensor,
  Magnetometer,
} from "expo-sensors";
import { Platform } from "react-native";

import { expoSensorsAdapter } from "../sensors/expo";
import {
  createWebSensorsAdapter,
  PROBE_TIMEOUT,
  webSensorsAdapter,
} from "../sensors/web";

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
    DeviceMotion: {
      ...sensor(),
      getPermissionsAsync: jest.fn(async () => ({
        status: "undetermined",
        granted: false,
        canAskAgain: true,
      })),
      requestPermissionsAsync: jest.fn(async () => ({
        status: "granted",
        granted: true,
        canAskAgain: false,
      })),
    },
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

  describe("device motion", () => {
    // A phone lying face up, pushed along +x at 1 m/s², turning around z
    // at 90 deg/s, as each platform's expo build reports it.
    const ios = {
      acceleration: { x: -1, y: 0, z: 0, timestamp: 4 },
      accelerationIncludingGravity: { x: -1, y: 0, z: -9.80665, timestamp: 4 },
      rotationRate: { alpha: 90, beta: 0, gamma: 0, timestamp: 4 },
    };
    const android = {
      acceleration: { x: 1, y: 0, z: 0, timestamp: 4 },
      // accel - 2 * gravity
      accelerationIncludingGravity: { x: 1, y: 0, z: -9.80665, timestamp: 4 },
      rotationRate: { alpha: 0, beta: 0, gamma: 90, timestamp: 4 },
    };
    const expected = {
      acceleration: { x: 1, y: 0, z: 0 },
      gravity: { x: 0, y: 0, z: 9.80665 },
      rotationRate: { x: 0, y: 0, z: Math.PI / 2 },
      timestamp: 4000,
    };

    it.each([
      ["ios", ios],
      ["android", android],
    ] as const)("reads %s's the same way", (os, raw) => {
      jest.replaceProperty(Platform, "OS", os);
      const { readings, stop } = collect("deviceMotion");
      send(DeviceMotion, raw);
      stop();
      expect(readings).toHaveLength(1);
      const [reading] = readings as (typeof expected)[];
      expect(reading).toEqual({ ...reading, timestamp: 4000 });
      for (const part of ["acceleration", "gravity", "rotationRate"] as const) {
        for (const axis of ["x", "y", "z"] as const) {
          expect(reading[part][axis]).toBeCloseTo(expected[part][axis]);
        }
      }
      // An inverted zero is 0, not -0.
      expect(Object.is(reading.acceleration.y, 0)).toBe(true);
    });

    it("maps each rotation axis on iOS", () => {
      jest.replaceProperty(Platform, "OS", "ios");
      const { readings, stop } = collect("deviceMotion");
      send(DeviceMotion, {
        ...ios,
        rotationRate: { alpha: 180, beta: 90, gamma: 45, timestamp: 4 },
      });
      stop();
      const { rotationRate } = readings[0] as typeof expected;
      expect(rotationRate.x).toBeCloseTo(Math.PI / 4);
      expect(rotationRate.y).toBeCloseTo(Math.PI / 2);
      expect(rotationRate.z).toBeCloseTo(Math.PI);
    });

    it("maps each rotation axis on Android", () => {
      jest.replaceProperty(Platform, "OS", "android");
      const { readings, stop } = collect("deviceMotion");
      send(DeviceMotion, {
        ...android,
        rotationRate: { alpha: 180, beta: 90, gamma: 45, timestamp: 4 },
      });
      stop();
      const { rotationRate } = readings[0] as typeof expected;
      expect(rotationRate.x).toBeCloseTo(Math.PI);
      expect(rotationRate.y).toBeCloseTo(Math.PI / 2);
      expect(rotationRate.z).toBeCloseTo(Math.PI / 4);
    });

    it("skips a reading missing a part", () => {
      const { readings, stop } = collect("deviceMotion");
      send(DeviceMotion, {
        ...android,
        accelerationIncludingGravity: undefined,
      });
      send(DeviceMotion, { ...android, acceleration: null });
      send(DeviceMotion, { ...android, rotationRate: null });
      stop();
      expect(readings).toEqual([]);
    });
  });

  describe("permission", () => {
    it("is iOS's Motion & Fitness, for the barometer only", async () => {
      jest.replaceProperty(Platform, "OS", "ios");
      expect(expoSensorsAdapter.requiresPermission("barometer")).toBe(true);
      expect(expoSensorsAdapter.requiresPermission("accelerometer")).toBe(
        false,
      );
      await expect(expoSensorsAdapter.getPermission()).resolves.toEqual({
        status: "undetermined",
        canAskAgain: true,
      });
      await expect(expoSensorsAdapter.requestPermission()).resolves.toEqual({
        status: "granted",
        canAskAgain: false,
      });
    });

    it("is not needed on Android, and never read there", async () => {
      jest.replaceProperty(Platform, "OS", "android");
      jest.mocked(DeviceMotion.getPermissionsAsync).mockClear();
      jest.mocked(DeviceMotion.requestPermissionsAsync).mockClear();
      expect(expoSensorsAdapter.requiresPermission("barometer")).toBe(false);
      await expect(expoSensorsAdapter.getPermission()).resolves.toEqual({
        status: "granted",
        canAskAgain: false,
      });
      await expect(expoSensorsAdapter.requestPermission()).resolves.toEqual({
        status: "granted",
        canAskAgain: false,
      });
      // expo's Android request asks for ACTIVITY_RECOGNITION.
      expect(DeviceMotion.getPermissionsAsync).not.toHaveBeenCalled();
      expect(DeviceMotion.requestPermissionsAsync).not.toHaveBeenCalled();
    });
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

  it("reads device motion, gravity apart", () => {
    const readings: unknown[] = [];
    const stop = webSensorsAdapter.subscribe("deviceMotion", (r) =>
      readings.push(r),
    );
    fire({
      timeStamp: 9,
      acceleration: { x: 1, y: 0, z: 0 },
      accelerationIncludingGravity: { x: 1, y: 0, z: 9.8 },
      rotationRate: { alpha: 0, beta: 0, gamma: 0 },
    } as never);
    // Chrome on a laptop: no acceleration without gravity.
    fire({
      acceleration: null,
      accelerationIncludingGravity: { x: 0, y: 0, z: 9.8 },
      rotationRate: { alpha: 0, beta: 0, gamma: 0 },
    } as never);
    fire({
      acceleration: { x: 1, y: 0, z: 0 },
      accelerationIncludingGravity: { x: 1, y: 0, z: 9.8 },
    } as never);
    fire({
      acceleration: { x: 1, y: 0, z: 0 },
      rotationRate: { alpha: 0, beta: 0, gamma: 0 },
    } as never);
    stop();
    expect(readings).toEqual([
      {
        acceleration: { x: 1, y: 0, z: 0 },
        gravity: { x: 0, y: 0, z: 9.8 },
        rotationRate: { x: 0, y: 0, z: 0 },
        timestamp: 9,
      },
    ]);
  });

  describe("permission", () => {
    let request: jest.Mock;
    beforeEach(() => {
      request = jest.fn(async () => "granted");
      Object.assign(
        (globalThis as { DeviceMotionEvent: object }).DeviceMotionEvent,
        { requestPermission: request },
      );
    });

    it("needs none without iOS Safari's prompt", async () => {
      delete (
        globalThis as { DeviceMotionEvent: { requestPermission?: unknown } }
      ).DeviceMotionEvent.requestPermission;
      const adapter = createWebSensorsAdapter();
      expect(adapter.requiresPermission("accelerometer")).toBe(false);
      await expect(adapter.getPermission()).resolves.toEqual({
        status: "granted",
        canAskAgain: false,
      });
      await expect(adapter.requestPermission()).resolves.toMatchObject({
        status: "granted",
      });
    });

    it("is unsupported without motion events", async () => {
      delete (globalThis as { DeviceMotionEvent?: unknown }).DeviceMotionEvent;
      await expect(createWebSensorsAdapter().getPermission()).resolves.toEqual({
        status: "unsupported",
        canAskAgain: false,
      });
    });

    it("gates the motion sensors behind iOS Safari's prompt", async () => {
      const adapter = createWebSensorsAdapter();
      expect(adapter.requiresPermission("accelerometer")).toBe(true);
      expect(adapter.requiresPermission("gyroscope")).toBe(true);
      expect(adapter.requiresPermission("deviceMotion")).toBe(true);
      expect(adapter.requiresPermission("barometer")).toBe(false);
      // Nothing to probe before the prompt: assumed present.
      await expect(adapter.isAvailable("accelerometer")).resolves.toBe(true);
      expect(motionListeners.size).toBe(0);
      await expect(adapter.getPermission()).resolves.toEqual({
        status: "undetermined",
        canAskAgain: true,
      });
    });

    it("asks synchronously and remembers the answer", async () => {
      const adapter = createWebSensorsAdapter();
      const answer = adapter.requestPermission();
      expect(request).toHaveBeenCalledTimes(1);
      await expect(answer).resolves.toEqual({
        status: "granted",
        canAskAgain: false,
      });
      await expect(adapter.getPermission()).resolves.toEqual({
        status: "granted",
        canAskAgain: false,
      });
    });

    it("reads a refusal as final", async () => {
      request.mockResolvedValueOnce("denied");
      const adapter = createWebSensorsAdapter();
      await expect(adapter.requestPermission()).resolves.toEqual({
        status: "denied",
        canAskAgain: false,
      });
    });

    it("rejects as Safari does outside a gesture", async () => {
      request.mockRejectedValueOnce(new Error("NotAllowedError"));
      const adapter = createWebSensorsAdapter();
      await expect(adapter.requestPermission()).rejects.toThrow(
        "NotAllowedError",
      );
      await expect(adapter.getPermission()).resolves.toMatchObject({
        status: "undetermined",
      });
    });
  });

  it("is unavailable when no event comes in time", async () => {
    jest.useFakeTimers();
    const answer = webSensorsAdapter.isAvailable("accelerometer");
    jest.advanceTimersByTime(PROBE_TIMEOUT);
    await expect(answer).resolves.toBe(false);
    expect(motionListeners.size).toBe(0);
  });
});
