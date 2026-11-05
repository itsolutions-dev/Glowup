import { createContext, useContext, useEffect } from "react";

import type { Shortcut } from "./useKeyboardShortcuts";

/**
 * The shortcuts to bind: the site's, then the page's — but not the page's
 * while a dialog of the site is open over it (a key there must not edit the
 * page behind).
 */
export const withPageShortcuts = (
  site: Shortcut[],
  page: Shortcut[],
  dialogOpen: boolean,
): Shortcut[] => (dialogOpen || page.length === 0 ? site : [...site, ...page]);

/** The shell's setter for the shortcuts of the page on screen. */
export const PageShortcutsContext = createContext<
  ((shortcuts: Shortcut[]) => void) | null
>(null);

/**
 * A page's own shortcuts: bound with the shell's and listed in its dialog under
 * "This page" while the page is mounted. Pass a memoised array.
 */
export const usePageShortcuts = (shortcuts: Shortcut[]) => {
  const register = useContext(PageShortcutsContext);
  useEffect(() => {
    register?.(shortcuts);
    return () => register?.([]);
  }, [register, shortcuts]);
};
