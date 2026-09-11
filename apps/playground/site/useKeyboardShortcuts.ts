import { useEffect } from "react";
import { Platform } from "react-native";

export interface Shortcut {
  /** Lower-case `event.key`, or "?" for the shifted form. */
  key: string;
  /** Requires the platform's command key (⌘ on macOS, Ctrl elsewhere). */
  meta?: boolean;
  label: string;
  description: string;
  run: () => void;
  /**
   * Fire even while the caret is in a text field. Only the palette's own
   * opener and Escape want this; every other letter shortcut would otherwise
   * swallow typing.
   */
  whileTyping?: boolean;
}

const isTypingTarget = (target: EventTarget | null): boolean => {
  const element = target as HTMLElement | null;
  if (!element) return false;
  const tag = element.tagName?.toUpperCase();
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    element.isContentEditable === true
  );
};

/**
 * Binds a set of keyboard shortcuts to the document.
 *
 * Web only, and deliberately so: there is no hardware keyboard to bind on a
 * phone, and `document` does not exist on native. The hook is a no-op there
 * rather than a platform fork at every call site.
 */
export const useKeyboardShortcuts = (shortcuts: Shortcut[]) => {
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;

    const onKeyDown = (event: KeyboardEvent) => {
      // A modifier combination the page does not claim belongs to the browser.
      if (event.altKey) return;

      const typing = isTypingTarget(event.target);
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      const commandKey = event.metaKey || event.ctrlKey;

      for (const shortcut of shortcuts) {
        const wantsCommand = shortcut.meta === true;
        if (wantsCommand !== commandKey) continue;
        if (shortcut.key !== key) continue;
        if (typing && !shortcut.whileTyping) continue;

        event.preventDefault();
        shortcut.run();
        return;
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [shortcuts]);
};

/** ⌘ on Apple platforms, Ctrl everywhere else — for labels, not for matching. */
export const COMMAND_KEY_LABEL =
  Platform.OS === "web" &&
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad/.test(navigator.platform ?? "")
    ? "⌘"
    : "Ctrl";

export default useKeyboardShortcuts;
