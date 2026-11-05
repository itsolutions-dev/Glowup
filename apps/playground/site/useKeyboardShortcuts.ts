import { useEffect } from "react";
import { Platform } from "react-native";

export interface Shortcut {
  /** Lower-case `event.key`, or "?" for the shifted form. */
  key: string;
  /** Requires the platform's command key (⌘ on macOS, Ctrl elsewhere). */
  meta?: boolean;
  /**
   * Requires Shift held (true) or not held (false); left out, Shift is not
   * looked at — "?" is a shifted key on most layouts.
   */
  shift?: boolean;
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

/** The shortcut a key press runs, if any: what the document listener uses. */
export const matchShortcut = (
  shortcuts: Shortcut[],
  event: {
    key: string;
    metaKey: boolean;
    ctrlKey: boolean;
    shiftKey: boolean;
    altKey: boolean;
    /** A focused widget (a tree, a slider) already used the key. */
    defaultPrevented?: boolean;
  },
  typing: boolean,
): Shortcut | undefined => {
  // A modifier combination the page does not claim belongs to the browser,
  // and a key a focused widget already handled belongs to that widget.
  if (event.altKey || event.defaultPrevented) return undefined;
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  const commandKey = event.metaKey || event.ctrlKey;
  const matches = shortcuts.filter(
    (shortcut) =>
      (shortcut.meta === true) === commandKey &&
      (shortcut.shift === undefined || shortcut.shift === event.shiftKey) &&
      shortcut.key === key &&
      (!typing || shortcut.whileTyping === true),
  );
  // One that names the Shift state wins over one that does not care:
  // Ctrl+Shift+Z is redo even with an undo on Ctrl+Z listed first.
  return matches.find((s) => s.shift !== undefined) ?? matches[0];
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
      const shortcut = matchShortcut(
        shortcuts,
        event,
        isTypingTarget(event.target),
      );
      if (!shortcut) return;
      event.preventDefault();
      shortcut.run();
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
