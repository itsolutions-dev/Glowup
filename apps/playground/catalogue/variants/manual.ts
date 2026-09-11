import type { Variant } from "./types";

/**
 * Variants written by hand, for the components whose authored preview draws raw
 * SVG — the generator rewrites layout primitives, not `<svg>` trees, and a
 * half-converted drawing is worse than none.
 *
 * Anything here wins over the generated entry for the same component.
 */
export const MANUAL_VARIANTS: Record<string, Variant[]> = {};
