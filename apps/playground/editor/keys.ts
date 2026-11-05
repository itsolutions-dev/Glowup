// The keyboard's grid edits (spec §14), pure: arrows move the selected node
// one cell on its grid, Shift and arrows resize it, both through placeNode, so
// the same rules as dragging apply.

import { findNode, type LayoutDocument, type NodeId } from "./document";
import { placeNode } from "./operations";

export type Arrow = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight";

const STEP: Record<Arrow, [number, number]> = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
};

/** `doc` itself with nothing selected, a node off any grid, or a step placeNode refuses. */
export const nudge = (
  doc: LayoutDocument,
  id: NodeId | null,
  key: Arrow,
  resize: boolean,
): LayoutDocument => {
  const layout = id ? findNode(doc, id)?.layout : undefined;
  if (!id || !layout) return doc;
  const [dx, dy] = STEP[key];
  // Off the grid's left or top edge is no step at all (placeNode would clamp it back).
  if (!resize && (layout.x + dx < 0 || layout.y + dy < 0)) return doc;
  return placeNode(
    doc,
    id,
    resize
      ? { ...layout, w: layout.w + dx, h: layout.h + dy }
      : { ...layout, x: layout.x + dx, y: layout.y + dy },
  );
};
