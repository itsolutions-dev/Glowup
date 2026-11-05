import React, { useEffect } from "react";
import { act, render } from "@testing-library/react-native";

import fixture from "./__fixtures__/editor-document.json";
import { findNode, type LayoutDocument } from "../editor/document";
import { nudge } from "../editor/keys";
import { editorShortcuts } from "../editor/canvas/shortcuts";
import { useEditor, type Editor } from "../editor/canvas/useEditor";
import { matchShortcut } from "../site/useKeyboardShortcuts";

const doc = fixture as LayoutDocument;

describe("nudge", () => {
  it("moves and resizes the selected node one cell, as dragging would", () => {
    expect(
      findNode(nudge(doc, "n1", "ArrowRight", false), "n1")?.layout,
    ).toEqual({
      x: 1,
      y: 0,
      w: 6,
      h: 4,
    });
    expect(
      findNode(nudge(doc, "n1", "ArrowRight", true), "n1")?.layout?.w,
    ).toBe(7);
    expect(findNode(nudge(doc, "n1", "ArrowDown", true), "n1")?.layout?.h).toBe(
      5,
    );
  });

  it("does nothing without a node on a grid, or at the grid's edge", () => {
    expect(nudge(doc, null, "ArrowRight", false)).toBe(doc);
    expect(nudge(doc, "n6", "ArrowRight", false)).toBe(doc);
    expect(nudge(doc, "n1", "ArrowLeft", false)).toBe(doc);
    expect(nudge(doc, "n1", "ArrowUp", false)).toBe(doc);
  });
});

let editor: Editor;
const Harness = () => {
  const current = useEditor(doc);
  useEffect(() => {
    editor = current;
  });
  return null;
};

const press = (
  key: string,
  mods: { meta?: boolean; shift?: boolean } = {},
  typing = false,
) =>
  act(async () => {
    matchShortcut(
      editorShortcuts(editor),
      {
        key,
        metaKey: false,
        ctrlKey: mods.meta === true,
        shiftKey: mods.shift === true,
        altKey: false,
      },
      typing,
    )?.run();
  });

describe("the editor's shortcuts", () => {
  beforeEach(async () => {
    await render(<Harness />);
    await act(async () => editor.select("n1"));
  });

  it("deletes, undoes and redoes", async () => {
    await press("Delete");
    expect(findNode(editor.doc, "n1")).toBeNull();
    await press("z", { meta: true });
    expect(findNode(editor.doc, "n1")).not.toBeNull();
    await press("Z", { meta: true, shift: true });
    expect(findNode(editor.doc, "n1")).toBeNull();
  });

  it("moves with arrows and resizes with Shift and arrows, one step per node", async () => {
    await press("ArrowRight");
    await press("ArrowRight");
    expect(findNode(editor.doc, "n1")?.layout?.x).toBe(2);
    await press("ArrowDown", { shift: true });
    expect(findNode(editor.doc, "n1")?.layout?.h).toBe(5);
    await act(async () => editor.undo());
    expect(findNode(editor.doc, "n1")?.layout).toEqual({
      x: 0,
      y: 0,
      w: 6,
      h: 4,
    });
  });

  it("duplicates, and clears the selection with Escape", async () => {
    await press("d", { meta: true });
    expect(editor.selected).toBe("n7");
    await press("Escape");
    expect(editor.selected).toBeNull();
  });

  it("leaves a field being typed in alone", async () => {
    await press("Backspace", {}, true);
    await press("z", { meta: true }, true);
    expect(findNode(editor.doc, "n1")).not.toBeNull();
    expect(editor.canUndo).toBe(false);
  });
});
