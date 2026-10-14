import type { Unsubscribe } from "../core/types";
import type {
  SensorName,
  SensorReadings,
  SensorsAdapter,
} from "../sensors/types";

export interface MockSensorsOptions {
  /** Default true. */
  supported?: boolean;
  /** Which sensors the device has. Default: all of them. */
  available?: Partial<Record<SensorName, boolean>>;
}

/** A reading without its timestamp, or with one to set it explicitly. */
export type MockReading<S extends SensorName> = Omit<
  SensorReadings[S],
  "timestamp"
> & { timestamp?: number };

export interface MockSensorsAdapter extends SensorsAdapter {
  /** The interval each sensor runs at, as the package last set it. */
  readonly intervals: Readonly<Partial<Record<SensorName, number>>>;
  /** Whether the package is listening to the sensor now. */
  isActive(sensor: SensorName): boolean;
  /**
   * Sends a reading, if the package is listening (a stopped sensor sends
   * nothing). The timestamp defaults to the previous one plus the sensor's
   * interval, so every reader set to that interval receives it.
   */
  emit<S extends SensorName>(sensor: S, reading: MockReading<S>): void;
}

/**
 * An in-memory `SensorsAdapter`. Inject it with
 * `<DeviceAdaptersProvider adapters={{ sensors }}>` and drive it with
 * `emit()`.
 */
export function createMockSensorsAdapter({
  supported = true,
  available = {},
}: MockSensorsOptions = {}): MockSensorsAdapter {
  const intervals: Partial<Record<SensorName, number>> = {};
  const listeners = new Map<SensorName, Set<(reading: never) => void>>();
  const clocks: Partial<Record<SensorName, number>> = {};

  return {
    intervals,
    isSupported: () => supported,
    isAvailable: async (sensor) => available[sensor] ?? true,
    setInterval(sensor, interval) {
      intervals[sensor] = interval;
    },
    subscribe(sensor, listener): Unsubscribe {
      let set = listeners.get(sensor);
      if (!set) {
        set = new Set();
        listeners.set(sensor, set);
      }
      const entry = listener as (reading: never) => void;
      set.add(entry);
      return () => {
        set.delete(entry);
      };
    },
    isActive: (sensor) => (listeners.get(sensor)?.size ?? 0) > 0,
    emit(sensor, reading) {
      const timestamp =
        reading.timestamp ?? (clocks[sensor] ?? 0) + (intervals[sensor] ?? 0);
      clocks[sensor] = timestamp;
      const full = { ...reading, timestamp } as never;
      [...(listeners.get(sensor) ?? [])].forEach((listener) => listener(full));
    },
  };
}
