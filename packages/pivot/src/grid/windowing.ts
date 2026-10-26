/**
 * The rows to mount in a scrolling list of rows of one fixed height: those in view plus a few
 * above and below (`overscan`, five by default). `end` is exclusive.
 */
export const visibleRange = ({
  scrollTop,
  viewportHeight,
  rowHeight,
  count,
  overscan = 5,
}: {
  scrollTop: number;
  viewportHeight: number;
  rowHeight: number;
  count: number;
  overscan?: number;
}): { start: number; end: number } => {
  if (count <= 0 || viewportHeight <= 0 || rowHeight <= 0) {
    return { start: 0, end: 0 };
  }
  const first = Math.min(count, Math.max(0, Math.floor(scrollTop / rowHeight)));
  const last = Math.ceil((scrollTop + viewportHeight) / rowHeight);
  return {
    start: Math.max(0, first - overscan),
    end: Math.min(count, last + overscan),
  };
};
