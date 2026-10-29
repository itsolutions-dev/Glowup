import { emptyDocument } from "../editor/document";
import {
  HISTORY_LIMIT,
  amend,
  commit,
  createHistory,
  redo,
  undo,
} from "../editor/history";

const [d0, d1, d2, d3] = ["0", "1", "2", "3"].map(emptyDocument);

describe("undo and redo", () => {
  it("undoes and redoes", () => {
    const h = commit(commit(createHistory(d0), d1), d2);
    expect(undo(h).present).toBe(d1);
    expect(undo(undo(h)).present).toBe(d0);
    expect(redo(undo(h)).present).toBe(d2);
    expect(undo(createHistory(d0)).present).toBe(d0);
  });

  it("clears the future on a new commit", () => {
    const h = commit(undo(commit(createHistory(d0), d1)), d2);
    expect(redo(h)).toBe(h);
  });

  it("coalesces a run of edits with the same key", () => {
    const h = commit(
      commit(commit(createHistory(d0), d1, "text:n2"), d2, "text:n2"),
      d3,
      "text:n2",
    );
    expect(h.present).toBe(d3);
    expect(undo(h).present).toBe(d0);
  });

  it("starts a new step after an undo, even with the same key", () => {
    const h = commit(
      undo(commit(createHistory(d0), d1, "text:n2")),
      d2,
      "text:n2",
    );
    expect(undo(h).present).toBe(d0);
    expect(h.past).toHaveLength(1);
  });

  it("keeps the last hundred steps", () => {
    let h = createHistory(d0);
    for (let i = 0; i < 150; i++) h = commit(h, emptyDocument(String(i)));
    expect(h.past).toHaveLength(HISTORY_LIMIT);
  });

  it("ignores a commit of the present document", () => {
    const h = createHistory(d0);
    expect(commit(h, d0)).toBe(h);
  });
});

describe("amend", () => {
  it("replaces the present without a new step", () => {
    const h = commit(createHistory(d0), d1);
    const amended = amend(h, d2);
    expect(amended.present).toBe(d2);
    expect(amended.past).toHaveLength(h.past.length);
    expect(undo(amended).present).toBe(d0);
  });

  it("returns the same history for the same document", () => {
    const h = commit(createHistory(d0), d1);
    expect(amend(h, h.present)).toBe(h);
  });
});
