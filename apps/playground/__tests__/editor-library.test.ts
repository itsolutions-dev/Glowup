import fixture from "./__fixtures__/editor-document.json";
import { checkDocument } from "../editor/check";
import type { LayoutDocument } from "../editor/document";
import { parseLayout } from "../editor/importJson";
import {
  addLayout,
  emptyLibrary,
  openLayout,
  readLibrary,
  recent,
  removeLayout,
  saveLayout,
} from "../editor/library";
import { setName } from "../editor/operations";
import { STARTERS } from "../editor/starters";

const doc = fixture as LayoutDocument;
const named = (name: string): LayoutDocument => ({ ...doc, name });

describe("the library of saved layouts", () => {
  it("starts empty, and reads back what it wrote", () => {
    expect(readLibrary(null)).toEqual(emptyLibrary());
    const one = addLayout(emptyLibrary(), named("One"), 1).library;
    const two = addLayout(one, named("Two"), 2).library;
    expect(readLibrary(JSON.stringify(two))).toEqual(two);
  });

  it("drops what it cannot read", () => {
    for (const raw of ["{", "[]", '{"version":1}']) {
      expect(readLibrary(raw)).toEqual(emptyLibrary());
    }
    const stored = {
      version: 1,
      open: "l1",
      layouts: [
        { id: "l1", savedAt: 1, doc: {} },
        { id: "l2", savedAt: 2, doc },
      ],
    };
    const read = readLibrary(JSON.stringify(stored));
    expect(read.layouts.map((l) => l.id)).toEqual(["l2"]);
    expect(read.open).toBeNull();
  });

  it("adds, saves, renames and opens layouts", () => {
    const first = addLayout(emptyLibrary(), named("One"), 1);
    const second = addLayout(first.library, named("Two"), 2);
    expect([first.id, second.id]).toEqual(["l1", "l2"]);
    expect(second.library.open).toBe("l2");
    const saved = saveLayout(second.library, "l1", named("Uno"), 5);
    const l1 = saved.layouts.find((l) => l.id === "l1")!;
    expect([l1.doc.name, l1.savedAt]).toEqual(["Uno", 5]);
    expect(saveLayout(saved, "l1", l1.doc, 9)).toBe(saved);
    expect(saveLayout(saved, "l9", doc, 9)).toBe(saved);
    expect(openLayout(saved, "l1").open).toBe("l1");
  });

  it("removing the open layout opens the most recent one", () => {
    let lib = emptyLibrary();
    for (const [name, at] of [
      ["A", 1],
      ["B", 3],
      ["C", 2],
    ] as const) {
      lib = addLayout(lib, named(name), at).library;
    }
    lib = openLayout(lib, "l2");
    lib = removeLayout(lib, "l2");
    expect(lib.open).toBe("l3");
    lib = removeLayout(removeLayout(lib, "l3"), "l1");
    expect(lib.open).toBeNull();
    expect(lib.layouts).toEqual([]);
  });

  it("recent lists newest first", () => {
    let lib = emptyLibrary();
    for (const at of [1, 3, 2])
      lib = addLayout(lib, named(`${at}`), at).library;
    expect(recent(lib).map((l) => l.savedAt)).toEqual([3, 2, 1]);
  });

  it("names a layout", () => {
    expect(setName(doc, "  Ordini ").name).toBe("Ordini");
    expect(setName(doc, "")).toBe(doc);
    expect(setName(doc, doc.name)).toBe(doc);
  });
});

describe("the starters", () => {
  it("are the three of the spec, in order", () => {
    expect(STARTERS.map((s) => [s.id, s.doc.name])).toEqual([
      ["detail", "Pagina di dettaglio"],
      ["form", "Nuovo cliente"],
      ["dashboard", "Cruscotto vendite"],
    ]);
  });

  it.each(STARTERS.map((s) => [s.id, s.doc] as const))(
    "%s is sound and opens unchanged",
    (_, starter) => {
      expect(checkDocument(starter)).toEqual([]);
      expect(parseLayout(JSON.stringify(starter))).toEqual({
        ok: true,
        doc: starter,
        notes: [],
      });
    },
  );
});

describe("the library, after the review", () => {
  it("drops a layout that makes the reader throw, and keeps the others", () => {
    const bad = {
      ...doc,
      items: [
        {
          id: "n9",
          type: "constructor",
          props: {},
          layout: { x: 0, y: 9, w: 2, h: 1 },
        },
      ],
    };
    const stored = {
      version: 1,
      open: "l2",
      layouts: [
        { id: "l1", savedAt: 1, doc },
        { id: "l2", savedAt: 2, doc: bad },
      ],
    };
    expect(() => readLibrary(JSON.stringify(stored))).not.toThrow();
    const read = readLibrary(JSON.stringify(stored));
    expect(read.layouts.map((l) => l.id)).toContain("l1");
  });

  it("imports a node named like an object's own properties as an unknown type", () => {
    const result = parseLayout(
      JSON.stringify({
        ...doc,
        items: [
          {
            id: "n1",
            type: "toString",
            props: {},
            layout: { x: 0, y: 0, w: 2, h: 1 },
          },
        ],
      }),
    );
    expect(result.ok && result.notes).toEqual([
      'Dropped n1: unknown type "toString"',
    ]);
  });
});
