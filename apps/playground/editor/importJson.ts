// Opening a layout's JSON (spec §14): refused when it is not a layout this
// editor can read, otherwise repaired into a sound document, with a note for
// everything dropped or moved. Never mutates what it parsed.

import { checkDocument } from "./check";
import { componentProps } from "./docgen";
import type {
  GridPlacement,
  GridSettings,
  LayoutDocument,
  LayoutNode,
} from "./document";
import { firstFreeCell, overlaps } from "./engine";
import { normalizeFields } from "./forms";
import { acceptsChild, MANIFEST } from "./manifest";

export type ImportResult =
  | { ok: true; doc: LayoutDocument; notes: string[] }
  | { ok: false; error: string };

type Raw = Record<string, unknown>;

const isObject = (value: unknown): value is Raw =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const whole = (value: unknown, fallback: number) =>
  Number.isInteger(value) ? (value as number) : fallback;
/** What kind of JSON value: a prop must keep the kind of its starting value. */
const kindOf = (value: unknown) =>
  Array.isArray(value) ? "array" : value === null ? "null" : typeof value;
/** Ids are `n` and a counter (§7): they become keys and constant names in the export. */
const ID = /^n\d+$/;

export const parseLayout = (text: string): ImportResult => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return {
      ok: false,
      error: `Not JSON: ${error instanceof Error ? error.message : error}`,
    };
  }
  if (!isObject(parsed) || parsed.format !== "glowup-layout") {
    return { ok: false, error: "Not a Glowup layout" };
  }
  if (typeof parsed.version === "number" && parsed.version > 1) {
    return {
      ok: false,
      error: `Made by a newer editor (version ${parsed.version})`,
    };
  }
  if (!isObject(parsed.grid) || !Array.isArray(parsed.items)) {
    return { ok: false, error: "No grid or items" };
  }

  const notes: string[] = [];
  const grid: GridSettings = {
    columns: whole(parsed.grid.columns, 12),
    rowHeight: whole(parsed.grid.rowHeight, 48),
    gap: whole(parsed.grid.gap, 16),
  };

  // Ids: the first of each stays, a repeated one gets the next free number.
  const seen = new Set<string>();
  let next =
    1 +
    Math.max(
      0,
      ...(JSON.stringify(parsed)
        .match(/"id":"n(\d+)"/g)
        ?.map((m) => Number(m.slice(7, -1))) ?? []),
    );

  /** One slot's nodes: `columns` for a grid, null for a flow. */
  const slot = (
    raws: unknown[],
    parent: string | null,
    columns: number | null,
    inForm: boolean,
  ): LayoutNode[] => {
    const nodes: { node: LayoutNode; layout: unknown }[] = [];
    for (const raw of raws) {
      if (!isObject(raw)) continue;
      const type = String(raw.type);
      let id = String(raw.id);
      const entry = MANIFEST[type];
      if (!entry) {
        notes.push(`Dropped ${id}: unknown type ${JSON.stringify(type)}`);
        continue;
      }
      if (parent && !acceptsChild(parent, type)) {
        notes.push(`Dropped ${id}: a ${parent} does not take a ${type}`);
        continue;
      }
      if (inForm && entry.form) {
        notes.push(`Dropped ${id}: a Form cannot hold another Form`);
        continue;
      }
      if (!ID.test(id)) {
        const renamed = `n${next++}`;
        notes.push(`Renamed ${id} to ${renamed}`);
        id = renamed;
      } else if (seen.has(id)) {
        const renamed = `n${next++}`;
        notes.push(`Renamed a second ${id} to ${renamed}`);
        id = renamed;
      }
      seen.add(id);

      const known = componentProps(type);
      const props: Raw = {};
      for (const [name, value] of Object.entries(
        isObject(raw.props) ? raw.props : {},
      )) {
        if (known && !known.some((p) => p.name === name)) {
          notes.push(`Removed ${JSON.stringify(name)} from ${id}`);
        } else if (
          name in entry.defaultProps &&
          kindOf(entry.defaultProps[name]) !== kindOf(value)
        ) {
          notes.push(
            `Removed ${JSON.stringify(name)} from ${id}: not the kind of value it takes`,
          );
        } else {
          props[name] = value;
        }
      }

      const node: LayoutNode = { id, type, props };
      if (typeof raw.text === "string") node.text = raw.text;
      if (isObject(raw.field)) {
        // Rebuilt, never trusted: a binding with no rules list breaks the export.
        const { name, rules, auto } = raw.field;
        node.field = {
          name: typeof name === "string" ? name : "",
          rules: list(rules).filter(isObject),
          ...(auto === true ? { auto } : {}),
        };
      }
      const form = inForm || entry.form === true;
      // On a grid, a container's columns follow its width (§7), the width as
      // the placement below will cut it to the slot's columns.
      const width =
        columns !== null && isObject(raw.layout)
          ? Math.min(
              Math.max(1, whole(raw.layout.w, entry.defaultSize.w)),
              columns,
            )
          : undefined;
      const follow = (stored: unknown) => {
        const own = width ?? whole(stored, entry.defaultSize.w);
        if (stored !== undefined && stored !== own) {
          notes.push(`Set ${id}'s columns to its width (${own})`);
        }
        return own;
      };
      if (entry.kind === "grid") {
        node.columns = follow(raw.columns);
        node.children = slot(list(raw.children), type, node.columns, form);
      } else if (entry.kind === "flow") {
        node.children = slot(list(raw.children), type, null, form);
      } else if (entry.kind === "tabs") {
        node.tabs = list(raw.tabs)
          .filter(isObject)
          .map((tab) => {
            const tabColumns = follow(tab.columns);
            return {
              label: String(tab.label ?? ""),
              columns: tabColumns,
              children: slot(list(tab.children), type, tabColumns, form),
            };
          });
      }
      if (columns === null && raw.layout !== undefined) {
        notes.push(`Removed ${id}'s layout: a ${parent} keeps an order`);
      }
      nodes.push({ node, layout: raw.layout });
    }
    if (columns === null) return nodes.map(({ node }) => node);

    // On a grid, in order: placed, inside the columns, clear of the ones before.
    const placed: GridPlacement[] = [];
    return nodes.map(({ node, layout }) => {
      const { defaultSize } = MANIFEST[node.type];
      let cell: GridPlacement;
      if (!isObject(layout)) {
        cell = {
          ...firstFreeCell(placed, defaultSize, columns),
          w: Math.min(defaultSize.w, columns),
          h: defaultSize.h,
        };
        notes.push(`Placed ${node.id} at the first free cell`);
      } else {
        const w = Math.min(
          Math.max(1, whole(layout.w, defaultSize.w)),
          columns,
        );
        const x = Math.min(Math.max(0, whole(layout.x, 0)), columns - w);
        cell = {
          x,
          y: Math.max(0, whole(layout.y, 0)),
          w,
          h: Math.max(1, whole(layout.h, defaultSize.h)),
        };
        if (x !== layout.x || w !== layout.w) {
          notes.push(`Moved ${node.id} inside the ${columns} columns`);
        }
        if (placed.some((other) => overlaps(other, cell))) {
          while (placed.some((other) => overlaps(other, cell))) cell.y += 1;
          notes.push(`Moved ${node.id} down: it overlapped another item`);
        }
      }
      placed.push(cell);
      return { ...node, layout: cell };
    });
  };

  const doc = normalizeFields({
    format: "glowup-layout",
    version: 1,
    name: typeof parsed.name === "string" ? parsed.name : "Imported",
    grid,
    items: slot(parsed.items as unknown[], null, grid.columns, false),
  });
  const problems = checkDocument(doc);
  return problems.length > 0
    ? { ok: false, error: `Cannot open it: ${problems[0]}` }
    : { ok: true, doc, notes };
};
