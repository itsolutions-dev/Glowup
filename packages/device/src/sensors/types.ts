import type { PermissionState, Unsubscribe } from "../core/types";

export type SensorName =
  | "accelerometer"
  | "gyroscope"
  | "magnetometer"
  | "barometer"
  | "light"
  | "deviceMotion";

/**
 * Every reading carries one. Milliseconds on a monotonic clock that is not
 * the wall clock (time since boot on native, since the page loaded on web):
 * compare two timestamps of the same stream, never one with `Date.now()`.
 */
export interface SensorSample {
  timestamp: number;
}

/**
 * Along the device's axes, on every platform: x to the right of the screen,
 * y to its top, z out of the screen towards the viewer.
 */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Acceleration including gravity, in m/s². A phone lying face up reads
 * about `{ x: 0, y: 0, z: 9.81 }` everywhere (the W3C and Android
 * convention; iOS's raw values are inverted and converted).
 */
export interface AccelerometerReading extends Vector3, SensorSample {}

/** Rotation rate around each axis in rad/s, counter-clockwise positive. */
export interface GyroscopeReading extends Vector3, SensorSample {}

/** The calibrated magnetic field along each axis, in µT. */
export interface MagnetometerReading extends Vector3, SensorSample {}

export interface BarometerReading extends SensorSample {
  /** Air pressure in hPa. */
  pressure: number;
  /** Metres since the first reading; `null` where the platform has none (Android). */
  relativeAltitude: number | null;
}

export interface LightReading extends SensorSample {
  /** Ambient light in lux. */
  illuminance: number;
}

/**
 * The platform's sensor fusion: the accelerometer split into the device's
 * own movement and gravity, with the rotation rate. Same axes and signs as
 * the single sensors.
 */
export interface DeviceMotionReading extends SensorSample {
  /** What the user does to the device, without gravity, in m/s². */
  acceleration: Vector3;
  /** Gravity alone, in m/s²: lying face up, about `{ x: 0, y: 0, z: 9.81 }`. */
  gravity: Vector3;
  /** Rotation rate in rad/s, as `GyroscopeReading`. */
  rotationRate: Vector3;
}

export interface SensorReadings {
  accelerometer: AccelerometerReading;
  gyroscope: GyroscopeReading;
  magnetometer: MagnetometerReading;
  barometer: BarometerReading;
  light: LightReading;
  deviceMotion: DeviceMotionReading;
}

/**
 * The contract between the `/sensors` hooks and whatever reads the
 * hardware. Readings are already in the units above: converting is the
 * adapter's job. The package opens at most one subscription per sensor and
 * adapter, only after `isAvailable` answered true.
 */
export interface SensorsAdapter {
  /** False where the platform has no sensors API at all. */
  isSupported(): boolean;
  /** Whether this device has the sensor; asked once per sensor. */
  isAvailable(sensor: SensorName): Promise<boolean>;
  /**
   * The fastest rate any reader asked for, in ms. Called before
   * `subscribe` and whenever it changes; the package throttles each reader
   * to its own interval, so an adapter may deliver faster than this.
   */
  setInterval(sensor: SensorName, interval: number): void;
  subscribe<S extends SensorName>(
    sensor: S,
    listener: (reading: SensorReadings[S]) => void,
  ): Unsubscribe;
  /**
   * Whether the sensor needs the motion permission here (iOS's barometer,
   * every sensor in iOS Safari). The package opens such a sensor only once
   * it is granted, and reads the permission for no other.
   */
  requiresPermission(sensor: SensorName): boolean;
  /** Reads the motion permission without prompting. */
  getPermission(): Promise<PermissionState>;
  /**
   * Prompts. On the web it must run in the user's gesture: call it
   * synchronously from the press handler.
   */
  requestPermission(): Promise<PermissionState>;
}
