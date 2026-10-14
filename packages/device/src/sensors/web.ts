import { hasDOM } from "../core/support";
import type { PermissionState } from "../core/types";
import type { SensorName, SensorReadings, SensorsAdapter } from "./types";

/**
 * The web default, on the DeviceMotion events, read directly: expo-sensors'
 * web build sends `deviceorientation`'s angles as the accelerometer and the
 * acceleration as the gyroscope. The accelerometer, gyroscope and device
 * motion exist in a browser; the magnetometer, barometer and light sensor
 * answer unavailable.
 *
 * Browsers fire `devicemotion` at their own rate (about 60 Hz): the interval
 * is applied by the package's throttle, not here. iOS Safari fires nothing
 * until `DeviceMotionEvent.requestPermission()` is granted, and grants only
 * from a user gesture.
 */

type MotionSensor = "accelerometer" | "gyroscope" | "deviceMotion";

const isMotionSensor = (sensor: SensorName): sensor is MotionSensor =>
  sensor === "accelerometer" ||
  sensor === "gyroscope" ||
  sensor === "deviceMotion";

const RADIANS_PER_DEGREE = Math.PI / 180;

/** How long a browser has to send a first reading before it counts as none. */
export const PROBE_TIMEOUT = 1000;

type Triple = { x: number | null; y: number | null; z: number | null };

function vector(value: Partial<Triple> | null | undefined) {
  const { x, y, z } = value ?? {};
  return x == null || y == null || z == null ? null : { x, y, z };
}

// W3C: alpha turns around z, beta around x, gamma around y, in deg/s.
function rotation(event: DeviceMotionEvent) {
  const { alpha, beta, gamma } = event.rotationRate ?? {};
  if (alpha == null || beta == null || gamma == null) return null;
  return {
    x: beta * RADIANS_PER_DEGREE,
    y: gamma * RADIANS_PER_DEGREE,
    z: alpha * RADIANS_PER_DEGREE,
  };
}

function read(
  sensor: MotionSensor,
  event: DeviceMotionEvent,
): SensorReadings[MotionSensor] | null {
  const timestamp = event.timeStamp;
  const withGravity = vector(event.accelerationIncludingGravity);
  if (sensor === "accelerometer") {
    return withGravity && { ...withGravity, timestamp };
  }
  const rotationRate = rotation(event);
  if (sensor === "gyroscope") {
    return rotationRate && { ...rotationRate, timestamp };
  }
  // W3C's acceleration is the user's; with gravity, it reads +9.81 face up.
  const acceleration = vector(event.acceleration);
  if (!acceleration || !withGravity || !rotationRate) return null;
  return {
    acceleration,
    gravity: {
      x: withGravity.x - acceleration.x,
      y: withGravity.y - acceleration.y,
      z: withGravity.z - acceleration.z,
    },
    rotationRate,
    timestamp,
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

type RequestPermission = () => Promise<"granted" | "denied" | "default">;

const hasMotionEvents = () => typeof DeviceMotionEvent !== "undefined";

/** iOS Safari's prompt; absent everywhere else. */
function getRequest(): RequestPermission | null {
  if (!hasMotionEvents()) return null;
  const request = (
    DeviceMotionEvent as unknown as { requestPermission?: RequestPermission }
  ).requestPermission;
  return typeof request === "function" ? request : null;
}

const GRANTED: PermissionState = { status: "granted", canAskAgain: false };
const UNDETERMINED: PermissionState = {
  status: "undetermined",
  canAskAgain: true,
};

export function createWebSensorsAdapter(): SensorsAdapter {
  // Safari cannot be asked what it answered: remembered for the page.
  let answer: PermissionState | null = null;

  const getPermission = async (): Promise<PermissionState> => {
    if (!hasMotionEvents())
      return { status: "unsupported", canAskAgain: false };
    return getRequest() ? (answer ?? UNDETERMINED) : GRANTED;
  };

  return {
    isSupported: () => hasDOM(),
    async isAvailable(sensor) {
      if (!isMotionSensor(sensor) || !hasMotionEvents()) return false;
      // Behind the prompt nothing can be probed: Safari is on iPhones and
      // iPads, which all have these sensors.
      if (getRequest()) return true;
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
    requiresPermission: (sensor) =>
      isMotionSensor(sensor) && getRequest() !== null,
    getPermission,
    requestPermission() {
      const request = getRequest();
      if (!request) return getPermission();
      // Called before any await: Safari grants only inside the gesture.
      return request().then((result) => {
        answer =
          result === "granted"
            ? GRANTED
            : result === "denied"
              ? { status: "denied", canAskAgain: false }
              : UNDETERMINED;
        return answer;
      });
    },
  };
}

export const webSensorsAdapter: SensorsAdapter = createWebSensorsAdapter();
