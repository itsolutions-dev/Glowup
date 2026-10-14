import {
  LocationError,
  type GeoPosition,
  type LocationErrorCode,
  type LocationPermissionState,
} from "../core/geo";
import type { PermissionState, PermissionStatus } from "../core/types";
import {
  isTaskDefined,
  runGeofenceTask,
  runLocationTask,
  type TaskKind,
} from "../background-location/tasks";
import type {
  BackgroundLocationAdapter,
  BackgroundLocationOptions,
  GeofenceRegion,
} from "../background-location/types";
import { buildPosition } from "./location";

export interface MockBackgroundLocationOptions {
  /** `false` behaves like the web. Default true. */
  supported?: boolean;
  /** The background permission. Default `"undetermined"`. */
  permission?: PermissionStatus;
  /** The foreground permission. Default `"granted"`. */
  foregroundPermission?: PermissionStatus;
  /** What `requestPermission()` turns an askable permission into. Default `"granted"`. */
  requestResult?: "granted" | "denied";
  /** Default true. */
  servicesEnabled?: boolean;
  /** How many regions it watches at once. Default 20, iOS's limit. */
  geofenceLimit?: number;
}

export interface MockBackgroundLocationAdapter extends BackgroundLocationAdapter {
  setPermission(
    status: PermissionStatus,
    options?: { canAskAgain?: boolean },
  ): void;
  setForegroundPermission(status: PermissionStatus): void;
  setServicesEnabled(enabled: boolean): void;
  /** Makes the next `start()` or `startGeofencing()` reject, as the platform would. */
  failNextStart(error: LocationError | LocationErrorCode): void;
  /**
   * Runs the handler `defineLocationTask(name, …)` registered with positions
   * (default: one `buildPosition()`), as the platform does in the
   * background; resolves once the handler finished. Throws when no updates
   * run under `name`: the platform would deliver nothing.
   */
  deliver(name: string, positions?: GeoPosition[]): Promise<void>;
  /** Runs the handler with a failure, as iOS reports one. */
  deliverError(
    name: string,
    error: LocationError | LocationErrorCode,
  ): Promise<void>;
  /**
   * Runs the handler `defineGeofenceTask(name, …)` registered with an
   * `enter` or `exit` of the watched region `regionId`. Throws when nothing
   * is watched under `name`, or `regionId` is not among its regions.
   */
  deliverGeofence(
    name: string,
    type: "enter" | "exit",
    regionId: string,
  ): Promise<void>;
  /** Runs the geofence handler with a failure. */
  deliverGeofenceError(
    name: string,
    error: LocationError | LocationErrorCode,
  ): Promise<void>;
  /**
   * Stops the updates and the regions watched under `name`, as the system
   * would (a revoked permission), without the app asking.
   */
  stopBySystem(name: string): void;
  /** What runs, by task name, with the options it was started with. */
  readonly running: ReadonlyMap<string, BackgroundLocationOptions>;
  /** The regions watched, by task name. */
  readonly geofences: ReadonlyMap<string, readonly GeofenceRegion[]>;
  /** How many times `requestPermission()` was called. */
  readonly requestCount: number;
}

function toError(error: LocationError | LocationErrorCode): LocationError {
  return typeof error === "string" ? new LocationError(error) : error;
}

// As the location mock: only an undetermined permission can be asked by default.
function toState(
  status: PermissionStatus,
  canAskAgain?: boolean,
): PermissionState {
  return { status, canAskAgain: canAskAgain ?? status === "undetermined" };
}

/**
 * An in-memory `BackgroundLocationAdapter`. Inject it with
 * `<DeviceAdaptersProvider adapters={{ backgroundLocation: adapter }}>`, then
 * drive it from the test: `adapter.setForegroundPermission("denied")`,
 * `await adapter.deliver("trip", [fix])`. The hooks share state per adapter,
 * so create one per test.
 */
export function createMockBackgroundLocationAdapter(
  options: MockBackgroundLocationOptions = {},
): MockBackgroundLocationAdapter {
  const requestResult = options.requestResult ?? "granted";
  let permission: PermissionState = toState(
    options.permission ?? "undetermined",
  );
  let foreground: LocationPermissionState = {
    ...toState(options.foregroundPermission ?? "granted"),
    precision: null,
  };
  let servicesEnabled = options.servicesEnabled ?? true;
  let nextStartError: LocationError | null = null;
  let requestCount = 0;
  const running = new Map<string, BackgroundLocationOptions>();
  const geofences = new Map<string, GeofenceRegion[]>();

  function assertRunning(name: string, kind: TaskKind) {
    const active = kind === "location" ? running : geofences;
    if (!active.has(name)) {
      throw new Error(
        `MockBackgroundLocationAdapter: nothing runs under "${name}", so the platform would deliver nothing. Start it first.`,
      );
    }
    if (!isTaskDefined(name, kind)) {
      const define =
        kind === "location" ? "defineLocationTask" : "defineGeofenceTask";
      throw new Error(
        `MockBackgroundLocationAdapter: no ${kind} task "${name}": call ${define}("${name}", …) first.`,
      );
    }
  }

  return {
    isSupported: () => options.supported ?? true,
    getPermission: async () => ({ ...permission }),
    async requestPermission() {
      requestCount++;
      if (permission.status !== "granted" && permission.canAskAgain) {
        permission = toState(requestResult, false);
      }
      return { ...permission };
    },
    getForegroundPermission: async () => ({ ...foreground }),
    hasServicesEnabled: async () => servicesEnabled,
    async start(name, startOptions) {
      if (nextStartError) {
        const error = nextStartError;
        nextStartError = null;
        throw error;
      }
      running.set(name, startOptions);
    },
    async stop(name) {
      running.delete(name);
    },
    hasStarted: async (name) => running.has(name),
    geofenceLimit: options.geofenceLimit ?? 20,
    async startGeofencing(name, regions) {
      if (nextStartError) {
        const error = nextStartError;
        nextStartError = null;
        throw error;
      }
      geofences.set(
        name,
        regions.map((region) => ({ ...region })),
      );
    },
    async stopGeofencing(name) {
      geofences.delete(name);
    },
    hasStartedGeofencing: async (name) => geofences.has(name),

    setPermission(status, extra = {}) {
      permission = toState(status, extra.canAskAgain);
    },
    setForegroundPermission(status) {
      foreground = { ...toState(status), precision: null };
    },
    setServicesEnabled(enabled) {
      servicesEnabled = enabled;
    },
    failNextStart(error) {
      nextStartError = toError(error);
    },
    async deliver(name, positions = [buildPosition()]) {
      assertRunning(name, "location");
      await runLocationTask(name, { type: "positions", positions });
    },
    async deliverError(name, error) {
      assertRunning(name, "location");
      await runLocationTask(name, { type: "error", error: toError(error) });
    },
    async deliverGeofence(name, type, regionId) {
      assertRunning(name, "geofence");
      const region = geofences.get(name)!.find(({ id }) => id === regionId);
      if (!region) {
        throw new Error(
          `MockBackgroundLocationAdapter: "${name}" watches no region "${regionId}".`,
        );
      }
      const { id, latitude, longitude, radius } = region;
      await runGeofenceTask(name, {
        type,
        region: { id, latitude, longitude, radius },
      });
    },
    async deliverGeofenceError(name, error) {
      assertRunning(name, "geofence");
      await runGeofenceTask(name, { type: "error", error: toError(error) });
    },
    stopBySystem(name) {
      running.delete(name);
      geofences.delete(name);
    },
    get running() {
      return new Map(running);
    },
    get geofences() {
      return new Map(geofences);
    },
    get requestCount() {
      return requestCount;
    },
  };
}
