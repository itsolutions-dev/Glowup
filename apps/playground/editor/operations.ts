// Every edit the layout editor makes, as a function from a document to a new
// one (spec §11.3–11.7). A refused edit returns the same document, so the
// caller can tell. Each structural edit ends with `normalizeFields`, so form
// bindings follow the fields wherever they go.

import {
  findNode,
  newId,
  slotNodes,
  slotOf,
  updateNode,
  type GridPlacement,
  type LayoutDocument,
  type LayoutNode,
  type NodeId,
  type Slot,
} from "./document";
import { extent, pushDown, rowsFor } from "./engine";
import { normalizeFields } from "./forms";
import { acceptsChild, entryFor, MANIFEST } from "./manifest";

/** A grid slot takes a cell; a flow container takes an index. */
export type Destination =
  | { slot: Slot; cell: { x: number; y: number } }
  | { slot: Slot; index: number };

/** The slot's grid columns, or null for a flow container (or a slot that does not exist). */
export const slotColumns = (doc: LayoutDocument, slot: Slot): number | null => {
  if (slot.kind === "page") return doc.grid.columns;
  const parent = findNode(doc, slot.parent);
  if (!parent) return null;
  if (slot.kind === "tab") return parent.tabs?.[slot.tab]?.columns ?? null;
  return entryFor(parent.type)?.kind === "grid"
    ? (parent.columns ?? null)
    : null;
};

const slotExists = (doc: LayoutDocument, slot: Slot) => {
  if (slot.kind === "page") return true;
  const parent = findNode(doc, slot.parent);
  if (!parent) return false;
  return slot.kind === "tab"
    ? !!parent.tabs?.[slot.tab]
    : Array.isArray(parent.children);
};

const setSlotNodes = (
  doc: LayoutDocument,
  slot: Slot,
  nodes: LayoutNode[],
): LayoutDocument => {
  if (slot.kind === "page") return { ...doc, items: nodes };
  if (slot.kind === "children") {
    return updateNode(doc, slot.parent, (node) => ({
      ...node,
      children: nodes,
    }));
  }
  return updateNode(doc, slot.parent, (node) => ({
    ...node,
    tabs: node.tabs?.map((panel, i) =>
      i === slot.tab ? { ...panel, children: nodes } : panel,
    ),
  }));
};

const subtree = (node: LayoutNode): LayoutNode[] => [
  node,
  ...(node.children ?? []).flatMap(subtree),
  ...(node.tabs ?? []).flatMap((panel) => panel.children.flatMap(subtree)),
];

/** Inside a Form: the slot's parent is a Form or sits in one. */
const insideForm = (doc: LayoutDocument, slot: Slot): boolean => {
  let current: Slot | null = slot;
  while (current && current.kind !== "page") {
    const parent = findNode(doc, current.parent);
    if (entryFor(parent?.type ?? "")?.form) return true;
    current = slotOf(doc, current.parent);
  }
  return false;
};

/** How wide a container's own grids reach: it cannot be narrower. */
const contentColumns = (node: LayoutNode): number =>
  Math.max(
    extent((node.children ?? []).flatMap((c) => (c.layout ? [c.layout] : [])))
      .columns,
    ...(node.tabs ?? []).map(
      (panel) =>
        extent(panel.children.flatMap((c) => (c.layout ? [c.layout] : [])))
          .columns,
    ),
    0,
  );

/**
 * Whether a node of `type` (or the node `movingId`, with its subtree) may go
 * in `slot`: the slot exists and accepts it, it is not inside the moving node,
 * no Form lands inside a Form, and a container fits the slot's columns.
 */
export const canPlace = (
  doc: LayoutDocument,
  type: string,
  slot: Slot,
  movingId?: NodeId,
): boolean => {
  if (!MANIFEST[type] || !slotExists(doc, slot)) return false;
  if (slot.kind !== "page") {
    const parent = findNode(doc, slot.parent);
    if (!parent || !acceptsChild(parent.type, type)) return false;
  }
  const moving = movingId ? findNode(doc, movingId) : null;
  const nodes = moving ? subtree(moving) : [];
  if (slot.kind !== "page" && nodes.some((n) => n.id === slot.parent)) {
    return false;
  }
  const bringsForm = moving
    ? nodes.some((n) => entryFor(n.type)?.form)
    : !!MANIFEST[type].form;
  if (bringsForm && insideForm(doc, slot)) return false;
  const columns = slotColumns(doc, slot);
  if (moving && columns !== null && contentColumns(moving) > columns) {
    return false;
  }
  return true;
};

/** A container's own grids follow its width. */
const withWidth = (node: LayoutNode, layout: GridPlacement): LayoutNode => {
  const kind = entryFor(node.type)?.kind;
  return {
    ...node,
    layout,
    ...(kind === "grid" ? { columns: layout.w } : {}),
    ...(node.tabs
      ? { tabs: node.tabs.map((panel) => ({ ...panel, columns: layout.w })) }
      : {}),
  };
};

/** The slot's nodes with `node` at `layout`, the rest pushed down below it. */
const placeIn = (
  nodes: LayoutNode[],
  node: LayoutNode,
  layout: GridPlacement,
): LayoutNode[] => {
  const placed = withWidth(node, layout);
  const list = [...nodes.filter((n) => n.id !== node.id), placed];
  const moved = pushDown(
    list.map((n) => ({ id: n.id, ...(n.layout as GridPlacement) })),
    node.id,
  );
  return list.map((n, i) =>
    n.layout && moved[i].y !== n.layout.y
      ? { ...n, layout: { ...n.layout, y: moved[i].y } }
      : n,
  );
};

/** A layout for `size` at `cell`, cut to the columns. */
const fit = (
  cell: { x: number; y: number },
  size: { w: number; h: number },
  columns: number,
): GridPlacement => {
  const w = Math.min(size.w, columns);
  return {
    x: Math.min(Math.max(0, cell.x), columns - w),
    y: Math.max(0, cell.y),
    w,
    h: size.h,
  };
};

const create = (doc: LayoutDocument, type: string): LayoutNode => {
  const entry = MANIFEST[type];
  const node: LayoutNode = {
    id: newId(doc),
    type,
    props: structuredClone(entry.defaultProps),
  };
  if (entry.defaultText !== undefined) node.text = entry.defaultText;
  if (entry.kind === "grid") {
    node.columns = entry.defaultSize.w;
    node.children = [];
  }
  if (entry.kind === "flow") node.children = [];
  if (entry.kind === "tabs") {
    node.tabs = ["Tab 1", "Tab 2"].map((label) => ({
      label,
      columns: entry.defaultSize.w,
      children: [],
    }));
  }
  return node;
};

/** Puts `node` (without a slot yet) at `dest` in `doc`. */
const put = (
  doc: LayoutDocument,
  node: LayoutNode,
  dest: Destination,
  size: { w: number; h: number },
): LayoutDocument => {
  const nodes = slotNodes(doc, dest.slot);
  const columns = slotColumns(doc, dest.slot);
  if (columns !== null && "cell" in dest) {
    return setSlotNodes(
      doc,
      dest.slot,
      placeIn(nodes, node, fit(dest.cell, size, columns)),
    );
  }
  const { layout: _dropped, ...flowNode } = node;
  const index = "index" in dest ? dest.index : nodes.length;
  const next = [...nodes];
  next.splice(Math.max(0, Math.min(index, nodes.length)), 0, flowNode);
  return setSlotNodes(doc, dest.slot, next);
};

export const insertNode = (
  doc: LayoutDocument,
  type: string,
  dest: Destination,
): { doc: LayoutDocument; id: NodeId } => {
  if (!canPlace(doc, type, dest.slot)) return { doc, id: "" };
  const node = create(doc, type);
  const out = put(doc, node, dest, MANIFEST[type].defaultSize);
  return { doc: normalizeFields(out), id: node.id };
};

const without = (doc: LayoutDocument, id: NodeId): LayoutDocument => {
  const slot = slotOf(doc, id);
  if (!slot) return doc;
  return setSlotNodes(
    doc,
    slot,
    slotNodes(doc, slot).filter((n) => n.id !== id),
  );
};

export const moveNode = (
  doc: LayoutDocument,
  id: NodeId,
  dest: Destination,
): LayoutDocument => {
  const node = findNode(doc, id);
  if (!node || !canPlace(doc, node.type, dest.slot, id)) return doc;
  const size = node.layout ?? MANIFEST[node.type].defaultSize;
  return normalizeFields(put(without(doc, id), node, dest, size));
};

export const removeNode = (doc: LayoutDocument, id: NodeId): LayoutDocument =>
  findNode(doc, id) ? normalizeFields(without(doc, id)) : doc;

/** The node's subtree with every id new, counting up from the document's next id. */
const renumber = (doc: LayoutDocument, node: LayoutNode): LayoutNode => {
  let next = Number(newId(doc).slice(1));
  const copy = (n: LayoutNode): LayoutNode => ({
    ...n,
    id: `n${next++}`,
    ...(n.children ? { children: n.children.map(copy) } : {}),
    ...(n.tabs
      ? {
          tabs: n.tabs.map((panel) => ({
            ...panel,
            children: panel.children.map(copy),
          })),
        }
      : {}),
  });
  return copy(node);
};

export const duplicateNode = (
  doc: LayoutDocument,
  id: NodeId,
): { doc: LayoutDocument; id: NodeId } => {
  const node = findNode(doc, id);
  const slot = slotOf(doc, id);
  if (!node || !slot) return { doc, id: "" };
  const copy = renumber(doc, node);
  const nodes = slotNodes(doc, slot);
  let out: LayoutDocument;
  if (node.layout) {
    const { x, y, w, h } = node.layout;
    out = setSlotNodes(doc, slot, placeIn(nodes, copy, { x, y: y + h, w, h }));
  } else {
    const index = nodes.findIndex((n) => n.id === id) + 1;
    out = put(doc, copy, { slot, index }, MANIFEST[node.type].defaultSize);
  }
  return { doc: normalizeFields(out), id: copy.id };
};

/** Merges props; a key set to undefined is removed. */
export const setProps = (
  doc: LayoutDocument,
  id: NodeId,
  props: Record<string, unknown>,
): LayoutDocument =>
  updateNode(doc, id, (node) => {
    const merged: Record<string, unknown> = { ...node.props, ...props };
    for (const [key, value] of Object.entries(props)) {
      if (value === undefined) delete merged[key];
    }
    return { ...node, props: merged };
  });

export const setText = (
  doc: LayoutDocument,
  id: NodeId,
  text: string,
): LayoutDocument => updateNode(doc, id, (node) => ({ ...node, text }));

/**
 * Moves or resizes a node within its own grid: whole cells, inside the
 * columns, no smaller than the manifest's `minSize`, a container no narrower
 * than its children reach. What it now covers is pushed down.
 */
export const placeNode = (
  doc: LayoutDocument,
  id: NodeId,
  placement: GridPlacement,
): LayoutDocument => {
  const node = findNode(doc, id);
  const slot = slotOf(doc, id);
  const columns = slot ? slotColumns(doc, slot) : null;
  const entry = entryFor(node?.type ?? "");
  if (!node?.layout || !slot || columns === null || !entry) return doc;
  const minW = Math.max(entry.minSize.w, contentColumns(node));
  const w = Math.min(Math.max(Math.round(placement.w), minW), columns);
  const h = Math.max(Math.round(placement.h), entry.minSize.h);
  const layout = fit(
    { x: Math.round(placement.x), y: Math.round(placement.y) },
    { w, h },
    columns,
  );
  return setSlotNodes(doc, slot, placeIn(slotNodes(doc, slot), node, layout));
};

/** Grows a node on a grid to hold `contentHeight` dp; never shrinks it. */
export const growToFit = (
  doc: LayoutDocument,
  id: NodeId,
  contentHeight: number,
): LayoutDocument => {
  const node = findNode(doc, id);
  const slot = slotOf(doc, id);
  if (!node?.layout || !slot) return doc;
  const rows = rowsFor(contentHeight, doc.grid.rowHeight, doc.grid.gap);
  if (rows <= node.layout.h) return doc;
  return setSlotNodes(
    doc,
    slot,
    placeIn(slotNodes(doc, slot), node, { ...node.layout, h: rows }),
  );
};

const withTabs = (
  doc: LayoutDocument,
  id: NodeId,
  change: (
    tabs: NonNullable<LayoutNode["tabs"]>,
    node: LayoutNode,
  ) => NonNullable<LayoutNode["tabs"]> | null,
): LayoutDocument => {
  const node = findNode(doc, id);
  if (!node?.tabs) return doc;
  const tabs = change(node.tabs, node);
  if (!tabs) return doc;
  return normalizeFields(updateNode(doc, id, (n) => ({ ...n, tabs })));
};

export const addTab = (
  doc: LayoutDocument,
  id: NodeId,
  label: string,
): LayoutDocument =>
  withTabs(doc, id, (tabs, node) => [
    ...tabs,
    {
      label,
      columns: node.layout?.w ?? tabs[0]?.columns ?? doc.grid.columns,
      children: [],
    },
  ]);

export const renameTab = (
  doc: LayoutDocument,
  id: NodeId,
  tab: number,
  label: string,
): LayoutDocument =>
  withTabs(doc, id, (tabs) =>
    tabs[tab]
      ? tabs.map((panel, i) => (i === tab ? { ...panel, label } : panel))
      : null,
  );

/** Removes a tab and what it holds; a TabbedPanel always keeps one tab. */
export const removeTab = (
  doc: LayoutDocument,
  id: NodeId,
  tab: number,
): LayoutDocument =>
  withTabs(doc, id, (tabs) =>
    tabs.length > 1 && tabs[tab] ? tabs.filter((_, i) => i !== tab) : null,
  );

export const moveTab = (
  doc: LayoutDocument,
  id: NodeId,
  from: number,
  to: number,
): LayoutDocument =>
  withTabs(doc, id, (tabs) => {
    if (!tabs[from] || to < 0 || to >= tabs.length) return null;
    const next = [...tabs];
    const [panel] = next.splice(from, 1);
    next.splice(to, 0, panel);
    return next;
  });
