/**
 * `@its/glowup-device/sensors` — accelerometer, gyroscope, magnetometer,
 * barometer, light sensor, device motion and the device's physical
 * orientation, in one set of units and axes on every platform. Needs
 * `expo-sensors` on iOS and Android; the web reads the motion sensors from
 * the DeviceMotion events.
 */
export {
  DEFAULT_SENSOR_INTERVAL,
  useAccelerometer,
  useBarometer,
  useDeviceMotion,
  useDeviceOrientation,
  useGyroscope,
  useLightSensor,
  useMagnetometer,
  useSensorAvailability,
  useSensorListener,
  useSensorPermission,
  type SensorOptions,
  type UseDeviceOrientation,
  type UseSensor,
  type UseSensorPermission,
} from "./hooks";
export { type DeviceOrientation } from "./deviceOrientation";
export { expoSensorsAdapter } from "./expo";
export { webSensorsAdapter } from "./web";
export type {
  AccelerometerReading,
  BarometerReading,
  DeviceMotionReading,
  GyroscopeReading,
  LightReading,
  MagnetometerReading,
  SensorName,
  SensorReadings,
  SensorSample,
  SensorsAdapter,
  Vector3,
} from "./types";
