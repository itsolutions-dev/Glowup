---
"@its/glowup-device": minor
---

New `/sensors` subpath on `expo-sensors` (an optional peer): accelerometer, gyroscope,
magnetometer, barometer, light sensor and device motion, in one set of units and axes on every
platform.

- Readings are normalised whatever expo-sensors sends: acceleration in m/s² including gravity
  (iOS's inverted signs fixed, so a phone lying face up reads `z ≈ +9.81` everywhere), rotation
  in rad/s, magnetic field in µT, pressure in hPa, light in lux, along the device's axes, with
  millisecond timestamps.
- Value hooks (`useAccelerometer`, `useGyroscope`, `useMagnetometer`, `useBarometer`,
  `useLightSensor`, `useDeviceMotion`) and `useSensorListener` for readings that must not
  re-render. `useSensorAvailability` answers whether the device has the sensor.
- One platform subscription per sensor, shared by every reader at the fastest interval asked
  for (default 200 ms, each reader throttled to its own), opened only once the sensor is known
  to exist and paused while the app is in the background.
- `useDeviceMotion`: the user's acceleration and gravity apart, with the rotation rate. No
  attitude: expo's iOS and Android angles start from different axes.
- `useDeviceOrientation`: how the device is held (`portrait-up`, `landscape-left`, `face-up`…),
  from gravity, with hysteresis; it re-renders only when the answer changes.
- `useSensorPermission(sensor)`: the motion permission where a sensor needs it (iOS's
  barometer, iOS Safari's motion sensors), with `isRequired`, `request()` (synchronous down to
  Safari's prompt, which grants only inside the user's gesture) and `openSettings()`. The
  sensor hooks never prompt.
- The web reads the DeviceMotion events itself instead of expo-sensors' web build, which sends
  orientation angles as the accelerometer.
- The config plugin takes `sensors: { motionPermission, highSamplingRate }`: the Motion & Fitness
  purpose string, the removal of `ACTIVITY_RECOGNITION` (added by expo-sensors for a pedometer
  this package does not expose) and, on request, `HIGH_SAMPLING_RATE_SENSORS`.
- `/testing` adds `createMockSensorsAdapter()`.
