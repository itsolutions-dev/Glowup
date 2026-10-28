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
import { extent, firstFreeCell, pushDown, rowsFor } from "./engine";
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

const idsOf = (node: LayoutNode) => new Set(subtree(node).map((n) => n.id));

const layoutsOf = (nodes: LayoutNode[]): GridPlacement[] =>
  nodes.flatMap((n) => (n.layout ? [n.layout] : []));

/** One string per slot, to compare two. */
const slotKey = (slot: Slot) =>
  slot.kind === "page"
    ? "page"
    : `${slot.kind}:${slot.parent}:${slot.kind === "tab" ? slot.tab : ""}`;

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
    extent(layoutsOf(node.children ?? [])).columns,
    ...(node.tabs ?? []).map(
      (panel) => extent(layoutsOf(panel.children)).columns,
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

/**
 * The slot's nodes with `node` at `layout` (where it was in the list, or at
 * the end when new), the rest pushed down below it.
 */
const placeIn = (
  nodes: LayoutNode[],
  node: LayoutNode,
  layout: GridPlacement,
): LayoutNode[] => {
  const placed = withWidth(node, layout);
  const list = nodes.some((n) => n.id === node.id)
    ? nodes.map((n) => (n.id === node.id ? placed : n))
    : [...nodes, placed];
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

/** A layout for `size` at `cell`, on whole cells, cut to the columns. */
const fit = (
  cell: { x: number; y: number },
  size: { w: number; h: number },
  columns: number,
): GridPlacement => {
  const w = Math.min(size.w, columns);
  return {
    x: Math.min(Math.max(0, Math.round(cell.x)), columns - w),
    y: Math.max(0, Math.round(cell.y)),
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

/** Puts `node` (without a slot yet) at `dest` in `doc`; a grid sent an index uses its first free cell. */
const put = (
  doc: LayoutDocument,
  node: LayoutNode,
  dest: Destination,
  size: { w: number; h: number },
): LayoutDocument => {
  const nodes = slotNodes(doc, dest.slot);
  const columns = slotColumns(doc, dest.slot);
  if (columns !== null) {
    const cell =
      "cell" in dest
        ? dest.cell
        : firstFreeCell(layoutsOf(nodes), size, columns);
    return setSlotNodes(
      doc,
      dest.slot,
      placeIn(nodes, node, fit(cell, size, columns)),
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
  return { doc: normalizeFields(out, new Set([node.id])), id: node.id };
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
  const from = slotOf(doc, id) as Slot;
  if (node.layout && "cell" in dest && slotKey(from) === slotKey(dest.slot)) {
    const { w, h } = node.layout;
    return placeNode(doc, id, { ...dest.cell, w, h });
  }
  // Out of a flow, a container comes back no narrower than its children reach.
  const { w, h } = MANIFEST[node.type].defaultSize;
  const size = node.layout ?? { w: Math.max(w, contentColumns(node)), h };
  return normalizeFields(put(without(doc, id), node, dest, size), idsOf(node));
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
    // The first free cell from the row under the original: nothing is pushed.
    const { y, h } = node.layout;
    const columns = slotColumns(doc, slot) as number;
    const cell = firstFreeCell(layoutsOf(nodes), node.layout, columns, y + h);
    out = setSlotNodes(
      doc,
      slot,
      placeIn(nodes, copy, { ...node.layout, ...cell }),
    );
  } else {
    const index = nodes.findIndex((n) => n.id === id) + 1;
    out = put(doc, copy, { slot, index }, MANIFEST[node.type].defaultSize);
  }
  return { doc: normalizeFields(out, idsOf(copy)), id: copy.id };
};

/** Merges props; a key set to undefined is removed. A field follows a new label. */
export const setProps = (
  doc: LayoutDocument,
  id: NodeId,
  props: Record<string, unknown>,
): LayoutDocument => {
  const out = updateNode(doc, id, (node) => {
    const merged: Record<string, unknown> = { ...node.props, ...props };
    for (const [key, value] of Object.entries(props)) {
      if (value === undefined) delete merged[key];
    }
    return JSON.stringify(merged) === JSON.stringify(node.props)
      ? node
      : { ...node, props: merged };
  });
  return out === doc ? doc : normalizeFields(out);
};

/** A text component's label; refused on any other kind. */
export const setText = (
  doc: LayoutDocument,
  id: NodeId,
  text: string,
): LayoutDocument =>
  updateNode(doc, id, (node) =>
    entryFor(node.type)?.kind !== "text" || node.text === text
      ? node
      : { ...node, text },
  );

/**
 * Moves or resizes a node within its own grid: whole cells, inside the
 * columns, no smaller than the manifest's `minSize`, a container no narrower
 * than its children reach. A placement that keeps the right (or bottom) edge
 * is a resize from the left (or top): that edge stays put. What it now covers
 * is pushed down. Refuses numbers that are not finite.
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
  const old = node?.layout;
  if (!old || !slot || columns === null || !entry) return doc;
  const values = [placement.x, placement.y, placement.w, placement.h];
  if (!values.every(Number.isFinite)) return doc;
  let [x, y, w, h] = values.map(Math.round);
  const minW = Math.max(entry.minSize.w, contentColumns(node));
  const right = old.x + old.w;
  if (x + w === right) {
    w = Math.max(right - Math.max(0, x), minW);
    x = right - w;
  }
  const bottom = old.y + old.h;
  if (y + h === bottom) {
    h = Math.max(bottom - Math.max(0, y), entry.minSize.h);
    y = bottom - h;
  }
  const layout = fit(
    { x, y },
    {
      w: Math.min(Math.max(w, minW), columns),
      h: Math.max(h, entry.minSize.h),
    },
    columns,
  );
  if (
    layout.x === old.x &&
    layout.y === old.y &&
    layout.w === old.w &&
    layout.h === old.h
  ) {
    return doc;
  }
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
  if (!node?.layout || !slot || !Number.isFinite(contentHeight)) return doc;
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
    tabs[tab] && tabs[tab].label !== label
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
    if (from === to || !tabs[from] || to < 0 || to >= tabs.length) return null;
    const next = [...tabs];
    const [panel] = next.splice(from, 1);
    next.splice(to, 0, panel);
    return next;
  });
