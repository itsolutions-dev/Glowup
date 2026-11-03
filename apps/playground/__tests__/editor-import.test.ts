import fixture from "./__fixtures__/editor-document.json";
import { checkDocument } from "../editor/check";
import { findNode, type LayoutDocument } from "../editor/document";
import { exportCode } from "../editor/codegen";
import { parseLayout } from "../editor/importJson";
import detail from "../editor/starters/detail.json";

const json = (value: unknown) => JSON.stringify(value, null, 2);

/** The fixture with everything the importer repairs. */
const broken = () => {
  const doc = structuredClone(fixture) as LayoutDocument;
  findNode(doc, "n2")!.props.colour = "red";
  findNode(doc, "n6")!.layout = { x: 0, y: 0, w: 2, h: 1 };
  findNode(doc, "n5")!.layout = { x: 10, y: 0, w: 4, h: 3 };
  doc.items.push(
    {
      id: "n7",
      type: "Nope",
      props: {},
      layout: { x: 0, y: 8, w: 2, h: 1 },
    },
    {
      id: "ls",
      type: "ListSection",
      props: {},
      layout: { x: 4, y: 8, w: 4, h: 3 },
      children: [{ id: "n8", type: "Button", props: {}, text: "X" }],
    },
    {
      id: "n4",
      type: "Typography",
      props: {},
      text: "Dup",
      layout: { x: 8, y: 8, w: 4, h: 1 },
    },
  );
  return doc;
};

describe("parseLayout", () => {
  it("opens what the editor exports, unchanged", () => {
    const result = parseLayout(json(detail));
    expect(result).toEqual({ ok: true, doc: detail, notes: [] });
  });

  it("refuses what it cannot open", () => {
    const error = (text: string) => {
      const result = parseLayout(text);
      return result.ok ? null : result.error;
    };
    expect(error("{")).toMatch(/^Not JSON/);
    expect(error("{}")).toBe("Not a Glowup layout");
    expect(error(json({ ...fixture, version: 2 }))).toBe(
      "Made by a newer editor (version 2)",
    );
    expect(error(json({ format: "glowup-layout", version: 1 }))).toBe(
      "No grid or items",
    );
  });

  it("repairs what it can and says so", () => {
    const result = parseLayout(json(broken()));
    if (!result.ok) throw new Error(result.error);
    expect(result.notes).toHaveLength(8);
    expect(result.notes).toEqual(
      expect.arrayContaining([
        'Removed "colour" from n2',
        "Removed n6's layout: a VStack keeps an order",
        "Moved n5 inside the 12 columns",
        "Moved n5 down: it overlapped another item",
        'Dropped n7: unknown type "Nope"',
        "Dropped n8: a ListSection does not take a Button",
        expect.stringMatching(/^Renamed ls to n[0-9]+$/),
        expect.stringMatching(/^Renamed a second n4 to n\d+$/),
      ]),
    );
    expect(findNode(result.doc, "n5")?.layout).toEqual({
      x: 8,
      y: 4,
      w: 4,
      h: 3,
    });
  });

  it("every document it returns is sound", () => {
    for (const text of [json(detail), json(fixture), json(broken())]) {
      const result = parseLayout(text);
      if (!result.ok) throw new Error(result.error);
      expect(checkDocument(result.doc)).toEqual([]);
    }
  });
});

describe("parseLayout, after the review", () => {
  const one = (node: unknown, columns = 12) =>
    json({
      format: "glowup-layout",
      version: 1,
      name: "One",
      grid: { columns, rowHeight: 48, gap: 16 },
      items: [node],
    });

  it("rebuilds a field binding that has no rules", () => {
    const result = parseLayout(
      one({
        id: "n1",
        type: "Form",
        props: {},
        layout: { x: 0, y: 0, w: 6, h: 4 },
        columns: 6,
        children: [
          {
            id: "n2",
            type: "Input",
            props: { label: "Email" },
            layout: { x: 0, y: 0, w: 4, h: 2 },
            field: { name: "email" },
          },
        ],
      }),
    );
    if (!result.ok) throw new Error(result.error);
    expect(findNode(result.doc, "n2")?.field?.rules).toEqual([]);
    expect(() => exportCode(result.doc)).not.toThrow();
  });

  it("gives an id that is not n<number> a new one", () => {
    const result = parseLayout(
      one({
        id: "my-box",
        type: "Paper",
        props: {},
        layout: { x: 0, y: 0, w: 6, h: 4 },
        columns: 6,
        children: [],
      }),
    );
    if (!result.ok) throw new Error(result.error);
    expect(result.doc.items[0].id).toMatch(/^n\d+$/);
    expect(result.notes).toEqual([
      expect.stringMatching(/^Renamed my-box to n\d+$/),
    ]);
  });

  it("makes a container's columns follow its width", () => {
    const paper = {
      id: "n1",
      type: "Paper",
      props: {},
      layout: { x: 0, y: 0, w: 6, h: 4 },
      columns: 12,
      children: [
        {
          id: "n2",
          type: "Typography",
          props: {},
          text: "Wide",
          layout: { x: 0, y: 0, w: 12, h: 1 },
        },
      ],
    };
    const wide = parseLayout(one(paper));
    if (!wide.ok) throw new Error(wide.error);
    expect(wide.doc.items[0].columns).toBe(6);
    expect(findNode(wide.doc, "n2")?.layout?.w).toBe(6);
    const narrow = parseLayout(one({ ...paper, columns: 6 }, 4));
    if (!narrow.ok) throw new Error(narrow.error);
    expect(narrow.doc.items[0]).toMatchObject({
      columns: 4,
      layout: { w: 4 },
    });
  });

  it("removes a prop of the wrong kind", () => {
    const result = parseLayout(
      one({
        id: "n1",
        type: "Select",
        props: { label: "Choice", options: "nope" },
        layout: { x: 0, y: 0, w: 4, h: 2 },
      }),
    );
    if (!result.ok) throw new Error(result.error);
    expect(result.doc.items[0].props.options).toBeUndefined();
    expect(result.notes).toContain(
      'Removed "options" from n1: not the kind of value it takes',
    );
  });
});
