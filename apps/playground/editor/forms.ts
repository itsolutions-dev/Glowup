// Form bindings (spec §11.7): a field component inside a Form has a name,
// unique in that Form, and JSON-safe rules; outside every Form it has none.

import {
  ancestors,
  findNode,
  updateNode,
  walk,
  type FieldRule,
  type LayoutDocument,
  type LayoutNode,
  type NodeId,
} from "./document";
import { entryFor } from "./manifest";

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/**
 * "Email address" → "emailAddress": accents dropped, everything but letters
 * and digits splits words, a leading digit is prefixed with "field". "" for
 * a label with no letter or digit.
 */
export const camelName = (label: string): string => {
  const words = label
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);
  const name = words
    .map((word, i) =>
      i === 0
        ? word.toLowerCase()
        : word[0].toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join("");
  return /^[0-9]/.test(name) ? `field${name}` : name;
};

/** The Form a node sits in (its nearest Form ancestor), or null. */
export const formOf = (doc: LayoutDocument, id: NodeId): NodeId | null =>
  ancestors(doc, id).find(
    (ancestor) => entryFor(findNode(doc, ancestor)?.type ?? "")?.form,
  ) ?? null;

/** A name for a newly bound field: from its label, else its type and a number. */
const freshName = (node: LayoutNode, taken: Set<string>) => {
  const base = camelName(String(node.props.label ?? ""));
  if (base) {
    if (!taken.has(base)) return base;
    let n = 2;
    while (taken.has(`${base}${n}`)) n++;
    return `${base}${n}`;
  }
  const type = node.type[0].toLowerCase() + node.type.slice(1);
  let n = 1;
  while (taken.has(`${type}${n}`)) n++;
  return `${type}${n}`;
};

/**
 * Binds every field component inside a Form and unbinds every one outside,
 * in walk order: a field keeps its name while it is free in its Form,
 * otherwise it gets a fresh one. The same document when nothing changes.
 */
export const normalizeFields = (doc: LayoutDocument): LayoutDocument => {
  const names = new Map<NodeId, Set<string>>();

  const visit = (nodes: LayoutNode[], form: NodeId | null): LayoutNode[] => {
    let changed = false;
    const out = nodes.map((node) => {
      const entry = entryFor(node.type);
      let next = node;
      if (entry?.field && form) {
        const taken = names.get(form) as Set<string>;
        const current = node.field?.name;
        const name =
          current && IDENTIFIER.test(current) && !taken.has(current)
            ? current
            : freshName(node, taken);
        taken.add(name);
        if (current !== name) {
          next = { ...node, field: { name, rules: node.field?.rules ?? [] } };
        }
      } else if (node.field) {
        const { field: _unbound, ...rest } = node;
        next = rest;
      }

      if (entry?.form) names.set(node.id, new Set());
      const inner = entry?.form ? node.id : form;
      if (next.children) {
        const children = visit(next.children, inner);
        if (children !== next.children) next = { ...next, children };
      }
      if (next.tabs) {
        let tabsChanged = false;
        const tabs = next.tabs.map((panel) => {
          const children = visit(panel.children, inner);
          if (children === panel.children) return panel;
          tabsChanged = true;
          return { ...panel, children };
        });
        if (tabsChanged) next = { ...next, tabs };
      }
      if (next !== node) changed = true;
      return next;
    });
    return changed ? out : nodes;
  };

  const items = visit(doc.items, null);
  return items === doc.items ? doc : { ...doc, items };
};

/** Why `name` cannot be that field's name, or null when it can. */
export const fieldNameProblem = (
  doc: LayoutDocument,
  id: NodeId,
  name: string,
): string | null => {
  const node = findNode(doc, id);
  const form = formOf(doc, id);
  if (!node?.field || !form) return "Not a field in a form";
  if (!IDENTIFIER.test(name)) return "Not a valid name";
  const taken = walk(doc).some(
    (other) =>
      other.id !== id &&
      other.field?.name === name &&
      formOf(doc, other.id) === form,
  );
  return taken ? "Already used in this form" : null;
};

export const setFieldName = (
  doc: LayoutDocument,
  id: NodeId,
  name: string,
): LayoutDocument =>
  fieldNameProblem(doc, id, name)
    ? doc
    : updateNode(doc, id, (node) => ({
        ...node,
        field: { name, rules: node.field?.rules ?? [] },
      }));

/** Replaces a bound field's rules; the same document for an unbound node. */
export const setFieldRules = (
  doc: LayoutDocument,
  id: NodeId,
  rules: FieldRule[],
): LayoutDocument =>
  findNode(doc, id)?.field
    ? updateNode(doc, id, (node) => ({
        ...node,
        field: { name: node.field?.name ?? "", rules },
      }))
    : doc;
