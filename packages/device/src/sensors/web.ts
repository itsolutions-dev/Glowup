import { hasDOM } from "../core/support";
import type { SensorName, SensorReadings, SensorsAdapter } from "./types";

/**
 * The web default, on the DeviceMotion events, read directly: expo-sensors'
 * web build sends `deviceorientation`'s angles as the accelerometer and the
 * acceleration as the gyroscope. Only those two exist in a browser; the
 * magnetometer, barometer and light sensor answer unavailable.
 *
 * Browsers fire `devicemotion` at their own rate (about 60 Hz): the interval
 * is applied by the package's throttle, not here. iOS Safari fires nothing
 * until `DeviceMotionEvent.requestPermission()` is granted.
 */

type MotionSensor = "accelerometer" | "gyroscope";

const isMotionSensor = (sensor: SensorName): sensor is MotionSensor =>
  sensor === "accelerometer" || sensor === "gyroscope";

const RADIANS_PER_DEGREE = Math.PI / 180;

/** How long a browser has to send a first reading before it counts as none. */
export const PROBE_TIMEOUT = 1000;

function read(
  sensor: MotionSensor,
  event: DeviceMotionEvent,
): SensorReadings[MotionSensor] | null {
  if (sensor === "accelerometer") {
    const { x, y, z } = event.accelerationIncludingGravity ?? {};
    if (x == null || y == null || z == null) return null;
    return { x, y, z, timestamp: event.timeStamp };
  }
  // W3C: alpha turns around z, beta around x, gamma around y, in deg/s.
  const { alpha, beta, gamma } = event.rotationRate ?? {};
  if (alpha == null || beta == null || gamma == null) return null;
  return {
    x: beta * RADIANS_PER_DEGREE,
    y: gamma * RADIANS_PER_DEGREE,
    z: alpha * RADIANS_PER_DEGREE,
    timestamp: event.timeStamp,
  };
}

/** True once an event carries the sensor's data; false after the timeout. */
function probe(sensor: MotionSensor): Promise<boolean> {
  return new Promise((resolve) => {
    const done = (available: boolean) => {
      clearTimeout(timer);
      window.removeEventListener("devicemotion", onMotion);
      resolve(available);
    };
    const onMotion = (event: DeviceMotionEvent) => {
      if (read(sensor, event)) done(true);
    };
    const timer = setTimeout(() => done(false), PROBE_TIMEOUT);
    window.addEventListener("devicemotion", onMotion);
  });
}

export const webSensorsAdapter: SensorsAdapter = {
  isSupported: () => hasDOM(),
  async isAvailable(sensor) {
    if (!isMotionSensor(sensor) || typeof DeviceMotionEvent === "undefined") {
      return false;
    }
    return probe(sensor);
  },
  setInterval() {},
  subscribe(sensor, listener) {
    if (!isMotionSensor(sensor)) return () => {};
    const onMotion = (event: DeviceMotionEvent) => {
      const reading = read(sensor, event);
      if (reading) {
        (listener as (next: SensorReadings[MotionSensor]) => void)(reading);
      }
    };
    window.addEventListener("devicemotion", onMotion);
    return () => window.removeEventListener("devicemotion", onMotion);
  },
};
