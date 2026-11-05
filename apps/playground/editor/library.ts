// The saved layouts (spec §14): one JSON value in storage, and what can be
// done to it. Pure; reading it back goes through `parseLayout`, so a stored
// layout meets the same rules as an imported one.

import type { LayoutDocument } from "./document";
import { parseLayout } from "./importJson";

export interface SavedLayout {
  id: string;
  /** When it was last saved (ms since the epoch): the order of the list. */
  savedAt: number;
  doc: LayoutDocument;
}

export interface Library {
  version: 1;
  /** The layout on the canvas, or none yet. */
  open: string | null;
  layouts: SavedLayout[];
}

const ID = /^l\d+$/;

export const emptyLibrary = (): Library => ({
  version: 1,
  open: null,
  layouts: [],
});

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** What storage held, or an empty library: what cannot be read is dropped. */
export const readLibrary = (raw: string | null): Library => {
  let stored: unknown;
  try {
    stored = raw === null ? null : JSON.parse(raw);
  } catch {
    return emptyLibrary();
  }
  if (!isObject(stored) || !Array.isArray(stored.layouts)) {
    return emptyLibrary();
  }
  const seen = new Set<string>();
  const layouts = stored.layouts.flatMap((entry): SavedLayout[] => {
    if (!isObject(entry) || typeof entry.id !== "string") return [];
    if (!ID.test(entry.id) || seen.has(entry.id)) return [];
    // One layout the reader cannot take (even one that makes it throw) is
    // dropped on its own: the others are kept, never the whole library lost.
    let read: ReturnType<typeof parseLayout>;
    try {
      read = parseLayout(JSON.stringify(entry.doc));
    } catch {
      return [];
    }
    if (!read.ok) return [];
    seen.add(entry.id);
    const savedAt = typeof entry.savedAt === "number" ? entry.savedAt : 0;
    return [{ id: entry.id, savedAt, doc: read.doc }];
  });
  const open =
    typeof stored.open === "string" && seen.has(stored.open)
      ? stored.open
      : null;
  return { version: 1, open, layouts };
};

/** A new layout holding `doc`, opened. */
export const addLayout = (
  library: Library,
  doc: LayoutDocument,
  now: number,
): { library: Library; id: string } => {
  const id = `l${1 + Math.max(0, ...library.layouts.map((l) => Number(l.id.slice(1))))}`;
  return {
    id,
    library: {
      ...library,
      open: id,
      layouts: [...library.layouts, { id, savedAt: now, doc }],
    },
  };
};

/** `doc` stored in layout `id`; the same library when nothing changes. */
export const saveLayout = (
  library: Library,
  id: string,
  doc: LayoutDocument,
  now: number,
): Library => {
  const at = library.layouts.findIndex((l) => l.id === id);
  if (at < 0 || library.layouts[at].doc === doc) return library;
  const layouts = [...library.layouts];
  layouts[at] = { id, savedAt: now, doc };
  return { ...library, layouts };
};

export const openLayout = (library: Library, id: string): Library =>
  library.layouts.some((l) => l.id === id) && library.open !== id
    ? { ...library, open: id }
    : library;

/** Newest first. */
export const recent = (library: Library): SavedLayout[] =>
  [...library.layouts].sort((a, b) => b.savedAt - a.savedAt);

/** Without layout `id`; removing the open one opens the most recent left. */
export const removeLayout = (library: Library, id: string): Library => {
  const layouts = library.layouts.filter((l) => l.id !== id);
  if (layouts.length === library.layouts.length) return library;
  const rest = { ...library, layouts };
  return library.open === id
    ? { ...rest, open: recent(rest)[0]?.id ?? null }
    : rest;
};
