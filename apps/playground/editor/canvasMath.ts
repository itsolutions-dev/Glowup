// The canvas's grid maths that are not edits: where a drop lands, how far a
// resize handle reaches, how many rows the page shows. Pure, like the rest of
// the model; the library types are imported as types only.

import type { DragItem, DropTarget } from "@its/glowup-ui";
import {
  findNode,
  type GridPlacement,
  type GridSettings,
  type LayoutDocument,
  type LayoutNode,
  type NodeId,
  type Slot,
} from "./document";
import { extent, snapCell } from "./engine";
import { entryFor } from "./manifest";
import {
  canPlace,
  insertNode,
  moveNode,
  slotColumns,
  slotKey,
  type Destination,
} from "./operations";

/** A resize handle: an edge, or the corner of two. */
export type Handle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

/** What an edit box carries as it is dragged. */
export interface NodeDragData {
  kind: "node";
  type: string;
}

/** What a palette entry carries as it is dragged. */
export interface NewDragData {
  kind: "new";
  type: string;
}

/**
 * What a zone carries: a grid (the page, a container's grid) places by cell,
 * a flow container by index, a tab on its panel's first free cell.
 */
export interface ZoneData {
  kind: "grid" | "flow" | "tab";
  slot: Slot;
}

/** What is dragged: a node of the document, or a new component from the palette. */
export type DragSource =
  { kind: "node"; id: NodeId } | { kind: "new"; type: string };

export interface DropPlan {
  source: DragSource;
  dest: Destination;
}

const ZONES = ["grid", "flow", "tab"];
const isZone = (data: unknown): data is ZoneData =>
  ZONES.includes((data as ZoneData | undefined)?.kind ?? "");

/** The dragged thing, its type and, for a node, the node; null for an unknown one. */
const sourceOf = (
  doc: LayoutDocument,
  active: DragItem,
): { source: DragSource; type: string; node?: LayoutNode } | null => {
  const data = active.data as NodeDragData | NewDragData | undefined;
  if (data?.kind === "new") {
    return entryFor(data.type)
      ? { source: { kind: "new", type: data.type }, type: data.type }
      : null;
  }
  const node = findNode(doc, active.id);
  return node
    ? { source: { kind: "node", id: node.id }, type: node.type, node }
    : null;
};

/**
 * Where the dragged thing lands: on a grid, the cell under its preview's
 * top-left corner; in a flow, the drag system's insertion index; on a tab, its
 * panel. Null when it is over no zone that takes it.
 */
export const dropTarget = (
  doc: LayoutDocument,
  active: DragItem,
  over: DropTarget | null,
): DropPlan | null => {
  if (!over || !isZone(over.data)) return null;
  const from = sourceOf(doc, active);
  const { kind, slot } = over.data;
  if (!from || !canPlace(doc, from.type, slot, from.node?.id)) return null;
  if (kind === "flow") {
    return { source: from.source, dest: { slot, index: over.index } };
  }
  if (kind === "tab") return { source: from.source, dest: { slot, index: 0 } };
  const columns = slotColumns(doc, slot);
  const size = from.node?.layout ?? entryFor(from.type)?.defaultSize;
  if (columns === null || !size) return null;
  const fitted = { w: Math.min(size.w, columns), h: size.h };
  const cell = snapCell(
    over.rect,
    over.zone.width,
    { ...doc.grid, columns },
    fitted,
  );
  return { source: from.source, dest: { slot, cell } };
};

/** The document after the drop, and the id of the node it placed ("" when refused). */
export const applyPlan = (
  doc: LayoutDocument,
  { source, dest }: DropPlan,
): { doc: LayoutDocument; id: NodeId } =>
  source.kind === "node"
    ? { doc: moveNode(doc, source.id, dest), id: source.id }
    : insertNode(doc, source.type, dest);

/** One string per landing place: a drag re-renders only when it changes. */
export const targetKey = (plan: DropPlan | null): string | null => {
  if (!plan) return null;
  const { source, dest } = plan;
  const who = source.kind === "node" ? source.id : `new:${source.type}`;
  const where =
    "cell" in dest ? `:${dest.cell.x},${dest.cell.y}` : `#${dest.index}`;
  return `${who}@${slotKey(dest.slot)}${where}`;
};

/** The panel the editor shows for a TabbedPanel: the one opened, never past the last. */
export const shownTab = (
  node: LayoutNode,
  tabs: Record<NodeId, number>,
): number =>
  Math.max(0, Math.min(tabs[node.id] ?? 0, (node.tabs?.length ?? 1) - 1));

/**
 * Where a tap on a palette entry adds `type`: into the selected container when
 * it takes the type (a grid's or the shown panel's first free cell, the end of
 * a flow), otherwise at the page's first free cell.
 */
export const addTarget = (
  doc: LayoutDocument,
  type: string,
  selected: NodeId | null,
  tabs: Record<NodeId, number>,
): Destination => {
  const node = selected ? findNode(doc, selected) : undefined;
  const kind = node && entryFor(node.type)?.kind;
  const slot: Slot | null = !node
    ? null
    : kind === "grid" || kind === "flow"
      ? { kind: "children", parent: node.id }
      : kind === "tabs"
        ? { kind: "tab", parent: node.id, tab: shownTab(node, tabs) }
        : null;
  if (!node || !slot || !canPlace(doc, type, slot)) {
    return { slot: { kind: "page" }, index: 0 };
  }
  return { slot, index: kind === "flow" ? (node.children?.length ?? 0) : 0 };
};

/** A column with its gap, and a row with its gap, in dp. */
export const cellPitch = (
  zoneWidth: number,
  columns: number,
  grid: GridSettings,
) => ({
  x: (zoneWidth + grid.gap) / columns,
  y: grid.rowHeight + grid.gap,
});

/**
 * The placement a handle dragged by `dx`, `dy` asks for, in whole cells.
 * Unclamped: `placeNode` keeps it inside the grid and above the minimum size.
 */
export const resizePlacement = (
  start: GridPlacement,
  handle: Handle,
  dx: number,
  dy: number,
  pitch: { x: number; y: number },
): GridPlacement => {
  const dc = Math.round(dx / pitch.x);
  const dr = Math.round(dy / pitch.y);
  const next = { ...start };
  if (handle.includes("e")) next.w += dc;
  if (handle.includes("w")) {
    next.x += dc;
    next.w -= dc;
  }
  if (handle.includes("s")) next.h += dr;
  if (handle.includes("n")) {
    next.y += dr;
    next.h -= dr;
  }
  return next;
};

/** The page's rows: down to its lowest item, four more while dragging. */
export const pageRows = (doc: LayoutDocument, dragging: boolean): number =>
  Math.max(
    4,
    extent(doc.items.flatMap((n) => (n.layout ? [n.layout] : []))).rows +
      (dragging ? 4 : 0),
  );

/**
 * Where a box sits on its grid: the arithmetic of the library's GridLayout,
 * so the edit layer's boxes land on the rendered items. The edit layer cannot
 * use GridLayout itself: its items scroll, and a scroller would clip the
 * selection chrome drawn above a box.
 */
export const boxPlacement = (
  item: GridPlacement,
  columns: number,
  rowHeight: number,
  gap: number,
) => {
  const after = columns - item.x - item.w;
  return {
    position: "absolute" as const,
    left: `${(item.x / columns) * 100}%` as `${number}%`,
    marginLeft: (item.x * gap) / columns,
    right: `${(after / columns) * 100}%` as `${number}%`,
    marginRight: (after * gap) / columns,
    top: item.y * (rowHeight + gap),
    height: item.h * rowHeight + (item.h - 1) * gap,
  };
};
