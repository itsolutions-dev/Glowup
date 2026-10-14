import {
  Accelerometer,
  Barometer,
  DeviceMotion,
  Gyroscope,
  LightSensor,
  Magnetometer,
  type AccelerometerMeasurement,
  type BarometerMeasurement,
  type DeviceMotionMeasurement,
  type GyroscopeMeasurement,
  type LightSensorMeasurement,
  type MagnetometerMeasurement,
} from "expo-sensors";
import { Platform } from "react-native";

import { toPermissionState } from "../core/permissions";
import { isNativePlatform } from "../core/support";
import type { PermissionState } from "../core/types";
import type {
  DeviceMotionReading,
  SensorName,
  SensorReadings,
  SensorsAdapter,
  Vector3,
} from "./types";

/** Android's `SensorManager.GRAVITY_EARTH`, which expo divides by. */
const STANDARD_GRAVITY = 9.80665;

// expo-sensors' timestamps are seconds since boot.
const toMs = (seconds: number) => seconds * 1000;

/**
 * expo reports the accelerometer in g, with opposite signs per platform:
 * Android sends the reaction to gravity (lying face up, z = +1), iOS
 * CoreMotion its direction (z = -1). Both become m/s², Android's way.
 * The `+ 0` turns the -0 of an inverted zero into 0.
 */
function toAccelerometer(raw: AccelerometerMeasurement) {
  const scale = STANDARD_GRAVITY * (Platform.OS === "ios" ? -1 : 1);
  return {
    x: raw.x * scale + 0,
    y: raw.y * scale + 0,
    z: raw.z * scale + 0,
    timestamp: toMs(raw.timestamp),
  };
}

// Gyroscope (rad/s) and magnetometer (µT) agree on both platforms.
const toVector = (raw: GyroscopeMeasurement | MagnetometerMeasurement) => ({
  x: raw.x,
  y: raw.y,
  z: raw.z,
  timestamp: toMs(raw.timestamp),
});

/** Both platforms send hPa (iOS converts from kPa); only iOS an altitude. */
const toBarometer = (raw: BarometerMeasurement) => ({
  pressure: raw.pressure,
  relativeAltitude: raw.relativeAltitude ?? null,
  timestamp: toMs(raw.timestamp),
});

const toLight = (raw: LightSensorMeasurement) => ({
  illuminance: raw.illuminance,
  timestamp: toMs(raw.timestamp),
});

const RADIANS_PER_DEGREE = Math.PI / 180;

const minus = (a: Vector3, b: Vector3): Vector3 => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z,
});

// Without expo's per-part timestamp.
const vector = ({ x, y, z }: Vector3): Vector3 => ({ x, y, z });

const negate = ({ x, y, z }: Vector3): Vector3 => ({
  x: -x + 0,
  y: -y + 0,
  z: -z + 0,
});

/**
 * expo's device motion, read from its source (57.0.3):
 * - `acceleration` is the user's, in m/s², with each platform's sign: iOS
 *   inverted like its accelerometer.
 * - `accelerationIncludingGravity` is that acceleration minus gravity on
 *   Android (`accel - 2 * gravity`) and the inverted sum on iOS, so on both
 *   `acceleration - accelerationIncludingGravity` is gravity, Android's way.
 * - `rotationRate` is in deg/s, its alpha/beta/gamma on x/y/z on Android
 *   and on z/y/x on iOS.
 * A reading missing a part (Android sends them as its sensors start) is
 * skipped.
 */
function toDeviceMotion(
  raw: DeviceMotionMeasurement,
): DeviceMotionReading | null {
  const { acceleration, accelerationIncludingGravity, rotationRate } = raw;
  if (!acceleration || !accelerationIncludingGravity || !rotationRate) {
    return null;
  }
  const ios = Platform.OS === "ios";
  const rate = (degrees: number) => degrees * RADIANS_PER_DEGREE;
  return {
    acceleration: ios ? negate(acceleration) : vector(acceleration),
    gravity: minus(acceleration, accelerationIncludingGravity),
    rotationRate: ios
      ? {
          x: rate(rotationRate.gamma),
          y: rate(rotationRate.beta),
          z: rate(rotationRate.alpha),
        }
      : {
          x: rate(rotationRate.alpha),
          y: rate(rotationRate.beta),
          z: rate(rotationRate.gamma),
        },
    timestamp: toMs(acceleration.timestamp),
  };
}

interface ExpoSensor<Raw> {
  isAvailableAsync(): Promise<boolean>;
  setUpdateInterval(intervalMs: number): void;
  addListener(listener: (raw: Raw) => void): { remove(): void } | undefined;
}

interface Entry<S extends SensorName> {
  module: Omit<ExpoSensor<unknown>, "addListener">;
  listen(
    listener: (reading: SensorReadings[S]) => void,
  ): { remove(): void } | undefined;
}

function entry<Raw, S extends SensorName>(
  module: ExpoSensor<Raw>,
  convert: (raw: Raw) => SensorReadings[S] | null,
): Entry<S> {
  return {
    module,
    listen: (listener) =>
      module.addListener((raw) => {
        const reading = convert(raw);
        if (reading) listener(reading);
      }),
  };
}

const SENSORS: { [S in SensorName]: Entry<S> } = {
  accelerometer: entry(Accelerometer, toAccelerometer),
  gyroscope: entry(Gyroscope, toVector),
  magnetometer: entry(Magnetometer, toVector),
  barometer: entry(Barometer, toBarometer),
  light: entry(LightSensor, toLight),
  deviceMotion: entry(DeviceMotion, toDeviceMotion),
};

const GRANTED: PermissionState = { status: "granted", canAskAgain: false };

/**
 * Motion & Fitness, which only iOS's barometer needs here (CMAltimeter
 * shares it with the pedometer, whose status expo reads). Android needs no
 * permission for these sensors: expo's own asks for ACTIVITY_RECOGNITION,
 * which is the pedometer's. Read only for a sensor that needs it: expo's
 * iOS requester crashes the app (`RCTFatal`) when the Info.plist has no
 * `NSMotionUsageDescription`.
 */
const motionPermission = async (
  ask: () => Promise<Parameters<typeof toPermissionState>[0]>,
) => (Platform.OS === "ios" ? toPermissionState(await ask()) : GRANTED);

/**
 * The native default: expo-sensors, converted to one set of units and axes
 * (see `types.ts`). Light is Android only: on iOS expo's light sensor is a
 * stub that answers unavailable. The iOS barometer ignores the interval
 * (CoreMotion's altimeter has no rate to set) and asks for Motion & Fitness
 * when it starts, so the package opens it only once that is granted.
 */
export const expoSensorsAdapter: SensorsAdapter = {
  isSupported: () => isNativePlatform,
  async isAvailable(sensor) {
    try {
      return await SENSORS[sensor].module.isAvailableAsync();
    } catch {
      return false;
    }
  },
  setInterval(sensor, interval) {
    // Android's native side takes an Int.
    SENSORS[sensor].module.setUpdateInterval(Math.round(interval));
  },
  subscribe(sensor, listener) {
    const subscription = SENSORS[sensor].listen(listener);
    // iOS's light stub returns nothing.
    return () => subscription?.remove();
  },
  requiresPermission: (sensor) =>
    Platform.OS === "ios" && sensor === "barometer",
  getPermission: () =>
    motionPermission(() => DeviceMotion.getPermissionsAsync()),
  requestPermission: () =>
    motionPermission(() => DeviceMotion.requestPermissionsAsync()),
};
