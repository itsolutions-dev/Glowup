import { createEmitter } from "./shared";

/**
 * Counts system UI open on top of the app. The global `systemSheet` covers
 * every sheet the package opens (the media picker): on Android it is another
 * activity, and the app goes to the background behind it and comes back
 * when it closes. `useAppLock` ignores a background that starts while one
 * is open, as it does behind its own prompt, or picking a photo would lock
 * the app. It lives in core because a capability may not import another; it
 * is plain JavaScript and loads no native module.
 */
export function createSystemSheet() {
  let open = 0;
  const emitter = createEmitter();
  const change = (delta: number) => {
    open += delta;
    emitter.emit();
  };
  return {
    isOpen: () => open > 0,
    subscribe: emitter.subscribe,
    /**
     * Runs `call` (synchronously: the web opens its file dialog only inside
     * the user's gesture) and counts the sheet open until it settles.
     */
    async run<T>(call: () => Promise<T>): Promise<T> {
      change(1);
      try {
        return await call();
      } finally {
        change(-1);
      }
    },
  };
}

export const systemSheet = createSystemSheet();
