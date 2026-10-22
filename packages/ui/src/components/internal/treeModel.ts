// The pure side of `Tree`: walking the nodes, which rows are visible, and the
// checkbox rules (a parent is checked when all its children are, mixed when
// some are). No React, no platform: tested on its own.
import type { TreeNode } from "../Tree";

export type CheckState = "checked" | "mixed" | "unchecked";

/** A node with where it sits. */
export interface NodeInfo {
  node: TreeNode;
  parent: string | null;
  /** 1 for the roots. */
  level: number;
}

/** A row the user can see, in the order it is drawn. */
export interface RowInfo extends NodeInfo {
  id: string;
  expandable: boolean;
  expanded: boolean;
}

type Loaded = ReadonlyMap<string, TreeNode[]>;

/** A node's children: its own, or the ones `loadChildren` brought. */
export const childrenOf = (node: TreeNode, loaded: Loaded) =>
  node.children ?? loaded.get(node.id);

/** Whether the node can be opened: it has children, or may have once loaded. */
export const isExpandable = (node: TreeNode, loaded: Loaded) => {
  const kids = childrenOf(node, loaded);
  return kids ? kids.length > 0 : !!node.hasChildren;
};

/** Every node by id, loaded ones included, in the order of a depth-first walk. */
export const indexNodes = (nodes: TreeNode[], loaded: Loaded) => {
  const index = new Map<string, NodeInfo>();
  const walk = (list: TreeNode[], level: number, parent: string | null) =>
    list.forEach((node) => {
      index.set(node.id, { node, parent, level });
      const kids = childrenOf(node, loaded);
      if (kids) walk(kids, level + 1, node.id);
    });
  walk(nodes, 1, null);
  return index;
};

/** The rows on screen: every root, and the children of each open node. */
export const visibleRows = (
  nodes: TreeNode[],
  loaded: Loaded,
  expanded: ReadonlySet<string>,
) => {
  const rows: RowInfo[] = [];
  const walk = (list: TreeNode[], level: number, parent: string | null) =>
    list.forEach((node) => {
      const expandable = isExpandable(node, loaded);
      const open = expandable && expanded.has(node.id);
      rows.push({
        id: node.id,
        node,
        parent,
        level,
        expandable,
        expanded: open,
      });
      const kids = childrenOf(node, loaded);
      if (open && kids) walk(kids, level + 1, node.id);
    });
  walk(nodes, 1, null);
  return rows;
};

/**
 * The state of every node's checkbox. A node with children is what they say
 * (all checked, none, or mixed); one without is checked when `selected` holds
 * it. A parent in `selected` stands for its whole branch, which is how a
 * branch picked before its children were loaded stays picked once they are.
 */
export const checkStates = (
  nodes: TreeNode[],
  loaded: Loaded,
  selected: ReadonlySet<string>,
) => {
  const states = new Map<string, CheckState>();
  const visit = (node: TreeNode, inherited: boolean): CheckState => {
    const own = inherited || selected.has(node.id);
    const kids = childrenOf(node, loaded);
    let state: CheckState;
    if (kids && kids.length > 0) {
      let all = true;
      let none = true;
      kids.forEach((kid) => {
        const s = visit(kid, own);
        if (s !== "checked") all = false;
        if (s !== "unchecked") none = false;
      });
      state = all ? "checked" : none ? "unchecked" : "mixed";
    } else {
      state = own ? "checked" : "unchecked";
    }
    states.set(node.id, state);
    return state;
  };
  nodes.forEach((node) => visit(node, false));
  return states;
};

/**
 * The selection after a click on `id`'s checkbox, or `null` when there is
 * nothing to change (every node under it is disabled). The click checks the
 * enabled leaves under the node, or unchecks them when they all are already;
 * a disabled node keeps the state it has. The result lists every checked node,
 * parents included, in tree order.
 */
export const toggleChecked = (
  nodes: TreeNode[],
  loaded: Loaded,
  index: ReadonlyMap<string, NodeInfo>,
  selected: ReadonlySet<string>,
  id: string,
): string[] | null => {
  const start = index.get(id);
  if (!start) return null;
  const states = checkStates(nodes, loaded, selected);
  const isLeaf = (node: TreeNode) => !childrenOf(node, loaded)?.length;

  const targets: string[] = [];
  const collect = (node: TreeNode) => {
    if (!isLeaf(node)) childrenOf(node, loaded)!.forEach(collect);
    else if (!node.disabled) targets.push(node.id);
  };
  collect(start.node);
  if (targets.length === 0) return null;

  const check = !targets.every((t) => states.get(t) === "checked");
  const leaves = new Set<string>();
  index.forEach(({ node }, nodeId) => {
    if (isLeaf(node) && states.get(nodeId) === "checked") leaves.add(nodeId);
  });
  targets.forEach((t) => (check ? leaves.add(t) : leaves.delete(t)));

  const next = checkStates(nodes, loaded, leaves);
  return [...index.keys()].filter((nodeId) => next.get(nodeId) === "checked");
};
