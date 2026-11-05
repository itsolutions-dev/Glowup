import { Platform } from "react-native";
import type { ViewStyle } from "react-native";
import type { Theme } from "../../providers/ThemeProvider";

/** The highest level of the M3 elevation scale. */
export const MAX_ELEVATION = 5;

// The shadow of each level on iOS (offset, opacity, radius) and Android
// (elevation), as `Paper` draws it.
const SHADOWS = [
  undefined,
  { y: 1, opacity: 0.1, radius: 1, android: 1 },
  { y: 2, opacity: 0.12, radius: 3, android: 2 },
  { y: 4, opacity: 0.15, radius: 6, android: 6 },
  { y: 6, opacity: 0.2, radius: 8, android: 8 },
  { y: 8, opacity: 0.25, radius: 10, android: 12 },
] as const;

/**
 * The look of an M3 elevation level, 0 to 5 (anything else is clamped): the
 * surface tone of that level, plus a shadow on iOS and Android from level 1.
 * On the web the tone alone carries the level, as it does in `Paper`.
 */
export const elevationStyle = (theme: Theme, level: number): ViewStyle => {
  const elevation = Math.max(0, Math.min(MAX_ELEVATION, Math.round(level)));
  const c = theme.colors;
  const backgroundColor = [
    c.surface,
    c.surfaceContainerLow,
    c.surfaceContainer,
    c.surfaceContainerHigh,
    c.surfaceContainerHighest,
    // The top of the container scale: the shadow tells 5 from 4. (surfaceDim
    // is darker than the page in dark mode, so 5 looked lower than 0.)
    c.surfaceContainerHighest,
  ][elevation];
  const shadow = SHADOWS[elevation];
  if (!shadow) return { backgroundColor };
  return {
    backgroundColor,
    ...Platform.select<ViewStyle>({
      ios: {
        shadowColor: c.shadow,
        shadowOffset: { width: 0, height: shadow.y },
        shadowOpacity: shadow.opacity,
        shadowRadius: shadow.radius,
      },
      android: { elevation: shadow.android },
    }),
  };
};
