import { useEffect, useRef, useSyncExternalStore } from "react";

import { getOrCreate } from "../core/shared";
import type { Unsubscribe } from "../core/types";
import { getRfidEngine, type RfidEngine } from "./engine";
import { useRfidAdapter } from "./hooks";

interface TriggerStore {
  isPressed(): boolean;
  /** Hears every press and release; the reader's trigger is the app's while anyone listens. */
  listen(handler: (pressed: boolean) => void): Unsubscribe;
  subscribe(listener: () => void): Unsubscribe;
}

function createTriggerStore(engine: RfidEngine): TriggerStore {
  const { adapter } = engine;
  const handlers = new Set<(pressed: boolean) => void>();
  let pressed = false;
  let release: Unsubscribe | null = null;

  function onTrigger(next: boolean) {
    pressed = next;
    handlers.forEach((handler) => handler(next));
  }

  function listen(handler: (pressed: boolean) => void): Unsubscribe {
    if (!adapter.subscribeTrigger) return () => {};
    handlers.add(handler);
    if (handlers.size === 1) {
      release = adapter.subscribeTrigger(onTrigger);
    }
    return () => {
      if (!handlers.delete(handler) || handlers.size > 0) return;
      release?.();
      release = null;
      if (pressed) onTrigger(false);
    };
  }

  return {
    isPressed: () => pressed,
    listen,
    subscribe: (listener) => listen(() => listener()),
  };
}

const stores = new WeakMap<RfidEngine, TriggerStore>();

const getServerSnapshot = () => false;

export interface RfidTriggerHandlers {
  onPress?: () => void;
  onRelease?: () => void;
}

export interface UseRfidTrigger {
  /** Whether the adapter hands the trigger over (`capabilities.trigger`). */
  isSupported: boolean;
  isPressed: boolean;
}

/**
 * The reader's trigger, for the app while the component is mounted: the
 * adapter switches the reader to hand its presses over, and back when the
 * last component using the hook unmounts. Pair it with a mode:
 *
 * ```tsx
 * const inventory = useRfidInventory();
 * useRfidTrigger({ onPress: () => inventory.start(), onRelease: () => inventory.stop() });
 * ```
 */
export function useRfidTrigger(
  handlers: RfidTriggerHandlers = {},
): UseRfidTrigger {
  const adapter = useRfidAdapter();
  const engine = getRfidEngine(adapter);
  const store = getOrCreate(stores, engine, () => createTriggerStore(engine));
  const latest = useRef(handlers);

  useEffect(() => {
    latest.current = handlers;
  });

  const isPressed = useSyncExternalStore(
    store.subscribe,
    store.isPressed,
    getServerSnapshot,
  );

  useEffect(
    () =>
      store.listen((pressed) =>
        (pressed ? latest.current.onPress : latest.current.onRelease)?.(),
      ),
    [store],
  );

  return {
    isSupported: typeof adapter.subscribeTrigger === "function",
    isPressed,
  };
}
