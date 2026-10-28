// The layout editor's document: an immutable tree of library components
// placed on grids (the page's, a container's, a tab panel's) or in flow
// containers. Plain data, so it saves as JSON and every operation can return
// a new document (spec §7). No React and no React Native in here.

export type NodeId = string;

/** Cells on a grid: `x` and `w` in columns, `y` and `h` in rows. */
export interface GridPlacement {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** The JSON-safe part of the library's `FormRule` (spec §11.7). */
export interface FieldRule {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  /** A regular expression's source. */
  pattern?: string;
  type?: "email" | "url" | "number";
  message?: string;
}

/** A field component's place in its Form. */
export interface FieldBinding {
  name: string;
  rules: FieldRule[];
  /** Made from the label (or the type): it follows the label until set by hand. */
  auto?: boolean;
}

export interface TabPanel {
  label: string;
  columns: number;
  children: LayoutNode[];
}

export interface LayoutNode {
  id: NodeId;
  /** A manifest type ("Paper", "Input", "TabbedPanel", "Form", …). */
  type: string;
  props: Record<string, unknown>;
  /** A text component's label. */
  text?: string;
  /** Its cells, on the grid of the slot it is in; absent in a flow container. */
  layout?: GridPlacement;
  /** A grid container's own grid (and a Form's). */
  columns?: number;
  children?: LayoutNode[];
  /** A TabbedPanel's panels. */
  tabs?: TabPanel[];
  /** A field inside a Form. */
  field?: FieldBinding;
}

export interface GridSettings {
  columns: number;
  rowHeight: number;
  gap: number;
}

export interface LayoutDocument {
  format: "glowup-layout";
  version: 1;
  name: string;
  grid: GridSettings;
  items: LayoutNode[];
}

/** Where a node lives: the page, a container's children, or one panel of a TabbedPanel. */
export type Slot =
  | { kind: "page" }
  | { kind: "children"; parent: NodeId }
  | { kind: "tab"; parent: NodeId; tab: number };

export const emptyDocument = (name: string): LayoutDocument => ({
  format: "glowup-layout",
  version: 1,
  name,
  grid: { columns: 12, rowHeight: 48, gap: 16 },
  items: [],
});

/** Every node with the slot it sits in, in walk order. */
const entries = (doc: LayoutDocument) => {
  const out: { node: LayoutNode; slot: Slot }[] = [];
  const visit = (nodes: LayoutNode[], slot: Slot) => {
    for (const node of nodes) {
      out.push({ node, slot });
      if (node.children) {
        visit(node.children, { kind: "children", parent: node.id });
      }
      node.tabs?.forEach((panel, tab) =>
        visit(panel.children, { kind: "tab", parent: node.id, tab }),
      );
    }
  };
  visit(doc.items, { kind: "page" });
  return out;
};

/** Pre-order: the items, each followed by its children and its panels' children. */
export const walk = (doc: LayoutDocument): LayoutNode[] =>
  entries(doc).map((entry) => entry.node);

/** One more than the largest `n<number>` id in the document. */
export const newId = (doc: LayoutDocument): NodeId => {
  let largest = 0;
  for (const node of walk(doc)) {
    const n = Number(node.id.replace(/^n/, ""));
    if (Number.isInteger(n) && n > largest) largest = n;
  }
  return `n${largest + 1}`;
};

export const findNode = (doc: LayoutDocument, id: NodeId): LayoutNode | null =>
  walk(doc).find((node) => node.id === id) ?? null;

export const slotOf = (doc: LayoutDocument, id: NodeId): Slot | null =>
  entries(doc).find((entry) => entry.node.id === id)?.slot ?? null;

export const slotNodes = (doc: LayoutDocument, slot: Slot): LayoutNode[] => {
  if (slot.kind === "page") return doc.items;
  const parent = findNode(doc, slot.parent);
  if (slot.kind === "children") return parent?.children ?? [];
  return parent?.tabs?.[slot.tab]?.children ?? [];
};

/**
 * The document with the node `id` replaced by `fn(node)`: only the path to it
 * is rebuilt, the rest keeps its objects. The same document when the node is
 * not there or `fn` returns it unchanged.
 */
export const updateNode = (
  doc: LayoutDocument,
  id: NodeId,
  fn: (node: LayoutNode) => LayoutNode,
): LayoutDocument => {
  const inList = (nodes: LayoutNode[]): LayoutNode[] => {
    let changed = false;
    const out = nodes.map((node) => {
      const next = inNode(node);
      if (next !== node) changed = true;
      return next;
    });
    return changed ? out : nodes;
  };
  const inNode = (node: LayoutNode): LayoutNode => {
    if (node.id === id) return fn(node);
    let next = node;
    if (node.children) {
      const children = inList(node.children);
      if (children !== node.children) next = { ...next, children };
    }
    if (node.tabs) {
      let changed = false;
      const tabs = node.tabs.map((panel) => {
        const children = inList(panel.children);
        if (children === panel.children) return panel;
        changed = true;
        return { ...panel, children };
      });
      if (changed) next = { ...next, tabs };
    }
    return next;
  };
  const items = inList(doc.items);
  return items === doc.items ? doc : { ...doc, items };
};

/** The containers a node sits in, nearest first. */
export const ancestors = (doc: LayoutDocument, id: NodeId): NodeId[] => {
  const out: NodeId[] = [];
  let slot = slotOf(doc, id);
  while (slot && slot.kind !== "page") {
    out.push(slot.parent);
    slot = slotOf(doc, slot.parent);
  }
  return out;
};
