/**
 * System UI the package opens on top of the app (the media picker). On
 * Android it is another activity: the app goes to the background behind it
 * and comes back when it closes. `useAppLock` ignores a background that
 * starts while one is open, as it does behind its own prompt, or picking a
 * photo would lock the app. It lives in core because a capability may not
 * import another; it is plain JavaScript and loads no native module.
 */
export interface SystemSheet {
  isOpen(): boolean;
  /**
   * Runs `open` (synchronously: the web opens its file dialog only inside
   * the user's gesture) and counts the sheet open until it settles.
   */
  run<T>(open: () => Promise<T>): Promise<T>;
}

export function createSystemSheet(): SystemSheet {
  let open = 0;
  return {
    isOpen: () => open > 0,
    async run(call) {
      open++;
      try {
        return await call();
      } finally {
        open--;
      }
    },
  };
}

export const systemSheet: SystemSheet = createSystemSheet();
