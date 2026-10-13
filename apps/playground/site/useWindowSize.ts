import { useSyncExternalStore } from "react";
import { Dimensions, type ScaledSize } from "react-native";

/**
 * What the static export sees: it prerenders in Node, where react-native-web's
 * window is 0 × 0. Hydration must start from this same size, or the first
 * client render (a desktop layout at 1280 px) disagrees with the prerendered
 * HTML (the compact one) and React throws it away (minified error #418).
 */
const SERVER_SIZE: ScaledSize = { width: 0, height: 0, scale: 1, fontScale: 1 };

let cached: ScaledSize | null = null;

// useSyncExternalStore compares snapshots by identity: hand back the same
// object until the size actually changes.
const getSnapshot = (): ScaledSize => {
  const next = Dimensions.get("window");
  if (
    !cached ||
    cached.width !== next.width ||
    cached.height !== next.height ||
    cached.scale !== next.scale ||
    cached.fontScale !== next.fontScale
  ) {
    cached = next;
  }
  return cached;
};

const subscribe = (onChange: () => void) => {
  const subscription = Dimensions.addEventListener("change", onChange);
  return () => subscription.remove();
};

const getServerSnapshot = () => SERVER_SIZE;

/**
 * `useWindowDimensions()`, safe to prerender: it reports the server's size
 * while hydrating and the real one right after. Read the window only through
 * this hook (via `useLayout()`), never with `useWindowDimensions()` directly.
 */
export const useWindowSize = (): ScaledSize =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
