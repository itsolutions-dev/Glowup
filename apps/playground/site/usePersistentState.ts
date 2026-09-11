import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_PREFIX = "glowup.site.";

/**
 * `useState` that survives a reload, for the reader's preferences — the
 * catalogue's layout mode, whether the props panel is open, the last category
 * filter. Nothing here is worth a round trip on its own; losing all of it on
 * every refresh is what made the gallery feel like a demo rather than a tool.
 *
 * The first render always uses `initial`: AsyncStorage is async on every
 * platform (localStorage behind a promise on web), and rendering a guessed
 * value that then snaps to the stored one is worse than one frame of default.
 */
export const usePersistentState = <T>(
  key: string,
  initial: T,
): [T, (value: T) => void, boolean] => {
  const [value, setValue] = useState<T>(initial);
  const [hydrated, setHydrated] = useState(false);
  const storageKey = useRef(KEY_PREFIX + key);

  useEffect(() => {
    let cancelled = false;
    AsyncStorage.getItem(storageKey.current)
      .then((raw) => {
        if (cancelled || raw == null) return;
        try {
          setValue(JSON.parse(raw) as T);
        } catch {
          // A value written by an older build in a format this one cannot read
          // is not worth an error: fall back to the default and overwrite it on
          // the next write.
        }
      })
      .finally(() => !cancelled && setHydrated(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const write = useCallback((next: T) => {
    setValue(next);
    // Fire and forget: a storage failure (private browsing, quota) must never
    // break the interaction that triggered it.
    AsyncStorage.setItem(storageKey.current, JSON.stringify(next)).catch(
      () => {},
    );
  }, []);

  return [value, write, hydrated];
};

export default usePersistentState;
