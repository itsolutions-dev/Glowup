import type { LocationAccuracy } from "../core/geo";
import type {
  BackgroundLocationOptions,
  ForegroundServiceOptions,
  LocationActivityType,
} from "./types";

const API = "useBackgroundLocation().start()";

const ACCURACIES: readonly LocationAccuracy[] = [
  "low",
  "balanced",
  "high",
  "best",
];

const ACTIVITY_TYPES: readonly LocationActivityType[] = [
  "other",
  "automotive",
  "fitness",
  "navigation",
  "airborne",
];

const COLOR = /^#(?:[0-9a-f]{6}|[0-9a-f]{8})$/i;

function fail(message: string): never {
  throw new TypeError(`${API}: ${message}`);
}

function checkDistance(key: string, value: unknown): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    fail(`${key} must be a finite number, 0 or more.`);
  }
  return value;
}

function checkFlag(key: string, value: unknown): boolean | undefined {
  if (value === undefined || typeof value === "boolean") return value;
  return fail(`${key} must be a boolean.`);
}

function checkText(key: string, value: unknown): string {
  if (typeof value !== "string" || value.trim() === "") {
    fail(`foregroundService.${key} must be a non-empty string.`);
  }
  return value;
}

function checkForegroundService(
  value: unknown,
): ForegroundServiceOptions | false {
  if (value === false) return false;
  if (typeof value !== "object" || value === null) {
    return fail(
      "foregroundService is required: { title, body } for Android's foreground service, or false for background updates with the background permission.",
    );
  }
  const service = value as Record<string, unknown>;
  const color = service.color;
  if (
    color !== undefined &&
    (typeof color !== "string" || !COLOR.test(color))
  ) {
    fail("foregroundService.color must be #RRGGBB or #AARRGGBB.");
  }
  return {
    title: checkText("title", service.title),
    body: checkText("body", service.body),
    color: color as string | undefined,
    stopWithApp: checkFlag(
      "foregroundService.stopWithApp",
      service.stopWithApp,
    ),
  };
}

/**
 * The options as the adapter receives them: checked, and with nothing but the
 * known keys. Invalid ones throw a `TypeError` before anything starts.
 */
export function checkOptions(options: unknown): BackgroundLocationOptions {
  if (typeof options !== "object" || options === null) {
    return fail("options are required (at least foregroundService).");
  }
  const raw = options as Record<string, unknown>;
  if (
    raw.accuracy !== undefined &&
    !ACCURACIES.includes(raw.accuracy as LocationAccuracy)
  ) {
    fail(`accuracy must be one of ${ACCURACIES.join(", ")}.`);
  }
  if (
    raw.activityType !== undefined &&
    !ACTIVITY_TYPES.includes(raw.activityType as LocationActivityType)
  ) {
    fail(`activityType must be one of ${ACTIVITY_TYPES.join(", ")}.`);
  }
  return {
    accuracy: raw.accuracy as LocationAccuracy | undefined,
    distanceInterval: checkDistance("distanceInterval", raw.distanceInterval),
    timeInterval: checkDistance("timeInterval", raw.timeInterval),
    batchInterval: checkDistance("batchInterval", raw.batchInterval),
    batchDistance: checkDistance("batchDistance", raw.batchDistance),
    pausesAutomatically: checkFlag(
      "pausesAutomatically",
      raw.pausesAutomatically,
    ),
    activityType: raw.activityType as LocationActivityType | undefined,
    showsIndicator: checkFlag("showsIndicator", raw.showsIndicator),
    foregroundService: checkForegroundService(raw.foregroundService),
  };
}
