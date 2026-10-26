// The arithmetic of zooming, apart from the gesture that asks for it: where the buttons stop, how far two
// fingers moved, and where the page has to be scrolled so that what was under the fingers stays there.

/** Where the zoom buttons stop. */
export const ZOOMS = [1, 1.25, 1.5, 2, 3];
export const MIN_ZOOM = ZOOMS[0];
/** Past this the drawing is capped by the width the viewer asks for (see `MAX_RENDER_WIDTH`) and would only stretch. */
export const MAX_ZOOM = ZOOMS[ZOOMS.length - 1];

/** The gap under each page: the one length in the list that a change of zoom does not scale. */
export const GAP = 12;

const EPSILON = 1e-6;

export const clampZoom = (zoom: number) =>
  Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));

/** The next button stop above (`1`) or below (`-1`) the zoom, wherever a pinch left it. */
export const stepZoom = (zoom: number, direction: 1 | -1) =>
  direction > 0
    ? (ZOOMS.find((z) => z > zoom + EPSILON) ?? MAX_ZOOM)
    : ([...ZOOMS].reverse().find((z) => z < zoom - EPSILON) ?? MIN_ZOOM);

export type TouchPoint = { pageX: number; pageY: number };

/** The distance between two fingers. */
export const span = (a: TouchPoint, b: TouchPoint) =>
  Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY);

/** The point between two fingers. */
export const middle = (a: TouchPoint, b: TouchPoint) => ({
  x: (a.pageX + b.pageX) / 2,
  y: (a.pageY + b.pageY) / 2,
});

/**
 * The scale to show while the fingers are down: the fingers' ratio, held so that the zoom it leads to stays between
 * the limits (past them the page stops growing under the fingers instead of springing back when they lift).
 */
export const liveScale = (zoom: number, ratio: number) =>
  clampZoom(zoom * ratio) / zoom;

/**
 * A scale about the centre of a box, with the point `focus` held still: the translation to apply with it.
 * Every point p lands on `centre + translation + scale * (p - centre)`, and `focus` must land on itself.
 */
export const holdFocus = (focus: number, centre: number, scale: number) =>
  (focus - centre) * (1 - scale);

/** The scroll offset after content grew by `ratio` that keeps the point `focus` pixels from the edge where it was. */
export const keepFocus = (offset: number, focus: number, ratio: number) =>
  Math.max(0, (offset + focus) * ratio - focus);

export type PageLayout = { offsets: number[]; lengths: number[] };

/**
 * Where a vertical position in the list lands once the pages are laid out at another width: the same place on the same
 * page (its height changes, the gap between pages does not). Above the first page the position stays.
 */
export const mapOffset = (
  from: PageLayout,
  to: PageLayout,
  gap: number,
  y: number,
) => {
  let index = -1;
  for (let i = 0; i < from.offsets.length; i += 1) {
    if (from.offsets[i] <= y) index = i;
    else break;
  }
  if (index < 0 || index >= to.offsets.length) return y;
  const fromHeight = from.lengths[index] - gap;
  const toHeight = to.lengths[index] - gap;
  const into = y - from.offsets[index];
  return (
    to.offsets[index] +
    (into <= fromHeight
      ? (fromHeight > 0 ? into / fromHeight : 0) * toHeight
      : toHeight + (into - fromHeight))
  );
};
