import fixture from "./__fixtures__/editor-document.json";
import {
  ancestors,
  emptyDocument,
  findNode,
  newId,
  slotNodes,
  slotOf,
  walk,
  type LayoutDocument,
} from "../editor/document";

const doc = fixture as LayoutDocument;

describe("the layout document", () => {
  it("starts empty on the default grid", () => {
    expect(emptyDocument("New")).toEqual({
      format: "glowup-layout",
      version: 1,
      name: "New",
      grid: { columns: 12, rowHeight: 48, gap: 16 },
      items: [],
    });
  });

  it("gives the next id", () => {
    expect(newId(doc)).toBe("n7");
    expect(newId(emptyDocument("New"))).toBe("n1");
  });

  it("walks the tree in order, tab panels included", () => {
    expect(walk(doc).map((n) => n.id)).toEqual([
      "n1",
      "n2",
      "n3",
      "n4",
      "n5",
      "n6",
    ]);
  });

  it("finds a node and its slot", () => {
    expect(findNode(doc, "n4")?.type).toBe("Input");
    expect(findNode(doc, "zz")).toBeNull();
    expect(slotOf(doc, "n1")).toEqual({ kind: "page" });
    expect(slotOf(doc, "n2")).toEqual({ kind: "children", parent: "n1" });
    expect(slotOf(doc, "n4")).toEqual({ kind: "tab", parent: "n3", tab: 0 });
    expect(slotOf(doc, "zz")).toBeNull();
    expect(slotNodes(doc, { kind: "tab", parent: "n3", tab: 1 })).toEqual([]);
    expect(slotNodes(doc, { kind: "page" }).map((n) => n.id)).toEqual([
      "n1",
      "n3",
      "n5",
    ]);
  });

  it("lists the ancestors, nearest first", () => {
    expect(ancestors(doc, "n4")).toEqual(["n3"]);
    expect(ancestors(doc, "n1")).toEqual([]);
  });
});
