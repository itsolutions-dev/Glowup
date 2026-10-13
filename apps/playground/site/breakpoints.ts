import { useSyncExternalStore } from "react";
import { Dimensions } from "react-native";

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

const subscribe = (onChange: () => void) => {
  const subscription = Dimensions.addEventListener("change", onChange);
  return () => subscription.remove();
};
const getWidth = () => Dimensions.get("window").width;
const getHeight = () => Dimensions.get("window").height;
// The prerender has no window: Node reports 0×0, so every exported page is
// rendered compact. Hydration has to start from that same answer, or the
// browser's real width puts a rail where the HTML has a menu button and React
// throws #418 on every route. The server snapshot is that answer; React swaps
// in the real size right after hydrating. Native never hydrates, so it never
// asks for it.
const getServerSize = () => 0;

/**
 * The single responsive hook. Everything that used to compare `width >= 960`
 * by hand asks this instead, so a change of breakpoint is a change in one file.
 */
export const useLayout = (): Layout => {
  const width = useSyncExternalStore(subscribe, getWidth, getServerSize);
  const height = useSyncExternalStore(subscribe, getHeight, getServerSize);
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
