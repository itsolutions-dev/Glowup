import type {
  GeoPosition,
  LocationAccuracy,
  LocationError,
  LocationPermissionState,
} from "../core/geo";
import type { PermissionState } from "../core/types";

/** What iOS tunes its updates for (`CLActivityType`); ignored on Android. */
export type LocationActivityType =
  "other" | "automotive" | "fitness" | "navigation" | "airborne";

/**
 * Android's foreground service: the notification shown while the updates run.
 * It needs no background permission, but it can only start while the app is
 * in the foreground. Ignored on iOS.
 */
export interface ForegroundServiceOptions {
  title: string;
  body: string;
  /** `#RRGGBB` or `#AARRGGBB`. */
  color?: string;
  /** Stop the service (and the updates) when the user swipes the app away. Default false. */
  stopWithApp?: boolean;
}

export interface BackgroundLocationBaseOptions {
  /** Default `balanced`. */
  accuracy?: LocationAccuracy;
  /** Minimum metres between two updates. */
  distanceInterval?: number;
  /** Minimum milliseconds between two updates. Android only. */
  timeInterval?: number;
  /**
   * Hold the positions back and deliver them together once this many
   * milliseconds passed since the last delivery (and `batchDistance` metres
   * were covered). Saves battery; the task then receives several at once.
   */
  batchInterval?: number;
  /** Metres to cover before a batch is delivered. */
  batchDistance?: number;
  /**
   * iOS: let the system pause the updates while the device seems still.
   * Default false (expo's native default is true, whatever its docs say).
   */
  pausesAutomatically?: boolean;
  /** iOS: helps it decide when to pause. Default `other`. */
  activityType?: LocationActivityType;
  /**
   * iOS: the blue status bar pill while the app uses location in the
   * background. Default false; with "While Using" alone iOS shows it anyway.
   */
  showsIndicator?: boolean;
}

/**
 * Android has two ways to keep the updates going, and the choice is the
 * app's: a **foreground service** (a notification, the foreground permission
 * only, started while the app is open) or plain **background** updates
 * (`foregroundService: false`: the background permission, which Google Play
 * accepts only with a declaration). The config plugin's
 * `backgroundLocation.mode` must match.
 */
export type BackgroundLocationOptions = BackgroundLocationBaseOptions &
  (
    | { foregroundService: ForegroundServiceOptions }
    | { foregroundService: false }
  );

/** What a location task receives: positions, oldest first, or a failure. */
export type LocationTaskEvent =
  | { type: "positions"; positions: GeoPosition[] }
  | { type: "error"; error: LocationError };

/**
 * Runs without React: in the background, after a relaunch on iOS, headless
 * on Android. Keep it short (store or send the positions) and return the
 * promise of that work.
 */
export type LocationTaskHandler = (
  event: LocationTaskEvent,
) => void | Promise<void>;

/**
 * The contract between the hooks and whatever runs the updates. The hooks
 * check support, the task's definition, the permissions and the services
 * before `start`, so an adapter needs no guard of its own for them, and only
 * `requestPermission` may prompt. Rejections carry a `LocationError`.
 */
export interface BackgroundLocationAdapter {
  /** Whether background updates exist on this platform. Read at call time. */
  isSupported(): boolean;
  /** The background ("Always" / "Allow all the time") permission. */
  getPermission(): Promise<PermissionState>;
  /** Shows the OS prompt (Android 11+: the settings page) when it still can. */
  requestPermission(): Promise<PermissionState>;
  /** The foreground permission, which every background update needs first. */
  getForegroundPermission(): Promise<LocationPermissionState>;
  hasServicesEnabled(): Promise<boolean>;
  start(name: string, options: BackgroundLocationOptions): Promise<void>;
  /** Resolves when nothing runs under `name`, already stopped or not. */
  stop(name: string): Promise<void>;
  /** Whether updates run under `name`, started by this launch or an earlier one. */
  hasStarted(name: string): Promise<boolean>;
}
