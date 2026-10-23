// Sizes of the read-only grid, in pixels. One density for now.
export const ROW_HEIGHT = 32;
export const HEADER_HEIGHT = 36;
/** Left indent per depth level of a row label. */
export const INDENT = 16;
export const CHEVRON_WIDTH = 32;
export const LABEL_WIDTH = 240;
export const CELL_WIDTH = 120;
/** Height of the scrolling container when the caller gives none. */
export const DEFAULT_HEIGHT = 480;

/** Below this container width the grid uses the narrow sizes. */
export const NARROW_WIDTH = 600;

/**
 * Sizes of the fixed columns and the minimum width of a number column for a container of this
 * width (undefined = not measured yet). A phone is too narrow for 272 px of fixed columns: the
 * label takes about 40% of the width, never less than 112 px nor more than 240.
 */
export const gridSizes = (
  containerWidth?: number,
): { chevron: number; label: number; cell: number } => {
  if (containerWidth === undefined || containerWidth >= NARROW_WIDTH) {
    return { chevron: CHEVRON_WIDTH, label: LABEL_WIDTH, cell: CELL_WIDTH };
  }
  return {
    chevron: 28,
    label: Math.max(
      112,
      Math.min(LABEL_WIDTH, Math.round(containerWidth * 0.4)),
    ),
    cell: 84,
  };
};
