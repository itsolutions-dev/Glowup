// The geometry behind drag and drop, kept free of React and of the platform so
// it can be tested on its own. Every rect and point is in window coordinates.

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Point {
  x: number;
  y: number;
}

/** The axis a drop zone lays its items along. */
export type DropOrientation = "vertical" | "horizontal";

/** Thickness of the insertion line, in dp. */
export const INDICATOR = 2;

/** How near a scroll area's top or bottom edge, in dp, the pointer starts it scrolling. */
export const AUTO_SCROLL_EDGE = 48;
/** The fastest auto-scroll, in dp per 16 ms tick. */
export const AUTO_SCROLL_MAX = 16;

/**
 * How far a scroll area scrolls in one tick while the pointer is at `point`:
 * negative near or above its top edge, positive near or below its bottom
 * edge, faster the nearer the edge; 0 elsewhere and beside the area.
 */
export const autoScrollStep = (point: Point, rect: Rect): number => {
  if (point.x < rect.x || point.x >= rect.x + rect.width) return 0;
  const speed = (distance: number) =>
    Math.round(
      AUTO_SCROLL_MAX *
        (1 -
          Math.min(Math.max(distance, 0), AUTO_SCROLL_EDGE) / AUTO_SCROLL_EDGE),
    );
  const top = point.y - rect.y;
  const bottom = rect.y + rect.height - point.y;
  if (top < AUTO_SCROLL_EDGE) return -speed(top);
  if (bottom < AUTO_SCROLL_EDGE) return speed(bottom);
  return 0;
};

export const contains = (rect: Rect, point: Point) =>
  point.x >= rect.x &&
  point.x < rect.x + rect.width &&
  point.y >= rect.y &&
  point.y < rect.y + rect.height;

/**
 * The zone under the point: the most deeply nested one, so a container inside
 * another wins over it, and the smaller one when two are as deep.
 */
export const zoneAt = <Z extends { rect: Rect; depth: number }>(
  zones: Z[],
  point: Point,
): Z | null => {
  let best: Z | null = null;
  for (const zone of zones) {
    if (!contains(zone.rect, point)) continue;
    if (
      !best ||
      zone.depth > best.depth ||
      (zone.depth === best.depth &&
        zone.rect.width * zone.rect.height < best.rect.width * best.rect.height)
    ) {
      best = zone;
    }
  }
  return best;
};

/**
 * Where a drop at the point lands among the items: the number of items whose
 * middle the point has passed along the axis.
 */
export const insertionIndex = (
  items: Rect[],
  point: Point,
  orientation: DropOrientation,
) =>
  items.filter((r) =>
    orientation === "vertical"
      ? point.y > r.y + r.height / 2
      : point.x > r.x + r.width / 2,
  ).length;

/**
 * The insertion line for `index`, relative to the zone: in the middle of the
 * gap between the item before it and the item at it, on the outer edge at
 * either end, as long as the item beside it. Null in an empty zone.
 */
export const indicatorAt = (
  zone: Rect,
  items: Rect[],
  index: number,
  orientation: DropOrientation,
): Rect | null => {
  const vertical = orientation === "vertical";
  const start = (r: Rect) => (vertical ? r.y : r.x);
  const end = (r: Rect) => (vertical ? r.y + r.height : r.x + r.width);
  const sorted = [...items].sort((a, b) => start(a) - start(b));
  const before = sorted[index - 1];
  const after = sorted[index];
  const beside = after ?? before;
  if (!beside) return null;
  const at =
    before && after
      ? (end(before) + start(after)) / 2
      : after
        ? start(after)
        : end(before);
  const line = at - INDICATOR / 2;
  return vertical
    ? {
        x: beside.x - zone.x,
        y: line - zone.y,
        width: beside.width,
        height: INDICATOR,
      }
    : {
        x: line - zone.x,
        y: beside.y - zone.y,
        width: INDICATOR,
        height: beside.height,
      };
};
