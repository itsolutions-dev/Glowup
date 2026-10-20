export interface Rect {
  top: number;
  bottom: number;
  left: number;
}

export interface Size {
  width: number;
  height: number;
}

/** Where a fixed-position surface goes: pinned by one edge, grown from there. */
export interface Placement {
  left: number;
  /** Set when the surface hangs from a line near its anchor. */
  top?: number;
  /** Set when it stands above its anchor, so it grows upward. */
  bottom?: number;
  /** The room left on that side; anything taller scrolls rather than moves. */
  maxHeight: number;
}

/**
 * Docks a surface of `size` to `anchor`: below it if there is room, else above
 * it, else (a short window, a field mid-page) over it, as low as the window
 * lets the whole surface show.
 *
 * `size` is a plan, not a live measurement: the placement depends on nothing
 * else, and the edge it pins stays put. A surface that later gets taller or
 * shorter (a picker moving from the date to the time) therefore grows or
 * shrinks away from that edge instead of jumping across the page. Plan with
 * the tallest the surface gets.
 */
export const placeBesideAnchor = (
  anchor: Rect,
  view: Size,
  size: Size,
  gap: number,
  margin: number,
): Placement => {
  const below = view.height - anchor.bottom - gap - margin;
  const above = anchor.top - gap - margin;
  const left = Math.min(
    Math.max(margin, anchor.left),
    Math.max(margin, view.width - size.width - margin),
  );

  if (below >= size.height) {
    return { left, top: anchor.bottom + gap, maxHeight: below };
  }
  if (above >= size.height) {
    return {
      left,
      bottom: view.height - anchor.top + gap,
      maxHeight: above,
    };
  }
  const top = Math.max(
    margin,
    Math.min(anchor.bottom + gap, view.height - size.height - margin),
  );
  return { left, top, maxHeight: view.height - top - margin };
};
