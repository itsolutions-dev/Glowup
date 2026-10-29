// The editor's state: the history of documents, the selected node, and the
// panel shown of each TabbedPanel.

import { useCallback, useMemo, useReducer } from "react";

import { findNode, type LayoutDocument, type NodeId } from "../document";
import {
  amend,
  commit,
  createHistory,
  redo,
  undo,
  type History,
} from "../history";

export interface Editor {
  doc: LayoutDocument;
  /** Null whenever the selected node is no longer in the document. */
  selected: NodeId | null;
  select(id: NodeId | null): void;
  /** A new undo step; nothing when `next` is the same document. */
  apply(next: LayoutDocument, key?: string): void;
  /**
   * Folds `next` into the present step (a container growing after an edit);
   * a function gets the latest document, so several in one tick compose.
   */
  amend(next: LayoutDocument | ((doc: LayoutDocument) => LayoutDocument)): void;
  undo(): void;
  redo(): void;
  canUndo: boolean;
  canRedo: boolean;
  /** The panel shown of each TabbedPanel: canvas state, not in the document or history. */
  tabs: Record<NodeId, number>;
  showTab(id: NodeId, tab: number): void;
}

interface State {
  history: History;
  selected: NodeId | null;
  tabs: Record<NodeId, number>;
}

type Action =
  | { type: "apply"; next: LayoutDocument; key?: string }
  | {
      type: "amend";
      next: LayoutDocument | ((doc: LayoutDocument) => LayoutDocument);
    }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "select"; id: NodeId | null }
  | { type: "tab"; id: NodeId; tab: number };

/** A selection whose node left the document is dropped, not revived by an undo. */
const keep = (state: State, history: History): State => {
  const selected =
    state.selected && findNode(history.present, state.selected)
      ? state.selected
      : null;
  // The same state when nothing changed: React then skips the render, and
  // every node's layout event asks to grow (most change nothing).
  return history === state.history && selected === state.selected
    ? state
    : { ...state, history, selected };
};

const reduce = (state: State, action: Action): State => {
  switch (action.type) {
    case "apply":
      return keep(state, commit(state.history, action.next, action.key));
    case "amend":
      return keep(
        state,
        amend(
          state.history,
          typeof action.next === "function"
            ? action.next(state.history.present)
            : action.next,
        ),
      );
    case "undo":
      return keep(state, undo(state.history));
    case "redo":
      return keep(state, redo(state.history));
    case "select":
      return action.id === state.selected
        ? state
        : { ...state, selected: action.id };
    case "tab":
      return state.tabs[action.id] === action.tab
        ? state
        : { ...state, tabs: { ...state.tabs, [action.id]: action.tab } };
  }
};

export const useEditor = (initial: LayoutDocument): Editor => {
  const [state, dispatch] = useReducer(reduce, initial, (doc) => ({
    history: createHistory(doc),
    selected: null,
    tabs: {},
  }));
  const doc = state.history.present;
  const { selected, tabs } = state;

  const select = useCallback(
    (id: NodeId | null) => dispatch({ type: "select", id }),
    [],
  );
  const apply = useCallback(
    (next: LayoutDocument, key?: string) =>
      dispatch({ type: "apply", next, key }),
    [],
  );
  const amendDoc = useCallback(
    (next: LayoutDocument | ((doc: LayoutDocument) => LayoutDocument)) =>
      dispatch({ type: "amend", next }),
    [],
  );
  const undoDoc = useCallback(() => dispatch({ type: "undo" }), []);
  const redoDoc = useCallback(() => dispatch({ type: "redo" }), []);
  const showTab = useCallback(
    (id: NodeId, tab: number) => dispatch({ type: "tab", id, tab }),
    [],
  );

  return useMemo(
    () => ({
      doc,
      selected,
      select,
      apply,
      amend: amendDoc,
      undo: undoDoc,
      redo: redoDoc,
      canUndo: state.history.past.length > 0,
      canRedo: state.history.future.length > 0,
      tabs,
      showTab,
    }),
    [
      doc,
      selected,
      select,
      apply,
      amendDoc,
      undoDoc,
      redoDoc,
      state.history,
      tabs,
      showTab,
    ],
  );
};
