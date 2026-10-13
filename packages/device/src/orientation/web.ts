import { hasDOM } from "../core/support";
import { OrientationError } from "./errors";
import type { Orientation, OrientationAdapter, OrientationLock } from "./types";

/**
 * The web default, on `screen.orientation`, read directly instead of through
 * expo-screen-orientation's web build, whose `unlockAsync()` calls
 * `screen.orientation.lock("natural")`: a lock, not an unlock, and one that
 * rejects outside fullscreen.
 */

interface ScreenOrientationLike {
  type: string;
  addEventListener(type: "change", listener: () => void): void;
  removeEventListener(type: "change", listener: () => void): void;
  lock?: (orientation: string) => Promise<void>;
  unlock?: () => void;
}

const screenOrientation = () =>
  (screen as unknown as { orientation?: ScreenOrientationLike }).orientation;

// Named as expo-screen-orientation's web build maps them, so a value means
// the same on every platform.
const FROM_WEB: Record<string, Orientation> = {
  "portrait-primary": "portrait-up",
  "portrait-secondary": "portrait-down",
  "landscape-primary": "landscape-left",
  "landscape-secondary": "landscape-right",
};

const TO_WEB: Record<OrientationLock, string> = {
  any: "any",
  portrait: "portrait-primary",
  landscape: "landscape",
  "landscape-left": "landscape-primary",
  "landscape-right": "landscape-secondary",
};

const read = (): Orientation =>
  FROM_WEB[screenOrientation()?.type ?? ""] ?? "unknown";

export const webOrientationAdapter: OrientationAdapter = {
  isSupported: () => hasDOM() && screenOrientation() != null,
  getOrientation: async () => read(),
  subscribe(listener) {
    const target = screenOrientation();
    const onChange = () => listener(read());
    target?.addEventListener("change", onChange);
    return () => target?.removeEventListener("change", onChange);
  },
  supportsLock: () =>
    hasDOM() && typeof screenOrientation()?.lock === "function",
  async lock(lock) {
    const target = screenOrientation();
    if (!hasDOM() || typeof target?.lock !== "function") {
      throw new OrientationError("unsupported");
    }
    try {
      await target.lock(TO_WEB[lock]);
    } catch (error) {
      // Chromium refuses on desktop and outside fullscreen on mobile
      // ("NotSupportedError: … not available on this device").
      throw new OrientationError(
        "unsupported",
        error instanceof Error ? error.message : undefined,
        error,
      );
    }
  },
  async unlock() {
    try {
      screenOrientation()?.unlock?.();
    } catch {
      // Nothing was locked.
    }
  },
};
