import fixture from "./__fixtures__/editor-document.json";
import { checkDocument } from "../editor/check";
import { findNode, type LayoutDocument } from "../editor/document";
import { setFieldName } from "../editor/forms";
import {
  addTab,
  canPlace,
  duplicateNode,
  growToFit,
  insertNode,
  moveNode,
  moveTab,
  placeNode,
  renameTab,
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

  it("duplicates at the first free cell below the original, with new ids", () => {
    // Spec §11.6: from the original's bottom row, the first place it fits;
    // nothing is pushed.
    const { doc: out, id } = duplicateNode(doc, "n1");
    sound(out);
    expect(findNode(out, id)?.layout).toEqual({ x: 4, y: 4, w: 6, h: 4 });
    expect(findNode(out, id)?.children?.[0].id).not.toBe("n2");
    expect(findNode(out, "n5")?.layout?.y).toBe(4);
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
    expect(findNode(inside, "n4")?.field).toEqual({
      name: "name",
      rules: [],
      auto: true,
    });
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

describe("the editing operations, after the review", () => {
  // A Form with a section (a VStack) first and a bound Input below it, and an
  // Input labelled the same on the page.
  const withSections = deepFreeze({
    ...structuredClone(fixture),
    items: [
      ...structuredClone(fixture).items,
      {
        id: "n7",
        type: "Form",
        props: {},
        layout: { x: 0, y: 8, w: 6, h: 6 },
        columns: 6,
        children: [
          {
            id: "n8",
            type: "VStack",
            props: {},
            layout: { x: 0, y: 0, w: 4, h: 3 },
            children: [
              {
                id: "n11",
                type: "Input",
                props: { label: "Text" },
                field: { name: "text", rules: [], auto: true },
              },
            ],
          },
          {
            id: "n9",
            type: "Input",
            props: { label: "Email" },
            layout: { x: 0, y: 3, w: 4, h: 2 },
            field: { name: "email", rules: [], auto: true },
          },
        ],
      },
      {
        id: "n10",
        type: "Input",
        props: { label: "Email" },
        layout: { x: 6, y: 8, w: 4, h: 2 },
      },
    ],
  } as LayoutDocument);

  it("keeps the names of fields already in the Form when a newcomer arrives earlier", () => {
    const moved = sound(
      moveNode(withSections, "n10", {
        slot: { kind: "children", parent: "n8" },
        index: 0,
      }),
    );
    expect(findNode(moved, "n9")?.field?.name).toBe("email");
    expect(findNode(moved, "n10")?.field?.name).toBe("email2");
    const { doc: inserted, id } = insertNode(withSections, "Input", {
      slot: { kind: "children", parent: "n8" },
      index: 0,
    });
    sound(inserted);
    expect(findNode(inserted, "n11")?.field?.name).toBe("text");
    expect(findNode(inserted, id)?.field?.name).toBe("text2");
  });

  it("brings a container out of a flow no narrower than its children", () => {
    const { doc: a, id: paper } = insertNode(doc, "Paper", {
      slot: { kind: "page" },
      cell: { x: 0, y: 8 },
    });
    const b = placeNode(a, paper, { x: 0, y: 8, w: 10, h: 4 });
    const { doc: c } = insertNode(b, "Input", {
      slot: { kind: "children", parent: paper },
      cell: { x: 6, y: 0 },
    });
    const inFlow = sound(
      moveNode(c, paper, {
        slot: { kind: "children", parent: "n5" },
        index: 0,
      }),
    );
    const back = sound(
      moveNode(inFlow, paper, {
        slot: { kind: "page" },
        cell: { x: 0, y: 12 },
      }),
    );
    expect(findNode(back, paper)?.layout?.w).toBe(10);
  });

  it("puts a node sent to a grid by index at the first free cell", () => {
    const out = sound(
      moveNode(doc, "n6", { slot: { kind: "page" }, index: 0 }),
    );
    expect(findNode(out, "n6")?.layout).toEqual({ x: 4, y: 4, w: 3, h: 1 });
  });

  it("returns the same document for an edit that changes nothing", () => {
    expect(placeNode(doc, "n1", { x: 0, y: 0, w: 6, h: 4 })).toBe(doc);
    expect(
      moveNode(doc, "n1", { slot: { kind: "page" }, cell: { x: 0, y: 0 } }),
    ).toBe(doc);
    expect(setProps(doc, "n4", { label: "Name" })).toBe(doc);
    expect(setText(doc, "n2", "Hi")).toBe(doc);
    expect(moveTab(doc, "n3", 0, 0)).toBe(doc);
    expect(renameTab(doc, "n3", 0, "A")).toBe(doc);
  });

  it("keeps a slot's order when a node moves within it", () => {
    const out = sound(placeNode(doc, "n1", { x: 0, y: 1, w: 6, h: 4 }));
    expect(out.items.map((n) => n.id)).toEqual(["n1", "n3", "n5"]);
  });

  it("moves only the edge a resize handle drags", () => {
    // Left handle past the first column: the right edge stays at 4.
    expect(
      findNode(placeNode(doc, "n5", { x: -1, y: 4, w: 5, h: 3 }), "n5")?.layout,
    ).toEqual({ x: 0, y: 4, w: 4, h: 3 });
    // Top handle past the first row: the bottom edge stays at 4.
    expect(
      findNode(placeNode(doc, "n3", { x: 6, y: -1, w: 6, h: 5 }), "n3")?.layout,
    ).toEqual({ x: 6, y: 0, w: 6, h: 4 });
    // Left handle past the minimum width (Input: 2): the right edge stays at 8.
    const { doc: withInput, id } = insertNode(doc, "Input", {
      slot: { kind: "page" },
      cell: { x: 4, y: 8 },
    });
    expect(
      findNode(placeNode(withInput, id, { x: 7, y: 8, w: 1, h: 2 }), id)
        ?.layout,
    ).toEqual({ x: 6, y: 8, w: 2, h: 2 });
  });

  it("names a field after its label until the name is set by hand", () => {
    const relabelled = sound(
      setProps(withSections, "n9", { label: "Work email" }),
    );
    expect(findNode(relabelled, "n9")?.field?.name).toBe("workEmail");
    const named = setFieldName(withSections, "n9", "contact");
    const kept = sound(setProps(named, "n9", { label: "Phone" }));
    expect(findNode(kept, "n9")?.field?.name).toBe("contact");
  });

  it("refuses text on a component that has none", () => {
    expect(setText(doc, "n1", "Hello")).toBe(doc);
  });

  it("keeps cells whole and refuses numbers that are not", () => {
    const { doc: out, id } = insertNode(doc, "Input", {
      slot: { kind: "page" },
      cell: { x: 6.4, y: 4.4 },
    });
    sound(out);
    expect(findNode(out, id)?.layout).toMatchObject({ x: 6, y: 4 });
    expect(growToFit(doc, "n1", NaN)).toBe(doc);
    expect(placeNode(doc, "n1", { x: 0, y: 0, w: 6, h: NaN })).toBe(doc);
    const broken = structuredClone(fixture) as LayoutDocument;
    broken.items[0].layout = { x: 0, y: 0.5, w: 6, h: 4 };
    expect(checkDocument(broken)).toContain("n1: not on whole cells");
  });
});
