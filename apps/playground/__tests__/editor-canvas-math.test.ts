import fixture from "./__fixtures__/editor-document.json";
import {
  addTarget,
  applyPlan,
  boxPlacement,
  cellPitch,
  dropTarget,
  pageRows,
  resizePlacement,
  shownTab,
  targetKey,
} from "../editor/canvasMath";
import {
  emptyDocument,
  findNode,
  type LayoutDocument,
  type LayoutNode,
} from "../editor/document";

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === "object") {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

const doc = deepFreeze(structuredClone(fixture) as LayoutDocument);

const VSTACK = { id: "n5", data: { kind: "node", type: "VStack" } };
const over = (rect: { x: number; y: number }, data: unknown = PAGE) => ({
  id: "page",
  data,
  index: 0,
  rect: { ...rect, width: 384, height: 176 },
  zone: { width: 1184, height: 704 },
});
const PAGE = { kind: "grid", slot: { kind: "page" } };

describe("dropTarget", () => {
  it("snaps the preview's corner to a cell of the grid under it", () => {
    expect(dropTarget(doc, VSTACK, over({ x: 400, y: 256 }))).toEqual({
      source: { kind: "node", id: "n5" },
      dest: { slot: { kind: "page" }, cell: { x: 4, y: 4 } },
    });
  });

  it("keeps the node inside the columns", () => {
    expect(dropTarget(doc, VSTACK, over({ x: 1100, y: 256 }))?.dest).toEqual({
      slot: { kind: "page" },
      cell: { x: 8, y: 4 },
    });
  });

  it("has no target outside a grid, in a refusing slot or for a missing node", () => {
    expect(dropTarget(doc, VSTACK, null)).toBeNull();
    expect(
      dropTarget(doc, VSTACK, over({ x: 0, y: 0 }, { kind: "list" })),
    ).toBeNull();
    expect(
      dropTarget(
        doc,
        { id: "n1", data: { kind: "node", type: "Paper" } },
        over(
          { x: 0, y: 0 },
          { kind: "grid", slot: { kind: "children", parent: "n2" } },
        ),
      ),
    ).toBeNull();
    expect(
      dropTarget(
        doc,
        { id: "nope", data: { kind: "node", type: "Paper" } },
        over({ x: 0, y: 0 }),
      ),
    ).toBeNull();
  });
});

describe("targetKey", () => {
  it("names a target by node, slot and cell", () => {
    expect(targetKey(dropTarget(doc, VSTACK, over({ x: 400, y: 256 })))).toBe(
      "n5@page:4,4",
    );
    expect(targetKey(null)).toBeNull();
  });
});

describe("cellPitch", () => {
  it("is a column with its gap across, a row with its gap down", () => {
    expect(cellPitch(1184, 12, doc.grid)).toEqual({ x: 100, y: 64 });
  });
});

describe("resizePlacement", () => {
  const start = { x: 2, y: 1, w: 4, h: 3 };
  const pitch = { x: 100, y: 64 };
  it.each([
    ["e", 210, 0, { x: 2, y: 1, w: 6, h: 3 }],
    ["w", -100, 0, { x: 1, y: 1, w: 5, h: 3 }],
    ["s", 0, 130, { x: 2, y: 1, w: 4, h: 5 }],
    ["n", 0, -64, { x: 2, y: 0, w: 4, h: 4 }],
    ["se", 100, 64, { x: 2, y: 1, w: 5, h: 4 }],
    ["nw", 100, 64, { x: 3, y: 2, w: 3, h: 2 }],
    ["e", 40, 0, start],
  ] as const)("%s by %i, %i", (handle, dx, dy, expected) => {
    expect(resizePlacement(start, handle, dx, dy, pitch)).toEqual(expected);
  });
});

describe("pageRows", () => {
  it("reaches the lowest item, four more while dragging, at least four", () => {
    expect(pageRows(doc, false)).toBe(7);
    expect(pageRows(doc, true)).toBe(11);
    expect(pageRows(emptyDocument("x"), false)).toBe(4);
  });
});

describe("boxPlacement", () => {
  it("places a box as GridLayout places its item", () => {
    expect(boxPlacement({ x: 3, y: 2, w: 6, h: 3 }, 12, 48, 16)).toEqual({
      position: "absolute",
      left: "25%",
      marginLeft: 4,
      right: "25%",
      marginRight: 4,
      top: 128,
      height: 176,
    });
  });
});

const N5: { kind: "children"; parent: string } = {
  kind: "children",
  parent: "n5",
};
const N2 = { id: "n2", data: { kind: "node", type: "Typography" } };
const NEW_INPUT = { id: "new:Input", data: { kind: "new", type: "Input" } };

/** The fixture plus an empty Form `f1` and an empty ListSection `ls` on the page. */
const extras = deepFreeze({
  ...structuredClone(fixture),
  items: [
    ...structuredClone(fixture).items,
    {
      id: "ls",
      type: "ListSection",
      props: {},
      layout: { x: 0, y: 7, w: 4, h: 3 },
      children: [],
    },
    {
      id: "f1",
      type: "Form",
      props: {},
      layout: { x: 0, y: 10, w: 6, h: 4 },
      columns: 6,
      children: [],
    },
  ],
} as LayoutDocument);

describe("dropTarget, for the palette and the containers", () => {
  it("places a new component from the palette by cell", () => {
    expect(dropTarget(doc, NEW_INPUT, over({ x: 400, y: 256 }))).toEqual({
      source: { kind: "new", type: "Input" },
      dest: { slot: { kind: "page" }, cell: { x: 4, y: 4 } },
    });
  });

  it("places by index in a flow container", () => {
    const flow = {
      ...over({ x: 0, y: 0 }, { kind: "flow", slot: N5 }),
      index: 1,
    };
    expect(dropTarget(doc, N2, flow)?.dest).toEqual({ slot: N5, index: 1 });
  });

  it("places on a tab at the first free cell of its panel", () => {
    const slot = { kind: "tab", parent: "n3", tab: 1 };
    expect(
      dropTarget(doc, N2, over({ x: 0, y: 0 }, { kind: "tab", slot }))?.dest,
    ).toEqual({ slot, index: 0 });
  });

  it("has no target for a type the zone refuses, or an unknown type", () => {
    const newOf = (type: string) => ({
      id: `new:${type}`,
      data: { kind: "new", type },
    });
    expect(
      dropTarget(
        extras,
        newOf("Form"),
        over(
          { x: 0, y: 0 },
          { kind: "grid", slot: { kind: "children", parent: "f1" } },
        ),
      ),
    ).toBeNull();
    expect(dropTarget(doc, newOf("Nope"), over({ x: 0, y: 0 }))).toBeNull();
    expect(
      dropTarget(
        extras,
        newOf("Button"),
        over(
          { x: 0, y: 0 },
          { kind: "flow", slot: { kind: "children", parent: "ls" } },
        ),
      ),
    ).toBeNull();
  });
});

describe("applyPlan", () => {
  it("inserts a new component and names it", () => {
    const plan = dropTarget(doc, NEW_INPUT, over({ x: 400, y: 256 }));
    const result = applyPlan(doc, plan!);
    expect(result.id).toBe("n7");
    expect(findNode(result.doc, "n7")?.layout).toEqual({
      x: 4,
      y: 4,
      w: 4,
      h: 2,
    });
  });

  it("moves a node and names it", () => {
    const plan = dropTarget(doc, VSTACK, over({ x: 400, y: 256 }));
    expect(applyPlan(doc, plan!).id).toBe("n5");
  });
});

describe("targetKey, for the palette and the containers", () => {
  it("names a new component's target, and an index", () => {
    expect(
      targetKey(dropTarget(doc, NEW_INPUT, over({ x: 400, y: 256 }))),
    ).toBe("new:Input@page:4,4");
    const flow = {
      ...over({ x: 0, y: 0 }, { kind: "flow", slot: N5 }),
      index: 1,
    };
    expect(targetKey(dropTarget(doc, N2, flow))).toBe("n2@children:n5:#1");
  });
});

describe("shownTab", () => {
  const n3 = findNode(doc, "n3") as LayoutNode;
  it("is the tab the editor opened, the first by default, never past the last", () => {
    expect(shownTab(n3, { n3: 5 })).toBe(1);
    expect(shownTab(n3, {})).toBe(0);
  });
});

describe("addTarget", () => {
  const PAGE_FIRST = { slot: { kind: "page" }, index: 0 };
  it("adds into the selected container, or on the page", () => {
    expect(addTarget(doc, "Input", null, {})).toEqual(PAGE_FIRST);
    expect(addTarget(doc, "Input", "n1", {})).toEqual({
      slot: { kind: "children", parent: "n1" },
      index: 0,
    });
    expect(addTarget(doc, "Input", "n5", {})).toEqual({ slot: N5, index: 1 });
    expect(addTarget(doc, "Input", "n3", { n3: 1 })).toEqual({
      slot: { kind: "tab", parent: "n3", tab: 1 },
      index: 0,
    });
  });

  it("adds on the page when the selection cannot take the type", () => {
    expect(addTarget(doc, "Input", "n2", {})).toEqual(PAGE_FIRST);
    expect(addTarget(extras, "Button", "ls", {})).toEqual(PAGE_FIRST);
  });
});
