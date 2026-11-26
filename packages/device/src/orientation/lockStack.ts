import { createEmitter } from "../core/shared";
import type { Unsubscribe } from "../core/types";
import { toOrientationError, type OrientationError } from "./errors";
import type { OrientationAdapter, OrientationLock } from "./types";

export interface OrientationLockState {
  /** This lock is the one the platform holds. */
  isActive: boolean;
  /** Why the platform refused this lock, while it is the most recent one. */
  error: OrientationError | null;
}

export const IDLE_LOCK: OrientationLockState = { isActive: false, error: null };
const ACTIVE_LOCK: OrientationLockState = { isActive: true, error: null };

export interface LockStack {
  /** Adds a lock on top, or changes it (which moves it on top). */
  set(id: string, lock: OrientationLock): void;
  remove(id: string): void;
  getState(id: string): OrientationLockState;
  subscribe(listener: () => void): Unsubscribe;
}

/**
 * The most recent lock wins; releasing it brings back the one before, and
 * releasing the last gives the orientation back to the app. Platform calls
 * run one at a time, each against the stack as it is when it runs, so a
 * burst of changes (a screen replacing another) settles on the final state.
 */
export function createLockStack(adapter: OrientationAdapter): LockStack {
  const entries: { id: string; lock: OrientationLock }[] = [];
  const states = new Map<string, OrientationLockState>();
  const emitter = createEmitter();
  // What the platform holds: null for the app's own orientation, undefined
  // when unknown (a lock failed halfway).
  let applied: OrientationLock | null | undefined = null;
  let queue = Promise.resolve();

  function setState(id: string, next: OrientationLockState) {
    const current = states.get(id) ?? IDLE_LOCK;
    if (current.isActive === next.isActive && current.error === next.error) {
      return;
    }
    states.set(id, next);
    emitter.emit();
  }

  async function apply() {
    const top = entries[entries.length - 1];
    entries.forEach((entry) => entry !== top && setState(entry.id, IDLE_LOCK));
    if (!top) {
      if (applied !== null) {
        applied = null;
        await adapter.unlock().catch(() => {});
      }
      return;
    }
    if (applied === top.lock) {
      setState(top.id, ACTIVE_LOCK);
      return;
    }
    const { id, lock } = top;
    try {
      await adapter.lock(lock);
      applied = lock;
      if (states.has(id)) setState(id, ACTIVE_LOCK);
    } catch (error) {
      applied = undefined;
      if (states.has(id)) {
        setState(id, { isActive: false, error: toOrientationError(error) });
      }
    }
  }

  function schedule() {
    queue = queue.then(apply).catch(() => {});
  }

  return {
    set(id, lock) {
      const index = entries.findIndex((entry) => entry.id === id);
      if (index >= 0) entries.splice(index, 1);
      entries.push({ id, lock });
      if (!states.has(id)) states.set(id, IDLE_LOCK);
      schedule();
    },
    remove(id) {
      const index = entries.findIndex((entry) => entry.id === id);
      if (index < 0) return;
      entries.splice(index, 1);
      states.delete(id);
      schedule();
    },
    getState: (id) => states.get(id) ?? IDLE_LOCK,
    subscribe: emitter.subscribe,
  };
}
