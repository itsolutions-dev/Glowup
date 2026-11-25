// The geometry behind GridLayout, kept free of React and of the platform so it
// can be tested on its own. Cells are in columns (x, w) and rows (y, h);
// everything placed is in dp, or in percent of the grid's width.

/** Where one child sits on the grid: `x` and `w` in columns, `y` and `h` in rows. */
export interface GridLayoutItem {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * The item as the grid can hold it: whole cells, at least one wide and one
 * tall, no wider than the columns, and inside them.
 */
export const clampGridItem = (
  item: GridLayoutItem,
  columns: number,
): GridLayoutItem => {
  const cols = Math.max(1, Math.round(columns));
  const w = Math.min(Math.max(1, Math.round(item.w)), cols);
  return {
    id: item.id,
    x: Math.min(Math.max(0, Math.round(item.x)), cols - w),
    y: Math.max(0, Math.round(item.y)),
    w,
    h: Math.max(1, Math.round(item.h)),
  };
};

const rowsTop = (y: number, rowHeight: number, gap: number) =>
  y * (rowHeight + gap);
const rowsHeight = (h: number, rowHeight: number, gap: number) =>
  h * rowHeight + (h - 1) * gap;

/** The bottom of the lowest item, in dp; 0 for an empty grid. */
export const gridLayoutHeight = (
  layout: GridLayoutItem[],
  rowHeight: number,
  gap: number,
): number =>
  layout.reduce((bottom, item) => {
    const y = Math.max(0, Math.round(item.y));
    const h = Math.max(1, Math.round(item.h));
    return Math.max(
      bottom,
      rowsTop(y, rowHeight, gap) + rowsHeight(h, rowHeight, gap),
    );
  }, 0);

/** The items in reading order: rows top to bottom, then left to right. */
export const gridReadingOrder = (layout: GridLayoutItem[]): GridLayoutItem[] =>
  [...layout].sort((a, b) => a.y - b.y || a.x - b.x);

/**
 * Where an item sits, as styles that need no measured width: its left and
 * right edges in percent of the grid's width plus a dp margin (a column is
 * `(width + gap) / columns` wide with its gap), its top and height in dp. A
 * grid placed this way prerenders at width 0 and reflows by itself.
 */
export const itemPlacement = (
  item: Omit<GridLayoutItem, "id">,
  columns: number,
  rowHeight: number,
  gap: number,
) => {
  const { x, y, w, h } = clampGridItem({ id: "", ...item }, columns);
  const cols = Math.max(1, Math.round(columns));
  const after = cols - x - w;
  return {
    left: `${(x / cols) * 100}%` as `${number}%`,
    marginLeft: (x * gap) / cols,
    right: `${(after / cols) * 100}%` as `${number}%`,
    marginRight: (after * gap) / cols,
    top: rowsTop(y, rowHeight, gap),
    height: rowsHeight(h, rowHeight, gap),
  };
};

// Editing: what a move, a resize or a drop asks of the grid. Moved from the
// playground's layout editor (canvasMath, engine), on GridLayoutItem.

/** A resize handle: an edge, or the corner of two. */
export type GridHandle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

/** Whether two items share a cell. */
export const gridItemsOverlap = (
  a: Omit<GridLayoutItem, "id">,
  b: Omit<GridLayoutItem, "id">,
): boolean =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** A column with its gap, and a row with its gap, in dp, on a grid `width` wide. */
export const gridPitch = (
  width: number,
  columns: number,
  rowHeight: number,
  gap: number,
) => ({ x: (width + gap) / Math.max(1, columns), y: rowHeight + gap });

/**
 * The cell under a dragged preview's top-left corner (a drop's `over.rect`),
 * for an item `size` big: whole cells, inside the columns.
 */
export const gridCellAt = (
  rect: { x: number; y: number },
  pitch: { x: number; y: number },
  columns: number,
  size: { w: number; h: number },
): { x: number; y: number } => ({
  x: Math.min(
    Math.max(0, Math.round(rect.x / pitch.x)),
    Math.max(0, columns - size.w),
  ),
  y: Math.max(0, Math.round(rect.y / pitch.y)),
});

/**
 * The item a handle dragged by `dx`, `dy` asks for, in whole cells, clamped
 * into the grid and to one cell at least; the opposite edge stays put.
 */
export const resizeGridItem = (
  start: GridLayoutItem,
  handle: GridHandle,
  dx: number,
  dy: number,
  pitch: { x: number; y: number },
  columns: number,
): GridLayoutItem => {
  const dc = Math.round(dx / pitch.x);
  const dr = Math.round(dy / pitch.y);
  let { x, y, w, h } = start;
  if (handle.includes("e")) w = Math.min(Math.max(1, w + dc), columns - x);
  if (handle.includes("w")) {
    const left = Math.min(Math.max(0, x + dc), x + w - 1);
    w += x - left;
    x = left;
  }
  if (handle.includes("s")) h = Math.max(1, h + dr);
  if (handle.includes("n")) {
    const top = Math.min(Math.max(0, y + dr), y + h - 1);
    h += y - top;
    y = top;
  }
  return { id: start.id, x, y, w, h };
};

/** Whether `item` can stand where it is: no other item of `layout` under it. */
export const gridItemFits = (
  layout: GridLayoutItem[],
  item: GridLayoutItem,
): boolean =>
  !layout.some(
    (other) => other.id !== item.id && gridItemsOverlap(other, item),
  );

/**
 * The first row at or below `item.y` where it stands clear of every other
 * item: a drop is placed there rather than over what is already placed.
 */
export const gridFreeRow = (
  layout: GridLayoutItem[],
  item: GridLayoutItem,
): number => {
  let y = item.y;
  while (!gridItemFits(layout, { ...item, y })) y += 1;
  return y;
};
