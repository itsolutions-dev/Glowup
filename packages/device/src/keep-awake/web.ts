import { hasDOM } from "../core/support";
import type { KeepAwakeAdapter } from "./types";

/**
 * The web default, on the Screen Wake Lock API, held directly instead of
 * through expo-keep-awake's web build, which (1) never re-acquires the lock
 * the browser releases whenever the tab is hidden, so the screen sleeps after
 * a tab switch although the hook is still mounted, and (2) throws on a
 * deactivation that beats the pending request — after which the request
 * lands and its lock is never released.
 */

interface WakeLockSentinel {
  released: boolean;
  release(): Promise<void>;
  addEventListener(type: "release", listener: () => void): void;
}

type WakeLockNavigator = Navigator & {
  wakeLock?: { request(type: "screen"): Promise<WakeLockSentinel> };
};

interface Hold {
  sentinel: WakeLockSentinel | null;
  /** The request in flight, so a visibility change does not send a second one. */
  pending: Promise<void> | null;
}

const holds = new Map<string, Hold>();

const visible = () => document.visibilityState === "visible";

function acquire(tag: string): Promise<void> {
  const hold = holds.get(tag);
  // A hidden page cannot take the lock; it is taken when the page shows.
  if (!hold || hold.sentinel || !visible()) return Promise.resolve();
  hold.pending ??= request(hold).finally(() => {
    hold.pending = null;
  });
  return hold.pending;
}

async function request(hold: Hold): Promise<void> {
  const sentinel = await (navigator as WakeLockNavigator).wakeLock!.request(
    "screen",
  );
  // Deactivated while the request was pending: let go.
  if (![...holds.values()].includes(hold)) {
    await sentinel.release();
    return;
  }
  hold.sentinel = sentinel;
  sentinel.addEventListener("release", () => {
    if (hold.sentinel === sentinel) hold.sentinel = null;
  });
}

// The browser releases every wake lock when the tab is hidden: take them
// again when it shows.
function onVisibilityChange() {
  if (!visible()) return;
  holds.forEach((_, tag) => {
    acquire(tag).catch(() => {});
  });
}

export const webKeepAwakeAdapter: KeepAwakeAdapter = {
  isSupported: () =>
    hasDOM() && (navigator as WakeLockNavigator).wakeLock != null,
  async activate(tag) {
    if (holds.size === 0) {
      document.addEventListener("visibilitychange", onVisibilityChange);
    }
    if (!holds.has(tag)) holds.set(tag, { sentinel: null, pending: null });
    await acquire(tag);
  },
  async deactivate(tag) {
    const hold = holds.get(tag);
    if (!hold) return;
    holds.delete(tag);
    if (holds.size === 0) {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    }
    await hold.sentinel?.release().catch(() => {});
  },
};
