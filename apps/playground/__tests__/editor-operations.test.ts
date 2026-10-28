import fixture from "./__fixtures__/editor-document.json";
import { checkDocument } from "../editor/check";
import { findNode, type LayoutDocument } from "../editor/document";
import {
  addTab,
  canPlace,
  duplicateNode,
  growToFit,
  insertNode,
  moveNode,
  moveTab,
  placeNode,
  removeNode,
  removeTab,
  setProps,
  setText,
} from "../editor/operations";

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === "object") {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

const doc = deepFreeze(structuredClone(fixture) as LayoutDocument);

/** Every successful operation keeps the document sound. */
const sound = (out: LayoutDocument) => {
  expect(checkDocument(out)).toEqual([]);
  return out;
};

describe("the editing operations", () => {
  it("inserts on the page at a free cell", () => {
    const { doc: out, id } = insertNode(doc, "Input", {
      slot: { kind: "page" },
      cell: { x: 6, y: 4 },
    });
    sound(out);
    expect(id).toBe("n7");
    expect(findNode(out, id)?.layout).toEqual({ x: 6, y: 4, w: 4, h: 2 });
  });

  it("pushes down what a new node lands on", () => {
    const { doc: out } = insertNode(doc, "Paper", {
      slot: { kind: "page" },
      cell: { x: 0, y: 0 },
    });
    sound(out);
    expect(findNode(out, "n1")?.layout?.y).toBe(4);
    expect(findNode(out, "n5")?.layout?.y).toBe(8);
  });

  it("inserts into a flow container at an index, without a layout", () => {
    const { doc: out, id } = insertNode(doc, "Input", {
      slot: { kind: "children", parent: "n5" },
      index: 0,
    });
    sound(out);
    expect(findNode(out, "n5")?.children?.[0].id).toBe(id);
    expect(findNode(out, id)?.layout).toBeUndefined();
  });

  it("moves between grids keeping the size, and out of a flow with the default size", () => {
    const a = sound(
      moveNode(doc, "n2", { slot: { kind: "page" }, cell: { x: 0, y: 8 } }),
    );
    expect(findNode(a, "n2")?.layout).toEqual({ x: 0, y: 8, w: 6, h: 1 });
    expect(findNode(a, "n1")?.children).toEqual([]);
    const b = sound(
      moveNode(doc, "n6", { slot: { kind: "page" }, cell: { x: 8, y: 8 } }),
    );
    expect(findNode(b, "n6")?.layout).toEqual({ x: 8, y: 8, w: 3, h: 1 });
  });

  it("refuses to move a node into itself", () => {
    expect(
      moveNode(doc, "n1", {
        slot: { kind: "children", parent: "n1" },
        cell: { x: 0, y: 2 },
      }),
    ).toBe(doc);
  });

  it("cuts a node to the columns of a narrower grid", () => {
    const { doc: wide, id } = insertNode(doc, "DataGrid", {
      slot: { kind: "page" },
      cell: { x: 0, y: 8 },
    });
    const out = sound(
      moveNode(wide, id, {
        slot: { kind: "children", parent: "n1" },
        cell: { x: 3, y: 1 },
      }),
    );
    expect(findNode(out, id)?.layout).toMatchObject({ x: 0, w: 6 });
  });

  it("removes a node with its children", () => {
    const out = sound(removeNode(doc, "n1"));
    expect(findNode(out, "n2")).toBeNull();
  });

  it("duplicates below the original with new ids", () => {
    const { doc: out, id } = duplicateNode(doc, "n1");
    sound(out);
    expect(findNode(out, id)?.layout).toEqual({ x: 0, y: 4, w: 6, h: 4 });
    expect(findNode(out, id)?.children?.[0].id).not.toBe("n2");
    expect(findNode(out, "n5")?.layout?.y).toBe(8);
  });

  it("widens a container, its columns following, and pushes down what it now covers", () => {
    const out = sound(placeNode(doc, "n1", { x: 0, y: 0, w: 8, h: 4 }));
    expect(findNode(out, "n1")).toMatchObject({
      columns: 8,
      layout: { w: 8 },
    });
    expect(findNode(out, "n3")?.layout?.y).toBe(4);
  });

  it("never narrows a container past its children", () => {
    const out = sound(placeNode(doc, "n1", { x: 0, y: 0, w: 3, h: 4 }));
    expect(findNode(out, "n1")?.layout?.w).toBe(6);
  });

  it("grows to fit its content and pushes down below it", () => {
    const out = sound(growToFit(doc, "n1", 400)); // rowsFor(400) = 7
    expect(findNode(out, "n1")?.layout?.h).toBe(7);
    expect(findNode(out, "n5")?.layout?.y).toBe(7);
    expect(growToFit(doc, "n1", 10)).toBe(doc); // never shrinks
  });

  it("edits props and text", () => {
    const out = sound(setProps(doc, "n1", { elevation: 2 }));
    expect(findNode(out, "n1")?.props).toEqual({ elevation: 2 });
    expect(
      findNode(setProps(out, "n1", { elevation: undefined }), "n1")?.props,
    ).toEqual({});
    expect(findNode(setText(doc, "n2", "Hello"), "n2")?.text).toBe("Hello");
  });

  it("edits tabs and keeps at least one tab", () => {
    const added = sound(addTab(doc, "n3", "C"));
    expect(findNode(added, "n3")?.tabs?.map((t) => t.label)).toEqual([
      "A",
      "B",
      "C",
    ]);
    expect(
      findNode(moveTab(added, "n3", 0, 2), "n3")?.tabs?.map((t) => t.label),
    ).toEqual(["B", "C", "A"]);
    const removed = sound(removeTab(doc, "n3", 0));
    expect(findNode(removed, "n4")).toBeNull();
    expect(removeTab(removed, "n3", 0)).toBe(removed); // "B" is the last tab
  });

  it("binds a field moved into a Form and unbinds it when it leaves", () => {
    const { doc: withForm, id: form } = insertNode(doc, "Form", {
      slot: { kind: "page" },
      cell: { x: 0, y: 8 },
    });
    const inside = sound(
      moveNode(withForm, "n4", {
        slot: { kind: "children", parent: form },
        cell: { x: 0, y: 0 },
      }),
    );
    expect(findNode(inside, "n4")?.field).toEqual({ name: "name", rules: [] });
    const outside = sound(
      moveNode(inside, "n4", { slot: { kind: "page" }, cell: { x: 6, y: 20 } }),
    );
    expect(findNode(outside, "n4")?.field).toBeUndefined();
  });

  it("renames a duplicated field", () => {
    const { doc: withForm, id: form } = insertNode(doc, "Form", {
      slot: { kind: "page" },
      cell: { x: 0, y: 8 },
    });
    const inside = moveNode(withForm, "n4", {
      slot: { kind: "children", parent: form },
      cell: { x: 0, y: 0 },
    });
    const { doc: out, id } = duplicateNode(inside, "n4");
    sound(out);
    expect(findNode(out, id)?.field?.name).toBe("name2");
  });

  it("refuses a Form in a Form", () => {
    const { doc: withForm, id: form } = insertNode(doc, "Form", {
      slot: { kind: "page" },
      cell: { x: 0, y: 8 },
    });
    expect(canPlace(withForm, "Form", { kind: "children", parent: form })).toBe(
      false,
    );
  });
});
