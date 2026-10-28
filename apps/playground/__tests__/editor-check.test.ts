import fixture from "./__fixtures__/editor-document.json";
import { checkDocument } from "../editor/check";
import type { LayoutDocument } from "../editor/document";

const clone = () => structuredClone(fixture) as LayoutDocument;

describe("the document's invariants", () => {
  it("finds the fixture sound", () => {
    expect(checkDocument(fixture as LayoutDocument)).toEqual([]);
  });

  it("reports each broken invariant", () => {
    const dup = clone();
    dup.items[2].children![0].id = "n2";
    expect(checkDocument(dup)).toContain("n2: duplicate id");

    const unknown = clone();
    unknown.items[0].type = "Gizmo";
    expect(checkDocument(unknown)).toContain("n1: unknown type Gizmo");

    const overlap = clone();
    overlap.items[2].layout = { x: 0, y: 3, w: 4, h: 3 };
    expect(checkDocument(overlap)).toContain("n1 and n5 overlap");

    const wide = clone();
    wide.items[0].layout!.w = 8;
    expect(checkDocument(wide)).toContain("n1: columns 6, width 8");

    const outside = clone();
    outside.items[2].layout = { x: 10, y: 4, w: 4, h: 3 };
    expect(checkDocument(outside)).toContain("n5: outside the 12 columns");

    const noLayout = clone();
    delete noLayout.items[2].layout;
    expect(checkDocument(noLayout)).toContain("n5: needs a layout on a grid");

    const flowLayout = clone();
    flowLayout.items[2].children![0].layout = { x: 0, y: 0, w: 1, h: 1 };
    expect(checkDocument(flowLayout)).toContain(
      "n6: has a layout in a flow container",
    );

    const text = clone();
    text.items[0].text = "Hello";
    expect(checkDocument(text)).toContain("n1: text on a grid");

    const noTabs = clone();
    noTabs.items[1].tabs = [];
    expect(checkDocument(noTabs)).toContain("n3: a TabbedPanel needs a tab");

    const refused = clone();
    refused.items[0].children!.push({
      id: "n7",
      type: "ListItem",
      props: {},
      layout: { x: 0, y: 1, w: 4, h: 1 },
    });
    refused.items[2].type = "ListSection";
    expect(checkDocument(refused)).toContain("n5: does not take Button");

    const stray = clone();
    stray.items[0].children![0].field = { name: "x", rules: [] };
    expect(checkDocument(stray)).toContain("n2: field outside a Form");
  });

  it("checks forms", () => {
    const doc = clone();
    doc.items.push({
      id: "n7",
      type: "Form",
      props: {},
      layout: { x: 0, y: 8, w: 6, h: 4 },
      columns: 6,
      children: [
        {
          id: "n8",
          type: "Input",
          props: {},
          layout: { x: 0, y: 0, w: 3, h: 2 },
          field: { name: "email", rules: [] },
        },
        {
          id: "n9",
          type: "Input",
          props: {},
          layout: { x: 3, y: 0, w: 3, h: 2 },
          field: { name: "email", rules: [] },
        },
        {
          id: "n10",
          type: "Form",
          props: {},
          layout: { x: 0, y: 2, w: 6, h: 2 },
          columns: 6,
          children: [],
        },
        {
          id: "n11",
          type: "Input",
          props: {},
          layout: { x: 0, y: 4, w: 3, h: 2 },
          field: { name: "my email", rules: [] },
        },
      ],
    });
    expect(checkDocument(doc)).toEqual(
      expect.arrayContaining([
        "n7: field name email used twice",
        "n10: a Form inside a Form",
        "n11: field name my email is not an identifier",
      ]),
    );
  });
});
