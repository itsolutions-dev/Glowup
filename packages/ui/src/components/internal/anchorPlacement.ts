/** Where a popover sits against its anchor, vertically. */
export type AnchorVertical = "top" | "center" | "bottom";
/** Which edges of the popover and its anchor line up. */
export type AnchorHorizontal = "left" | "center" | "right";

/**
 * Where a popover sits relative to its anchor. `vertical`: `"bottom"` is below
 * the anchor, `"top"` above it, `"center"` centred on it (overlapping).
 * `horizontal`: `"left"` aligns the left edges, `"right"` the right edges,
 * `"center"` the centres.
 */
export interface AnchorPosition {
  vertical: AnchorVertical;
  horizontal: AnchorHorizontal;
}

export interface AnchorRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PlacementSize {
  width: number;
  height: number;
}

/** Where to pin a popover: from `top` or, standing above its anchor, from `bottom`. */
export interface AnchoredPlacement {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
}

/**
 * Places a popover of `popover` size against `anchor` as `position` asks,
 * inside a `window` with a `margin` kept clear on every side. `"bottom"` and
 * `"top"` flip to the other side when the preferred one has no room; the
 * horizontal and `"center"` placements slide back inside the margins.
 */
export const placeAnchored = (
  anchor: AnchorRect,
  popover: PlacementSize,
  window: PlacementSize,
  position: AnchorPosition = { vertical: "bottom", horizontal: "left" },
  margin: number = 16,
  gap: number = 8,
): AnchoredPlacement => {
  const width = Math.min(popover.width, window.width - margin * 2);

  const clampLeft = (left: number) =>
    Math.max(margin, Math.min(left, window.width - width - margin));
  const left = clampLeft(
    position.horizontal === "right"
      ? anchor.x + anchor.width - width
      : position.horizontal === "center"
        ? anchor.x + (anchor.width - width) / 2
        : anchor.x,
  );

  const below = anchor.y + anchor.height + gap;
  const fitsBelow = below + popover.height <= window.height - margin;
  const aboveEdge = window.height - anchor.y + gap;
  const fitsAbove = anchor.y - gap - popover.height >= margin;

  switch (position.vertical) {
    case "center": {
      const centred = anchor.y + (anchor.height - popover.height) / 2;
      const top = Math.max(
        margin,
        Math.min(centred, window.height - popover.height - margin),
      );
      return { top, left, width };
    }
    case "top":
      // Above if it fits; otherwise below, however tight.
      return fitsAbove
        ? { bottom: aboveEdge, left, width }
        : { top: below, left, width };
    case "bottom":
    default:
      return fitsBelow
        ? { top: below, left, width }
        : { bottom: aboveEdge, left, width };
  }
};
