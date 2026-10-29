import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import {
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "@its/glowup-ui";

import fixture from "./__fixtures__/editor-document.json";
import type { LayoutDocument, LayoutNode } from "../editor/document";
import { RenderTree } from "../editor/canvas/RenderTree";
import { createRects, RectsProvider, type Rects } from "../editor/canvas/rects";

// The test renderer cannot measure: each view's window rect comes from its testID.
const RECTS: Record<string, [number, number, number, number]> = {};

beforeEach(() => {
  for (const key of Object.keys(RECTS)) delete RECTS[key];
  for (const component of [View, ScrollView]) {
    jest
      .spyOn(component.prototype as any, "measureInWindow")
      .mockImplementation(function (this: any, cb: any) {
        cb(...(RECTS[this.props?.testID] ?? [0, 0, 0, 0]));
      });
  }
});
afterEach(() => jest.restoreAllMocks());

const doc = fixture as LayoutDocument;
const layoutEvent = (height = 0) => ({
  nativeEvent: { layout: { x: 0, y: 0, width: 0, height } },
});

const draw = (
  document: LayoutDocument,
  props: Partial<React.ComponentProps<typeof RenderTree>> = {},
) => {
  const rects = createRects();
  const view = render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 1280, height: 900 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <ThemeProvider>
        <RectsProvider value={rects}>
          <RenderTree doc={document} {...props} />
        </RectsProvider>
      </ThemeProvider>
    </SafeAreaProvider>,
  );
  return { view, rects };
};

const paper = (id: string, children: LayoutNode[]): LayoutNode => ({
  id,
  type: "Paper",
  props: {},
  layout: { x: 0, y: 0, w: 6, h: 4 },
  columns: 6,
  children,
});

describe("the render tree", () => {
  it("draws every node of the fixture with the real components", async () => {
    await draw(doc).view;
    expect(screen.getByText("Hi")).toBeTruthy();
    expect(screen.getByText("Save")).toBeTruthy();
    expect(screen.getByLabelText("Name")).toBeTruthy();
    expect(screen.getByText("A")).toBeTruthy();
    expect(screen.getByText("B")).toBeTruthy();
    for (const id of ["n1", "n2", "n3", "n4", "n5", "n6"]) {
      expect(screen.getByTestId(`frame-${id}`)).toBeTruthy();
    }
  });

  it("is inert", async () => {
    await draw(doc).view;
    expect(screen.getByTestId("canvas-render").props.pointerEvents).toBe(
      "none",
    );
  });

  it("measures where an inner grid sits in its container", async () => {
    RECTS["frame-n1"] = [0, 0, 584, 240];
    RECTS["inner-n1"] = [16, 16, 552, 208];
    const { view, rects } = draw(doc);
    await view;
    await fireEvent(screen.getByTestId("inner-n1"), "layout", layoutEvent());
    expect(rects.get("inner:n1")).toEqual({
      x: 16,
      y: 16,
      width: 552,
      height: 208,
    });
  });

  it("measures a flow child inside its container", async () => {
    RECTS["frame-n5"] = [0, 256, 384, 176];
    RECTS["frame-n6"] = [0, 256, 384, 40];
    const { view, rects } = draw(doc);
    await view;
    await fireEvent(screen.getByTestId("frame-n6"), "layout", layoutEvent(40));
    expect(rects.get("child:n6")).toEqual({
      x: 0,
      y: 0,
      width: 384,
      height: 40,
    });
  });

  it("measures nested grids relative to their own container", async () => {
    const nested: LayoutDocument = {
      ...doc,
      items: [
        paper("p1", [
          paper("p2", [
            paper("p3", [
              {
                id: "t",
                type: "Typography",
                props: {},
                text: "Deep",
                layout: { x: 0, y: 0, w: 6, h: 1 },
              },
            ]),
          ]),
        ]),
      ],
    };
    Object.assign(RECTS, {
      "frame-p1": [0, 0, 600, 400],
      "inner-p1": [16, 16, 568, 368],
      "frame-p2": [16, 16, 400, 300],
      "inner-p2": [32, 32, 368, 268],
      "frame-p3": [32, 32, 300, 200],
      "inner-p3": [48, 48, 268, 168],
    });
    const { view, rects } = draw(nested);
    await view;
    for (const id of ["p1", "p2", "p3"]) {
      await fireEvent(
        screen.getByTestId(`inner-${id}`),
        "layout",
        layoutEvent(),
      );
      expect(rects.get(`inner:${id}`)).toMatchObject({ x: 16, y: 16 });
    }
  });

  it("reports a node's content height", async () => {
    const onContentHeight = jest.fn();
    await draw(doc, { onContentHeight }).view;
    await fireEvent(screen.getByTestId("frame-n1"), "layout", layoutEvent(300));
    expect(onContentHeight).toHaveBeenCalledWith("n1", 300);
  });

  it("dims the node being placed", async () => {
    await draw(doc, { dimmed: "n1" }).view;
    expect(
      StyleSheet.flatten(screen.getByTestId("frame-n1").props.style).opacity,
    ).toBe(0.5);
  });
});

describe("the render tree, with tabs", () => {
  it("shows the panel the editor opened", async () => {
    await draw(doc, { tabs: { n3: 1 } }).view;
    expect(screen.queryByTestId("frame-n4")).toBeNull();
    expect(
      within(screen.getByTestId("inner-n3")).getByText("Drop components here"),
    ).toBeTruthy();
  });

  it("keeps the tallest panel's height", async () => {
    await draw(doc, { tabs: { n3: 1 } }).view;
    expect(
      StyleSheet.flatten(screen.getByTestId("inner-n3").props.style).minHeight,
    ).toBe(112);
  });
});

describe("the rects store", () => {
  it("notifies only when a rect changes", () => {
    const rects: Rects = createRects();
    const listener = jest.fn();
    rects.subscribe(listener);
    rects.set("a", { x: 0, y: 0, width: 1, height: 1 });
    rects.set("a", { x: 0, y: 0, width: 1, height: 1 });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
