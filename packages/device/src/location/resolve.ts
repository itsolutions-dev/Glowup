import { LocationError } from "../core/geo";
import type { GeoPosition, LocationAdapter, PositionOptions } from "./types";

/**
 * The checks every read goes through, in the order a user can fix them. They
 * also keep the adapters from prompting: on web, asking for a position is
 * what shows the browser's permission prompt.
 */
export async function ensureReady(adapter: LocationAdapter): Promise<void> {
  if (!adapter.isSupported()) throw new LocationError("unsupported");
  const permission = await adapter.getPermission();
  if (permission.status === "unsupported") {
    throw new LocationError("unsupported");
  }
  if (permission.status !== "granted") {
    throw new LocationError("permission-denied");
  }
  if (!(await adapter.hasServicesEnabled())) {
    throw new LocationError("services-disabled");
  }
}

/** expo-location has no timeout on native: a fix indoors can wait forever. */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  if (!Number.isFinite(ms) || ms <= 0) return promise;
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new LocationError("timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export interface ResolvePositionOptions extends PositionOptions {
  maxAge?: number;
  timeout: number;
}

export async function resolvePosition(
  adapter: LocationAdapter,
  { accuracy, maxAge, timeout }: ResolvePositionOptions,
): Promise<GeoPosition> {
  await ensureReady(adapter);
  if (maxAge !== undefined) {
    // The cache is a shortcut: when it fails, a fresh read still can succeed.
    const cached = await adapter
      .getLastKnownPosition({ maxAge })
      .catch(() => null);
    if (cached) return cached;
  }
  return withTimeout(adapter.getCurrentPosition({ accuracy }), timeout);
}
