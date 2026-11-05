import fixture from "./__fixtures__/editor-document.json";
import {
  findNode,
  slotOf,
  type LayoutDocument,
  type LayoutNode,
} from "../editor/document";
import {
  codeProps,
  dataProps,
  layerTree,
  moveInto,
  moveTargets,
} from "../editor/panels";

const deepFreeze = <T>(value: T): T => {
  if (value && typeof value === "object") {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
};

const doc = deepFreeze(structuredClone(fixture) as LayoutDocument);

const withItems = (...items: LayoutNode[]): LayoutDocument => {
  const out = structuredClone(fixture) as LayoutDocument;
  out.items.push(...items);
  return deepFreeze(out);
};

describe("the panels", () => {
  it("lists the data props, not the registry's", () => {
    const select: LayoutNode = {
      id: "s1",
      type: "Select",
      props: { label: "Choice" },
    };
    expect(dataProps(select, ["label", "placeholder"])).toEqual(["options"]);
    expect(dataProps(findNode(doc, "n2")!, ["variant"])).toEqual([]);
  });

  it("lists the props set in code", () => {
    const code = codeProps("Button");
    expect(code).toContain("onClick");
    expect(code).not.toContain("variant");
    // The editor owns children: the text (Content) or the layout.
    expect(codeProps("Typography")).not.toContain("children");
    expect(codeProps("Paper")).not.toContain("children");
  });

  it("draws the document as layers", () => {
    expect(layerTree(doc)).toEqual([
      {
        id: "n1",
        label: "Paper",
        children: [{ id: "n2", label: "Typography · Hi" }],
      },
      {
        id: "n3",
        label: "TabbedPanel",
        children: [
          {
            id: "n3:tab0",
            label: "A",
            children: [{ id: "n4", label: "Input · Name" }],
          },
          { id: "n3:tab1", label: "B", children: [] },
        ],
      },
      {
        id: "n5",
        label: "VStack",
        children: [{ id: "n6", label: "Button · Save" }],
      },
    ]);
  });

  it("offers only the containers that can take the node", () => {
    expect(moveTargets(doc, "n6").map((t) => t.id)).toEqual([
      null,
      "n1",
      "n3",
      "n5",
    ]);
    expect(moveTargets(doc, "n1").map((t) => t.id)).not.toContain("n1");
    const list = withItems({
      id: "ls",
      type: "ListSection",
      props: {},
      layout: { x: 0, y: 7, w: 4, h: 3 },
      children: [],
    });
    expect(moveTargets(list, "n6").map((t) => t.id)).not.toContain("ls");
    const forms = structuredClone(fixture) as LayoutDocument;
    forms.items.push({
      id: "f1",
      type: "Form",
      props: {},
      layout: { x: 6, y: 4, w: 6, h: 4 },
      columns: 6,
      children: [],
    });
    findNode(forms, "n1")!.children!.push({
      id: "f2",
      type: "Form",
      props: {},
      layout: { x: 0, y: 1, w: 6, h: 2 },
      columns: 6,
      children: [],
    });
    expect(moveTargets(deepFreeze(forms), "n1").map((t) => t.id)).not.toContain(
      "f1",
    );
  });

  it("moves a node into a container", () => {
    const intoPaper = moveInto(doc, "n6", "n1", {});
    expect(slotOf(intoPaper, "n6")).toEqual({ kind: "children", parent: "n1" });
    expect(findNode(intoPaper, "n6")?.layout).toEqual({
      x: 0,
      y: 1,
      w: 3,
      h: 1,
    });
    const intoStack = moveInto(doc, "n2", "n5", {});
    expect(findNode(intoStack, "n5")?.children?.map((n) => n.id)).toEqual([
      "n6",
      "n2",
    ]);
    expect(slotOf(moveInto(doc, "n6", null, {}), "n6")).toEqual({
      kind: "page",
    });
  });
});
