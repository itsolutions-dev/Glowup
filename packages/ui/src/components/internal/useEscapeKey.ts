import { useEffect, useRef } from "react";
import { Platform } from "react-native";

/**
 * Call after closing something on an Escape keydown, on web. react-native-web's
 * `Modal` closes on the Escape keyup, so a popover inside a `Dialog` would
 * close and take the dialog with it: this stops that one keyup before it
 * reaches the document.
 */
export const swallowEscapeKeyUp = () => {
  if (typeof window?.addEventListener !== "function") return;
  const onKeyUp = (event: KeyboardEvent) => {
    if (event.key !== "Escape") return;
    event.stopPropagation();
    window.removeEventListener("keyup", onKeyUp, true);
  };
  window.addEventListener("keyup", onKeyUp, true);
};

/**
 * Calls `onEscape` when Escape is pressed while `active`, on web — the key
 * react-native's `onRequestClose` does not cover. The handler is read through
 * a ref, so an inline callback does not re-subscribe the listener on every
 * render.
 */
export const useEscapeKey = (active: boolean, onEscape: () => void) => {
  const handler = useRef(onEscape);
  useEffect(() => {
    handler.current = onEscape;
  });

  useEffect(() => {
    if (Platform.OS !== "web" || !active) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      swallowEscapeKeyUp();
      handler.current();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [active]);
};
