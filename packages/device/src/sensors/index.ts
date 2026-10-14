/**
 * `@its/glowup-device/sensors` — accelerometer, gyroscope, magnetometer,
 * barometer and light sensor, in one set of units and axes on every
 * platform. Needs `expo-sensors` on iOS and Android; the web reads the
 * accelerometer and gyroscope from the DeviceMotion events.
 */
export {
  DEFAULT_SENSOR_INTERVAL,
  useAccelerometer,
  useBarometer,
  useGyroscope,
  useLightSensor,
  useMagnetometer,
  useSensorAvailability,
  useSensorListener,
  type SensorOptions,
  type UseSensor,
} from "./hooks";
export { expoSensorsAdapter } from "./expo";
export { webSensorsAdapter } from "./web";
export type {
  AccelerometerReading,
  BarometerReading,
  GyroscopeReading,
  LightReading,
  MagnetometerReading,
  SensorName,
  SensorReadings,
  SensorSample,
  SensorsAdapter,
  Vector3,
} from "./types";
