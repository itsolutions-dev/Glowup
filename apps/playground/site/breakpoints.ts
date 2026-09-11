import { useWindowDimensions } from "react-native";

/**
 * Material 3 window size classes, in dp. One source of truth for every
 * responsive decision in the app: the previous screen switched layout at 960
 * while the drawer switched at 840, so between the two you got a permanent
 * drawer next to a layout that still believed it was on a phone.
 *
 * https://m3.material.io/foundations/layout/applying-layout/window-size-classes
 */
export const BREAKPOINTS = {
  compact: 0,
  medium: 600,
  expanded: 840,
  large: 1200,
  extraLarge: 1600,
} as const;

export type SizeClass = keyof typeof BREAKPOINTS;

const ORDER: SizeClass[] = [
  "compact",
  "medium",
  "expanded",
  "large",
  "extraLarge",
];

export const sizeClassFor = (width: number): SizeClass => {
  let match: SizeClass = "compact";
  for (const name of ORDER) if (width >= BREAKPOINTS[name]) match = name;
  return match;
};

export interface Layout {
  width: number;
  height: number;
  sizeClass: SizeClass;
  /** True from this size class up. `atLeast("expanded")` reads as the docs do. */
  atLeast: (size: SizeClass) => boolean;
  /** Phone-shaped: one column, navigation behind a scrim. */
  isCompact: boolean;
  /** Tablet and up: a navigation rail is permanently visible. */
  hasRail: boolean;
  /** Room for a permanent catalogue list beside the content. */
  hasSidebar: boolean;
  /** Room for a third column (the props panel) beside the content. */
  hasThirdColumn: boolean;
  /** Content column cap, so text lines stay readable on a wide monitor. */
  contentMaxWidth: number;
}

/**
 * The single responsive hook. Everything that used to compare `width >= 960`
 * by hand asks this instead, so a change of breakpoint is a change in one file.
 */
export const useLayout = (): Layout => {
  const { width, height } = useWindowDimensions();
  const sizeClass = sizeClassFor(width);
  const atLeast = (size: SizeClass) => width >= BREAKPOINTS[size];

  return {
    width,
    height,
    sizeClass,
    atLeast,
    isCompact: sizeClass === "compact",
    hasRail: atLeast("medium"),
    hasSidebar: atLeast("expanded"),
    hasThirdColumn: atLeast("large"),
    contentMaxWidth: atLeast("large") ? 1040 : 880,
  };
};
