import type { ViewStyle } from "react-native";
import type { EdgeInsets } from "react-native-safe-area-context";

export type Corner = "bottom-right" | "bottom-left" | "top-right" | "top-left";

// M3: a screen-level FAB sits 16dp from the edges it hugs.
const MARGIN = 16;

/**
 * Absolute position in a corner of the screen, clear of the safe-area insets.
 * Shared by FAB, AnimatedFAB and SpeedDial, which all float in a corner.
 */
export const cornerStyle = (corner: Corner, insets: EdgeInsets): ViewStyle => ({
  position: "absolute",
  ...(corner.startsWith("top")
    ? { top: insets.top + MARGIN }
    : { bottom: insets.bottom + MARGIN }),
  ...(corner.endsWith("right")
    ? { right: insets.right + MARGIN }
    : { left: insets.left + MARGIN }),
});
