import { useEffect, useState } from "react";

/**
 * `value`, once it has stopped changing for `delayMs`. The first value is
 * returned at once, so there is no empty frame on mount; every later change
 * restarts the wait.
 */
export const useDebouncedValue = <T>(value: T, delayMs: number): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
};

export interface DebouncedCallback<Args extends unknown[]> {
  (...args: Args): void;
  /** Drops the pending call, if any. */
  cancel: () => void;
  /** Runs the pending call now, if any; a no-op otherwise. */
  flush: () => void;
}

interface Configurable<Args extends unknown[]> extends DebouncedCallback<Args> {
  configure: (callback: (...args: Args) => void, delayMs: number) => void;
}

// The timer and the pending arguments live in this closure, not in refs: the
// hook below reads and writes nothing mutable while it renders.
const createDebounced = <Args extends unknown[]>(
  initialCallback: (...args: Args) => void,
  initialDelayMs: number,
): Configurable<Args> => {
  let callback = initialCallback;
  let delayMs = initialDelayMs;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: Args | null = null;

  const cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    pending = null;
  };
  const flush = () => {
    const args = pending;
    cancel();
    if (args) callback(...args);
  };
  const call = (...args: Args) => {
    pending = args;
    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, delayMs);
  };
  const configure = (
    nextCallback: (...args: Args) => void,
    nextDelay: number,
  ) => {
    callback = nextCallback;
    delayMs = nextDelay;
  };
  return Object.assign(call, { cancel, flush, configure });
};

/**
 * A debounced version of `callback`: only the last call in a burst runs, with
 * its arguments, `delayMs` after it. The returned function keeps one identity
 * for the life of the component, always calls the latest `callback`, and drops
 * what is pending when the component unmounts.
 */
export const useDebouncedCallback = <Args extends unknown[]>(
  callback: (...args: Args) => void,
  delayMs: number,
): DebouncedCallback<Args> => {
  const [debounced] = useState(() => createDebounced(callback, delayMs));

  useEffect(() => {
    debounced.configure(callback, delayMs);
  });
  useEffect(() => debounced.cancel, [debounced]);

  return debounced;
};
