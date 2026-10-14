import {
  Accelerometer,
  Barometer,
  Gyroscope,
  LightSensor,
  Magnetometer,
  type AccelerometerMeasurement,
  type BarometerMeasurement,
  type GyroscopeMeasurement,
  type LightSensorMeasurement,
  type MagnetometerMeasurement,
} from "expo-sensors";
import { Platform } from "react-native";

import { isNativePlatform } from "../core/support";
import type { SensorName, SensorReadings, SensorsAdapter } from "./types";

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
  convert: (raw: Raw) => SensorReadings[S],
): Entry<S> {
  return {
    module,
    listen: (listener) => module.addListener((raw) => listener(convert(raw))),
  };
}

const SENSORS: { [S in SensorName]: Entry<S> } = {
  accelerometer: entry(Accelerometer, toAccelerometer),
  gyroscope: entry(Gyroscope, toVector),
  magnetometer: entry(Magnetometer, toVector),
  barometer: entry(Barometer, toBarometer),
  light: entry(LightSensor, toLight),
};

/**
 * The native default: expo-sensors, converted to one set of units and axes
 * (see `types.ts`). Light is Android only: on iOS expo's light sensor is a
 * stub that answers unavailable. The iOS barometer ignores the interval
 * (CoreMotion's altimeter has no rate to set).
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
};
