import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Platform } from "react-native";

import { useDeviceAdapter } from "../core/adapters";
import { expoSensorsAdapter } from "./expo";
import { getAvailability, getSensorStream } from "./stream";
import type {
  AccelerometerReading,
  BarometerReading,
  GyroscopeReading,
  LightReading,
  MagnetometerReading,
  SensorName,
  SensorReadings,
  SensorsAdapter,
} from "./types";
import { webSensorsAdapter } from "./web";

const defaultSensorsAdapter =
  Platform.OS === "web" ? webSensorsAdapter : expoSensorsAdapter;

/**
 * 5 readings a second: the fastest rate Android 12 and later deliver
 * without the `HIGH_SAMPLING_RATE_SENSORS` permission.
 */
export const DEFAULT_SENSOR_INTERVAL = 200;

export interface SensorOptions {
  /** Listen only while true. Default true. */
  enabled?: boolean;
  /**
   * Milliseconds between readings, at most. Default
   * `DEFAULT_SENSOR_INTERVAL`; 0 takes every reading the platform sends.
   */
  interval?: number;
}

function assertInterval(interval: unknown): asserts interval is number {
  if (
    typeof interval !== "number" ||
    !Number.isFinite(interval) ||
    interval < 0
  ) {
    throw new TypeError(
      `A sensor interval must be a number of milliseconds, 0 or more (got ${String(interval)}).`,
    );
  }
}

function useSensorsAdapter(): SensorsAdapter {
  return useDeviceAdapter("sensors") ?? defaultSensorsAdapter;
}

const getServerAvailability = () => null;

/**
 * Whether the device has the sensor: `null` until it is known, and while a
 * statically exported page hydrates. Asked once per sensor.
 */
export function useSensorAvailability(sensor: SensorName): boolean | null {
  const availability = getAvailability(useSensorsAdapter(), sensor);
  return useSyncExternalStore(
    availability.subscribe,
    availability.getSnapshot,
    getServerAvailability,
  );
}

/**
 * Calls `onReading` with each reading, without re-rendering: for rates a
 * render per reading cannot keep up with (animations, games). Readers of
 * the same sensor share one platform subscription, which pauses while the
 * app is in the background.
 */
export function useSensorListener<S extends SensorName>(
  sensor: S,
  onReading: (reading: SensorReadings[S]) => void,
  { enabled = true, interval = DEFAULT_SENSOR_INTERVAL }: SensorOptions = {},
): { isAvailable: boolean | null } {
  assertInterval(interval);
  const adapter = useSensorsAdapter();
  const isAvailable = useSensorAvailability(sensor);

  // Usually an inline function: call the latest one instead of
  // subscribing again on every render.
  const onReadingRef = useRef(onReading);
  useEffect(() => {
    onReadingRef.current = onReading;
  });

  useEffect(() => {
    if (!enabled) return;
    return getSensorStream(adapter, sensor).subscribe(interval, (reading) =>
      onReadingRef.current(reading),
    );
  }, [adapter, sensor, enabled, interval]);

  return { isAvailable };
}

export interface UseSensor<R> {
  /** `null` until known, and while a statically exported page hydrates. */
  isAvailable: boolean | null;
  /** The latest reading; `null` until the first. Kept while paused. */
  reading: R | null;
}

function useSensor<S extends SensorName>(
  sensor: S,
  options?: SensorOptions,
): UseSensor<SensorReadings[S]> {
  const [reading, setReading] = useState<SensorReadings[S] | null>(null);
  const { isAvailable } = useSensorListener(sensor, setReading, options);
  return { isAvailable, reading };
}

/** Acceleration including gravity, in m/s² (lying face up: z ≈ +9.81). */
export function useAccelerometer(
  options?: SensorOptions,
): UseSensor<AccelerometerReading> {
  return useSensor("accelerometer", options);
}

/** Rotation rate in rad/s. */
export function useGyroscope(
  options?: SensorOptions,
): UseSensor<GyroscopeReading> {
  return useSensor("gyroscope", options);
}

/** The magnetic field in µT. Native only. */
export function useMagnetometer(
  options?: SensorOptions,
): UseSensor<MagnetometerReading> {
  return useSensor("magnetometer", options);
}

/**
 * Air pressure in hPa, and on iOS the altitude change. Native only; iOS
 * ignores the interval.
 */
export function useBarometer(
  options?: SensorOptions,
): UseSensor<BarometerReading> {
  return useSensor("barometer", options);
}

/** Ambient light in lux. Android only. */
export function useLightSensor(
  options?: SensorOptions,
): UseSensor<LightReading> {
  return useSensor("light", options);
}
