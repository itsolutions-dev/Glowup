import { useMemo } from "react";

import { useWindowWidth } from "../components/internal/useWindowWidth";

/**
 * Material 3 window size classes: the width, in dp, where each one starts.
 * https://m3.material.io/foundations/layout/applying-layout/window-size-classes
 */
export const SIZE_CLASSES = {
  compact: 0,
  medium: 600,
  expanded: 840,
  large: 1200,
  extraLarge: 1600,
} as const;

export type SizeClass = keyof typeof SIZE_CLASSES;

/** Where each size class starts; pass a partial one to `useBreakpoint`. */
export type Breakpoints = Record<SizeClass, number>;

const ORDER: SizeClass[] = [
  "compact",
  "medium",
  "expanded",
  "large",
  "extraLarge",
];

/** The size class of a window `width` dp wide. */
export const sizeClassFor = (
  width: number,
  breakpoints: Breakpoints = SIZE_CLASSES,
): SizeClass => {
  let match: SizeClass = "compact";
  for (const name of ORDER) if (width >= breakpoints[name]) match = name;
  return match;
};

export interface BreakpointInfo {
  /** The window width in dp. */
  width: number;
  sizeClass: SizeClass;
  /** True from `size` up: `atLeast("expanded")` is true on large windows too. */
  atLeast: (size: SizeClass) => boolean;
}

/**
 * The window's size class, following the window live. Defaults to Material 3's
 * thresholds; an app with its own (a desktop layout that starts at 1300) passes
 * the ones it wants to change. Safe to prerender: while a static page hydrates
 * the width is 0, so the class is `compact`, then the real one right after.
 */
export const useBreakpoint = (
  overrides?: Partial<Breakpoints>,
): BreakpointInfo => {
  const width = useWindowWidth();
  // Compared by value: an inline `{ large: 1300 }` is a new object every render.
  const key = overrides ? JSON.stringify(overrides) : "";
  return useMemo(() => {
    const breakpoints: Breakpoints = { ...SIZE_CLASSES, ...overrides };
    return {
      width,
      sizeClass: sizeClassFor(width, breakpoints),
      atLeast: (size) => width >= breakpoints[size],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, key]);
};

/**
 * A value that depends on the window's size class: the one set for the
 * current class, or else for the largest class below it (mobile first, like
 * `Grid`). `fallback` is what a window smaller than every class set gets.
 *
 * ```ts
 * const columns = useBreakpointValue({ compact: 1, medium: 2, large: 4 }, 1);
 * ```
 */
export function useBreakpointValue<T>(
  values: Partial<Record<SizeClass, T>>,
  fallback: T,
): T;
export function useBreakpointValue<T>(
  values: Partial<Record<SizeClass, T>>,
): T | undefined;
export function useBreakpointValue<T>(
  values: Partial<Record<SizeClass, T>>,
  fallback?: T,
): T | undefined {
  const { sizeClass } = useBreakpoint();
  for (let i = ORDER.indexOf(sizeClass); i >= 0; i--) {
    const value = values[ORDER[i]];
    if (value !== undefined) return value;
  }
  return fallback;
}
