// Form bindings (spec §11.7): a field component inside a Form has a name,
// unique in that Form, and JSON-safe rules; outside every Form it has none.

import {
  ancestors,
  findNode,
  updateNode,
  walk,
  type FieldBinding,
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

/** An automatic name's stem: the label in camel case, else the type ("input"). */
const stemOf = (node: LayoutNode) => {
  const fromLabel = camelName(String(node.props.label ?? ""));
  return fromLabel
    ? { stem: fromLabel, first: "" }
    : { stem: node.type[0].toLowerCase() + node.type.slice(1), first: "1" };
};

/** The stem, then the stem numbered from 2 (or from 1 for a type stem), until free. */
const freshName = (node: LayoutNode, taken: Set<string>) => {
  const { stem, first } = stemOf(node);
  if (first === "" && !taken.has(stem)) return stem;
  let n = first === "" ? 2 : 1;
  while (taken.has(`${stem}${n}`)) n++;
  return `${stem}${n}`;
};

/** Whether an automatic name still comes from the node's label (or type). */
const fitsStem = (node: LayoutNode, name: string) => {
  const { stem, first } = stemOf(node);
  return (
    (first === "" && name === stem) || new RegExp(`^${stem}\\d+$`).test(name)
  );
};

/**
 * Binds every field component inside a Form and unbinds every one outside.
 * Within a Form, names already there win over arrivals: first the names set
 * by hand, then the automatic names that still match their label, then the
 * `newcomers` (nodes just inserted, moved or copied) and anything unbound —
 * these keep their name by the same rules while it is free, otherwise they
 * get a fresh, automatic one. Walk order breaks ties. The same document when
 * nothing changes.
 */
export const normalizeFields = (
  doc: LayoutDocument,
  newcomers: ReadonlySet<NodeId> = new Set(),
): LayoutDocument => {
  // The fields of each Form, in walk order.
  const fieldsOf = new Map<NodeId, LayoutNode[]>();
  const collect = (nodes: LayoutNode[], form: NodeId | null) => {
    for (const node of nodes) {
      const entry = entryFor(node.type);
      if (entry?.field && form) fieldsOf.get(form)?.push(node);
      if (entry?.form) fieldsOf.set(node.id, []);
      const inner = entry?.form ? node.id : form;
      if (node.children) collect(node.children, inner);
      node.tabs?.forEach((panel) => collect(panel.children, inner));
    }
  };
  collect(doc.items, null);

  // Each bound field's binding, decided in priority order.
  const binding = new Map<NodeId, { name: string; auto: boolean }>();
  for (const fields of fieldsOf.values()) {
    const taken = new Set<string>();
    const settle = (node: LayoutNode, name: string, auto: boolean) => {
      taken.add(name);
      binding.set(node.id, { name, auto });
    };
    const usable = (name: string | undefined): name is string =>
      !!name && IDENTIFIER.test(name) && !taken.has(name);
    const resident = fields.filter((n) => n.field && !newcomers.has(n.id));
    for (const node of resident) {
      if (!node.field?.auto && usable(node.field?.name)) {
        settle(node, node.field.name, false);
      }
    }
    for (const node of resident) {
      const name = node.field?.name;
      if (node.field?.auto && usable(name) && fitsStem(node, name)) {
        settle(node, name, true);
      }
    }
    for (const node of fields) {
      if (binding.has(node.id)) continue;
      const name = node.field?.name;
      const auto = !!node.field?.auto;
      if (usable(name) && (!auto || fitsStem(node, name))) {
        settle(node, name, auto);
      } else settle(node, freshName(node, taken), true);
    }
  }

  // Apply: bind what was decided, unbind every other field.
  const apply = (nodes: LayoutNode[]): LayoutNode[] => {
    let changed = false;
    const out = nodes.map((node) => {
      let next = node;
      const decided = binding.get(node.id);
      if (decided) {
        const { name, auto } = decided;
        if (node.field?.name !== name || !!node.field?.auto !== auto) {
          next = {
            ...node,
            field: {
              name,
              rules: node.field?.rules ?? [],
              ...(auto ? { auto: true } : {}),
            },
          };
        }
      } else if (node.field) {
        const { field: _unbound, ...rest } = node;
        next = rest;
      }
      if (next.children) {
        const children = apply(next.children);
        if (children !== next.children) next = { ...next, children };
      }
      if (next.tabs) {
        let tabsChanged = false;
        const tabs = next.tabs.map((panel) => {
          const children = apply(panel.children);
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

  const items = apply(doc.items);
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

/** Names a field by hand: from now on it no longer follows its label. */
export const setFieldName = (
  doc: LayoutDocument,
  id: NodeId,
  name: string,
): LayoutDocument =>
  fieldNameProblem(doc, id, name)
    ? doc
    : updateNode(doc, id, (node) =>
        node.field?.name === name && !node.field.auto
          ? node
          : { ...node, field: { name, rules: node.field?.rules ?? [] } },
      );

/** Replaces a bound field's rules; the same document for an unbound node. */
export const setFieldRules = (
  doc: LayoutDocument,
  id: NodeId,
  rules: FieldRule[],
): LayoutDocument =>
  findNode(doc, id)?.field
    ? updateNode(doc, id, (node) => ({
        ...node,
        field: { ...(node.field as FieldBinding), rules },
      }))
    : doc;
