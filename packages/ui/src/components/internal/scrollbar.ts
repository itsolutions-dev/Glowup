// The arithmetic behind ScrollArea's scrollbars, kept free of React and of the
// platform so the thumb geometry can be tested on its own. Every function works
// along one axis: `content` and `viewport` are the scrollable length and the
// visible length, `scroll` the offset of the visible window, `track` the length
// the thumb can travel along. All in dp.

/** When the scrollbars of a `ScrollArea` are visible. */
export type ScrollbarType = "auto" | "always" | "scroll" | "hover";

/** The three numbers of one scroll axis. */
export interface AxisMetrics {
  /** Offset of the visible window from the start of the content. */
  scroll: number;
  /** Length of the visible window. */
  viewport: number;
  /** Length of the whole content. */
  content: number;
}

export interface ThumbGeometry {
  /** The length of the track the thumb travels along. */
  track: number;
  /** The shortest the thumb may get, so a long list keeps a grabbable thumb. */
  minThumb?: number;
}

export interface ThumbMetrics {
  /** Thumb length along the track. */
  size: number;
  /** Distance from the start of the track to the start of the thumb. */
  offset: number;
}

/** Shortest thumb, in dp. */
export const MIN_THUMB = 24;

/** Share of the viewport a click on the track scrolls, like a browser's page step. */
export const PAGE_RATIO = 0.875;

/** Layout and content sizes are rounded apart on some platforms; 1dp is not overflow. */
const EPSILON = 1;

export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** The furthest the content can scroll: 0 when it fits. */
export const maxScroll = ({
  content,
  viewport,
}: Pick<AxisMetrics, "content" | "viewport">) =>
  Math.max(0, content - viewport);

/** Whether there is anything to scroll. A viewport not measured yet (0) has not overflowed. */
export const isOverflowing = ({
  content,
  viewport,
}: Pick<AxisMetrics, "content" | "viewport">) =>
  viewport > 0 && content - viewport > EPSILON;

/**
 * The thumb's length and position. The length is the track scaled by how much
 * of the content is visible (never below `minThumb`); the position follows the
 * scroll offset across the room the thumb has left. With nothing to scroll the
 * thumb fills the track.
 */
export const thumbMetrics = (
  metrics: AxisMetrics,
  { track, minThumb = MIN_THUMB }: ThumbGeometry,
): ThumbMetrics => {
  if (track <= 0) return { size: 0, offset: 0 };
  const max = maxScroll(metrics);
  if (max <= 0 || metrics.viewport <= 0) return { size: track, offset: 0 };
  const size = clamp(
    (metrics.viewport / metrics.content) * track,
    Math.min(minThumb, track),
    track,
  );
  return {
    size,
    offset: (track - size) * clamp(metrics.scroll / max, 0, 1),
  };
};

/**
 * The scroll offset for a thumb dragged `delta` dp from where it was when the
 * drag began (`startScroll`). The inverse of `thumbMetrics`' offset: one dp of
 * thumb travel is `max / free` dp of content, where `free` is the track the
 * thumb does not cover.
 */
export const scrollFromDrag = (
  metrics: Pick<AxisMetrics, "content" | "viewport">,
  geometry: ThumbGeometry,
  startScroll: number,
  delta: number,
) => {
  const max = maxScroll(metrics);
  const { size } = thumbMetrics({ ...metrics, scroll: startScroll }, geometry);
  const free = geometry.track - size;
  if (max <= 0 || free <= 0) return clamp(startScroll, 0, max);
  return clamp(startScroll + (delta * max) / free, 0, max);
};

/**
 * The scroll offset after a press at `point` (dp from the start of the track):
 * one page back when it lands before the thumb, one page on when after it, and
 * unchanged on the thumb itself.
 */
export const scrollFromTrackPress = (
  metrics: AxisMetrics,
  geometry: ThumbGeometry,
  point: number,
) => {
  const max = maxScroll(metrics);
  const { size, offset } = thumbMetrics(metrics, geometry);
  const page = metrics.viewport * PAGE_RATIO;
  if (point < offset) return clamp(metrics.scroll - page, 0, max);
  if (point > offset + size) return clamp(metrics.scroll + page, 0, max);
  return clamp(metrics.scroll, 0, max);
};

/**
 * Whether a scrollbar is laid out at all: always for `always`, otherwise only
 * while the content overflows.
 */
export const hasScrollbar = (type: ScrollbarType, overflowing: boolean) =>
  type === "always" || overflowing;

/**
 * Whether a scrollbar is visible right now. `engaged` is true while the user is
 * scrolling or dragging, and for the hide delay after; for `hover` it is also
 * true while the pointer is over the area.
 */
export const scrollbarShown = (
  type: ScrollbarType,
  overflowing: boolean,
  engaged: boolean,
) => {
  if (type === "always") return true;
  if (!overflowing) return false;
  return type === "auto" || engaged;
};
