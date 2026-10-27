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
  item: GridLayoutItem,
  columns: number,
  rowHeight: number,
  gap: number,
) => {
  const { x, y, w, h } = clampGridItem(item, columns);
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
