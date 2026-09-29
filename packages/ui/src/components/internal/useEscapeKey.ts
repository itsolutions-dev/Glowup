import { useEffect, useRef } from "react";
import { Platform } from "react-native";

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
      handler.current();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [active]);
};
