// Undo and redo for the layout editor (spec §14): a stack of whole
// documents, cheap because operations share every unchanged node. Edits with
// the same key in a row (typing in one field) make one step.

import type { LayoutDocument } from "./document";

export const HISTORY_LIMIT = 100;

export interface History {
  past: LayoutDocument[];
  present: LayoutDocument;
  future: LayoutDocument[];
  /** The key of the last commit, for coalescing. */
  lastKey: string | null;
}

export const createHistory = (doc: LayoutDocument): History => ({
  past: [],
  present: doc,
  future: [],
  lastKey: null,
});

/**
 * A new step; with the same `key` as the last commit it replaces that step
 * instead. Committing the present document changes nothing. A commit clears
 * the future.
 */
export const commit = (
  history: History,
  doc: LayoutDocument,
  key?: string,
): History => {
  if (doc === history.present) return history;
  if (key !== undefined && key === history.lastKey) {
    return { ...history, present: doc, future: [] };
  }
  return {
    past: [...history.past, history.present].slice(-HISTORY_LIMIT),
    present: doc,
    future: [],
    lastKey: key ?? null,
  };
};

export const undo = (history: History): History => {
  if (history.past.length === 0) return history;
  return {
    past: history.past.slice(0, -1),
    present: history.past[history.past.length - 1],
    future: [history.present, ...history.future],
    lastKey: null,
  };
};

export const redo = (history: History): History => {
  if (history.future.length === 0) return history;
  return {
    past: [...history.past, history.present].slice(-HISTORY_LIMIT),
    present: history.future[0],
    future: history.future.slice(1),
    lastKey: null,
  };
};

/**
 * Folds `doc` into the present step: a consequence of the last edit (a
 * container growing to hold what was dropped in it) undoes with that edit.
 */
export const amend = (history: History, doc: LayoutDocument): History =>
  doc === history.present ? history : { ...history, present: doc };
