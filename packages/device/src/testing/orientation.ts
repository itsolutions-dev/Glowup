import { OrientationError } from "../orientation/errors";
import type {
  Orientation,
  OrientationAdapter,
  OrientationLock,
} from "../orientation/types";

export interface MockOrientationOptions {
  /** Starting orientation (default `portrait-up`). */
  orientation?: Orientation;
  /** False stands in for a browser that refuses every lock (default true). */
  lockable?: boolean;
}

export interface MockOrientationAdapter extends OrientationAdapter {
  /** Rotates the interface and notifies every subscriber. */
  setOrientation(next: Orientation): void;
  /** The lock the platform holds; `null` for the app's own orientation. */
  readonly currentLock: OrientationLock | null;
  /** Every lock and unlock, in order (`"unlock"` for an unlock). */
  readonly calls: readonly (OrientationLock | "unlock")[];
  /** Active platform subscriptions: the hooks share one per adapter. */
  readonly subscriberCount: number;
}

const SETTLES: Partial<Record<OrientationLock, Orientation>> = {
  portrait: "portrait-up",
  landscape: "landscape-left",
  "landscape-left": "landscape-left",
  "landscape-right": "landscape-right",
};

/**
 * An in-memory `OrientationAdapter`. A lock rotates the interface to match
 * (as a device would) and an unlock leaves it where it is. Inject it with
 * `<DeviceAdaptersProvider adapters={{ orientation }}>`.
 */
export function createMockOrientationAdapter({
  orientation: initial = "portrait-up",
  lockable = true,
}: MockOrientationOptions = {}): MockOrientationAdapter {
  let orientation = initial;
  let currentLock: OrientationLock | null = null;
  const calls: (OrientationLock | "unlock")[] = [];
  const listeners = new Set<(orientation: Orientation) => void>();

  const setOrientation = (next: Orientation) => {
    orientation = next;
    [...listeners].forEach((listener) => listener(orientation));
  };

  return {
    isSupported: () => true,
    getOrientation: async () => orientation,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    supportsLock: () => lockable,
    async lock(lock) {
      calls.push(lock);
      if (!lockable) throw new OrientationError("unsupported");
      currentLock = lock;
      const settled = SETTLES[lock];
      if (settled && settled !== orientation) setOrientation(settled);
    },
    async unlock() {
      calls.push("unlock");
      currentLock = null;
    },
    setOrientation,
    get currentLock() {
      return currentLock;
    },
    get calls() {
      return calls;
    },
    get subscriberCount() {
      return listeners.size;
    },
  };
}
