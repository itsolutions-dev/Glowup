import { useSyncExternalStore } from "react";

import type { Unsubscribe } from "./types";

/** `map`'s entry for `key`, created and stored on first use. */
export function getOrCreate<K, V>(
  map: { get(key: K): V | undefined; set(key: K, value: V): unknown },
  key: K,
  create: () => V,
): V {
  let value = map.get(key);
  if (value === undefined) {
    value = create();
    map.set(key, value);
  }
  return value;
}

export interface Emitter {
  subscribe(listener: () => void): Unsubscribe;
  emit(): void;
  size(): number;
}

/** A set of change listeners: what every store here hands to `useSyncExternalStore`. */
export function createEmitter(): Emitter {
  const listeners = new Set<() => void>();
  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    emit: () => listeners.forEach((listener) => listener()),
    size: () => listeners.size,
  };
}

/**
 * A capability's error: a `code` from its own list, recognised by `name`
 * (`isCodedError`) across module copies, where `instanceof` would not work.
 */
export class CodedError<C extends string> extends Error {
  readonly code: C;

  constructor(name: string, code: C, message: string, cause?: unknown) {
    super(message);
    this.name = name;
    this.code = code;
    if (cause !== undefined) (this as { cause?: unknown }).cause = cause;
  }
}

export function isCodedError(error: unknown, name: string): boolean {
  return (
    error instanceof Error &&
    error.name === name &&
    typeof (error as { code?: unknown }).code === "string"
  );
}

/** A failure's `detail`: an Expo error's code and message, or the value as text. */
export function errorDetail(error: unknown): string {
  const { code, message } = (error ?? {}) as {
    code?: unknown;
    message?: unknown;
  };
  const text = typeof message === "string" ? message : String(error);
  return typeof code === "string" ? `${code}: ${text}` : text;
}

const subscribeNothing = () => () => {};

/**
 * A value read on the client only (an adapter's `isSupported()`):
 * `serverValue` while the static web export prerenders in Node and while
 * its page hydrates, or the HTML would mismatch.
 */
export function useClientValue<T>(read: () => T, serverValue: T): T {
  return useSyncExternalStore(subscribeNothing, read, () => serverValue);
}
