import React from "react";
import { render } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "@its/glowup-ui";

import fixture from "./__fixtures__/editor-document.json";
import { exportCode } from "../editor/codegen";
import { RenderTree } from "../editor/canvas/RenderTree";
import { createRects, RectsProvider } from "../editor/canvas/rects";
import {
  emptyDocument,
  type LayoutDocument,
  type LayoutNode,
} from "../editor/document";
import detail from "../editor/starters/detail.json";
import { compileExample } from "../site/liveCode";

const Providers = ({ children }: { children: React.ReactNode }) => (
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 1280, height: 900 },
      insets: { top: 0, left: 0, right: 0, bottom: 0 },
    }}
  >
    <ThemeProvider>{children}</ThemeProvider>
  </SafeAreaProvider>
);

type Tree = { children?: (Tree | string)[] | null } | Tree[] | null;

/** Every string a rendered tree shows, in order. */
const texts = (tree: Tree): string[] => {
  if (!tree) return [];
  if (Array.isArray(tree)) return tree.flatMap(texts);
  return (tree.children ?? []).flatMap((child) =>
    typeof child === "string" ? [child] : texts(child),
  );
};

const PLACEHOLDER = "Drop components here";

const canvasTexts = async (doc: LayoutDocument) => {
  const view = await render(
    <Providers>
      <RectsProvider value={createRects()}>
        <RenderTree doc={doc} />
      </RectsProvider>
    </Providers>,
  );
  const out = texts(view.toJSON() as Tree).filter((t) => t !== PLACEHOLDER);
  return out;
};

const exportedTexts = async (doc: LayoutDocument) => {
  const result = compileExample(exportCode(doc));
  if (!result.ok) throw new Error(result.error);
  const view = await render(
    <Providers>
      <result.Component />
    </Providers>,
  );
  const out = texts(view.toJSON() as Tree);
  return out;
};

const page = (name: string, items: LayoutNode[]): LayoutDocument => ({
  ...emptyDocument(name),
  items,
});

describe("the export draws what the canvas draws", () => {
  it.each([
    ["the starter", detail as LayoutDocument],
    ["the fixture", fixture as LayoutDocument],
  ])("%s exports a file that draws what the canvas draws", async (_, doc) => {
    const canvas = await canvasTexts(doc);
    expect(canvas.length).toBeGreaterThan(3);
    expect(await exportedTexts(doc)).toEqual(canvas);
  });

  it("draws a required field the same way", async () => {
    const doc = page("Required", [
      {
        id: "f1",
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
            field: { name: "email", rules: [{ required: true }], auto: true },
          },
        ],
      },
    ]);
    expect(await exportedTexts(doc)).toEqual(await canvasTexts(doc));
  });

  it("keeps every character of texts and props", async () => {
    const strings = [
      'He said "hi" {x} </b> \\ back',
      "Prezzo: 12 €\nIVA inclusa",
      'Il "nome"',
    ];
    const doc = page("Characters", [
      {
        id: "n1",
        type: "Typography",
        props: {},
        text: strings[0],
        layout: { x: 0, y: 0, w: 6, h: 1 },
      },
      {
        id: "n2",
        type: "Typography",
        props: {},
        text: strings[1],
        layout: { x: 0, y: 1, w: 6, h: 1 },
      },
      {
        id: "n3",
        type: "Input",
        props: { label: strings[2] },
        layout: { x: 0, y: 2, w: 4, h: 2 },
      },
    ]);
    const shown = await exportedTexts(doc);
    for (const text of strings) expect(shown).toContain(text);
  });

  it("compiles with clashing labels", async () => {
    const doc = page(
      "Clashes",
      ["Email", "Email", "class", undefined].map((label, i) => ({
        id: `n${i + 1}`,
        type: "Input",
        props: label === undefined ? {} : { label },
        layout: { x: 0, y: i * 2, w: 4, h: 2 },
      })),
    );
    expect(await exportedTexts(doc)).toEqual(await canvasTexts(doc));
  });

  it("compiles an empty layout, container and tab panel", async () => {
    expect(await exportedTexts(emptyDocument("Empty"))).toEqual([]);
    const paper = page("Paper", [
      {
        id: "n1",
        type: "Paper",
        props: {},
        layout: { x: 0, y: 0, w: 6, h: 4 },
        columns: 6,
        children: [],
      },
    ]);
    expect(await exportedTexts(paper)).toEqual([]);
    expect(await exportedTexts(fixture as LayoutDocument)).toContain("B");
  });
});
