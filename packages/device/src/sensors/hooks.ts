import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Platform } from "react-native";

import { useDeviceAdapter } from "../core/adapters";
import { usePermissionSnapshot } from "../core/permissionStore";
import type { PermissionState } from "../core/types";
import {
  classifyOrientation,
  type DeviceOrientation,
} from "./deviceOrientation";
import { expoSensorsAdapter } from "./expo";
import { getAvailability, getPermissionStore, getSensorStream } from "./stream";
import type {
  AccelerometerReading,
  BarometerReading,
  DeviceMotionReading,
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

const subscribeNothing = () => () => {};
const getServerRequired = () => null;

const GRANTED: PermissionState = { status: "granted", canAskAgain: false };
const resolveGranted = async () => GRANTED;

export interface UseSensorPermission extends PermissionState {
  /**
   * Whether the sensor needs the motion permission here: iOS's barometer
   * (Motion & Fitness) and every sensor in iOS Safari. Where it does not,
   * the permission reads `granted`. `null` while a static page hydrates.
   */
  isRequired: boolean | null;
  /** True until the first read answers. */
  isLoading: boolean;
  /**
   * Shows the prompt. On the web call it synchronously from a press
   * handler: Safari grants only inside the user's gesture.
   */
  request: () => Promise<PermissionState>;
  /** Re-reads it. The hook already does when the app returns to the foreground. */
  refresh: () => Promise<PermissionState>;
}

/**
 * The motion permission a sensor needs, if any, shared by every component.
 * The sensor hooks never prompt: a sensor that needs it opens once it is
 * granted, and reads nothing until then.
 */
export function useSensorPermission(sensor: SensorName): UseSensorPermission {
  const adapter = useSensorsAdapter();
  const getRequired = useCallback(
    () => adapter.requiresPermission(sensor),
    [adapter, sensor],
  );
  const isRequired = useSyncExternalStore(
    subscribeNothing,
    getRequired,
    getServerRequired,
  );
  const store = getPermissionStore(adapter);
  const state = usePermissionSnapshot(isRequired ? store : null);

  if (isRequired === false) {
    return {
      ...GRANTED,
      isRequired,
      isLoading: false,
      request: resolveGranted,
      refresh: resolveGranted,
    };
  }
  return {
    ...(state ?? { status: "undetermined", canAskAgain: true }),
    isRequired,
    isLoading: state === null,
    request: store.request,
    refresh: store.refresh,
  };
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
 * Air pressure in hPa, and on iOS the altitude change. Native only. iOS
 * ignores the interval and needs Motion & Fitness: see
 * `useSensorPermission("barometer")`.
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

/**
 * The platform's sensor fusion: the user's acceleration and gravity apart,
 * with the rotation rate. Needs a gyroscope (on Android, every sensor the
 * fusion uses).
 */
export function useDeviceMotion(
  options?: SensorOptions,
): UseSensor<DeviceMotionReading> {
  return useSensor("deviceMotion", options);
}

export interface UseDeviceOrientation {
  /** Whether there is an accelerometer; `null` until known. */
  isAvailable: boolean | null;
  /** `null` until a reading shows one clearly. */
  orientation: DeviceOrientation | null;
}

/**
 * How the device is held (not how the interface is drawn: see
 * `/orientation`), from the accelerometer alone. Re-renders only when it
 * changes; a phone tilted halfway keeps its previous answer.
 */
export function useDeviceOrientation(
  options?: SensorOptions,
): UseDeviceOrientation {
  const [orientation, setOrientation] = useState<DeviceOrientation | null>(
    null,
  );
  // Compared here, not in a state updater: React may render once to find
  // out an updater changed nothing.
  const last = useRef<DeviceOrientation | null>(null);
  const { isAvailable } = useSensorListener(
    "accelerometer",
    (reading) => {
      const next = classifyOrientation(reading, last.current);
      if (next === last.current) return;
      last.current = next;
      setOrientation(next);
    },
    options,
  );
  return { isAvailable, orientation };
}
