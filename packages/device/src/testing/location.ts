import type { PermissionStatus } from "../core/types";
import { LocationError, type LocationErrorCode } from "../location/errors";
import type {
  GeoCoordinates,
  GeoPosition,
  LocationAdapter,
  LocationPermissionState,
  LocationPrecision,
  WatchPositionOptions,
} from "../location/types";

/** Rome, accurate to 10 m, taken now. */
export function buildPosition(
  coords: Partial<GeoCoordinates> = {},
  timestamp: number = Date.now(),
): GeoPosition {
  return {
    coords: {
      latitude: 41.9028,
      longitude: 12.4964,
      altitude: null,
      accuracy: 10,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
      ...coords,
    },
    timestamp,
  };
}

export interface MockLocationOptions {
  /** Default `"undetermined"`. */
  permission?: PermissionStatus;
  /** Reported once granted. Default `"precise"`. */
  precision?: LocationPrecision;
  /** Default: true unless `permission` is `"denied"`. */
  canAskAgain?: boolean;
  /** What `requestPermission()` turns an askable permission into. Default `"granted"`. */
  requestResult?: "granted" | "denied";
  /** Default true. */
  servicesEnabled?: boolean;
  /** Default true. */
  supported?: boolean;
  /** What `getCurrentPosition()` answers. Default `buildPosition()`. */
  position?: GeoPosition | LocationError | "pending";
  /** What `getLastKnownPosition()` answers, before the maxAge check. Default `null`. */
  lastKnown?: GeoPosition | null;
}

export interface MockLocationAdapter extends LocationAdapter {
  setPermission(
    status: PermissionStatus,
    options?: { precision?: LocationPrecision; canAskAgain?: boolean },
  ): void;
  setServicesEnabled(enabled: boolean): void;
  /** `"pending"` makes `getCurrentPosition()` never settle (to test timeouts). */
  setPosition(next: GeoPosition | LocationError | "pending"): void;
  setLastKnown(next: GeoPosition | null): void;
  /** Delivers a fix to every active watch. */
  emit(position: GeoPosition): void;
  /** Delivers an error to every active watch. */
  fail(error: LocationError | LocationErrorCode): void;
  /** Active watches and the options each was opened with. */
  readonly watches: readonly WatchPositionOptions[];
  /** How many times `requestPermission()` was called. */
  readonly requestCount: number;
}

/**
 * An in-memory `LocationAdapter`. Inject it with
 * `<DeviceAdaptersProvider adapters={{ location: adapter }}>` and drive it
 * from the test: `adapter.setPermission("granted")`, `adapter.emit(fix)`.
 * The hooks share permission state per adapter, so create one per test.
 */
export function createMockLocationAdapter(
  options: MockLocationOptions = {},
): MockLocationAdapter {
  const requestResult = options.requestResult ?? "granted";
  let precision: LocationPrecision = options.precision ?? "precise";
  let permission: LocationPermissionState;
  let servicesEnabled = options.servicesEnabled ?? true;
  let position = options.position ?? buildPosition();
  let lastKnown = options.lastKnown ?? null;
  let requestCount = 0;
  const watchers = new Map<
    number,
    {
      options: WatchPositionOptions;
      onPosition: (position: GeoPosition) => void;
      onError: (error: LocationError) => void;
    }
  >();
  let nextWatch = 0;

  function setPermission(
    status: PermissionStatus,
    extra: { precision?: LocationPrecision; canAskAgain?: boolean } = {},
  ) {
    if (extra.precision) precision = extra.precision;
    permission = {
      status,
      canAskAgain:
        extra.canAskAgain ??
        (status === "undetermined" ||
          (status === "denied" && options.canAskAgain === true)),
      precision: status === "granted" ? precision : null,
    };
  }
  setPermission(options.permission ?? "undetermined", {
    canAskAgain: options.canAskAgain,
  });

  return {
    isSupported: () => options.supported ?? true,
    getPermission: async () => permission,
    async requestPermission() {
      requestCount++;
      if (permission.status === "undetermined" || permission.canAskAgain) {
        setPermission(requestResult, { canAskAgain: false });
      }
      return permission;
    },
    hasServicesEnabled: async () => servicesEnabled,
    getCurrentPosition() {
      if (position === "pending") return new Promise<GeoPosition>(() => {});
      return position instanceof LocationError
        ? Promise.reject(position)
        : Promise.resolve(position);
    },
    async getLastKnownPosition({ maxAge = Infinity, requiredAccuracy }) {
      if (!lastKnown) return null;
      const tooOld = Date.now() - lastKnown.timestamp > maxAge;
      const tooRough =
        requiredAccuracy !== undefined &&
        (lastKnown.coords.accuracy ?? Infinity) > requiredAccuracy;
      return tooOld || tooRough ? null : lastKnown;
    },
    watchPosition(watchOptions, onPosition, onError) {
      const id = nextWatch++;
      watchers.set(id, { options: watchOptions, onPosition, onError });
      return () => {
        watchers.delete(id);
      };
    },

    setPermission,
    setServicesEnabled(enabled) {
      servicesEnabled = enabled;
    },
    setPosition(next) {
      position = next;
    },
    setLastKnown(next) {
      lastKnown = next;
    },
    emit(fix) {
      [...watchers.values()].forEach((watcher) => watcher.onPosition(fix));
    },
    fail(error) {
      const failure =
        typeof error === "string" ? new LocationError(error) : error;
      [...watchers.values()].forEach((watcher) => watcher.onError(failure));
    },
    get watches() {
      return [...watchers.values()].map((watcher) => watcher.options);
    },
    get requestCount() {
      return requestCount;
    },
  };
}
