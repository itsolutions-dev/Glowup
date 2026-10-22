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

/** The side of its anchor a floating card sits on. */
export type PlacementSide = "top" | "bottom" | "left" | "right";

/** A card's top-left corner in window coordinates, and the side it ended up on. */
export interface SidePlacement {
  left: number;
  top: number;
  side: PlacementSide;
}

const OPPOSITE: Record<PlacementSide, PlacementSide> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

/**
 * Places a card of `card` size on one `side` of `anchor`, `gap` away and
 * centred along it. When that side has no room the card goes to the opposite
 * one if that fits, and stays on the asked side if neither does; either way it
 * slides back inside the window's `margin`s. All coordinates are the window's.
 */
export const placeOnSide = (
  anchor: AnchorRect,
  card: PlacementSize,
  window: PlacementSize,
  side: PlacementSide,
  margin: number = 8,
  gap: number = 8,
): SidePlacement => {
  const room: Record<PlacementSide, number> = {
    top: anchor.y - margin,
    bottom: window.height - (anchor.y + anchor.height) - margin,
    left: anchor.x - margin,
    right: window.width - (anchor.x + anchor.width) - margin,
  };
  const need =
    (side === "top" || side === "bottom" ? card.height : card.width) + gap;
  const used =
    room[side] >= need || room[OPPOSITE[side]] < need ? side : OPPOSITE[side];

  const centreX = anchor.x + (anchor.width - card.width) / 2;
  const centreY = anchor.y + (anchor.height - card.height) / 2;
  const raw = {
    top: { left: centreX, top: anchor.y - gap - card.height },
    bottom: { left: centreX, top: anchor.y + anchor.height + gap },
    left: { left: anchor.x - gap - card.width, top: centreY },
    right: { left: anchor.x + anchor.width + gap, top: centreY },
  }[used];

  return {
    left: Math.max(
      margin,
      Math.min(raw.left, window.width - card.width - margin),
    ),
    top: Math.max(
      margin,
      Math.min(raw.top, window.height - card.height - margin),
    ),
    side: used,
  };
};
