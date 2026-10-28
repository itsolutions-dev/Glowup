// What a sound layout document looks like, as a list of what is wrong with
// one. Every editing operation must keep this list empty; the tests run it
// after each, and the JSON import (plan 3) reports it.

import type { LayoutDocument, LayoutNode, NodeId } from "./document";
import { overlaps } from "./engine";
import { acceptsChild, entryFor } from "./manifest";

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

interface SlotInfo {
  /** A grid slot's columns; null for a flow container. */
  columns: number | null;
  /** The container's type and id; absent on the page. */
  parent?: { type: string; id: NodeId };
}

/** Every broken invariant as one message; empty when the document is sound. */
export const checkDocument = (doc: LayoutDocument): string[] => {
  const problems: string[] = [];
  const seen = new Set<NodeId>();
  const fieldNames = new Map<NodeId, Set<string>>();

  const visit = (nodes: LayoutNode[], slot: SlotInfo, form: NodeId | null) => {
    if (slot.columns !== null) {
      nodes.forEach((a, i) => {
        for (const b of nodes.slice(i + 1)) {
          if (a.layout && b.layout && overlaps(a.layout, b.layout)) {
            problems.push(`${a.id} and ${b.id} overlap`);
          }
        }
      });
    }

    for (const node of nodes) {
      if (seen.has(node.id)) problems.push(`${node.id}: duplicate id`);
      seen.add(node.id);

      const entry = entryFor(node.type);
      if (!entry) problems.push(`${node.id}: unknown type ${node.type}`);
      if (slot.parent && !acceptsChild(slot.parent.type, node.type)) {
        problems.push(`${slot.parent.id}: does not take ${node.type}`);
      }

      const { layout } = node;
      if (slot.columns !== null) {
        if (!layout) {
          problems.push(`${node.id}: needs a layout on a grid`);
        } else if (
          ![layout.x, layout.y, layout.w, layout.h].every(Number.isInteger)
        ) {
          problems.push(`${node.id}: not on whole cells`);
        } else if (
          layout.x < 0 ||
          layout.y < 0 ||
          layout.w < 1 ||
          layout.h < 1 ||
          layout.x + layout.w > slot.columns
        ) {
          problems.push(`${node.id}: outside the ${slot.columns} columns`);
        }
      } else if (layout) {
        problems.push(`${node.id}: has a layout in a flow container`);
      }

      if (node.text !== undefined && entry && entry.kind !== "text") {
        problems.push(`${node.id}: text on a ${entry.kind}`);
      }
      if (entry?.kind === "grid" && layout && node.columns !== layout.w) {
        problems.push(`${node.id}: columns ${node.columns}, width ${layout.w}`);
      }
      if (entry?.kind === "tabs") {
        if (!node.tabs?.length) {
          problems.push(`${node.id}: a TabbedPanel needs a tab`);
        }
        for (const panel of node.tabs ?? []) {
          if (layout && panel.columns !== layout.w) {
            problems.push(
              `${node.id}: columns ${panel.columns}, width ${layout.w}`,
            );
          }
        }
      }
      if (entry?.form && form) {
        problems.push(`${node.id}: a Form inside a Form`);
      }

      if (node.field) {
        const { name } = node.field;
        if (!form) {
          problems.push(`${node.id}: field outside a Form`);
        } else {
          if (!IDENTIFIER.test(name)) {
            problems.push(
              `${node.id}: field name ${name} is not an identifier`,
            );
          }
          const names = fieldNames.get(form) ?? new Set<string>();
          if (names.has(name)) {
            problems.push(`${form}: field name ${name} used twice`);
          }
          names.add(name);
          fieldNames.set(form, names);
        }
      }

      const inner = entry?.form ? node.id : form;
      const parent = { type: node.type, id: node.id };
      if (node.children) {
        visit(
          node.children,
          {
            columns: entry?.kind === "grid" ? (node.columns ?? 0) : null,
            parent,
          },
          inner,
        );
      }
      for (const panel of node.tabs ?? []) {
        visit(panel.children, { columns: panel.columns, parent }, inner);
      }
    }
  };

  visit(doc.items, { columns: doc.grid.columns }, null);
  return problems;
};
