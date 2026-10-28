// The grid maths of the layout editor: snapping, collisions, finding room.
// Free placement with gaps (spec §11.3, §16 Q3): what an item lands on is
// pushed down, and nothing ever moves up to fill a hole.

import type { GridPlacement, GridSettings } from "./document";

export interface Placed extends GridPlacement {
  id: string;
}

export const overlaps = (a: GridPlacement, b: GridPlacement): boolean =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/**
 * The cell under a preview's top-left corner (a drop's `over.rect`), inside
 * the columns for an item `size.w` wide. A column with its gap is
 * `(zoneWidth + gap) / columns` wide, a row with its gap `rowHeight + gap`.
 */
export const snapCell = (
  rect: { x: number; y: number },
  zoneWidth: number,
  grid: GridSettings,
  size: { w: number; h: number },
): { x: number; y: number } => {
  const pitchX = (zoneWidth + grid.gap) / grid.columns;
  const pitchY = grid.rowHeight + grid.gap;
  return {
    x: Math.min(
      Math.max(0, Math.round(rect.x / pitchX)),
      Math.max(0, grid.columns - size.w),
    ),
    y: Math.max(0, Math.round(rect.y / pitchY)),
  };
};

/**
 * After the item `fixedId` was placed: every item it overlaps moves down to
 * just below it, keeping its column, and whatever that one now overlaps moves
 * the same way, along the chain. Nothing moves up. Same order out as in.
 */
export const pushDown = <T extends Placed>(
  items: T[],
  fixedId: string,
): T[] => {
  const out = items.map((item) => ({ ...item }));
  const fixed = out.find((item) => item.id === fixedId);
  if (!fixed) return out;
  const queue: T[] = [fixed];
  while (queue.length > 0) {
    const taken = queue.shift() as T;
    const others = out
      .filter((item) => item.id !== taken.id && item.id !== fixedId)
      .sort((a, b) => a.y - b.y || a.x - b.x);
    for (const other of others) {
      if (overlaps(other, taken)) {
        other.y = taken.y + taken.h;
        queue.push(other);
      }
    }
  }
  return out;
};

/**
 * The first cell, row by row from `fromRow` and then left to right, where an
 * item of `size` overlaps nothing.
 */
export const firstFreeCell = (
  items: GridPlacement[],
  size: { w: number; h: number },
  columns: number,
  fromRow = 0,
): { x: number; y: number } => {
  const w = Math.min(size.w, columns);
  for (let y = fromRow; ; y++) {
    for (let x = 0; x + w <= columns; x++) {
      const cell = { x, y, w, h: size.h };
      if (!items.some((item) => overlaps(item, cell))) return { x, y };
    }
  }
};

/** The fewest rows, at least one, whose height holds `height` dp. */
export const rowsFor = (height: number, rowHeight: number, gap: number) =>
  Math.max(1, Math.ceil((height + gap) / (rowHeight + gap)));

/** How far the items reach: the rightmost column edge and the bottom row edge. */
export const extent = (
  items: GridPlacement[],
): { columns: number; rows: number } => ({
  columns: items.reduce((most, item) => Math.max(most, item.x + item.w), 0),
  rows: items.reduce((most, item) => Math.max(most, item.y + item.h), 0),
});
