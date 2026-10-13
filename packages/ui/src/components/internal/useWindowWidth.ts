import { useSyncExternalStore } from "react";
import { Dimensions } from "react-native";

const subscribe = (onChange: () => void) => {
  const subscription = Dimensions.addEventListener("change", onChange);
  return () => subscription.remove();
};

const getSnapshot = () => Dimensions.get("window").width;

// What a static web export renders with: react-native-web's window is 0 wide
// in Node. Hydration has to start from the same value, or a layout derived
// from the width (Grid's column count) differs between the prerendered HTML
// and the first client render, and React discards the page (error #418).
const getServerSnapshot = () => 0;

/**
 * The window width, safe to server-render: `useWindowDimensions().width`,
 * except that it reports 0 while hydrating a prerendered page and the real
 * width right after. On native and in a client-only web app there is no
 * hydration, and it is the window width from the first render.
 */
export const useWindowWidth = () =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
