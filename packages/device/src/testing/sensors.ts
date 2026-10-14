import type {
  PermissionState,
  PermissionStatus,
  Unsubscribe,
} from "../core/types";
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
  /**
   * The sensors that need the motion permission, as iOS's barometer or
   * iOS Safari's motion sensors do. Default: none.
   */
  gated?: readonly SensorName[];
  /** The motion permission. Default `"undetermined"`. */
  permission?: PermissionStatus;
  /** What a request answers. Default `"granted"`. */
  requestAnswer?: "granted" | "denied";
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
  /** How many times the permission was requested. */
  readonly permissionRequests: number;
  /** Changes the permission as the system settings would (read on the next refresh). */
  setPermission(status: PermissionStatus): void;
}

/**
 * An in-memory `SensorsAdapter`. Inject it with
 * `<DeviceAdaptersProvider adapters={{ sensors }}>` and drive it with
 * `emit()`.
 */
const toState = (status: PermissionStatus): PermissionState => ({
  status,
  canAskAgain: status === "undetermined",
});

export function createMockSensorsAdapter({
  supported = true,
  available = {},
  gated = [],
  permission = "undetermined",
  requestAnswer = "granted",
}: MockSensorsOptions = {}): MockSensorsAdapter {
  let current = permission;
  let requests = 0;
  const intervals: Partial<Record<SensorName, number>> = {};
  const listeners = new Map<SensorName, Set<(reading: never) => void>>();
  const clocks: Partial<Record<SensorName, number>> = {};

  return {
    intervals,
    get permissionRequests() {
      return requests;
    },
    setPermission(status) {
      current = status;
    },
    requiresPermission: (sensor) => gated.includes(sensor),
    getPermission: async () => toState(current),
    async requestPermission() {
      requests++;
      if (current === "undetermined") current = requestAnswer;
      return toState(current);
    },
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
