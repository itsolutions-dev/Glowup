import React, { useEffect } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from "@its/glowup-ui";

import fixture from "./__fixtures__/editor-document.json";
import {
  findNode,
  slotOf,
  type LayoutDocument,
  type LayoutNode,
} from "../editor/document";
import { MANIFEST } from "../editor/manifest";
import * as operations from "../editor/operations";
import { removeNode, removeTab, setProps } from "../editor/operations";
import { Canvas } from "../editor/canvas/Canvas";
import { Palette } from "../editor/canvas/Palette";
import { useEditor, type Editor } from "../editor/canvas/useEditor";

// The test renderer cannot measure: each view's window rect comes from its testID.
const RECTS: Record<string, [number, number, number, number]> = {};

beforeEach(() => {
  jest.useFakeTimers();
  for (const key of Object.keys(RECTS)) delete RECTS[key];
  for (const component of [View, ScrollView]) {
    jest
      .spyOn(component.prototype as any, "measureInWindow")
      .mockImplementation(function (this: any, cb: any) {
        cb(...(RECTS[this.props?.testID] ?? [0, 0, 0, 0]));
      });
  }
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

const at = (x: number, y: number) => ({ nativeEvent: { pageX: x, pageY: y } });
const layoutEvent = (height: number) => ({
  nativeEvent: { layout: { x: 0, y: 0, width: 0, height } },
});

let editor: Editor;
/** How many times the harness committed a render. */
let commits = 0;
const Harness = ({
  initial,
  palette,
}: {
  initial: LayoutDocument;
  palette: boolean;
}) => {
  const current = useEditor(initial);
  // Handed to the tests after each render, outside it.
  useEffect(() => {
    editor = current;
    commits += 1;
  });
  return (
    <Canvas
      editor={current}
      palette={palette ? <Palette editor={current} /> : undefined}
    />
  );
};

const draw = (
  initial: LayoutDocument = fixture as LayoutDocument,
  palette = false,
) =>
  render(
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 1280, height: 900 },
        insets: { top: 0, left: 0, right: 0, bottom: 0 },
      }}
    >
      <ThemeProvider>
        <Harness initial={initial} palette={palette} />
      </ThemeProvider>
    </SafeAreaProvider>,
  );

/**
 * What onLayout does on a device: the render tree measures n1's inner grid and
 * the flow child n6, so their edit boxes appear.
 */
const measure = async () => {
  Object.assign(RECTS, {
    "frame-n1": [0, 0, 584, 240],
    "inner-n1": [16, 16, 552, 208],
    "frame-n5": [0, 256, 384, 176],
    "frame-n6": [0, 256, 384, 40],
  });
  await fireEvent(screen.getByTestId("inner-n1"), "layout", layoutEvent(208));
  await fireEvent(screen.getByTestId("frame-n6"), "layout", layoutEvent(40));
};

/** Where a box sits from the top of its parent. */
const topOf = (id: string) =>
  StyleSheet.flatten(screen.getByTestId("place-" + id).props.style).top;

/** A tap on an edit box: the press the responder system hands it, let go at once. */
const tap = async (testID: string) => {
  const id = testID.replace(/^box-/, "");
  // The Draggable watches the press; the box's tap view takes it.
  screen
    .getByTestId("box-" + id)
    .props.onStartShouldSetResponderCapture(at(10, 10));
  const view = screen.getByTestId("tap-" + id);
  expect(view.props.onStartShouldSetResponder(at(10, 10))).toBe(true);
  await fireEvent(view, "responderGrant", at(10, 10));
  await fireEvent(view, "responderRelease", at(10, 10));
};

describe("the canvas", () => {
  it("draws its boxes as plain views, not buttons: they nest", async () => {
    await draw();
    expect(
      screen.getByTestId("box-n1").props.accessibilityRole,
    ).toBeUndefined();
  });

  it("selects a node on tap, the innermost under the pointer", async () => {
    await draw();
    await measure();
    await tap("box-n2");
    expect(editor.selected).toBe("n2");
    expect(screen.getByText("Typography")).toBeTruthy();
    expect(screen.getByLabelText("Delete")).toBeTruthy();
    expect(screen.getByLabelText("Duplicate")).toBeTruthy();
  });

  it("clears the selection on the empty canvas", async () => {
    await draw();
    await measure();
    await tap("box-n2");
    await fireEvent.press(screen.getByTestId("canvas-background"));
    expect(editor.selected).toBeNull();
    expect(screen.queryByLabelText("Delete")).toBeNull();
  });

  it("deletes and undoes", async () => {
    await draw();
    await tap("box-n1");
    await fireEvent.press(screen.getByLabelText("Delete"));
    expect(screen.queryByTestId("frame-n1")).toBeNull();
    expect(screen.queryByTestId("frame-n2")).toBeNull();
    await act(async () => editor.undo());
    expect(screen.getByTestId("frame-n1")).toBeTruthy();
    expect(screen.getByTestId("frame-n2")).toBeTruthy();
  });

  it("duplicates below the original and selects the copy", async () => {
    await draw();
    await tap("box-n5");
    await fireEvent.press(screen.getByLabelText("Duplicate"));
    expect(findNode(editor.doc, "n7")?.layout).toEqual({
      x: 0,
      y: 7,
      w: 4,
      h: 3,
    });
    expect(editor.selected).toBe("n7");
  });

  it("forgets a selection whose node is gone", async () => {
    await draw();
    await measure();
    await tap("box-n6");
    await act(async () => editor.apply(removeNode(editor.doc, "n6")));
    expect(editor.selected).toBeNull();
    expect(screen.queryByLabelText("Delete")).toBeNull();
    await act(async () => editor.undo());
    expect(findNode(editor.doc, "n6")).not.toBeNull();
    expect(editor.selected).toBeNull();
  });

  it("grows a container to its content, in the same undo step", async () => {
    await draw();
    await act(async () =>
      editor.apply(setProps(editor.doc, "n2", { variant: "headlineLarge" })),
    );
    await fireEvent(screen.getByTestId("frame-n1"), "layout", layoutEvent(400));
    expect(findNode(editor.doc, "n1")?.layout?.h).toBe(7);
    await act(async () => editor.undo());
    expect(findNode(editor.doc, "n1")?.layout?.h).toBe(4);
    expect(findNode(editor.doc, "n2")?.props.variant).toBeUndefined();
  });
});

/** The responder system's first pass, a resting press, then the moves. */
const drag = async (
  testID: string,
  from: [number, number],
  ...path: [number, number][]
) => {
  const item = screen.getByTestId(testID);
  item.props.onStartShouldSetResponderCapture(at(...from));
  expect(item.props.onStartShouldSetResponder(at(...from))).toBe(true);
  await fireEvent(item, "responderGrant", at(...from));
  await act(async () => {
    jest.advanceTimersByTime(250);
  });
  for (const point of path)
    await fireEvent(item, "responderMove", at(...point));
  return item;
};

const release = (
  item: ReturnType<typeof screen.getByTestId>,
  point: [number, number],
) => fireEvent(item, "responderRelease", at(...point));

// The page zone is 1184 wide: a cell with its gap is 100 across and 64 down.
const placeBoxes = () =>
  Object.assign(RECTS, {
    "zone-page": [0, 0, 1184, 704],
    "box-n1": [0, 0, 584, 240],
    "box-n3": [600, 0, 584, 240],
    "box-n5": [0, 256, 384, 176],
  });

const withTypography = (): LayoutDocument => {
  const doc = structuredClone(fixture) as LayoutDocument;
  const t1: LayoutNode = {
    id: "t1",
    type: "Typography",
    props: {},
    text: "Loose",
    layout: { x: 0, y: 7, w: 4, h: 1 },
  };
  doc.items.push(t1);
  return doc;
};

describe("moving", () => {
  it("moves a node to the cell under its preview", async () => {
    placeBoxes();
    await draw();
    const box = await drag("box-n5", [20, 270], [420, 270]);
    await release(box, [420, 270]);
    expect(findNode(editor.doc, "n5")?.layout).toEqual({
      x: 4,
      y: 4,
      w: 4,
      h: 3,
    });
    expect(editor.canUndo).toBe(true);
    await act(async () => editor.undo());
    expect(findNode(editor.doc, "n5")?.layout?.x).toBe(0);
  });

  it("pushes down what it lands on, nothing else moves", async () => {
    placeBoxes();
    await draw();
    const box = await drag("box-n5", [20, 270], [20, 142]);
    await release(box, [20, 142]);
    expect(findNode(editor.doc, "n5")?.layout?.y).toBe(2);
    expect(findNode(editor.doc, "n1")?.layout?.y).toBe(5);
    expect(findNode(editor.doc, "n3")?.layout).toEqual({
      x: 6,
      y: 0,
      w: 6,
      h: 4,
    });
  });

  it("draws the grid it is over and where the node will land", async () => {
    placeBoxes();
    await draw();
    await drag("box-n5", [20, 270], [420, 270]);
    expect(screen.getByTestId("landing")).toBeTruthy();
    expect(screen.queryByTestId("cell-0-0")).toBeNull();
    expect(screen.getByTestId("cell-0-10")).toBeTruthy();
    expect(
      StyleSheet.flatten(screen.getByTestId("frame-n5").props.style).opacity,
    ).toBe(0.5);
  });

  it("hides the selection chrome while the node moves", async () => {
    placeBoxes();
    await draw();
    await tap("box-n5");
    expect(screen.getByLabelText("Delete")).toBeTruthy();
    await drag("box-n5", [20, 270], [420, 270]);
    expect(screen.queryByLabelText("Delete")).toBeNull();
  });

  it("leaves the document alone when dropped outside every zone", async () => {
    placeBoxes();
    await draw();
    const before = editor.doc;
    const box = await drag("box-n5", [20, 270], [2000, 2000]);
    await release(box, [2000, 2000]);
    expect(editor.doc).toBe(before);
    expect(editor.canUndo).toBe(false);
  });

  it("lands in a container's grid", async () => {
    placeBoxes();
    Object.assign(RECTS, {
      "box-t1": [0, 448, 384, 48],
      "zone-n1": [16, 16, 552, 208],
    });
    await draw(withTypography());
    await measure();
    const box = await drag("box-t1", [20, 460], [60, 40]);
    await release(box, [60, 40]);
    expect(slotOf(editor.doc, "t1")).toEqual({
      kind: "children",
      parent: "n1",
    });
    expect(findNode(editor.doc, "t1")?.layout).toEqual({
      x: 0,
      y: 0,
      w: 4,
      h: 1,
    });
    expect(findNode(editor.doc, "n2")?.layout?.y).toBe(1);
  });

  it("one undo restores a move and the growth it caused", async () => {
    placeBoxes();
    Object.assign(RECTS, {
      "box-t1": [0, 448, 384, 48],
      "zone-n1": [16, 16, 552, 208],
    });
    await draw(withTypography());
    await measure();
    const box = await drag("box-t1", [20, 460], [60, 40]);
    await release(box, [60, 40]);
    await fireEvent(screen.getByTestId("frame-n1"), "layout", layoutEvent(400));
    expect(findNode(editor.doc, "n1")?.layout?.h).toBe(7);
    await act(async () => editor.undo());
    expect(slotOf(editor.doc, "t1")).toEqual({ kind: "page" });
    expect(findNode(editor.doc, "n1")?.layout?.h).toBe(4);
  });

  it("grows a container the drop made taller, after the drop", async () => {
    placeBoxes();
    Object.assign(RECTS, {
      "box-t1": [0, 448, 384, 48],
      "zone-n1": [16, 16, 552, 208],
    });
    await draw(withTypography());
    await measure();
    const box = await drag("box-t1", [20, 460], [60, 40]);
    // Measured while the draft is drawn: growth waits for the drop.
    await fireEvent(screen.getByTestId("frame-n1"), "layout", layoutEvent(400));
    expect(findNode(editor.doc, "n1")?.layout?.h).toBe(4);
    await release(box, [60, 40]);
    expect(findNode(editor.doc, "n1")?.layout?.h).toBe(7);
  });

  it("cancels with the drag", async () => {
    placeBoxes();
    await draw();
    const before = editor.doc;
    const box = await drag("box-n5", [20, 270], [420, 270]);
    await fireEvent(box, "responderTerminate");
    expect(editor.doc).toBe(before);
    expect(screen.queryByTestId("landing")).toBeNull();
  });
});

/** The page's width, as onLayout reports it on a device: 1184, so a cell is 100 across. */
const sizePage = () =>
  fireEvent(screen.getByTestId("edit-layer"), "layout", {
    nativeEvent: { layout: { x: 0, y: 0, width: 1184, height: 704 } },
  });

/** A pan on a resize handle, by dx, dy; let go unless `hold`. */
const pull = async (handle: string, dx: number, dy: number, hold = false) => {
  const view = screen.getByLabelText(`Resize ${handle}`);
  await fireEvent(view, "responderGrant", at(500, 500));
  await fireEvent(view, "responderMove", at(500 + dx, 500 + dy));
  if (!hold) await fireEvent(view, "responderRelease", at(500 + dx, 500 + dy));
  return view;
};

describe("resizing", () => {
  it("widens to whole cells from the right edge", async () => {
    await draw();
    await sizePage();
    await tap("box-n5");
    await pull("e", 210, 0);
    expect(findNode(editor.doc, "n5")?.layout).toEqual({
      x: 0,
      y: 4,
      w: 6,
      h: 3,
    });
    await act(async () => editor.undo());
    expect(findNode(editor.doc, "n5")?.layout?.w).toBe(4);
  });

  it("grows downwards from the bottom edge, pushing down", async () => {
    await draw(withTypography());
    await sizePage();
    await tap("box-n5");
    await pull("s", 0, 130);
    expect(findNode(editor.doc, "n5")?.layout?.h).toBe(5);
    expect(findNode(editor.doc, "t1")?.layout?.y).toBe(9);
  });

  it("clamps at the grid's edge and at the minimum size", async () => {
    await draw();
    await sizePage();
    await tap("box-n5");
    await pull("w", -500, 0);
    expect(findNode(editor.doc, "n5")?.layout).toEqual({
      x: 0,
      y: 4,
      w: 4,
      h: 3,
    });
    await pull("e", -2000, 0);
    expect(findNode(editor.doc, "n5")?.layout?.w).toBe(
      MANIFEST.VStack.minSize.w,
    );
  });

  it("draws no cell over the node being resized", async () => {
    await draw();
    await sizePage();
    await tap("box-n5");
    await pull("e", 210, 0, true);
    expect(screen.queryByTestId("cell-0-4")).toBeNull();
    expect(screen.getByTestId("cell-8-4")).toBeTruthy();
  });

  it("shows the size live and lets go on cancel", async () => {
    await draw();
    await sizePage();
    await tap("box-n5");
    const before = editor.doc;
    const handle = await pull("e", 210, 0, true);
    expect(screen.getByTestId("landing")).toBeTruthy();
    expect(editor.doc).toBe(before);
    await fireEvent(handle, "responderTerminate");
    expect(screen.queryByTestId("landing")).toBeNull();
    expect(editor.doc).toBe(before);
    expect(editor.canUndo).toBe(false);
  });

  it("has no handles on a flow child", async () => {
    await draw();
    await measure();
    await tap("box-n6");
    expect(screen.queryByLabelText("Resize e")).toBeNull();
  });
});

describe("after the review", () => {
  const intoN1 = async () => {
    placeBoxes();
    Object.assign(RECTS, {
      "box-t1": [0, 448, 384, 48],
      "zone-n1": [16, 16, 552, 208],
    });
    await draw(withTypography());
    await measure();
    const box = await drag("box-t1", [20, 460], [60, 40]);
    // The draft makes n1 taller.
    await fireEvent(screen.getByTestId("frame-n1"), "layout", layoutEvent(400));
    return box;
  };

  it("does not grow a container from a drag that was called off", async () => {
    const box = await intoN1();
    await fireEvent(box, "responderTerminate");
    expect(findNode(editor.doc, "n1")?.layout?.h).toBe(4);
  });

  it("does not grow a container from a drop outside every zone", async () => {
    const box = await intoN1();
    await fireEvent(box, "responderMove", at(2000, 2000));
    await release(box, [2000, 2000]);
    expect(findNode(editor.doc, "n1")?.layout?.h).toBe(4);
  });

  it("keeps the left edge when an east handle overshoots the grid", async () => {
    await draw();
    await sizePage();
    await tap("box-n3");
    await pull("e", 400, 0);
    expect(findNode(editor.doc, "n3")?.layout).toMatchObject({ x: 6, w: 6 });
  });

  it("moves a flow child's box when a sibling's removal moves it, without a layout event", async () => {
    const doc = structuredClone(fixture) as LayoutDocument;
    const stack = doc.items.find((n) => n.id === "n5") as LayoutNode;
    stack.children = [
      { id: "b1", type: "Button", props: {}, text: "One" },
      { id: "b2", type: "Button", props: {}, text: "Two" },
    ];
    Object.assign(RECTS, {
      "frame-n5": [0, 256, 384, 176],
      "frame-b1": [0, 256, 384, 40],
      "frame-b2": [0, 304, 384, 40],
    });
    await draw(doc);
    await fireEvent(screen.getByTestId("frame-b1"), "layout", layoutEvent(40));
    await fireEvent(screen.getByTestId("frame-b2"), "layout", layoutEvent(40));
    expect(topOf("b2")).toBe(48);
    // b2 moves up to where b1 was; on the web no layout event says so.
    RECTS["frame-b2"] = [0, 256, 384, 40];
    await act(async () => editor.apply(removeNode(editor.doc, "b1")));
    expect(topOf("b2")).toBe(0);
  });

  it("does not re-render the editor for an edit that changes nothing", async () => {
    await draw();
    const before = commits;
    await act(async () => editor.amend((doc) => doc));
    await act(async () => editor.select(null));
    expect(commits).toBe(before);
  });

  it("recomputes a resize's draft once per cell, not per pointer move", async () => {
    await draw();
    await sizePage();
    await tap("box-n5");
    const placeNode = jest.spyOn(operations, "placeNode");
    const handle = screen.getByLabelText("Resize e");
    await fireEvent(handle, "responderGrant", at(500, 500));
    await fireEvent(handle, "responderMove", at(710, 500));
    const once = placeNode.mock.calls.length;
    await fireEvent(handle, "responderMove", at(720, 500));
    await fireEvent(handle, "responderMove", at(730, 500));
    expect(placeNode.mock.calls.length).toBe(once);
  });
});

/** A tap on a tab of a TabbedPanel, by its label. */
const tapTab = async (label: string) => {
  const view = screen.getByLabelText(label);
  expect(view.props.onStartShouldSetResponder(at(10, 10))).toBe(true);
  await fireEvent(view, "responderGrant", at(10, 10));
  await fireEvent(view, "responderRelease", at(10, 10));
};

/** What onLayout does on a device: the render tree measures n3's tab bar. */
const measureBar = async () => {
  Object.assign(RECTS, {
    "frame-n3": [600, 0, 584, 240],
    "bar-n3": [600, 0, 584, 48],
  });
  await fireEvent(screen.getByTestId("bar-n3"), "layout", layoutEvent(48));
};

describe("tabs", () => {
  it("taps a tab to edit its panel", async () => {
    await draw();
    await measureBar();
    await tapTab("B tab");
    expect(editor.tabs.n3).toBe(1);
    expect(screen.queryByTestId("frame-n4")).toBeNull();
    await tapTab("A tab");
    expect(editor.tabs.n3).toBe(0);
    expect(screen.getByTestId("frame-n4")).toBeTruthy();
  });

  it("shows the last panel when the open one is removed", async () => {
    await draw();
    await act(async () => editor.showTab("n3", 1));
    expect(screen.queryByTestId("frame-n4")).toBeNull();
    await act(async () => editor.apply(removeTab(editor.doc, "n3", 1)));
    expect(screen.getByTestId("frame-n4")).toBeTruthy();
  });

  it("opening a tab is not an edit", async () => {
    await draw();
    await act(async () => editor.showTab("n3", 1));
    expect(editor.canUndo).toBe(false);
  });
});

/** The fixture with the stack n5 holding two Buttons, b1 above b2. */
const withTwoButtons = (): LayoutDocument => {
  const doc = structuredClone(fixture) as LayoutDocument;
  const button = (id: string): LayoutNode => ({
    id,
    type: "Button",
    props: {},
    text: id,
  });
  findNode(doc, "n5")!.children = [button("b1"), button("b2")];
  return doc;
};

/** What onLayout does on a device: the render tree measures b1 and b2 in n5. */
const measureButtons = async () => {
  Object.assign(RECTS, {
    "frame-n5": [0, 256, 384, 176],
    "zone-n5": [0, 256, 384, 176],
    "frame-b1": [0, 256, 384, 40],
    "box-b1": [0, 256, 384, 40],
    "frame-b2": [0, 304, 384, 40],
    "box-b2": [0, 304, 384, 40],
  });
  await fireEvent(screen.getByTestId("frame-b1"), "layout", layoutEvent(40));
  await fireEvent(screen.getByTestId("frame-b2"), "layout", layoutEvent(40));
};

const childIds = (id: string) =>
  findNode(editor.doc, id)?.children?.map((child) => child.id);

describe("between containers", () => {
  beforeEach(() => {
    placeBoxes();
    Object.assign(RECTS, {
      "box-t1": [0, 448, 384, 48],
      "zone-n5": [0, 256, 384, 176],
      "box-n6": [0, 256, 384, 40],
    });
  });

  it("drops a page node into a stack at the insertion line", async () => {
    await draw(withTypography());
    await measure();
    const box = await drag("box-t1", [20, 460], [20, 262]);
    await release(box, [20, 262]);
    expect(childIds("n5")).toEqual(["t1", "n6"]);
    expect(findNode(editor.doc, "t1")?.layout).toBeUndefined();
  });

  it("takes a stack's child out onto the page", async () => {
    await draw();
    await measure();
    const box = await drag("box-n6", [20, 270], [520, 600]);
    await release(box, [520, 600]);
    expect(slotOf(editor.doc, "n6")).toEqual({ kind: "page" });
    expect(findNode(editor.doc, "n6")?.layout).toMatchObject({ w: 3, h: 1 });
  });

  it("reorders inside a stack", async () => {
    await draw(withTwoButtons());
    await measureButtons();
    const box = await drag("box-b2", [20, 320], [20, 262]);
    await release(box, [20, 262]);
    expect(childIds("n5")).toEqual(["b2", "b1"]);
  });

  it("a drop at the same place in a stack changes nothing", async () => {
    await draw(withTwoButtons());
    await measureButtons();
    const before = editor.doc;
    const box = await drag("box-b1", [20, 270], [20, 272]);
    await release(box, [20, 272]);
    expect(editor.doc).toBe(before);
    expect(editor.canUndo).toBe(false);
  });

  it("drops onto a tab, into that panel, and shows it", async () => {
    await draw(withTypography());
    await measureBar();
    RECTS["tab-n3-1"] = [892, 0, 292, 48];
    const box = await drag("box-t1", [20, 460], [1000, 20]);
    await release(box, [1000, 20]);
    expect(slotOf(editor.doc, "t1")).toEqual({
      kind: "tab",
      parent: "n3",
      tab: 1,
    });
    expect(findNode(editor.doc, "t1")?.layout).toEqual({
      x: 0,
      y: 0,
      w: 4,
      h: 1,
    });
    expect(editor.tabs.n3).toBe(1);
  });

  it("switches to a tab hovered for half a second", async () => {
    await draw(withTypography());
    await measureBar();
    RECTS["tab-n3-1"] = [892, 0, 292, 48];
    await drag("box-t1", [20, 460], [1000, 20]);
    await act(async () => {
      jest.advanceTimersByTime(500);
    });
    expect(editor.tabs.n3).toBe(1);
  });

  it("does not switch for a tab only passed over", async () => {
    await draw(withTypography());
    await measureBar();
    RECTS["tab-n3-1"] = [892, 0, 292, 48];
    const box = await drag("box-t1", [20, 460], [1000, 20]);
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    await fireEvent(box, "responderMove", at(20, 600));
    await act(async () => {
      jest.advanceTimersByTime(500);
    });
    expect(editor.tabs.n3).not.toBe(1);
  });

  it("does not switch when the drag is cancelled over a tab", async () => {
    await draw(withTypography());
    await measureBar();
    RECTS["tab-n3-1"] = [892, 0, 292, 48];
    const box = await drag("box-t1", [20, 460], [1000, 20]);
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    await fireEvent(box, "responderTerminate", at(1000, 20));
    await act(async () => {
      jest.advanceTimersByTime(500);
    });
    expect(editor.tabs.n3).not.toBe(1);
  });

  it("drops through a container that does not take the type", async () => {
    const doc = structuredClone(fixture) as LayoutDocument;
    doc.items.push({
      id: "ls",
      type: "ListSection",
      props: {},
      layout: { x: 4, y: 4, w: 4, h: 3 },
      children: [],
    });
    Object.assign(RECTS, {
      "box-ls": [400, 256, 384, 176],
      "zone-ls": [400, 256, 384, 176],
    });
    await draw(doc);
    await measure();
    const box = await drag("box-n6", [20, 270], [440, 290]);
    await release(box, [440, 290]);
    expect(slotOf(editor.doc, "n6")).toEqual({ kind: "page" });
    expect(childIds("ls")).toEqual([]);
  });
});

/** A tap on a palette entry: pressed and let go where it was pressed. */
const tapEntry = async (type: string) => {
  const entry = screen.getByTestId("palette-" + type);
  entry.props.onStartShouldSetResponderCapture(at(10, 10));
  await fireEvent(entry, "responderGrant", at(10, 10));
  await fireEvent(entry, "responderRelease", at(10, 10));
};

describe("the palette", () => {
  it("lists every palette component under its catalogue group", async () => {
    await draw(undefined, true);
    for (const group of ["Foundations", "Inputs", "Layout"]) {
      expect(screen.getByText(group)).toBeTruthy();
    }
    for (const type of ["Paper", "TabbedPanel", "VStack", "Form"]) {
      expect(screen.getByTestId("palette-" + type)).toBeTruthy();
    }
    expect(screen.getAllByTestId(/^palette-/)).toHaveLength(
      Object.keys(MANIFEST).length,
    );
  });

  it("filters by name", async () => {
    await draw(undefined, true);
    const search = screen.getByLabelText("Search components");
    await fireEvent.changeText(search, "inp");
    expect(screen.getByTestId("palette-Input")).toBeTruthy();
    expect(screen.getByTestId("palette-InputArea")).toBeTruthy();
    expect(screen.queryByTestId("palette-Paper")).toBeNull();
    await fireEvent.changeText(search, "zzz");
    expect(screen.getByText("No components match")).toBeTruthy();
  });

  it("adds on the page's first free cell with a tap", async () => {
    await draw(undefined, true);
    await tapEntry("Input");
    expect(findNode(editor.doc, "n7")?.layout).toEqual({
      x: 4,
      y: 4,
      w: 4,
      h: 2,
    });
    expect(editor.selected).toBe("n7");
    await act(async () => editor.undo());
    expect(findNode(editor.doc, "n7")).toBeNull();
  });

  it("adds into the selected container with a tap", async () => {
    await draw(undefined, true);
    await act(async () => editor.select("n1"));
    await tapEntry("Typography");
    expect(slotOf(editor.doc, "n7")).toEqual({
      kind: "children",
      parent: "n1",
    });
    expect(findNode(editor.doc, "n7")?.layout).toEqual({
      x: 0,
      y: 1,
      w: 6,
      h: 1,
    });
  });

  it("adds to the page when the selection cannot take it", async () => {
    const doc = structuredClone(fixture) as LayoutDocument;
    doc.items.push({
      id: "ls",
      type: "ListSection",
      props: {},
      layout: { x: 4, y: 4, w: 4, h: 3 },
      children: [],
    });
    await draw(doc, true);
    await act(async () => editor.select("ls"));
    await tapEntry("Button");
    expect(slotOf(editor.doc, "n7")).toEqual({ kind: "page" });
  });

  it("drags a component from the palette onto the page", async () => {
    placeBoxes();
    RECTS["palette-Input"] = [-280, 100, 260, 40];
    await draw(undefined, true);
    const entry = await drag("palette-Input", [-200, 120], [480, 276]);
    await release(entry, [480, 276]);
    expect(findNode(editor.doc, "n7")?.layout).toEqual({
      x: 4,
      y: 4,
      w: 4,
      h: 2,
    });
    expect(editor.selected).toBe("n7");
  });
});

describe("tabs, after the review", () => {
  it("carries a node from one panel to another through a hovered tab", async () => {
    placeBoxes();
    Object.assign(RECTS, {
      "inner-n3": [600, 48, 584, 192],
      "zone-n3:0": [600, 48, 584, 192],
      "zone-n3:1": [600, 48, 584, 192],
      "box-n4": [600, 48, 384, 112],
      "tab-n3-1": [892, 0, 292, 48],
    });
    await draw();
    await measureBar();
    await fireEvent(screen.getByTestId("inner-n3"), "layout", layoutEvent(192));
    const box = await drag("box-n4", [620, 60], [1000, 20]);
    await act(async () => {
      jest.advanceTimersByTime(500);
    });
    expect(editor.tabs.n3).toBe(1);
    // The dragged box outlives the switch: unmounted, it would cancel the drag.
    expect(
      screen.getByTestId("box-n4", { includeHiddenElements: true }),
    ).toBeTruthy();
    // On a device the panel shown now lays out, and the drag measures it.
    await fireEvent(
      screen.getByTestId("zone-n3:1"),
      "layout",
      layoutEvent(192),
    );
    await fireEvent(box, "responderMove", at(700, 150));
    await release(box, [700, 150]);
    expect(slotOf(editor.doc, "n4")).toEqual({
      kind: "tab",
      parent: "n3",
      tab: 1,
    });
    expect(findNode(editor.doc, "n4")?.layout).toEqual({
      x: 1,
      y: 1,
      w: 4,
      h: 2,
    });
  });

  it("a tap on a tab selects the TabbedPanel", async () => {
    await draw();
    await measureBar();
    await act(async () => editor.select("n4"));
    await tapTab("B tab");
    expect(editor.selected).toBe("n3");
  });
});
