import type { Unsubscribe } from "./types";

/**
 * The system authentication prompt, shared by every capability that shows
 * one (`/biometrics`, `/secure-store`'s protected items): the platforms
 * show one at a time and misbehave on a second (Android's
 * expo-local-authentication answers `app_cancel`, expo-secure-store throws,
 * iOS stacks an evaluation), so a second caller is refused before it
 * reaches them. It lives in core because a capability may not import
 * another; it is plain JavaScript and loads no native module.
 */
export interface PromptSession {
  isRunning(): boolean;
  subscribe(listener: () => void): Unsubscribe;
  /** Runs `call`, or answers `busy` at once while another prompt runs. */
  run<T>(busy: T, call: () => Promise<T>): Promise<T>;
}

function createPromptSession(): PromptSession {
  let running = false;
  const listeners = new Set<() => void>();
  const set = (next: boolean) => {
    running = next;
    listeners.forEach((listener) => listener());
  };
  return {
    isRunning: () => running,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    async run(busy, call) {
      if (running) return busy;
      set(true);
      try {
        return await call();
      } finally {
        set(false);
      }
    },
  };
}

export const promptSession: PromptSession = createPromptSession();
